import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// Global variables provided by the Canvas environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// The core React component for our application.
const App = () => {
    // --- State Management ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- Daily Timetable Data ---
    // This is the core structure of your daily plan. Each object represents an activity.
    const baseSchedule = [
        { time: '5:10 AM', description: 'Wake up & wudu', details: 'Drink a glass of warm water.' },
        { time: '5:30 – 6:00 AM', description: 'Fajr + Qur’an', details: 'Keep a straight posture during recitation.' },
        { time: '6:05 – 6:35 AM', description: 'Exercise', details: 'Strength, stretches, and breathing.' },
        { time: '6:35 – 6:55 AM', description: 'Shower + Breakfast', details: 'Fuel for the day: paneer, eggs, or poha.' },
        { time: '6:55 – 7:10 AM', description: 'Cycle to library', details: 'Good for stamina.' },
        { time: '7:10 – 11:30 AM', description: 'Library deep study', details: 'Stand and stretch every hour. Carry water + nuts.' },
        { time: '11:30 – 12:15 PM', description: 'Light lunch + break', details: 'Keep it light to avoid drowsiness.' },
        { time: '12:15 – 1:15 PM', description: 'Skill study', details: 'Use a small cushion for lower back support.' },
        { time: '1:15 – 1:25 PM', description: 'Pack & prepare', details: 'Gentle shoulder & neck roll before leaving.' },
        { time: '1:30 PM', description: 'Dhuhr prayer', details: 'Prayer itself stretches spine naturally.' },
        { time: '1:35 – 1:55 PM', description: 'Cycle to work', details: ' ' },
        { time: '2:00 – 6:00 PM', description: 'Work', details: 'Stretch neck/back at least once per hour. Stay hydrated.' },
        { time: '4:00 PM', description: 'Snack', details: 'Roasted chana, fruit, or sandwich.' },
        { time: '5:15 PM', description: 'Asr prayer', details: ' ' },
        { time: '6:00 – 6:25 PM', description: 'Cycle home', details: 'Cardio + fresh air.' },
        { time: '6:30 PM', description: 'Maghrib prayer', details: ' ' },
        { time: '6:40 – 8:20 PM', description: 'Home study block', details: 'Maintain proper posture with back support.' },
        { time: '8:30 PM', description: 'Isha prayer', details: ' ' },
        { time: '8:45 – 9:15 PM', description: 'Dinner', details: 'Avoid oily/spicy foods. Add curd or salad.' },
        { time: '9:15 – 10:00 PM', description: 'Skill practice', details: 'Take a standing stretch break halfway.' },
        { time: '10:00 – 10:20 PM', description: 'Journaling + planning', details: ' ' },
        { time: '10:20 – 11:00 PM', description: 'Qur’an reflection', details: 'Sit with straight back support.' },
        { time: '11:00 – 11:15 PM', description: 'Relax', details: 'Light stretching + warm milk.' },
        { time: '11:15 PM', description: 'Sleep', details: 'Medium-firm mattress and pillow.' },
    ];

    // --- Firebase Initialization and Authentication ---
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const authInstance = getAuth(app);

            setDb(firestoreDb);
            setAuth(authInstance);

            // Listen for changes in the authentication state.
            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    console.log('User signed out, signing in anonymously...');
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(authInstance, initialAuthToken);
                        } else {
                            await signInAnonymously(authInstance);
                        }
                    } catch (error) {
                        console.error('Firebase sign-in failed:', error);
                    }
                }
                setIsAuthReady(true);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
        }
    }, []);

    // --- Real-time Data Fetching with onSnapshot ---
    useEffect(() => {
        if (!isAuthReady || !db || !userId) {
            console.log('Auth not ready or DB/User ID not available. Aborting data fetch.');
            return;
        }

        const dateDocRef = doc(db, `artifacts/${appId}/users/${userId}/dailyTimetables/${selectedDate}`);
        
        // Listen for real-time updates to the document for the selected date.
        const unsubscribe = onSnapshot(dateDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Merge the saved data with the base schedule.
                // This ensures all activities are always displayed.
                const mergedSchedule = baseSchedule.map(baseActivity => {
                    const savedActivity = data.activities.find(a => a.description === baseActivity.description);
                    return savedActivity ? savedActivity : { ...baseActivity, isDone: false, comment: '' };
                });
                setSchedule(mergedSchedule);
            } else {
                // If no data exists for this day, use the base schedule.
                setSchedule(baseSchedule.map(a => ({ ...a, isDone: false, comment: '' })));
            }
        }, (error) => {
            console.error('Failed to listen for document changes:', error);
        });

        return () => unsubscribe();
    }, [isAuthReady, db, userId, selectedDate]);

    // --- Function to Save Data to Firestore ---
    const saveData = async (updatedSchedule) => {
        if (!db || !userId) {
            console.log('Database or User ID not available. Cannot save.');
            return;
        }

        setIsSaving(true);
        const dateDocRef = doc(db, `artifacts/${appId}/users/${userId}/dailyTimetables/${selectedDate}`);
        
        try {
            await setDoc(dateDocRef, { activities: updatedSchedule }, { merge: false });
            console.log('Document successfully written!');
        } catch (error) {
            console.error('Error writing document:', error);
        }
        setIsSaving(false);
    };

    // --- Handlers for User Interaction ---
    const handleCheckboxChange = (index) => {
        const newSchedule = [...schedule];
        newSchedule[index].isDone = !newSchedule[index].isDone;
        setSchedule(newSchedule);
        saveData(newSchedule);
    };

    const handleCommentChange = (index, comment) => {
        const newSchedule = [...schedule];
        newSchedule[index].comment = comment;
        setSchedule(newSchedule);
        // Save data after a small delay to avoid excessive writes while typing
        const delaySave = setTimeout(() => {
            saveData(newSchedule);
        }, 500);
        return () => clearTimeout(delaySave);
    };

    // --- UI Logic ---
    const getProgress = () => {
        const now = new Date();
        const totalMinutes = now.getHours() * 60 + now.getMinutes();
        const totalMinutesInDay = 24 * 60;
        return (totalMinutes / totalMinutesInDay) * 100;
    };

    const sections = {
        'Morning': ['5:10 AM', '5:30 – 6:00 AM', '6:05 – 6:35 AM', '6:35 – 6:55 AM', '6:55 – 7:10 AM', '7:10 – 11:30 AM', '11:30 – 12:15 PM', '12:15 – 1:15 PM', '1:15 – 1:25 PM', '1:30 PM', '1:35 – 1:55 PM'],
        'Afternoon': ['2:00 – 6:00 PM', '4:00 PM', '5:15 PM'],
        'Evening': ['6:00 – 6:25 PM', '6:30 PM', '6:40 – 8:20 PM', '8:30 PM', '8:45 – 9:15 PM'],
        'Night': ['9:15 – 10:00 PM', '10:00 – 10:20 PM', '10:20 – 11:00 PM', '11:00 – 11:15 PM', '11:15 PM']
    };

    const getIconForSection = (sectionName) => {
        switch (sectionName) {
            case 'Morning': return '🌅';
            case 'Afternoon': return '☀️';
            case 'Evening': return '🌇';
            case 'Night': return '🌙';
            default: return '';
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center bg-[#f0f4f8] text-gray-800 font-inter">
            <header className="text-center mb-8 w-full max-w-4xl">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">Optimized Daily Plan</h1>
                <p className="text-lg sm:text-xl text-gray-600">Plan and track your routine with a daily log.</p>
                {userId && (
                    <p className="text-xs text-gray-400 mt-2">
                        User ID: <span className="font-mono">{userId}</span>
                    </p>
                )}
            </header>

            <div className="w-full max-w-4xl mb-6">
                <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700 mb-2">Select a date to track your progress:</label>
                <input
                    id="date-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 transition-all duration-200"
                />
            </div>
            
            <div className="w-full max-w-4xl mb-8 bg-gray-200 rounded-full h-2.5 shadow-inner">
                <div 
                    id="progress-bar" 
                    className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-teal-500 transition-all duration-1000 ease-in-out" 
                    style={{ width: `${getProgress()}%` }}
                ></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {Object.keys(sections).map(sectionName => (
                    <div 
                        key={sectionName} 
                        className="bg-white p-6 rounded-3xl shadow-lg transform transition-transform duration-300 hover:scale-[1.01]"
                    >
                        <div className="flex items-center mb-4">
                            <span className="text-3xl mr-4">{getIconForSection(sectionName)}</span>
                            <h2 className="text-2xl font-semibold text-gray-900">{sectionName}</h2>
                        </div>
                        <div className="space-y-4">
                            {schedule
                                .filter(activity => sections[sectionName].includes(activity.time))
                                .map((activity, index) => (
                                    <div 
                                        key={index} 
                                        className="bg-gray-50 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center"
                                    >
                                        <div className="flex-1">
                                            <label className="flex items-start cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={activity.isDone}
                                                    onChange={() => handleCheckboxChange(index)}
                                                    className="form-checkbox h-5 w-5 text-teal-500 rounded border-gray-300 focus:ring-0 mr-3 mt-1 flex-shrink-0"
                                                />
                                                <div>
                                                    <p className={`font-medium ${activity.isDone ? 'line-through text-gray-400' : ''}`}>
                                                        {activity.time} <span className="font-normal text-gray-500">- {activity.description}</span>
                                                    </p>
                                                    {activity.details && (
                                                        <p className="text-sm font-light italic text-gray-500 mt-1">{activity.details}</p>
                                                    )}
                                                </div>
                                            </label>
                                            <textarea
                                                className="w-full mt-2 p-2 text-sm rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-0 transition-all duration-200"
                                                placeholder="Add a comment or reflection..."
                                                value={activity.comment}
                                                onChange={(e) => handleCommentChange(index, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-white rounded-3xl shadow-lg w-full max-w-4xl text-center transform transition-transform duration-300 hover:scale-[1.01]">
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">Your Daily Balance ⚖️</h3>
                <p className="text-gray-600 leading-relaxed">
                    This version integrates small but impactful health habits throughout your day, helping you build muscle, reduce pain, and feel more energetic for your studies, work, and faith.
                </p>
            </div>
            
            {isSaving && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white text-sm rounded-full shadow-lg transition-opacity duration-300">
                    Saving...
                </div>
            )}
        </div>
    );
};

export default App;

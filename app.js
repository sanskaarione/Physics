// main.js

// Base schedule data (simplified version for clarity)
const baseSchedule = [
    { time: '5:10 AM', description: 'Wake up & wudu', details: 'Drink a glass of warm water.' },
    { time: '5:30 – 6:00 AM', description: 'Fajr + Qur’an', details: 'Keep a straight posture during recitation.' },
    { time: '6:05 – 6:35 AM', description: 'Exercise', details: 'Strength, stretches, and breathing.' },
    { time: '6:35 – 6:55 AM', description: 'Shower + Breakfast', details: 'Fuel for the day: paneer, eggs, or poha.' },
    { time: '6:55 – 7:10 AM', description: 'Cycle to library',},
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
    // Add other activities here
];

// This will hold the schedule data dynamically
let schedule = [];

// Function to render schedule
function renderSchedule() {
    const scheduleContainer = document.getElementById('schedule');
    scheduleContainer.innerHTML = ''; // Clear existing schedule

    schedule.forEach((activity, index) => {
        const activityDiv = document.createElement('div');
        activityDiv.classList.add('activity');
        
        // Create checkbox for completion status
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = activity.isDone;
        checkbox.addEventListener('change', () => handleCheckboxChange(index));

        // Create text content for activity time and description
        const text = document.createElement('div');
        text.innerHTML = `<strong>${activity.time}</strong> - ${activity.description}`;
        if (activity.details) {
            const details = document.createElement('p');
            details.textContent = activity.details;
            text.appendChild(details);
        }

        // Create textarea for comments
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Add a comment or reflection...';
        textarea.value = activity.comment || '';
        textarea.addEventListener('input', (e) => handleCommentChange(index, e.target.value));

        // Append elements to the activity div
        activityDiv.appendChild(checkbox);
        activityDiv.appendChild(text);
        activityDiv.appendChild(textarea);
        scheduleContainer.appendChild(activityDiv);
    });
}

// Handle checkbox change
function handleCheckboxChange(index) {
    schedule[index].isDone = !schedule[index].isDone;
    renderSchedule(); // Re-render to reflect changes
}

// Handle comment change
function handleCommentChange(index, comment) {
    schedule[index].comment = comment;
    // You can save this to local storage, server, or just keep in memory.
}

// Initialize schedule state
function initializeSchedule() {
    schedule = baseSchedule.map(activity => ({
        ...activity,
        isDone: false,
        comment: ''
    }));
    renderSchedule(); // Initial render
}

// Start the app
initializeSchedule();
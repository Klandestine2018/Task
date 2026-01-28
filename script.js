import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize Supabase
const supabaseUrl = 'https://glcbgojazyixtydglqeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY2Jnb2phenlpeHR5ZGdscWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3MDYsImV4cCI6MjA4NTEyODcwNn0.6KDkeCtlYbT5jo4mvA_iwYo4vgCPtn4DTyG7HYkeqUM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple tasks that take 1-2 minutes max
const tinyTasks = [
    { text: "Drink a glass of water", time: "1 min", xp: 1 },
    { text: "Put 1 dish in the dishwasher", time: "30 sec", xp: 1 },
    { text: "Take 3 deep breaths", time: "1 min", xp: 1 },
    { text: "Put 1 item of clothing away", time: "1 min", xp: 1 },
    { text: "Stretch for 30 seconds", time: "30 sec", xp: 1 },
    { text: "Look out the window for 1 minute", time: "1 min", xp: 1 },
    { text: "Touch your toes once", time: "30 sec", xp: 1 },
    { text: "Smile for 10 seconds", time: "10 sec", xp: 1 },
    { text: "Blink slowly 10 times", time: "30 sec", xp: 1 },
    { text: "Put 1 thing back where it belongs", time: "1 min", xp: 1 },
    { text: "Take 1 sip of water", time: "10 sec", xp: 1 },
    { text: "Roll your shoulders once", time: "30 sec", xp: 1 },
    { text: "Look at something green", time: "30 sec", xp: 1 },
    { text: "Exhale slowly 3 times", time: "1 min", xp: 1 }
];

// Pet evolution stages
const petStages = [
    { emoji: "🥚", name: "Egg", level: 1, xpNeeded: 5 },
    { emoji: "🐣", name: "Hatchling", level: 2, xpNeeded: 10 },
    { emoji: "🐥", name: "Chick", level: 3, xpNeeded: 15 },
    { emoji: "🐓", name: "Chicken", level: 4, xpNeeded: 20 },
    { emoji: "🦅", name: "Eagle", level: 5, xpNeeded: 25 }
];

let currentTask = null;
let userData = {
    xp: 0,
    level: 1,
    tasksToday: 0,
    streak: 0,
    lastTaskDate: null
};

// Load user data
async function loadUserData() {
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .single();
        
        if (error && error.code === 'PGRST116') {
            // No data yet, create initial record
            await createUserRecord();
        } else if (data) {
            userData = data;
            updateUI();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        // Continue with local data if Supabase fails
    }
}

async function createUserRecord() {
    try {
        const { error } = await supabase
            .from('user_progress')
            .insert([userData]);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error creating record:', error);
    }
}

// Generate new task
function generateNewTask() {
    const randomTask = tinyTasks[Math.floor(Math.random() * tinyTasks.length)];
    currentTask = {
        ...randomTask,
        id: Date.now(),
        completed: false
    };
    
    document.getElementById('current-task').querySelector('.task-text').textContent = currentTask.text;
    document.getElementById('task-time').textContent = currentTask.time;
}

// Complete task
async function completeTask() {
    if (!currentTask) return;
    
    // Update XP and level
    userData.xp += currentTask.xp;
    userData.tasksToday++;
    
    // Check if leveled up
    const currentStage = petStages[userData.level - 1];
    if (userData.xp >= currentStage.xpNeeded && userData.level < petStages.length) {
        userData.level++;
        userData.xp = 0; // Reset XP for new level
        celebrateLevelUp();
    }
    
    // Save to recent tasks
    saveRecentTask(currentTask.text);
    
    // Save to database
    await saveUserData();
    
    // Update UI
    updateUI();
    
    // Generate new task
    generateNewTask();
}

// Skip task
function skipTask() {
    generateNewTask();
}

// Save recent task locally
function saveRecentTask(taskText) {
    let recent = JSON.parse(localStorage.getItem('recentTasks') || '[]');
    recent.unshift({
        text: taskText,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    recent = recent.slice(0, 5); // Keep only 5 recent
    localStorage.setItem('recentTasks', JSON.stringify(recent));
    updateRecentTasks();
}

// Update recent tasks display
function updateRecentTasks() {
    const recent = JSON.parse(localStorage.getItem('recentTasks') || '[]');
    const container = document.getElementById('recent-list');
    container.innerHTML = recent.map(task => `
        <div class="recent-item">
            <div>${task.text}</div>
            <div class="recent-time">${task.time}</div>
        </div>
    `).join('');
}

// Save user data to database
async function saveUserData() {
    try {
        const { error } = await supabase
            .from('user_progress')
            .update(userData)
            .eq('id', userData.id || 1);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Update UI
function updateUI() {
    // Update pet
    const pet = document.getElementById('pet');
    const currentStage = petStages[userData.level - 1];
    pet.textContent = currentStage.emoji;
    pet.className = `pet stage-${userData.level}`;
    
    // Update stats
    document.getElementById('level').textContent = userData.level;
    document.getElementById('xp').textContent = userData.xp;
    document.getElementById('xp-needed').textContent = currentStage.xpNeeded;
    document.getElementById('tasks-today').textContent = userData.tasksToday;
    document.getElementById('streak').textContent = userData.streak;
    
    // Update XP bar
    const xpPercent = (userData.xp / currentStage.xpNeeded) * 100;
    document.getElementById('xp-fill').style.width = `${xpPercent}%`;
    
    // Update recent tasks
    updateRecentTasks();
}

// Celebrate level up
function celebrateLevelUp() {
    const pet = document.getElementById('pet');
    pet.classList.add('celebrating');
    setTimeout(() => pet.classList.remove('celebrating'), 500);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserData();
    generateNewTask();
    
    // Event listeners
    document.getElementById('complete-task').addEventListener('click', completeTask);
    document.getElementById('skip-task').addEventListener('click', skipTask);
});

// Create table in Supabase (run this once)
async function createTable() {
    try {
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS user_progress (
                    id SERIAL PRIMARY KEY,
                    xp INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    tasks_today INTEGER DEFAULT 0,
                    streak INTEGER DEFAULT 0,
                    last_task_date DATE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });
        
        if (error) throw error;
        console.log('Table created successfully');
    } catch (error) {
        console.error('Error creating table:', error);
    }
}

// Call this once to set up the table
// createTable();
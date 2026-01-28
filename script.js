import { authManager } from './auth.js';
import { aiTaskGenerator } from './ai-tasks.js';
import { getPetEvolution } from './pets.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://glcbgojazyixtydglqeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY2Jnb2phenlpeHR5ZGdscWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3MDYsImV4cCI6MjA4NTEyODcwNn0.6KDkeCtlYbT5jo4mvA_iwYo4vgCPtn4DTyG7HYkeqUM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Global state
let currentUser = null;
let currentTask = null;
let userProfile = null;

// DOM elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const petSelection = document.getElementById('pet-selection');
const selectPetBtn = document.getElementById('select-pet-btn');

// Auth event listeners
document.getElementById('signin-btn').addEventListener('click', handleSignIn);
document.getElementById('signup-btn').addEventListener('click', handleSignUp);
document.getElementById('logout-btn').addEventListener('click', handleLogout);

// Pet selection
document.querySelectorAll('.pet-option').forEach(option => {
    option.addEventListener('click', (e) => {
        document.querySelectorAll('.pet-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectPetBtn.classList.remove('hidden');
        selectPetBtn.dataset.petType = option.dataset.pet;
    });
});

selectPetBtn.addEventListener('click', handlePetSelection);

// App event listeners
document.getElementById('complete-task').addEventListener('click', completeTask);
document.getElementById('skip-task').addEventListener('click', skipTask);
document.getElementById('regenerate-task').addEventListener('click', generateNewTask);

// Auth functions
async function handleSignIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const result = await authManager.signIn(email, password);
    if (result.success) {
        await loadUserData();
    } else {
        alert('Sign in failed: ' + result.error);
    }
}

async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const result = await authManager.signUp(email, password);
    if (result.success) {
        // Show pet selection
        loginForm.classList.add('hidden');
        petSelection.classList.remove('hidden');
    } else {
        alert('Sign up failed: ' + result.error);
    }
}

async function handleLogout() {
    await authManager.signOut();
    showAuthSection();
}

async function handlePetSelection() {
    const petType = selectPetBtn.dataset.petType;
    if (petType && authManager.user) {
        await authManager.updatePetType(authManager.user.id, petType);
        await loadUserData();
    }
}

// User data management
async function loadUserData() {
    const user = await authManager.getCurrentUser();
    if (!user) {
        showAuthSection();
        return;
    }
    
    currentUser = user;
    
    // Load user profile
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
    
    if (profile) {
        userProfile = profile;
        showAppSection();
        updateUI();
        await generateNewTask();
    } else {
        // New user, show pet selection
        loginForm.classList.add('hidden');
        petSelection.classList.remove('hidden');
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }
}

// Task management
async function generateNewTask() {
    if (!userProfile) return;
    
    const userContext = {
        petType: userProfile.pet_type,
        level: userProfile.level,
        tasksToday: userProfile.tasks_today
    };
    
    currentTask = await aiTaskGenerator.generateTask(userContext);
    
    document.getElementById('current-task').querySelector('.task-text').textContent = currentTask.text;
    document.getElementById('task-time').textContent = currentTask.time;
}

async function completeTask() {
    if (!currentTask || !userProfile) return;
    
    // Update user profile
    userProfile.xp += currentTask.xp;
    userProfile.tasks_today += 1;
    userProfile.total_tasks += 1;
    
    // Check for level up
    const currentStage = getPetEvolution(userProfile.pet_type, userProfile.level);
    if (userProfile.xp >= currentStage.xpNeeded && userProfile.level < 5) {
        userProfile.level += 1;
        userProfile.xp = 0;
        celebrateLevelUp();
    }
    
    // Save to recent tasks
    saveRecentTask(currentTask.text);
    
    // Update database
    await updateUserProfile();
    
    // Update UI
    updateUI();
    
    // Generate new task
    await generateNewTask();
}

async function skipTask() {
    await generateNewTask();
}

// UI functions
function showAuthSection() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
}

function showAppSection() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
}

function updateUI() {
    if (!userProfile) return;
    
    // Update pet
    const petData = getPetEvolution(userProfile.pet_type, userProfile.level);
    const pet = document.getElementById('pet');
    pet.textContent = petData.emoji;
    pet.className = `pet ${userProfile.pet_type} stage-${userProfile.level}`;
    
    // Update app theme
    document.body.style.background = petData.colors.gradient;
    document.getElementById('app-title').textContent = `${petData.name} Companion`;
    document.getElementById('current-pet-type').textContent = userProfile.pet_type;
    document.getElementById('pet-name').textContent = userProfile.pet_name || petData.name;
    
    // Update stats
    document.getElementById('level').textContent = userProfile.level;
    document.getElementById('xp').textContent = userProfile.xp;
    document.getElementById('xp-needed').textContent = petData.xpNeeded;
    document.getElementById('tasks-today').textContent = userProfile.tasks_today;
    document.getElementById('streak').textContent = userProfile.streak;
    document.getElementById('total-tasks').textContent = userProfile.total_tasks;
    
    // Update XP bar
    const xpPercent = (userProfile.xp / petData.xpNeeded) * 100;
    document.getElementById('xp-fill').style.width = `${xpPercent}%`;
}

function saveRecentTask(taskText) {
    let recent = JSON.parse(localStorage.getItem(`recentTasks_${currentUser.id}`) || '[]');
    recent.unshift({
        text: taskText,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    recent = recent.slice(0, 5);
    localStorage.setItem(`recentTasks_${currentUser.id}`, JSON.stringify(recent));
    updateRecentTasks();
}

function updateRecentTasks() {
    const recent = JSON.parse(localStorage.getItem(`recentTasks_${currentUser.id}`) || '[]');
    const container = document.getElementById('recent-list');
    container.innerHTML = recent.map(task => `
        <div class="recent-item">
            <div>${task.text}</div>
            <div class="recent-time">${task.time}</div>
        </div>
    `).join('');
}

function celebrateLevelUp() {
    const pet = document.getElementById('pet');
    pet.classList.add('celebrating');
    setTimeout(() => pet.classList.remove('celebrating'), 500);
}

async function updateUserProfile() {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({
                level: userProfile.level,
                xp: userProfile.xp,
                tasks_today: userProfile.tasks_today,
                total_tasks: userProfile.total_tasks,
                streak: userProfile.streak
            })
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Update profile error:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already signed in
    await loadUserData();
});

// Auth state changes
authManager.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        showAuthSection();
    } else if (event === 'SIGNED_IN') {
        loadUserData();
    }
});
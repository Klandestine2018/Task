import { authManager } from './auth.js';
import { supabase } from './supabase.js';
import { aiTaskGenerator } from './ai-tasks.js';
import { getPetEvolution } from './pets.js';


let currentUser = null;
let currentTask = null;
let userProfile = null;

const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const petSelection = document.getElementById('pet-selection');
const selectPetBtn = document.getElementById('select-pet-btn');

document.getElementById('signin-btn').addEventListener('click', handleSignIn);
document.getElementById('signup-btn').addEventListener('click', handleSignUp);
document.getElementById('logout-btn').addEventListener('click', handleLogout);

document.querySelectorAll('.pet-option').forEach(option => {
    option.addEventListener('click', (e) => {
        document.querySelectorAll('.pet-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectPetBtn.classList.remove('hidden');
        selectPetBtn.dataset.petType = option.dataset.pet;
    });
});

selectPetBtn.addEventListener('click', handlePetSelection);

document.getElementById('complete-task').addEventListener('click', completeTask);
document.getElementById('skip-task').addEventListener('click', skipTask);
document.getElementById('regenerate-task').addEventListener('click', generateNewTask);

async function handleSignIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('Attempting sign in...');
    const result = await authManager.signIn(email, password);
    
    if (result.success) {
        console.log('Sign in successful - auth state change will handle the rest');
        // Don't call loadUserData here - the auth state change will handle it
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



async function loadUserData() {
    console.log('=== STARTING loadUserData ===');
    
    // Use the global currentUser we set from auth state change
    if (!currentUser) {
        console.log('No currentUser, showing auth section');
        showAuthSection();
        return;
    }
    
    console.log('User from auth state:', currentUser.id);
    
    try {
        console.log('Loading profile...');
        console.log('About to query: user_profiles where user_id =', currentUser.id);
        console.log('Using supabase:', typeof supabase);
        console.log('supabase.from exists:', typeof supabase.from);
        
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
        
        console.log('Profile query completed');
        console.log('Profile result:', { data: profile, error });
        
        if (error) {
            console.log('Error detected:', error);
            console.log('Error code:', error.code);
            console.log('Error message:', error.message);
            
            if (error.code === 'PGRST116') {
                console.log('Creating new profile...');
                await createUserProfile(currentUser.id);
            } else {
                throw error;
            }
        } else {
            console.log('Profile loaded successfully:', profile);
            userProfile = profile;
        }
        
        console.log('Showing app...');
        showAppSection();
        updateUI();
        await generateNewTask();
        console.log('=== COMPLETED ===');
        
    } catch (error) {
        console.error('MAJOR ERROR:', error);
        console.error('Error stack:', error.stack);
        alert('Login error: ' + error.message + '\nCheck console for details');
        showAuthSection();
    }
}


// Add this test function
async function testSupabase() {
    console.log('=== TESTING SUPABASE ===');
    console.log('supabase exists:', !!supabase);
    console.log('supabase.from exists:', typeof supabase.from);
    
    try {
        const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
        console.log('Test query result:', { data, error });
    } catch (testError) {
        console.error('Test query failed:', testError);
    }
}

// Add this new function to create profile if missing:
async function createUserProfile(userId) {
    console.log('Creating profile for user:', userId);
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .insert([{
                user_id: userId,
                pet_type: 'dragon',
                pet_name: 'Companion',
                level: 1,
                xp: 0,
                tasks_today: 0,
                total_tasks: 0,
                streak: 0
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Profile creation error:', error);
            throw error;
        }
        
        console.log('Profile created successfully:', data);
        userProfile = data;
        return data;
        
    } catch (error) {
        console.error('Could not create profile:', error);
        throw error;
    }
}

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
    
    userProfile.xp += currentTask.xp;
    userProfile.tasks_today += 1;
    userProfile.total_tasks += 1;
    
    const currentStage = getPetEvolution(userProfile.pet_type, userProfile.level);
    if (userProfile.xp >= currentStage.xpNeeded && userProfile.level < 10) {  // Changed from 5 to 10
        userProfile.level += 1;
        userProfile.xp = 0;
        celebrateLevelUp();
    }
    
    saveRecentTask(currentTask.text);
    
    await updateUserProfile();
    
    updateUI();
    
    await generateNewTask();
}
async function skipTask() {
    await generateNewTask();
}

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
    
    const petData = getPetEvolution(userProfile.pet_type, userProfile.level);
    const pet = document.getElementById('pet');
    pet.textContent = petData.emoji;
    pet.className = `pet ${userProfile.pet_type} stage-${userProfile.level}`;
    
    document.body.style.background = petData.colors.gradient;
    document.getElementById('app-title').textContent = `${petData.name} Companion`;
    document.getElementById('current-pet-type').textContent = userProfile.pet_type;
    document.getElementById('pet-name').textContent = userProfile.pet_name || petData.name;
    
    document.getElementById('level').textContent = userProfile.level;
    document.getElementById('xp').textContent = userProfile.xp;
    document.getElementById('xp-needed').textContent = petData.xpNeeded;
    document.getElementById('tasks-today').textContent = userProfile.tasks_today;
    document.getElementById('streak').textContent = userProfile.streak;
    document.getElementById('total-tasks').textContent = userProfile.total_tasks;
    
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
        const safeLevel = Math.min(userProfile.level, 10);

        const { error } = await supabase
            .from('user_profiles')
            .update({
                level: safeLevel,
                xp: userProfile.xp,
                tasks_today: userProfile.tasks_today,
                total_tasks: userProfile.total_tasks,
                streak: userProfile.streak,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        console.log('Profile updated successfully');
    } catch (error) {
        console.error('Update profile error:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserData();
});

authManager.onAuthStateChange(async (event, session) => {
    console.log('=== AUTH STATE CHANGE ===', event);
    
    if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, storing user and loading data...');
        currentUser = session.user; // Store the user from session
        await loadUserData();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        showAuthSection();
    }
});
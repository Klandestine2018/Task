// Create single shared Supabase instance
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://glcbgojazyixtydglqeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY2Jnb2phenlpeHR5ZGdscWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3MDYsImV4cCI6MjA4NTEyODcwNn0.6KDkeCtlYbT5jo4mvA_iwYo4vgCPtn4DTyG7HYkeqUM';

// Single shared instance
export const supabase = createClient(supabaseUrl, supabaseKey);

export class AuthManager {
    constructor() {
        this.supabase = supabase;
        this.user = null;
        this.session = null;
    }

    async signUp(email, password) {
        try {
            console.log('Attempting sign up with:', email);
            
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
            });
            
            if (error) {
                console.error('Sign up error:', error);
                throw error;
            }
            
            console.log('Sign up response:', data);
            
            // Wait for user to be created
            if (data.user) {
                this.user = data.user;
                this.session = data.session;
                
                // Try to create profile manually
                await this.createUserProfile(this.user.id);
                
                return { success: true, data };
            } else if (data.session) {
                // Sometimes user is in session but not data.user
                const { data: { user } } = await this.supabase.auth.getUser();
                this.user = user;
                this.session = data.session;
                
                if (this.user) {
                    await this.createUserProfile(this.user.id);
                }
                
                return { success: true, data };
            } else {
                // Email verification might be required
                return { 
                    success: true, 
                    data, 
                    message: 'Check your email for confirmation link' 
                };
            }
            
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async createUserProfile(userId) {
        try {
            console.log('Creating profile for user:', userId);
            
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
                // Profile might already exist from trigger
                const { data: existingProfile } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                
                if (existingProfile) {
                    console.log('Profile already exists');
                    return true;
                }
                
                return false;
            }
            
            console.log('Profile created:', data);
            return true;
        } catch (error) {
            console.error('Create profile error:', error);
            return false;
        }
    }

    async updatePetType(userId, petType) {
        try {
            const { error } = await this.supabase
                .from('user_profiles')
                .update({ pet_type: petType })
                .eq('user_id', userId);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Update pet type error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            console.log('Attempting sign in with:', email);
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            
            if (error) {
                console.error('Sign in error:', error);
                throw error;
            }
            
            console.log('Sign in successful:', data);
            
            this.user = data.user;
            this.session = data.session;
            
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            this.user = null;
            this.session = null;
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async refreshSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.refreshSession();
            if (error) throw error;
            
            if (session) {
                this.session = session;
                this.user = session.user;
            }
            return { success: true, session };
        } catch (error) {
            console.error('Session refresh error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentUser() {
        console.log('=== AUTH MANAGER getCurrentUser CALLED ===');
        
        try {
            console.log('1. Getting session...');
            const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
            
            if (sessionError) {
                console.log('Session error:', sessionError);
                return null;
            }
            
            if (session?.user) {
                console.log('2. Found user in session:', session.user.id);
                this.user = session.user;
                return session.user;
            }
            
            // If no session, try getUser as fallback
            console.log('3. No session, trying getUser...');
            const { data: { user }, error: userError } = await this.supabase.auth.getUser();
            
            if (userError) {
                console.log('getUser error:', userError);
                return null;
            }
            
            this.user = user;
            console.log('4. User from getUser:', user?.id);
            return user;
            
        } catch (error) {
            console.error('5. Major error:', error);
            return null;
        }
    }

    onAuthStateChange(callback) {
        return this.supabase.auth.onAuthStateChange(callback);
    }
}

// Export single instance
export const authManager = new AuthManager();

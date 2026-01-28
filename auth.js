import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://glcbgojazyixtydglqeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY2Jnb2phenlpeHR5ZGdscWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3MDYsImV4cCI6MjA4NTEyODcwNn0.6KDkeCtlYbT5jo4mvA_iwYo4vgCPtn4DTyG7HYkeqUM';
const supabase = createClient(supabaseUrl, supabaseKey);

export class AuthManager {
    constructor() {
        this.user = null;
        this.session = null;
    }

    async signUp(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            
            if (error) throw error;
            
            this.user = data.user;
            this.session = data.session;
            
            // Create user profile
            if (this.user) {
                await this.createUserProfile(this.user.id);
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (error) throw error;
            
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
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.user = null;
            this.session = null;
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            this.user = user;
            return user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    async createUserProfile(userId) {
        try {
            const { error } = await supabase
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
                }]);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Create profile error:', error);
            return false;
        }
    }

    async updatePetType(userId, petType) {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ pet_type: petType })
                .eq('user_id', userId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Update pet type error:', error);
            return false;
        }
    }

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    }
}

export const authManager = new AuthManager();
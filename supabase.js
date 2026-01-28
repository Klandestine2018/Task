import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://glcbgojazyixtydglqeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY2Jnb2phenlpeHR5ZGdscWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3MDYsImV4cCI6MjA4NTEyODcwNn0.6KDkeCtlYbT5jo4mvA_iwYo4vgCPtn4DTyG7HYkeqUM';

export const supabase = createClient(supabaseUrl, supabaseKey);
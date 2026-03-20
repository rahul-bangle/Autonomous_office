import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lgovxpvqhcvzagcfamwj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnb3Z4cHZxaGN2emFnY2ZhbXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTI1MjksImV4cCI6MjA4NzUyODUyOX0.6fQkAmcalHYqu40T4s5CwXygfiJVEokhtNp_wbFYmyo';

export const supabase = createClient(supabaseUrl, supabaseKey);

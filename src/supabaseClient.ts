import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uiipfzpirsnhjwdzgjht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpaXBmenBpcnNuaGp3ZHpnamh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjE0NjgsImV4cCI6MjA5ODk5NzQ2OH0.ZWxxkDTqfITMBLiz1qXwV5NtJS00hWdyzk8-kMQvXTM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
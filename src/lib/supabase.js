import { createClient } from '@supabase/supabase-js';

const supabaseUrl = window.__SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = window.__SUPABASE_KEY__ || import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

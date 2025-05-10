
import { createClient } from '@supabase/supabase-js';

// Use the provided Supabase credentials
const supabaseUrl = "https://dqnopbhjcqbhhulswmdz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbm9wYmhqY3FiaGh1bHN3bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4Mjk0NDcsImV4cCI6MjA2MjQwNTQ0N30.O6gZd1JcYLQ6qehfA3J2JC1wyelkbiSfF7D5tiaeZpE";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

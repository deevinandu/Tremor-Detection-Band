// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dqnopbhjcqbhhulswmdz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbm9wYmhqY3FiaGh1bHN3bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4Mjk0NDcsImV4cCI6MjA2MjQwNTQ0N30.O6gZd1JcYLQ6qehfA3J2JC1wyelkbiSfF7D5tiaeZpE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
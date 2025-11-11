import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tyrbxpeyhvsjwhdsstkv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cmJ4cGV5aHZzandoZHNzdGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTg1MzUsImV4cCI6MjA3ODMzNDUzNX0.-zNW1Aoj3Hls-N3525Jo7yWn4BZ-ihjMnx1memoUCzo";  // paste the full anon key here

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: AsyncStorage,
    autoRefreshToken: true
  }
});

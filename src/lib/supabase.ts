import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// TODO: Replace with your actual Supabase URL and Anon Key
// You can also use expo-constants to load these from app.json/env
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://your-project.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: {
            getItem: (key) => {
                // TODO: Implement secure storage (AsyncStorage or SecureStore)
                return null;
            },
            setItem: (key, value) => {
                // TODO: Implement secure storage
            },
            removeItem: (key) => {
                // TODO: Implement secure storage
            },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

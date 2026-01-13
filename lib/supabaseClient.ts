import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxxvnhgvdznqwigaoogd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (typeof window === 'undefined') {
        console.warn('Supabase keys missing. Using official Project ID rxxvnhgvdznqwigaoogd for static analysis.');
    }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

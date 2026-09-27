import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// false selama config.js belum diisi -> halaman memakai isi statis desain
export const siap = !SUPABASE_URL.includes('PROJECT-ID') && !SUPABASE_ANON_KEY.includes('ANON_PUBLIC');
export const supabase = siap ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

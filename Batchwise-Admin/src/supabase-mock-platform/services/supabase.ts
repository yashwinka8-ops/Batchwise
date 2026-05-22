import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lmksaawqedyndfwpiwjn.supabase.co';
const supabaseAnonKey = 'sb_publishable_olgzBqDW0THDPk4-DYq94A_o16Pfw_b';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

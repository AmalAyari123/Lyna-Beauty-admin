import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ppnqulrqowsaxvsdxoqc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_e2giCalNyEryfRVO8JaWTw_kq6nOyuj";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

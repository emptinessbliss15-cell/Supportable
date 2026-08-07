import { createClient } from "@supabase/supabase-js";

type SupportableEnv = {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
};

const env = (import.meta as ImportMeta & {
  env: SupportableEnv;
}).env;

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

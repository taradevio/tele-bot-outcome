import { createClient } from "@supabase/supabase-js";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
};

const supabaseClient = (c: Env) => createClient(c.SUPABASE_URL, c.SUPABASE_KEY);


export default supabaseClient;
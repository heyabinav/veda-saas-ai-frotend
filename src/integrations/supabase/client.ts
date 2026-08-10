import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Keep static generation from crashing when preview/build workers do not expose
// project variables. Deployed environments use the real values automatically.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey);

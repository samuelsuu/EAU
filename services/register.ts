import { supabase } from "@/lib/supabase";

export async function registerWithSupabase(form: any) {
  // Step 1: Create Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
  });

  if (authError) return { error: authError.message };

  // Step 2: Insert profile
  const userId = authData.user?.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    first_name: form.first_name,
    last_name: form.last_name,
    username: form.user_name || null,
    email: form.email,
    role: form.role, // "user" | "artisan"
    bio: "",
    skills: [],
    is_available: true,
  });

  if (profileError) return { error: profileError.message };

  return { data: "success" };
}

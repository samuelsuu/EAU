// services/login.ts
import { supabase } from "@/lib/supabase";

export interface LoginForm {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      username: string | null;
      role: "user" | "artisan";
      bio: string;
      skills: string[];
      is_available: boolean;
      avatar_url: string | null;
      phone: string | null;
      location: string | null;
      created_at: string;
    };
  };
}

/**
 * Login user with Supabase and fetch profile
 */
export async function loginWithSupabase(
  form: LoginForm
): Promise<LoginResult> {
  try {
    // Step 1: Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (authError) {
      // Handle specific error cases
      if (authError.message.includes("Invalid login credentials")) {
        return {
          success: false,
          error: "Invalid email or password. Please try again.",
        };
      }

      if (authError.message.includes("Email not confirmed")) {
        return {
          success: false,
          error: "Please verify your email before signing in. Check your inbox for the verification link.",
        };
      }

      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user || !authData.session) {
      return {
        success: false,
        error: "Login failed. Please try again.",
      };
    }

    // Step 2: Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      // Sign out if profile doesn't exist
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Profile not found. Please contact support.",
      };
    }

    // Step 3: Return success with token and user data
    return {
      success: true,
      data: {
        token: authData.session.access_token,
        user: {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          username: profile.username,
          role: profile.role,
          bio: profile.bio,
          skills: profile.skills || [],
          is_available: profile.is_available,
          avatar_url: profile.avatar_url || null,
          phone: profile.phone || null,
          location: profile.location || null,
          created_at: profile.created_at,
        },
      },
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || "Failed to logout" 
    };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * Fetch a user profile by user ID
 */
export async function getProfileById(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch profile" };
  }
}

/**
 * Update a user profile by user ID
 */
export async function updateProfileById(userId: string, profileData: any) {
  try {
    const { error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", userId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update profile" };
  }
}
// services/artisan.ts
import { supabase } from "@/lib/supabase";

export interface Artisan {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string | null;
  email?: string;
  role?: "user" | "artisan";
  bio?: string;
  skills?: string[];
  is_available?: boolean;
  avatar_url?: string | null;
  phone?: string | null;
  location?: string | null;
  created_at?: string;
  // Additional fields that might be in the profile
  name?: string;
  profession?: string;
  title?: string;
  rating?: number;
  reviews?: number;
  hourly_rate?: string;
  avatar?: string;
  completed_jobs?: number;
  description?: string;
  experience_level?: string;
  languages?: string;
  english_level?: string;
  freelancer_type?: string;
  address?: string;
  views?: number;
  tagline?: string;
  average_rating?: number;
  rating_count?: number;
}

export interface ArtisanFilters {
  keyword?: string;
  category?: string;
  skill?: string;
  expertise_level?: string;
  language?: string;
  location?: string;
  min_price?: string;
  max_price?: string;
  sort_by?: string;
  order?: "asc" | "desc";
  per_page?: number;
  paged?: number;
}

/**
 * Get list of artisans from profiles table
 */
export async function getArtisansList(filters?: ArtisanFilters) {
  try {
    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "artisan");

    // Apply keyword search (search in name, bio, skills)
    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase();
      query = query.or(
        `first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%,username.ilike.%${keyword}%,bio.ilike.%${keyword}%`
      );
    }

    // Apply location filter
    if (filters?.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }

    // Apply skills filter (if skills is an array in the profile)
    if (filters?.skill) {
      query = query.contains("skills", [filters.skill]);
    }

    // Apply sorting
    if (filters?.sort_by) {
      const ascending = filters.order === "asc";
      query = query.order(filters.sort_by, { ascending });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    const perPage = filters?.per_page || 50;
    const page = filters?.paged || 1;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    // Transform data to match expected format
    const artisans = (data || []).map((profile) => ({
      id: profile.id,
      name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username || "Unknown",
      first_name: profile.first_name,
      last_name: profile.last_name,
      username: profile.username,
      email: profile.email,
      role: profile.role,
      bio: profile.bio || profile.description,
      description: profile.bio || profile.description,
      skills: profile.skills || [],
      is_available: profile.is_available,
      avatar: profile.avatar_url || profile.avatar,
      avatar_url: profile.avatar_url || profile.avatar,
      phone: profile.phone,
      location: profile.location || profile.address,
      address: profile.address || profile.location,
      tagline: profile.tagline,
      hourly_rate: profile.hourly_rate,
      rating: profile.rating || profile.average_rating,
      average_rating: profile.average_rating || profile.rating,
      reviews: profile.reviews || profile.rating_count,
      rating_count: profile.rating_count || profile.reviews,
      completed_jobs: profile.completed_jobs,
      experience_level: profile.experience_level,
      languages: profile.languages,
      english_level: profile.english_level,
      freelancer_type: profile.freelancer_type,
      views: profile.views,
      created_at: profile.created_at,
    }));

    return { success: true, data: artisans };
  } catch (error: any) {
    console.error("Get artisans error:", error);
    return { success: false, error: error.message || "Failed to fetch artisans", data: [] };
  }
}

/**
 * Get artisan details by ID
 */
export async function getArtisanById(artisanId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", artisanId)
      .eq("role", "artisan")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Artisan not found" };
    }

    // Transform to match expected format
    const artisan: Artisan = {
      id: data.id,
      name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || data.username || "Unknown",
      first_name: data.first_name,
      last_name: data.last_name,
      username: data.username,
      email: data.email,
      role: data.role,
      bio: data.bio || data.description,
      description: data.bio || data.description,
      skills: data.skills || [],
      is_available: data.is_available,
      avatar: data.avatar_url || data.avatar,
      avatar_url: data.avatar_url || data.avatar,
      phone: data.phone,
      location: data.location || data.address,
      address: data.address || data.location,
      tagline: data.tagline,
      hourly_rate: data.hourly_rate,
      rating: data.rating || data.average_rating,
      average_rating: data.average_rating || data.rating,
      reviews: data.reviews || data.rating_count,
      rating_count: data.rating_count || data.reviews,
      completed_jobs: data.completed_jobs,
      experience_level: data.experience_level,
      languages: data.languages,
      english_level: data.english_level,
      freelancer_type: data.freelancer_type,
      views: data.views,
      created_at: data.created_at,
    };

    return { success: true, data: artisan };
  } catch (error: any) {
    console.error("Get artisan details error:", error);
    return { success: false, error: error.message || "Failed to fetch artisan details" };
  }
}

/**
 * Send a message to an artisan
 */
export interface SendMessageParams {
  sender_id: string;
  receiver_id: string;
  content: string;
}

export async function sendMessageToArtisan(params: SendMessageParams) {
  try {
    if (!params.sender_id || !params.receiver_id || !params.content?.trim()) {
      return { success: false, error: "Missing required fields" };
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: params.sender_id,
        receiver_id: params.receiver_id,
        content: params.content.trim(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Send message error:", error);
    return { success: false, error: error.message || "Failed to send message" };
  }
}

/**
 * Get filter options (if needed from a separate table or static data)
 * This is a placeholder - adjust based on your actual filter data structure
 */
export async function getArtisanFilters() {
  try {
    // If you have a separate filters table, query it here
    // For now, return empty filters
    return {
      success: true,
      data: {
        categories: [],
        skills: [],
        expertise_levels: [
          { id: 1, name: "Beginner", slug: "beginner" },
          { id: 2, name: "Intermediate", slug: "intermediate" },
          { id: 3, name: "Expert", slug: "expert" },
        ],
        languages: [],
        locations: [],
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch filters" };
  }
}


// services/jobs.ts
import { supabase } from "@/lib/supabase";

export interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_type: "fixed" | "hourly";
  location: string | null;
  job_type: "task" | "project";
  status: "open" | "in_progress" | "completed" | "cancelled";
  skills: string[];
  category: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    avatar: string | null;
  };
  proposal_count?: number;
}

export interface Proposal {
  id: string;
  job_id: string;
  freelancer_id: string;
  cover_letter: string;
  proposed_amount: number | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ==================== JOB FUNCTIONS ====================

/**
 * Get all open jobs
 */
export const getOpenJobs = async (filters?: {
  job_type?: "task" | "project";
  category?: string;
  skills?: string[];
  location?: string;
  limit?: number;
}) => {
  try {
    let query = supabase
      .from("jobs")
      .select(`
        *,
        client:profiles!jobs_client_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          avatar
        )
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.job_type) {
      query = query.eq("job_type", filters.job_type);
    }
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching jobs:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data as Job[], error: null };
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get job by ID
 */
export const getJobById = async (jobId: string) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        client:profiles!jobs_client_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          avatar,
          email,
          phone
        )
      `)
      .eq("id", jobId)
      .single();

    if (error) {
      console.error("Error fetching job:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data as Job, error: null };
  } catch (error: any) {
    console.error("Error fetching job:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get jobs created by a user
 */
export const getUserJobs = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("client_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user jobs:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data as Job[], error: null };
  } catch (error: any) {
    console.error("Error fetching user jobs:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Create a new job
 */
export const createJob = async (jobData: Partial<Job>) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .insert(jobData)
      .select()
      .single();

    if (error) {
      console.error("Error creating job:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data as Job, error: null };
  } catch (error: any) {
    console.error("Error creating job:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Update job
 */
export const updateJob = async (jobId: string, updates: Partial<Job>) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", jobId)
      .select()
      .single();

    if (error) {
      console.error("Error updating job:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data as Job, error: null };
  } catch (error: any) {
    console.error("Error updating job:", error);
    return { success: false, error: error.message, data: null };
  }
};

// ==================== PROPOSAL FUNCTIONS ====================

/**
 * Submit a proposal
 */
export const submitProposal = async (proposalData: {
  job_id: string;
  freelancer_id: string;
  cover_letter: string;
  proposed_amount?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from("proposals")
      .insert({
        job_id: proposalData.job_id,
        freelancer_id: proposalData.freelancer_id,
        cover_letter: proposalData.cover_letter,
        proposed_amount: proposalData.proposed_amount || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting proposal:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data as Proposal, error: null };
  } catch (error: any) {
    console.error("Error submitting proposal:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get proposals for a job
 */
export const getJobProposals = async (jobId: string) => {
  try {
    const { data, error } = await supabase
      .from("proposals")
      .select(`
        *,
        freelancer:profiles!proposals_freelancer_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          avatar,
          bio,
          skills,
          average_rating,
          rating_count
        )
      `)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching proposals:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
  } catch (error: any) {
    console.error("Error fetching proposals:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get user's proposals
 */
export const getUserProposals = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("proposals")
      .select(`
        *,
        job:jobs!proposals_job_id_fkey(
          id,
          title,
          description,
          budget_min,
          budget_max,
          budget_type,
          status
        )
      `)
      .eq("freelancer_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user proposals:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
  } catch (error: any) {
    console.error("Error fetching user proposals:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Update proposal status
 */
export const updateProposalStatus = async (
  proposalId: string,
  status: "pending" | "accepted" | "rejected" | "withdrawn"
) => {
  try {
    const { data, error } = await supabase
      .from("proposals")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", proposalId)
      .select()
      .single();

    if (error) {
      console.error("Error updating proposal status:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data as Proposal, error: null };
  } catch (error: any) {
    console.error("Error updating proposal status:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Check if user has already submitted a proposal for a job
 */
export const hasUserProposed = async (userId: string, jobId: string) => {
  try {
    const { data, error } = await supabase
      .from("proposals")
      .select("id")
      .eq("freelancer_id", userId)
      .eq("job_id", jobId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking proposal:", error);
      return { success: false, error: error.message, hasProposed: false };
    }

    return { success: true, hasProposed: !!data, error: null };
  } catch (error: any) {
    console.error("Error checking proposal:", error);
    return { success: false, error: error.message, hasProposed: false };
  }
};

// ==================== NOTIFICATION FUNCTIONS ====================

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId: string, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data as Notification[], error: null };
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error fetching unread count:", error);
      return { success: false, error: error.message, count: 0 };
    }

    return { success: true, count: count || 0, error: null };
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    return { success: false, error: error.message, count: 0 };
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return { success: false, error: error.message };
  }
};
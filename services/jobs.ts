// services/jobs.ts - Updated to handle missing job_type column

import { supabase } from "@/lib/supabase";

export interface Job {
  id: string;
  title: string;
  description: string;
  budget_min?: number | null;
  budget_max?: number | null;
  budget_type?: "fixed" | "hourly";
  location?: string | null;
  job_type?: "task" | "project"; // Made optional
  status: string;
  skills?: string[];
  created_at: string;
  deadline?: string | null;
  category?: string | null;
  user_id: string;
  proposal_count?: number;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
  };
}

export interface Proposal {
  id: string;
  job_id: string;
  artisan_id: string;
  price: number | null;
  message: string | null;
  status: string;
  created_at: string;
}

/**
 * Get open jobs with filters
 */
export const getOpenJobs = async (filters?: {
  job_type?: "task" | "project";
  limit?: number;
  offset?: number;
}) => {
  try {
    console.log("🔍 Fetching jobs with filters:", filters);

    let query = supabase
      .from("jobs")
      .select(
        `
        *,
        client:profiles!jobs_user_id_fkey(id, first_name, last_name, avatar),
        proposals:proposal(id)
      `
      )
      .eq("status", "open")
      .order("created_at", { ascending: false });

    // Only filter by job_type if the column exists and filter is provided
    if (filters?.job_type) {
      // Try to filter, but don't fail if column doesn't exist
      query = query.eq("job_type", filters.job_type);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching jobs:", error);
      
      // If error is about missing column, try again without job_type filter
      if (error.message.includes("job_type") || error.code === "42703") {
        console.log("⚠️ job_type column not found, fetching all jobs...");
        
        const retryQuery = supabase
          .from("jobs")
          .select(
            `
            *,
            client:profiles!jobs_user_id_fkey(id, first_name, last_name, avatar),
            proposals:proposal(id)
          `
          )
          .eq("status", "open")
          .order("created_at", { ascending: false });
        
        if (filters?.limit) {
          retryQuery.limit(filters.limit);
        }
        
        const retryResult = await retryQuery;
        
        if (retryResult.error) {
          return { success: false, error: retryResult.error.message, data: null };
        }
        
        const jobsWithCount = retryResult.data?.map((job: any) => ({
          ...job,
          proposal_count: job.proposals?.length || 0,
          proposals: undefined,
        }));
        
        return { success: true, data: jobsWithCount, error: null };
      }
      
      return { success: false, error: error.message, data: null };
    }

    console.log("✅ Raw jobs data:", data);
    console.log("📊 Number of jobs fetched:", data?.length || 0);

    // Add proposal count to each job
    const jobsWithCount = data?.map((job: any) => {
      const proposalCount = job.proposals?.length || 0;
      console.log(`📝 Job "${job.title}" has ${proposalCount} proposals`);
      
      return {
        ...job,
        proposal_count: proposalCount,
        proposals: undefined,
      };
    });

    console.log("✅ Processed jobs:", jobsWithCount?.length || 0);
    return { success: true, data: jobsWithCount, error: null };
  } catch (error: any) {
    console.error("❌ Error in getOpenJobs:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get a single job by ID
 */
export const getJobById = async (jobId: string) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        *,
        client:profiles!jobs_user_id_fkey(id, first_name, last_name, avatar, email),
        job_images(id, image_url, created_at),
        proposals:proposal(id)
      `
      )
      .eq("id", jobId)
      .single();

    if (error) {
      console.error("Error fetching job:", error);
      return { success: false, error: error.message, data: null };
    }

    const jobWithCount = {
      ...data,
      proposal_count: data.proposals?.length || 0,
      proposals: undefined,
    };

    return { success: true, data: jobWithCount, error: null };
  } catch (error: any) {
    console.error("Error in getJobById:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Check if user has already proposed to a job
 */
export const hasUserProposed = async (userId: string, jobId: string) => {
  try {
    const { data, error } = await supabase
      .from("proposal")
      .select("id")
      .eq("artisan_id", userId)
      .eq("job_id", jobId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking proposal:", error);
      return { hasProposed: false, error: error.message };
    }

    return { hasProposed: !!data, error: null };
  } catch (error: any) {
    console.error("Error in hasUserProposed:", error);
    return { hasProposed: false, error: error.message };
  }
};

/**
 * Create a notification for the job owner
 */
const createProposalNotification = async (
  jobOwnerId: string,
  jobId: string,
  jobTitle: string,
  artisanName: string
) => {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: jobOwnerId,
      type: "proposal",
      title: "New Proposal Received",
      body: `${artisanName} has submitted a proposal for "${jobTitle}"`,
      related_id: jobId,
      is_read: false,
    });

    if (error) {
      console.error("Error creating notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error in createProposalNotification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Submit a proposal for a job
 */
export const submitProposal = async (params: {
  job_id: string;
  freelancer_id: string;
  cover_letter: string;
  proposed_amount?: number;
}) => {
  try {
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("user_id, title")
      .eq("id", params.job_id)
      .single();

    if (jobError) {
      console.error("Error fetching job:", jobError);
      return { success: false, error: "Job not found" };
    }

    const { data: artisanData, error: artisanError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", params.freelancer_id)
      .single();

    if (artisanError) {
      console.error("Error fetching artisan profile:", artisanError);
      return { success: false, error: "User profile not found" };
    }

    const checkResult = await hasUserProposed(
      params.freelancer_id,
      params.job_id
    );
    if (checkResult.hasProposed) {
      return {
        success: false,
        error: "You have already submitted a proposal for this job",
      };
    }

    const { data, error } = await supabase
      .from("proposal")
      .insert({
        job_id: params.job_id,
        artisan_id: params.freelancer_id,
        message: params.cover_letter,
        price: params.proposed_amount || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting proposal:", error);
      return { success: false, error: error.message };
    }

    const artisanName = `${artisanData.first_name} ${artisanData.last_name}`;
    await createProposalNotification(
      jobData.user_id,
      params.job_id,
      jobData.title,
      artisanName
    );

    return { success: true, data, error: null };
  } catch (error: any) {
    console.error("Error in submitProposal:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error fetching notification count:", error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: count || 0, error: null };
  } catch (error: any) {
    console.error("Error in getUnreadNotificationCount:", error);
    return { success: false, count: 0, error: error.message };
  }
};

/**
 * Get all notifications for a user
 */
export const getNotifications = async (userId: string, limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (error: any) {
    console.error("Error in getNotifications:", error);
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error in markNotificationAsRead:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error in markAllNotificationsAsRead:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a notification
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
    console.error("Error in deleteNotification:", error);
    return { success: false, error: error.message };
  }
};
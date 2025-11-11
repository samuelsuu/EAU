// services/messages.ts
import { supabase } from "@/lib/supabase";

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  read_at?: string | null;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string | null;
    avatar: string | null;
    avatar_url?: string | null;
  };
  receiver?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string | null;
    avatar: string | null;
    avatar_url?: string | null;
  };
}

/**
 * Get messages for a user (messages where user is receiver)
 */
export async function getMessagesForUser(userId: string) {
  try {
    // First, get messages without foreign key joins
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return { success: false, error: messagesError.message, data: [] };
    }

    if (!messagesData || messagesData.length === 0) {
      return { success: true, data: [] };
    }

    // Get unique sender IDs
    const senderIds = [...new Set(messagesData.map((msg) => msg.sender_id))];
    
    // Fetch sender profiles
    const { data: sendersData, error: sendersError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, username, avatar")
      .in("id", senderIds);

    if (sendersError) {
      console.error("Error fetching senders:", sendersError);
      // Return messages without sender data if profile fetch fails
      return { success: true, data: messagesData.map((msg) => ({ ...msg, sender: null })) };
    }

    // Create a map of sender profiles
    const sendersMap = new Map(
      (sendersData || []).map((sender) => [sender.id, sender])
    );

    // Combine messages with sender data
    const messagesWithSenders = messagesData.map((message) => {
      const sender = sendersMap.get(message.sender_id);
      return {
        ...message,
        sender: sender ? {
          ...sender,
          avatar_url: sender.avatar || null, // Map avatar to avatar_url for compatibility
        } : null,
        receiver: null, // We don't need receiver data for received messages
      };
    });

    return { success: true, data: messagesWithSenders };
  } catch (error: any) {
    console.error("Get messages error:", error);
    return { success: false, error: error.message || "Failed to fetch messages", data: [] };
  }
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(userId: string) {
  try {
    // First try to count using is_read column
    const { count: countWithRead, error: errorWithRead } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .or("is_read.is.null,is_read.eq.false");

    if (!errorWithRead) {
      return { success: true, count: countWithRead || 0 };
    }

    // If is_read column doesn't exist, use read_at to determine unread
    // Unread = messages where read_at is null
    const { count: countWithReadAt, error: errorWithReadAt } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .is("read_at", null);

    if (!errorWithReadAt) {
      return { success: true, count: countWithReadAt || 0 };
    }

    // Fallback: count all messages if neither column exists
    const { count: allCount, error: allError } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId);
    
    if (allError) {
      console.error("Error fetching unread count:", allError);
      return { success: false, error: allError.message, count: 0 };
    }
    
    return { success: true, count: allCount || 0 };
  } catch (error: any) {
    console.error("Get unread count error:", error);
    return { success: false, error: error.message || "Failed to fetch count", count: 0 };
  }
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(messageId: number) {
  try {
    // Try updating with both is_read and read_at
    let updateData: any = {
      read_at: new Date().toISOString()
    };
    
    // Try to include is_read if column exists
    const { error: errorWithRead } = await supabase
      .from("messages")
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq("id", messageId);

    if (errorWithRead) {
      // If is_read column doesn't exist, just use read_at
      const { error: errorWithoutRead } = await supabase
        .from("messages")
        .update({ 
          read_at: new Date().toISOString()
        })
        .eq("id", messageId);
      
      if (errorWithoutRead) {
        console.error("Error marking message as read:", errorWithoutRead);
        return { success: false, error: errorWithoutRead.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Mark message as read error:", error);
    return { success: false, error: error.message || "Failed to mark message as read" };
  }
}

/**
 * Get conversation between two users (all messages between them)
 */
export async function getConversation(userId: string, otherUserId: string) {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching conversation:", error);
      return { success: false, error: error.message, data: [] };
    }

    // Get both user profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, username, avatar")
      .in("id", [userId, otherUserId]);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    const profilesMap = new Map(
      (profilesData || []).map((profile) => [profile.id, profile])
    );

    // Combine messages with sender/receiver data
    const messagesWithProfiles = (data || []).map((message) => {
      const sender = profilesMap.get(message.sender_id);
      const receiver = profilesMap.get(message.receiver_id);
      return {
        ...message,
        sender: sender ? {
          ...sender,
          avatar_url: sender.avatar || null,
        } : null,
        receiver: receiver ? {
          ...receiver,
          avatar_url: receiver.avatar || null,
        } : null,
      };
    });

    return { success: true, data: messagesWithProfiles };
  } catch (error: any) {
    console.error("Get conversation error:", error);
    return { success: false, error: error.message || "Failed to fetch conversation", data: [] };
  }
}

/**
 * Get conversations list (grouped by sender/receiver)
 */
export interface Conversation {
  userId: string;
  userName: string;
  userAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isUnread: boolean;
}

export async function getConversationsList(userId: string) {
  try {
    // Get all messages where user is sender or receiver
    const { data: allMessages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return { success: false, error: messagesError.message, data: [] };
    }

    if (!allMessages || allMessages.length === 0) {
      return { success: true, data: [] };
    }

    // Group messages by other user
    const conversationsMap = new Map<string, Message[]>();
    
    allMessages.forEach((message) => {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, []);
      }
      conversationsMap.get(otherUserId)!.push(message);
    });

    // Get all unique user IDs
    const otherUserIds = Array.from(conversationsMap.keys());
    
    // Fetch profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, username, avatar")
      .in("id", otherUserIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    const profilesMap = new Map(
      (profilesData || []).map((profile) => [profile.id, profile])
    );

    // Build conversations list
    const conversations: Conversation[] = Array.from(conversationsMap.entries()).map(([otherUserId, messages]) => {
      const profile = profilesMap.get(otherUserId);
      const userName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username || "Unknown"
        : "Unknown";
      const userAvatar = profile?.avatar || null;
      
      // Get last message
      const lastMessage = messages[0]; // Already sorted by created_at desc
      const unreadMessages = messages.filter((msg) => 
        msg.receiver_id === userId && (!msg.is_read && !msg.read_at)
      );

      return {
        userId: otherUserId,
        userName,
        userAvatar,
        lastMessage: lastMessage.content,
        lastMessageTime: lastMessage.created_at,
        unreadCount: unreadMessages.length,
        isUnread: unreadMessages.length > 0,
      };
    });

    // Sort by last message time (most recent first)
    conversations.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    return { success: true, data: conversations };
  } catch (error: any) {
    console.error("Get conversations list error:", error);
    return { success: false, error: error.message || "Failed to fetch conversations", data: [] };
  }
}

/**
 * Send a reply message
 */
export interface SendReplyParams {
  sender_id: string;
  receiver_id: string;
  content: string;
}

export async function sendReply(params: SendReplyParams) {
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
    console.error("Send reply error:", error);
    return { success: false, error: error.message || "Failed to send reply" };
  }
}


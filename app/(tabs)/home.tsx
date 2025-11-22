// app/(tabs)/home.tsx - IMPROVED VERSION
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  primaryColor,
  secondaryColor,
  backgroundColor,
  whiteColor,
  fontColor,
  highlightColor,
} from "@/constants/GlobalConstants";
import { supabase } from "@/lib/supabase";
import {
  getConversationsList,
  getConversation,
  getUnreadMessageCount,
  sendReply,
  markMessageAsRead,
  Message,
  Conversation,
} from "@/services/messages";
import {
  getOpenJobs,
  submitProposal,
  hasUserProposed,
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/jobs";
import { getProfileById } from "@/services/login";

const { width } = Dimensions.get("window");

interface Job {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_type: "fixed" | "hourly";
  location: string | null;
  job_type: "task" | "project";
  status: string;
  skills: string[];
  created_at: string;
  deadline: string | null;
  category: string | null;
  proposal_count?: number;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
  };
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

const Home = () => {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { greeting: "Good Morning", emoji: "🌅" };
    } else if (hour >= 12 && hour < 17) {
      return { greeting: "Good Afternoon", emoji: "☀️" };
    } else if (hour >= 17 && hour < 21) {
      return { greeting: "Good Evening", emoji: "🌆" };
    } else {
      return { greeting: "Good Night", emoji: "🌙" };
    }
  };

  const { greeting, emoji } = getTimeBasedGreeting();

  const displayName = useMemo(() => {
    if (!user) return "Guest";
    if (typeof user === "string") return user;
    const username = user.username || user.user_name || user.userName;
    if (username) return username;
    const name = user.name;
    if (name) return name;
    const first = user.first_name || user.firstName || user.first;
    const last = user.last_name || user.lastName || user.last;
    const full = `${first || ""} ${last || ""}`.trim();
    if (full) return full;
    return user.email?.split("@")[0] || "User";
  }, [user]);

  // State
  const [tasks, setTasks] = useState<Job[]>([]);
  const [projects, setProjects] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "projects">("projects");

  // Apply Modal State
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationData, setApplicationData] = useState({
    coverLetter: "",
    proposedPrice: "",
  });
  const [applying, setApplying] = useState(false);

  // Messages State
  const [messagesModalVisible, setMessagesModalVisible] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Notifications State
  const [notificationsModalVisible, setNotificationsModalVisible] =
    useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Conversation View State
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>(
    []
  );
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatScrollViewRef = useRef<ScrollView>(null);

  // Profile View State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Job Details Modal State
  const [jobDetailsModalVisible, setJobDetailsModalVisible] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<Job | null>(
    null
  );

  const [hasProposed, setHasProposed] = useState(false);
  const [checkingProposal, setCheckingProposal] = useState(false);

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);

      const allJobsRes = await getOpenJobs({ limit: 50 });

      if (allJobsRes.success && allJobsRes.data) {
        const tasksData = allJobsRes.data.filter(
          (job) => job.job_type === "task"
        );
        const projectsData = allJobsRes.data.filter(
          (job) => !job.job_type || job.job_type === "project"
        );

        setTasks(tasksData);
        setProjects(projectsData);
      } else {
        console.error("Error fetching jobs:", allJobsRes.error);
        setTasks([]);
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user?.id) return;
    try {
      setLoadingMessages(true);
      const res = await getConversationsList(user.id);
      if (res.success && res.data) {
        setConversations(res.data);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      setLoadingNotifications(true);
      const res = await getNotifications(user.id);
      if (res.success && res.data) {
        setNotifications(res.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch conversation messages
  const fetchConversationMessages = async (otherUserId: string) => {
    if (!user?.id) return;
    try {
      setLoadingConversation(true);
      const res = await getConversation(user.id, otherUserId);
      if (res.success && res.data) {
        setConversationMessages(res.data);
        const unreadMessages = res.data.filter(
          (msg) => msg.receiver_id === user.id && !msg.is_read && !msg.read_at
        );
        for (const msg of unreadMessages) {
          await markMessageAsRead(msg.id);
        }
        fetchConversations();
        fetchUnreadCounts();
        setTimeout(() => {
          chatScrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        setConversationMessages([]);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setConversationMessages([]);
    } finally {
      setLoadingConversation(false);
    }
  };

  // Fetch unread counts
  const fetchUnreadCounts = async () => {
    if (!user?.id) {
      setMessageUnreadCount(0);
      setNotificationUnreadCount(0);
      return;
    }

    try {
      const messageRes = await getUnreadMessageCount(user.id);
      const messageCount = messageRes.success ? messageRes.count || 0 : 0;
      setMessageUnreadCount(messageCount);

      const notifRes = await getUnreadNotificationCount(user.id);
      const notifCount = notifRes.success ? notifRes.count || 0 : 0;
      setNotificationUnreadCount(notifCount);

      console.log("📬 Unread messages:", messageCount);
      console.log("🔔 Unread notifications:", notifCount);
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  // Open messages modal
  const openMessagesModal = () => {
    setMessagesModalVisible(true);
    setSelectedConversation(null);
    fetchConversations();
  };

  // Open notifications modal
  const openNotificationsModal = () => {
    setNotificationsModalVisible(true);
    fetchNotifications();
  };

  // Open conversation
  const openConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchConversationMessages(conversation.userId);
  };

  // View user profile
  const handleViewProfile = async (userId: string) => {
    setLoadingProfile(true);
    setProfileModalVisible(true);
    try {
      const res = await getProfileById(userId);
      if (res.success && res.data) {
        setViewedProfile(res.data);
      } else {
        alert(res.error || "Failed to load profile");
        setProfileModalVisible(false);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      alert("Failed to load profile");
      setProfileModalVisible(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user?.id) return;

    setSendingMessage(true);
    try {
      const res = await sendReply({
        sender_id: user.id,
        receiver_id: selectedConversation.userId,
        content: messageText.trim(),
      });

      if (res.success) {
        setMessageText("");
        await fetchConversationMessages(selectedConversation.userId);
        fetchConversations();
        fetchUnreadCounts();
        setTimeout(() => {
          chatScrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        alert(res.error || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await markNotificationAsRead(notification.id);
    fetchNotifications();
    fetchUnreadCounts();

    // Close modal first
    setNotificationsModalVisible(false);

    // Navigate based on type
    if (notification.type === "proposal" && notification.related_id) {
      // Navigate to job proposals screen (for job owners)
      setTimeout(() => {
        router.push(`/job/${notification.related_id}`);
      }, 300);
    } else if (
      notification.type === "proposal_accepted" ||
      notification.type === "proposal_rejected"
    ) {
      // Navigate to my proposals screen (for artisans)
      setTimeout(() => {
        router.push("/(tabs)/proposals");
      }, 300);
    }
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = async () => {
    if (!user?.id) return;
    await markAllNotificationsAsRead(user.id);
    fetchNotifications();
    fetchUnreadCounts();
  };

  // View job details
  const handleViewJobDetails = (job: Job) => {
    setSelectedJobDetails(job);
    setJobDetailsModalVisible(true);
  };

  useEffect(() => {
    fetchJobs();
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
    fetchUnreadCounts();
  };

  const formatBudget = (job: Job) => {
    if (job.budget_type === "hourly") {
      if (job.budget_min && job.budget_max) {
        return `$${job.budget_min}-$${job.budget_max}/hr`;
      } else if (job.budget_min) {
        return `$${job.budget_min}/hr`;
      }
      return "Hourly Rate";
    } else {
      if (job.budget_min && job.budget_max) {
        return `$${job.budget_min}-$${job.budget_max}`;
      } else if (job.budget_min) {
        return `$${job.budget_min}`;
      }
      return "Fixed Price";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleApply = async (job: Job) => {
    if (!user?.id) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to apply for jobs"
      );
      return;
    }

    setCheckingProposal(true);
    const checkRes = await hasUserProposed(user.id, job.id);
    setCheckingProposal(false);

    if (checkRes.hasProposed) {
      Alert.alert(
        "Already Applied",
        "You have already submitted a proposal for this job.",
        [{ text: "OK" }]
      );
      return;
    }

    setSelectedJob(job);
    setHasProposed(false);
    setApplyModalVisible(true);
  };

  const submitApplication = async () => {
    if (!applicationData.coverLetter.trim()) {
      Alert.alert("Required Field", "Please write a cover letter");
      return;
    }

    if (!user?.id || !selectedJob?.id) {
      Alert.alert("Error", "Missing user or job information");
      return;
    }

    setApplying(true);
    try {
      const proposalRes = await submitProposal({
        job_id: selectedJob.id,
        freelancer_id: user.id,
        cover_letter: applicationData.coverLetter.trim(),
        proposed_amount: applicationData.proposedPrice
          ? parseFloat(applicationData.proposedPrice)
          : undefined,
      });

      if (proposalRes.success) {
        Alert.alert(
          "Success! 🎉",
          "Your proposal has been submitted successfully. The job owner will be notified.",
          [
            {
              text: "OK",
              onPress: () => {
                setApplyModalVisible(false);
                setApplicationData({ coverLetter: "", proposedPrice: "" });
              },
            },
          ]
        );
      } else {
        if (
          proposalRes.error?.includes("duplicate") ||
          proposalRes.error?.includes("unique")
        ) {
          Alert.alert(
            "Already Applied",
            "You have already submitted a proposal for this job."
          );
        } else {
          Alert.alert(
            "Error",
            proposalRes.error || "Failed to submit proposal."
          );
        }
      }
    } catch (error: any) {
      console.error("Error submitting proposal:", error);
      Alert.alert("Error", "Failed to submit proposal.");
    } finally {
      setApplying(false);
    }
  };

  // Render job card with more details
  const renderProjectCard = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.projectCard}
      activeOpacity={0.7}
      onPress={() => handleViewJobDetails(item)}
    >
      <View style={styles.projectCardHeader}>
        <View style={styles.projectHeaderLeft}>
          <Text style={styles.projectPostedDate}>
            {formatDate(item.created_at)}
          </Text>
          {item.location && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={10} color="#7A50EC" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          )}
        </View>
        {item.proposal_count !== undefined && item.proposal_count > 0 && (
          <View style={styles.proposalsBadge}>
            <Ionicons name="people" size={12} color="#666" />
            <Text style={styles.proposalsText}>{item.proposal_count}</Text>
          </View>
        )}
      </View>

      <Text style={styles.projectTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <Text style={styles.projectDescription} numberOfLines={3}>
        {item.description}
      </Text>

      {item.deadline && (
        <View style={styles.projectMetaRow}>
          <View style={styles.projectMetaItem}>
            <Ionicons name="time-outline" size={14} color="#FF6B6B" />
            <Text style={[styles.projectMetaText, { color: "#FF6B6B" }]}>
              Due: {formatDate(item.deadline)}
            </Text>
          </View>
        </View>
      )}

      {item.skills && item.skills.length > 0 && (
        <View style={styles.skillsContainer}>
          {item.skills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {item.skills.length > 3 && (
            <View style={styles.skillTag}>
              <Text style={styles.skillText}>+{item.skills.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.projectFooter}>
        <View style={styles.authorSection}>
          {item.client?.avatar ? (
            <Image
              source={{ uri: item.client.avatar }}
              style={styles.authorAvatar}
            />
          ) : (
            <View style={[styles.authorAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={16} color="#999" />
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorLabel}>Client</Text>
            <Text style={styles.authorName} numberOfLines={1}>
              {item.client
                ? `${item.client.first_name} ${item.client.last_name}`
                : "Anonymous"}
            </Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.projectType}>
            {item.budget_type === "fixed" ? "Fixed" : "Hourly"}
          </Text>
          <Text style={styles.projectPrice}>{formatBudget(item)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.applyButton}
        onPress={(e) => {
          e.stopPropagation();
          handleApply(item);
        }}
      >
        <Text style={styles.applyButtonText}>Apply Now</Text>
        <Ionicons name="arrow-forward" size={16} color={whiteColor} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="briefcase-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No {activeTab} available</Text>
      <Text style={styles.emptySubtext}>
        Check back later for new opportunities
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Loading opportunities...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {greeting}, {displayName} {emoji}
          </Text>
          <Text style={styles.subtitle}>Find your next opportunity</Text>
        </View>
        <View style={styles.headerIcons}>
          {/* Messages Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/message/messages")} // Navigate to messages tab
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color={fontColor}
            />
            {messageUnreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Notifications Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={openNotificationsModal}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={fontColor}
            />
            {notificationUnreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationUnreadCount > 99
                    ? "99+"
                    : notificationUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for jobs..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={primaryColor} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "tasks" && styles.activeTab]}
          onPress={() => setActiveTab("tasks")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "tasks" && styles.activeTabText,
            ]}
          >
            Tasks ({tasks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "projects" && styles.activeTab]}
          onPress={() => setActiveTab("projects")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "projects" && styles.activeTabText,
            ]}
          >
            Projects ({projects.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === "tasks" ? tasks : projects}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Job Details Modal */}
      <Modal
        visible={jobDetailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setJobDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Job Details</Text>
              <TouchableOpacity
                onPress={() => setJobDetailsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedJobDetails && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailsHeader}>
                  <Text style={styles.detailsTitle}>
                    {selectedJobDetails.title}
                  </Text>
                  <Text style={styles.detailsPrice}>
                    {formatBudget(selectedJobDetails)}
                  </Text>
                </View>

                <View style={styles.detailsMeta}>
                  <View style={styles.detailsMetaItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.detailsMetaText}>
                      Posted {formatDate(selectedJobDetails.created_at)}
                    </Text>
                  </View>
                  {selectedJobDetails.location && (
                    <View style={styles.detailsMetaItem}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#666"
                      />
                      <Text style={styles.detailsMetaText}>
                        {selectedJobDetails.location}
                      </Text>
                    </View>
                  )}
                  {selectedJobDetails.proposal_count !== undefined && (
                    <View style={styles.detailsMetaItem}>
                      <Ionicons name="people-outline" size={16} color="#666" />
                      <Text style={styles.detailsMetaText}>
                        {selectedJobDetails.proposal_count} proposals
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Description</Text>
                  <Text style={styles.detailsDescription}>
                    {selectedJobDetails.description}
                  </Text>
                </View>

                {selectedJobDetails.skills &&
                  selectedJobDetails.skills.length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>
                        Required Skills
                      </Text>
                      <View style={styles.skillsContainer}>
                        {selectedJobDetails.skills.map((skill, index) => (
                          <View key={index} style={styles.skillTag}>
                            <Text style={styles.skillText}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                {selectedJobDetails.deadline && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Deadline</Text>
                    <View style={styles.detailsMetaItem}>
                      <Ionicons name="time-outline" size={16} color="#FF6B6B" />
                      <Text
                        style={[styles.detailsMetaText, { color: "#FF6B6B" }]}
                      >
                        {formatDate(selectedJobDetails.deadline)}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedJobDetails.client && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Client</Text>
                    <View style={styles.clientDetails}>
                      {selectedJobDetails.client.avatar ? (
                        <Image
                          source={{ uri: selectedJobDetails.client.avatar }}
                          style={styles.clientDetailsAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.clientDetailsAvatar,
                            styles.avatarPlaceholder,
                          ]}
                        >
                          <Ionicons name="person" size={24} color="#999" />
                        </View>
                      )}
                      <Text style={styles.clientDetailsName}>
                        {selectedJobDetails.client.first_name}{" "}
                        {selectedJobDetails.client.last_name}
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.applyButtonLarge}
                  onPress={() => {
                    setJobDetailsModalVisible(false);
                    handleApply(selectedJobDetails);
                  }}
                >
                  <Text style={styles.applyButtonText}>Apply for this Job</Text>
                  <Ionicons name="arrow-forward" size={20} color={whiteColor} />
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Apply Modal */}
      <Modal
        visible={applyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Application</Text>
              <TouchableOpacity
                onPress={() => setApplyModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedJob && (
                <View style={styles.jobPreview}>
                  <Text style={styles.jobPreviewTitle} numberOfLines={2}>
                    {selectedJob.title}
                  </Text>
                  <Text style={styles.jobPreviewBudget}>
                    {formatBudget(selectedJob)}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Cover Letter *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Explain why you're the best fit for this job..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                value={applicationData.coverLetter}
                onChangeText={(text) =>
                  setApplicationData({ ...applicationData, coverLetter: text })
                }
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Proposed Price (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your proposed price"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={applicationData.proposedPrice}
                onChangeText={(text) =>
                  setApplicationData({
                    ...applicationData,
                    proposedPrice: text,
                  })
                }
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setApplyModalVisible(false)}
                  disabled={applying}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, applying && { opacity: 0.7 }]}
                  onPress={submitApplication}
                  disabled={applying}
                >
                  {applying ? (
                    <ActivityIndicator color={whiteColor} />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <SafeAreaView style={styles.messagesSafeArea}>
          <View style={styles.messagesHeader}>
            <TouchableOpacity
              onPress={() => setNotificationsModalVisible(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={fontColor} />
            </TouchableOpacity>
            <Text style={styles.messagesHeaderTitle}>Notifications</Text>
            <TouchableOpacity
              onPress={handleMarkAllNotificationsRead}
              style={styles.refreshButton}
            >
              <Ionicons name="checkmark-done" size={24} color={primaryColor} />
            </TouchableOpacity>
          </View>

          {loadingNotifications ? (
            <View style={styles.messagesLoadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyMessagesContainer}>
              <Ionicons name="notifications-outline" size={64} color="#ccc" />
              <Text style={styles.emptyMessagesText}>No notifications</Text>
              <Text style={styles.emptyMessagesSubtext}>
                You'll see notifications here when you receive them
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.messagesList}>
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.is_read && styles.unreadNotificationItem,
                  ]}
                  onPress={() => handleNotificationClick(notification)}
                >
                  <View style={styles.notificationIcon}>
                    <Ionicons
                      name={
                        notification.type === "proposal"
                          ? "briefcase"
                          : notification.type === "message"
                          ? "chatbubble"
                          : "notifications"
                      }
                      size={24}
                      color={notification.is_read ? "#999" : primaryColor}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationBody} numberOfLines={2}>
                      {notification.body}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </Text>
                  </View>
                  {!notification.is_read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Messages Modal - Conversations List */}
      <Modal
        visible={messagesModalVisible && !selectedConversation}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setMessagesModalVisible(false);
          setSelectedConversation(null);
        }}
      >
        <SafeAreaView style={styles.messagesSafeArea}>
          <View style={styles.messagesHeader}>
            <TouchableOpacity
              onPress={() => {
                setMessagesModalVisible(false);
                setSelectedConversation(null);
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={fontColor} />
            </TouchableOpacity>
            <Text style={styles.messagesHeaderTitle}>Messages</Text>
            <TouchableOpacity
              onPress={() => {
                fetchConversations();
                fetchUnreadCounts();
              }}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh" size={24} color={fontColor} />
            </TouchableOpacity>
          </View>

          {loadingMessages ? (
            <View style={styles.messagesLoadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.emptyMessagesContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyMessagesText}>No conversations yet</Text>
              <Text style={styles.emptyMessagesSubtext}>
                Messages from users will appear here
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.messagesList}>
              {conversations.map((conversation) => (
                <TouchableOpacity
                  key={conversation.userId}
                  style={[
                    styles.conversationItem,
                    conversation.isUnread && styles.unreadConversationItem,
                  ]}
                  onPress={() => openConversation(conversation)}
                >
                  <View style={styles.conversationItemContent}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleViewProfile(conversation.userId);
                      }}
                    >
                      {conversation.userAvatar ? (
                        <Image
                          source={{ uri: conversation.userAvatar }}
                          style={styles.conversationAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.conversationAvatar,
                            styles.avatarPlaceholder,
                          ]}
                        >
                          <Ionicons name="person" size={24} color="#999" />
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.conversationContent}>
                      <View style={styles.conversationHeader}>
                        <Text style={styles.conversationName}>
                          {conversation.userName}
                        </Text>
                        <Text style={styles.conversationTime}>
                          {formatDate(conversation.lastMessageTime)}
                        </Text>
                      </View>
                      <View style={styles.conversationFooter}>
                        <Text
                          style={styles.conversationLastMessage}
                          numberOfLines={1}
                        >
                          {conversation.lastMessage}
                        </Text>
                        {conversation.unreadCount > 0 && (
                          <View style={styles.conversationBadge}>
                            <Text style={styles.conversationBadgeText}>
                              {conversation.unreadCount > 99
                                ? "99+"
                                : conversation.unreadCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Conversation Chat Modal */}
      <Modal
        visible={messagesModalVisible && !!selectedConversation}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setSelectedConversation(null);
          setMessageText("");
        }}
      >
        <SafeAreaView style={styles.messagesSafeArea}>
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={() => {
                setSelectedConversation(null);
                setMessageText("");
                setConversationMessages([]);
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={fontColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (selectedConversation?.userId) {
                  handleViewProfile(selectedConversation.userId);
                }
              }}
              style={styles.chatHeaderUser}
            >
              {selectedConversation?.userAvatar ? (
                <Image
                  source={{ uri: selectedConversation.userAvatar }}
                  style={styles.chatHeaderAvatar}
                />
              ) : (
                <View
                  style={[styles.chatHeaderAvatar, styles.avatarPlaceholder]}
                >
                  <Ionicons name="person" size={20} color="#999" />
                </View>
              )}
              <Text style={styles.chatHeaderName}>
                {selectedConversation?.userName || "Unknown"}
              </Text>
            </TouchableOpacity>
            <View style={{ width: 24 }} />
          </View>

          {loadingConversation ? (
            <View style={styles.messagesLoadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
            </View>
          ) : (
            <ScrollView
              ref={chatScrollViewRef}
              style={styles.chatMessagesList}
              contentContainerStyle={styles.chatMessagesContent}
              onContentSizeChange={() => {
                chatScrollViewRef.current?.scrollToEnd({ animated: true });
              }}
            >
              {conversationMessages.map((message) => {
                const isSent = message.sender_id === user?.id;
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubbleContainer,
                      isSent
                        ? styles.sentMessageContainer
                        : styles.receivedMessageContainer,
                    ]}
                  >
                    {!isSent && message.sender?.avatar && (
                      <Image
                        source={{ uri: message.sender.avatar }}
                        style={styles.messageBubbleAvatar}
                      />
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        isSent
                          ? styles.sentMessageBubble
                          : styles.receivedMessageBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageBubbleText,
                          isSent
                            ? styles.sentMessageText
                            : styles.receivedMessageText,
                        ]}
                      >
                        {message.content}
                      </Text>
                      <Text
                        style={[
                          styles.messageBubbleTime,
                          isSent
                            ? styles.sentMessageTime
                            : styles.receivedMessageTime,
                        ]}
                      >
                        {new Date(message.created_at).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    </View>
                    {isSent && <View style={{ width: 32 }} />}
                  </View>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
              editable={!sendingMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!messageText.trim() || sendingMessage) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator color={whiteColor} size="small" />
              ) : (
                <Ionicons name="send" size={20} color={whiteColor} />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Profile View Modal */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <SafeAreaView style={styles.profileSafeArea}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              onPress={() => setProfileModalVisible(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={fontColor} />
            </TouchableOpacity>
            <Text style={styles.profileHeaderTitle}>User Profile</Text>
            <View style={{ width: 24 }} />
          </View>

          {loadingProfile ? (
            <View style={styles.profileLoadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : viewedProfile ? (
            <ScrollView style={styles.profileScrollView}>
              <View style={styles.profileViewHeader}>
                {viewedProfile.avatar ? (
                  <Image
                    source={{ uri: viewedProfile.avatar }}
                    style={styles.profileViewAvatar}
                  />
                ) : (
                  <View
                    style={[styles.profileViewAvatar, styles.avatarPlaceholder]}
                  >
                    <Ionicons name="person" size={48} color="#999" />
                  </View>
                )}
                <Text style={styles.profileViewName}>
                  {`${viewedProfile.first_name || ""} ${
                    viewedProfile.last_name || ""
                  }`.trim() ||
                    viewedProfile.username ||
                    viewedProfile.name ||
                    "Unknown User"}
                </Text>
                {viewedProfile.role && (
                  <View style={styles.profileRoleBadge}>
                    <Text style={styles.profileRoleText}>
                      {viewedProfile.role}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.profileInfoSection}>
                {viewedProfile.email && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="mail-outline" size={18} color="#666" />
                    <Text style={styles.profileInfoLabel}>Email:</Text>
                    <Text style={styles.profileInfoValue}>
                      {viewedProfile.email}
                    </Text>
                  </View>
                )}

                {viewedProfile.phone && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="call-outline" size={18} color="#666" />
                    <Text style={styles.profileInfoLabel}>Phone:</Text>
                    <Text style={styles.profileInfoValue}>
                      {viewedProfile.phone}
                    </Text>
                  </View>
                )}

                {viewedProfile.location && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="location-outline" size={18} color="#666" />
                    <Text style={styles.profileInfoLabel}>Location:</Text>
                    <Text style={styles.profileInfoValue}>
                      {viewedProfile.location}
                    </Text>
                  </View>
                )}

                {viewedProfile.bio && (
                  <View style={styles.profileBioSection}>
                    <Text style={styles.profileSectionTitle}>About</Text>
                    <Text style={styles.profileBioText}>
                      {viewedProfile.bio}
                    </Text>
                  </View>
                )}

                {viewedProfile.skills && viewedProfile.skills.length > 0 && (
                  <View style={styles.profileSkillsSection}>
                    <Text style={styles.profileSectionTitle}>Skills</Text>
                    <View style={styles.profileSkillsContainer}>
                      {viewedProfile.skills.map(
                        (skill: string, index: number) => (
                          <View key={index} style={styles.profileSkillTag}>
                            <Text style={styles.profileSkillText}>{skill}</Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: backgroundColor,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: primaryColor,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: whiteColor,
    fontSize: 11,
    fontWeight: "700",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: fontColor,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: whiteColor,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: fontColor,
  },
  filterButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: whiteColor,
  },
  activeTab: {
    backgroundColor: primaryColor,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: whiteColor,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  projectCard: {
    backgroundColor: whiteColor,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  projectCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  projectHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  projectPostedDate: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3EFFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 10,
    color: "#7A50EC",
    fontWeight: "600",
  },
  proposalsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  proposalsText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 8,
    lineHeight: 24,
  },
  projectDescription: {
    fontSize: 14,
    color: "#585858",
    lineHeight: 20,
    marginBottom: 12,
  },
  projectMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 12,
  },
  projectMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  projectMetaText: {
    fontSize: 12,
    fontWeight: "500",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },
  skillTag: {
    backgroundColor: backgroundColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  projectFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  authorInfo: {
    flex: 1,
  },
  authorLabel: {
    fontSize: 10,
    color: "#999",
    marginBottom: 2,
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    color: fontColor,
  },
  priceSection: {
    alignItems: "flex-end",
  },
  projectType: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
  },
  projectPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: primaryColor,
  },
  applyButton: {
    flexDirection: "row",
    backgroundColor: primaryColor,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  applyButtonText: {
    color: whiteColor,
    fontSize: 15,
    fontWeight: "600",
  },
  applyButtonLarge: {
    flexDirection: "row",
    backgroundColor: primaryColor,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: whiteColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  detailsModalContent: {
    backgroundColor: whiteColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "95%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: fontColor,
  },
  closeButton: {
    padding: 4,
  },
  jobPreview: {
    backgroundColor: backgroundColor,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  jobPreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: fontColor,
    marginBottom: 4,
  },
  jobPreviewBudget: {
    fontSize: 14,
    fontWeight: "700",
    color: primaryColor,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: fontColor,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: fontColor,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: fontColor,
    marginBottom: 16,
    minHeight: 120,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 8,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: primaryColor,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: whiteColor,
  },
  detailsHeader: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 8,
  },
  detailsPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: primaryColor,
  },
  detailsMeta: {
    marginBottom: 20,
    gap: 8,
  },
  detailsMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailsMetaText: {
    fontSize: 14,
    color: "#666",
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 12,
  },
  detailsDescription: {
    fontSize: 15,
    color: "#585858",
    lineHeight: 22,
  },
  clientDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientDetailsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  clientDetailsName: {
    fontSize: 16,
    fontWeight: "600",
    color: fontColor,
  },
  messagesSafeArea: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  messagesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: whiteColor,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 4,
  },
  messagesHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
  },
  refreshButton: {
    padding: 4,
  },
  messagesLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    flex: 1,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: whiteColor,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  unreadNotificationItem: {
    backgroundColor: "#F0F8FF",
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: fontColor,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: primaryColor,
    marginLeft: 8,
  },
  conversationItem: {
    backgroundColor: whiteColor,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  unreadConversationItem: {
    backgroundColor: "#F0F8FF",
  },
  conversationItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  conversationAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: fontColor,
  },
  conversationTime: {
    fontSize: 12,
    color: "#999",
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  conversationLastMessage: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    marginRight: 8,
  },
  conversationBadge: {
    backgroundColor: primaryColor,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  conversationBadgeText: {
    color: whiteColor,
    fontSize: 11,
    fontWeight: "700",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: whiteColor,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  chatHeaderUser: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: "600",
    color: fontColor,
  },
  chatMessagesList: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  chatMessagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubbleContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  sentMessageContainer: {
    justifyContent: "flex-end",
  },
  receivedMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  sentMessageBubble: {
    backgroundColor: primaryColor,
    borderBottomRightRadius: 4,
  },
  receivedMessageBubble: {
    backgroundColor: whiteColor,
    borderBottomLeftRadius: 4,
  },
  messageBubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentMessageText: {
    color: whiteColor,
  },
  receivedMessageText: {
    color: fontColor,
  },
  messageBubbleTime: {
    fontSize: 11,
    marginTop: 4,
  },
  sentMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  receivedMessageTime: {
    color: "#999",
    textAlign: "left",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: whiteColor,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: fontColor,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: primaryColor,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  profileSafeArea: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: whiteColor,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  profileHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
  },
  profileLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileScrollView: {
    flex: 1,
  },
  profileViewHeader: {
    backgroundColor: whiteColor,
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  profileViewAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: primaryColor,
  },
  profileViewName: {
    fontSize: 24,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 8,
  },
  profileRoleBadge: {
    backgroundColor: primaryColor,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileRoleText: {
    color: whiteColor,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  profileInfoSection: {
    backgroundColor: whiteColor,
    padding: 16,
    marginTop: 10,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileInfoLabel: {
    fontSize: 15,
    color: "#6c757d",
    marginLeft: 10,
    minWidth: 100,
  },
  profileInfoValue: {
    fontSize: 15,
    color: fontColor,
    fontWeight: "500",
    flex: 1,
  },
  profileBioSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  profileSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 12,
  },
  profileBioText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  profileSkillsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  profileSkillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  profileSkillTag: {
    backgroundColor: backgroundColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  profileSkillText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
});

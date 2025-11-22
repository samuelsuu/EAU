// app/(tabs)/proposals.tsx - My Proposals Screen
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  primaryColor,
  secondaryColor,
  backgroundColor,
  whiteColor,
  fontColor,
} from "@/constants/GlobalConstants";
import { supabase } from "@/lib/supabase";

interface Proposal {
  id: string;
  job_id: string;
  artisan_id: string;
  price: number | null;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  job?: {
    id: string;
    title: string;
    description: string;
    budget_min: number | null;
    budget_max: number | null;
    budget_type: "fixed" | "hourly";
    status: string;
    user_id: string;
    client?: {
      id: string;
      first_name: string;
      last_name: string;
      avatar: string | null;
      email: string;
    };
  };
}

const MyProposalsScreen = () => {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch user's proposals
  const fetchProposals = async () => {
    if (!user?.id) {
      setProposals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("proposal")
        .select(`
          *,
          job:jobs!proposal_job_id_fkey(
            id,
            title,
            description,
            budget_min,
            budget_max,
            budget_type,
            status,
            user_id,
            client:profiles!jobs_user_id_fkey(
              id,
              first_name,
              last_name,
              avatar,
              email
            )
          )
        `)
        .eq("artisan_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching proposals:", error);
        setProposals([]);
      } else {
        setProposals(data || []);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setProposals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProposals();
  };

  // Filter proposals based on active tab
  const filteredProposals = proposals.filter((proposal) => {
    if (activeTab === "all") return true;
    return proposal.status === activeTab;
  });

  // Handle start messaging
  const handleStartMessaging = async (proposal: Proposal) => {
    if (!proposal.job?.client?.id || !user?.id) {
      Alert.alert("Error", "Cannot start conversation");
      return;
    }

    setSelectedProposal(proposal);
    setMessageModalVisible(true);
  };

  // Send message
const handleSendMessage = async () => {
  if (!messageText.trim() || !selectedProposal || !user?.id) return;

  if (!selectedProposal.job?.client?.id) {
    Alert.alert("Error", "Client information not available");
    return;
  }

  setSendingMessage(true);
  try {
    // Remove is_read: false from the insert
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedProposal.job.client.id,
      content: messageText.trim(),
      // Removed: is_read: false
    });

    if (error) throw error;

    Alert.alert(
      "Success",
      "Message sent successfully! You can continue the conversation in the Messages tab.",
      [
        {
          text: "Go to Messages",
          onPress: () => {
            setMessageModalVisible(false);
            setMessageText("");
            router.push("/(tabs)/messages");
          },
        },
        {
          text: "OK",
          onPress: () => {
            setMessageModalVisible(false);
            setMessageText("");
          },
        },
      ]
    );
  } catch (error: any) {
    console.error("Error sending message:", error);
    Alert.alert("Error", "Failed to send message");
  } finally {
    setSendingMessage(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "#10B981";
      case "rejected":
        return "#EF4444";
      case "pending":
      default:
        return "#F59E0B";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "#ECFDF5";
      case "rejected":
        return "#FEF2F2";
      case "pending":
      default:
        return "#FFFBEB";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      case "pending":
      default:
        return "time-outline";
    }
  };

  const renderProposalCard = ({ item }: { item: Proposal }) => (
    <View style={styles.proposalCard}>
      {/* Header with Status */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>

      {/* Job Info */}
      <Text style={styles.jobTitle} numberOfLines={2}>
        {item.job?.title || "Untitled Job"}
      </Text>
      <Text style={styles.jobDescription} numberOfLines={3}>
        {item.job?.description || "No description available"}
      </Text>

      {/* Proposal Price */}
      {item.price && (
        <View style={styles.priceContainer}>
          <View style={styles.priceTag}>
            <Ionicons name="pricetag" size={16} color={primaryColor} />
            <Text style={styles.priceLabel}>Your Bid</Text>
          </View>
          <Text style={styles.priceAmount}>${item.price.toLocaleString()}</Text>
        </View>
      )}

      {/* Client Info */}
      {item.job?.client && (
        <View style={styles.clientSection}>
          <View style={styles.clientRow}>
            {item.job.client.avatar ? (
              <Image source={{ uri: item.job.client.avatar }} style={styles.clientAvatar} />
            ) : (
              <View style={[styles.clientAvatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={18} color="#94A3B8" />
              </View>
            )}
            <View style={styles.clientInfo}>
              <Text style={styles.clientLabel}>Client</Text>
              <Text style={styles.clientName}>
                {item.job.client.first_name} {item.job.client.last_name}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => router.push(`/job/${item.job_id}`)}
        >
          <Ionicons name="document-text-outline" size={18} color={primaryColor} />
          <Text style={styles.viewButtonText}>View Job</Text>
        </TouchableOpacity>

        {item.status === "accepted" && (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => handleStartMessaging(item)}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={whiteColor} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="document-text-outline" size={56} color="#CBD5E1" />
      </View>
      <Text style={styles.emptyText}>
        {activeTab === "all"
          ? "No Proposals Yet"
          : `No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Proposals`}
      </Text>
      <Text style={styles.emptySubtext}>
        Start applying to jobs and your proposals will appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Loading your proposals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Proposals</Text>
          <Text style={styles.headerSubtitle}>
            {proposals.length} {proposals.length === 1 ? 'proposal' : 'proposals'} submitted
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && styles.activeTab]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
              All
            </Text>
            <View style={[styles.tabBadge, activeTab === "all" && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, activeTab === "all" && styles.activeTabBadgeText]}>
                {proposals.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "pending" && styles.activeTab]}
            onPress={() => setActiveTab("pending")}
          >
            <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>
              Pending
            </Text>
            <View style={[styles.tabBadge, activeTab === "pending" && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, activeTab === "pending" && styles.activeTabBadgeText]}>
                {proposals.filter((p) => p.status === "pending").length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "accepted" && styles.activeTab]}
            onPress={() => setActiveTab("accepted")}
          >
            <Text style={[styles.tabText, activeTab === "accepted" && styles.activeTabText]}>
              Accepted
            </Text>
            <View style={[styles.tabBadge, activeTab === "accepted" && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, activeTab === "accepted" && styles.activeTabBadgeText]}>
                {proposals.filter((p) => p.status === "accepted").length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "rejected" && styles.activeTab]}
            onPress={() => setActiveTab("rejected")}
          >
            <Text style={[styles.tabText, activeTab === "rejected" && styles.activeTabText]}>
              Rejected
            </Text>
            <View style={[styles.tabBadge, activeTab === "rejected" && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, activeTab === "rejected" && styles.activeTabBadgeText]}>
                {proposals.filter((p) => p.status === "rejected").length}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Proposals List */}
      <FlatList
        data={filteredProposals}
        renderItem={renderProposalCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      />

      {/* Message Modal */}
      <Modal
  visible={messageModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setMessageModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.messageModalContent}>
      <View style={styles.modalHeader}>
        <View>
          <Text style={styles.modalTitle}>Send Message</Text>
          <Text style={styles.modalSubtitle}>Start a conversation with the client</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setMessageModalVisible(false);
            setMessageText("");
          }}
          disabled={sendingMessage}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={26} color="#64748B" />
        </TouchableOpacity>
      </View>

      {selectedProposal && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Job Context Card */}
          <View style={styles.contextCard}>
            <View style={styles.contextIcon}>
              <Ionicons name="briefcase-outline" size={20} color={primaryColor} />
            </View>
            <View style={styles.contextInfo}>
              <Text style={styles.contextLabel}>Regarding Job</Text>
              <Text style={styles.contextTitle} numberOfLines={2}>
                {selectedProposal.job?.title || "Job"}
              </Text>
            </View>
          </View>

          {/* Client Info Card */}
          {selectedProposal.job?.client && (
            <View style={styles.recipientInfo}>
              <View style={styles.recipientHeader}>
                {selectedProposal.job.client.avatar ? (
                  <Image
                    source={{ uri: selectedProposal.job.client.avatar }}
                    style={styles.recipientAvatar}
                  />
                ) : (
                  <View style={[styles.recipientAvatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={24} color="#94A3B8" />
                  </View>
                )}
                <View style={styles.recipientDetails}>
                  <Text style={styles.recipientLabel}>Sending to</Text>
                  <Text style={styles.recipientName}>
                    {selectedProposal.job.client.first_name}{" "}
                    {selectedProposal.job.client.last_name}
                  </Text>
                  {selectedProposal.job.client.email && (
                    <Text style={styles.recipientEmail}>
                      {selectedProposal.job.client.email}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Your Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Introduce yourself and discuss the project details..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={8}
              value={messageText}
              onChangeText={setMessageText}
              textAlignVertical="top"
              editable={!sendingMessage}
              maxLength={500}
            />
            <Text style={styles.charCount}>
              {messageText.length}/500 characters
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.messageModalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setMessageModalVisible(false);
                setMessageText("");
              }}
              disabled={sendingMessage}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sendMessageButton,
                (!messageText.trim() || sendingMessage) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator color={whiteColor} size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={whiteColor} />
                  <Text style={styles.sendMessageButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
};

export default MyProposalsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: whiteColor,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500",
  },
  tabsWrapper: {
    backgroundColor: whiteColor,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    marginRight: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: primaryColor,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: whiteColor,
  },
  tabBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  activeTabBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  activeTabBadgeText: {
    color: whiteColor,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  proposalCard: {
    backgroundColor: whiteColor,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    lineHeight: 24,
  },
  jobDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  priceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: primaryColor,
  },
  clientSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginBottom: 16,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  clientInfo: {
    flex: 1,
  },
  clientLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 3,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  viewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: primaryColor,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: primaryColor,
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: primaryColor,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: whiteColor,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: whiteColor,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  closeButton: {
    padding: 4,
  },
  messageModalContent: {
    flex: 1,
  },
  contextCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  contextIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: whiteColor,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contextInfo: {
    flex: 1,
  },
  contextLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contextTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 20,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  clientModalAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  clientCardInfo: {
    flex: 1,
  },
  clientCardLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "600",
  },
  clientCardName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  messageInput: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0F172A",
    minHeight: 140,
    backgroundColor: "#FAFBFC",
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "right",
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
  },
  sendButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: primaryColor,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: whiteColor,
  },
  messageModalContent: {
    backgroundColor: whiteColor,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: "90%",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  contextCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  contextIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: whiteColor,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contextInfo: {
    flex: 1,
  },
  contextLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contextTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 20,
  },
  recipientInfo: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  recipientHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  recipientEmail: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 24,
  },
  messageInput: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#0F172A",
    minHeight: 150,
    backgroundColor: "#FAFBFC",
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 8,
    fontWeight: "500",
  },
  messageModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  sendMessageButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: primaryColor,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  sendMessageButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: whiteColor,
  },
});
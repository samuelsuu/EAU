// app/(tabs)/messages.tsx - Messages Screen
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  primaryColor,
  backgroundColor,
  whiteColor,
  fontColor,
} from "@/constants/GlobalConstants";
import {
  getConversationsList,
  getConversation,
  sendReply,
  markMessageAsRead,
  Message,
  Conversation,
} from "@/services/messages";
import { getProfileById } from "@/services/login";

const MessagesScreen = () => {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Conversation View State
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatScrollViewRef = useRef<ScrollView>(null);

  // Profile View State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
      setLoading(false);
      setRefreshing(false);
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

  // Open conversation
  const openConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchConversationMessages(conversation.userId);
  };

  // Close conversation
  const closeConversation = () => {
    setSelectedConversation(null);
    setConversationMessages([]);
    setMessageText("");
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

  useEffect(() => {
    fetchConversations();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
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

  // If viewing a conversation
  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={closeConversation} style={styles.backButton}>
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
              <View style={[styles.chatHeaderAvatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color="#999" />
              </View>
            )}
            <Text style={styles.chatHeaderName}>
              {selectedConversation?.userName || "Unknown"}
            </Text>
          </TouchableOpacity>
          <View style={{ width: 24 }} />
        </View>

        {/* Messages List */}
        {loadingConversation ? (
          <View style={styles.loadingContainer}>
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
                    isSent ? styles.sentMessageContainer : styles.receivedMessageContainer,
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
                      isSent ? styles.sentMessageBubble : styles.receivedMessageBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageBubbleText,
                        isSent ? styles.sentMessageText : styles.receivedMessageText,
                      ]}
                    >
                      {message.content}
                    </Text>
                    <Text
                      style={[
                        styles.messageBubbleTime,
                        isSent ? styles.sentMessageTime : styles.receivedMessageTime,
                      ]}
                    >
                      {new Date(message.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  {isSent && <View style={{ width: 32 }} />}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Message Input */}
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
              (!messageText.trim() || sendingMessage) && styles.sendButtonDisabled,
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
              <View style={styles.loadingContainer}>
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
                    <View style={[styles.profileViewAvatar, styles.avatarPlaceholder]}>
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
                      <Text style={styles.profileRoleText}>{viewedProfile.role}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.profileInfoSection}>
                  {viewedProfile.email && (
                    <View style={styles.profileInfoRow}>
                      <Ionicons name="mail-outline" size={18} color="#666" />
                      <Text style={styles.profileInfoLabel}>Email:</Text>
                      <Text style={styles.profileInfoValue}>{viewedProfile.email}</Text>
                    </View>
                  )}

                  {viewedProfile.phone && (
                    <View style={styles.profileInfoRow}>
                      <Ionicons name="call-outline" size={18} color="#666" />
                      <Text style={styles.profileInfoLabel}>Phone:</Text>
                      <Text style={styles.profileInfoValue}>{viewedProfile.phone}</Text>
                    </View>
                  )}

                  {viewedProfile.location && (
                    <View style={styles.profileInfoRow}>
                      <Ionicons name="location-outline" size={18} color="#666" />
                      <Text style={styles.profileInfoLabel}>Location:</Text>
                      <Text style={styles.profileInfoValue}>{viewedProfile.location}</Text>
                    </View>
                  )}

                  {viewedProfile.bio && (
                    <View style={styles.profileBioSection}>
                      <Text style={styles.profileSectionTitle}>About</Text>
                      <Text style={styles.profileBioText}>{viewedProfile.bio}</Text>
                    </View>
                  )}

                  {viewedProfile.skills && viewedProfile.skills.length > 0 && (
                    <View style={styles.profileSkillsSection}>
                      <Text style={styles.profileSectionTitle}>Skills</Text>
                      <View style={styles.profileSkillsContainer}>
                        {viewedProfile.skills.map((skill: string, index: number) => (
                          <View key={index} style={styles.profileSkillTag}>
                            <Text style={styles.profileSkillText}>{skill}</Text>
                          </View>
                        ))}
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
  }

  // Conversations List View
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={fontColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => fetchConversations()} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={fontColor} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Messages from users will appear here</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.conversationsList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
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
                    <View style={[styles.conversationAvatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={24} color="#999" />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{conversation.userName}</Text>
                    <Text style={styles.conversationTime}>
                      {formatDate(conversation.lastMessageTime)}
                    </Text>
                  </View>
                  <View style={styles.conversationFooter}>
                    <Text style={styles.conversationLastMessage} numberOfLines={1}>
                      {conversation.lastMessage}
                    </Text>
                    {conversation.unreadCount > 0 && (
                      <View style={styles.conversationBadge}>
                        <Text style={styles.conversationBadgeText}>
                          {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
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
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: whiteColor,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: fontColor,
  },
  backButton: {
    padding: 4,
  },
  refreshButton: {
    padding: 4,
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
  conversationsList: {
    flex: 1,
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
  avatarPlaceholder: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
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
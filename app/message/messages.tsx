// app/(tabs)/messages.tsx - Messages Screen with Chat
import { getConversations, getMessages, sendMessage, markMessagesAsRead } from "@/api/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
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
} from "@/constants/GlobalConstants";

interface Conversation {
    id: string;
    user_id: string;
    name: string;
    avatar?: string;
    last_message: string;
    last_message_time: string;
    unread_count: number;
    online?: boolean;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    timestamp: string;
    is_read: boolean;
    sender_name?: string;
    sender_avatar?: string;
}

const Messages = () => {
    const router = useRouter();
    const currentUser = useSelector((state: any) => state.auth.user);
    const currentUserId = currentUser?.user_id || currentUser?.id;

    // State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [offset, setOffset] = useState(0);

    const flatListRef = useRef<FlatList>(null);

    // Fetch conversations
    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await getConversations();
            
            console.log('💬 Conversations response:', response.data);
            
            const conversationsData = response.data?.data?.conversations || 
                                     response.data?.conversations || 
                                     [];
            
            setConversations(conversationsData);
            
            // If no conversations but we have a receiverId from navigation, create a temporary one
            if (conversationsData.length === 0) {
                console.log('ℹ️ No conversations found. User can start a new chat from other screens.');
            }
        } catch (error: any) {
            console.error("❌ Error fetching conversations:", error);
            // Don't show alert for 404, just show empty state
            if (error?.status !== 404) {
                Alert.alert("Error", "Failed to load conversations");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch messages for a conversation
    const fetchMessages = async (conversation: Conversation) => {
        try {
            setLoadingMessages(true);
            const response = await getMessages({
                receiver_id: conversation.user_id,
                offset: 0,
            });
            
            console.log('📨 Messages response:', response.data);
            
            const messagesData = response.data?.data?.messages || 
                                response.data?.messages || 
                                [];
            
            setMessages(messagesData);
            setOffset(0);
            
            // Mark messages as read
            if (conversation.unread_count > 0) {
                try {
                    await markMessagesAsRead(conversation.id);
                    // Update conversation unread count
                    setConversations(prev => 
                        prev.map(conv => 
                            conv.id === conversation.id 
                                ? { ...conv, unread_count: 0 }
                                : conv
                        )
                    );
                } catch (error) {
                    console.error("Failed to mark as read:", error);
                }
            }
            
            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error: any) {
            console.error("❌ Error fetching messages:", error);
            Alert.alert("Error", "Failed to load messages");
        } finally {
            setLoadingMessages(false);
        }
    };

    // Load more messages (pagination)
    const loadMoreMessages = async () => {
        if (!selectedConversation || loadingMessages) return;
        
        try {
            const newOffset = offset + 20;
            const response = await getMessages({
                receiver_id: selectedConversation.user_id,
                offset: newOffset,
            });
            
            const messagesData = response.data?.data?.messages || 
                                response.data?.messages || 
                                [];
            
            if (messagesData.length > 0) {
                setMessages(prev => [...messagesData, ...prev]);
                setOffset(newOffset);
            }
        } catch (error) {
            console.error("Error loading more messages:", error);
        }
    };

    // Send message
    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedConversation) return;

        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            sender_id: currentUserId,
            receiver_id: selectedConversation.user_id,
            message: messageText.trim(),
            timestamp: new Date().toISOString(),
            is_read: false,
        };

        // Optimistically add message
        setMessages(prev => [...prev, tempMessage]);
        setMessageText("");
        
        // Scroll to bottom
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        setSendingMessage(true);
        try {
            const response = await sendMessage({
                receiver_id: selectedConversation.user_id,
                message: tempMessage.message,
            });

            console.log('✅ Message sent:', response.data);

            // Update the temp message with real data
            if (response.data?.data?.message) {
                setMessages(prev => 
                    prev.map(msg => 
                        msg.id === tempMessage.id 
                            ? { ...response.data.data.message, id: response.data.data.message.id }
                            : msg
                    )
                );
            }

            // Update conversation's last message
            setConversations(prev =>
                prev.map(conv =>
                    conv.id === selectedConversation.id
                        ? {
                              ...conv,
                              last_message: tempMessage.message,
                              last_message_time: "Just now",
                          }
                        : conv
                )
            );
        } catch (error: any) {
            console.error("❌ Send message error:", error);
            // Remove temp message on error
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            Alert.alert("Error", "Failed to send message");
        } finally {
            setSendingMessage(false);
        }
    };

    // Handle conversation selection
    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        fetchMessages(conversation);
    };

    // Handle refresh
    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    // Render conversation item
    const renderConversationItem = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={[
                styles.conversationItem,
                selectedConversation?.id === item.id && styles.conversationItemActive,
            ]}
            onPress={() => handleSelectConversation(item)}
        >
            <View style={styles.conversationAvatar}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={24} color="#999" />
                    </View>
                )}
                {item.online && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.conversationTime}>{item.last_message_time}</Text>
                </View>
                <View style={styles.conversationFooter}>
                    <Text style={styles.conversationMessage} numberOfLines={1}>
                        {item.last_message}
                    </Text>
                    {item.unread_count > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCount}>{item.unread_count}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    // Render message bubble
    const renderMessageItem = ({ item }: { item: Message }) => {
        const isCurrentUser = item.sender_id === currentUserId;

        return (
            <View
                style={[
                    styles.messageContainer,
                    isCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft,
                ]}
            >
                {!isCurrentUser && (
                    <View style={styles.messageAvatar}>
                        {selectedConversation?.avatar ? (
                            <Image
                                source={{ uri: selectedConversation.avatar }}
                                style={styles.smallAvatar}
                            />
                        ) : (
                            <View style={[styles.smallAvatar, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={16} color="#999" />
                            </View>
                        )}
                    </View>
                )}

                <View
                    style={[
                        styles.messageBubble,
                        isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isCurrentUser ? styles.messageTextRight : styles.messageTextLeft,
                        ]}
                    >
                        {item.message}
                    </Text>
                    <Text
                        style={[
                            styles.messageTime,
                            isCurrentUser ? styles.messageTimeRight : styles.messageTimeLeft,
                        ]}
                    >
                        {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Text>
                </View>
            </View>
        );
    };

    // Empty states
    const renderEmptyConversations = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Start messaging to see your chats here</Text>
        </View>
    );

    const renderEmptyMessages = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={primaryColor} />
                <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <View style={styles.container}>
                {/* Conversations List */}
                <View style={[styles.conversationsPanel, selectedConversation && styles.conversationsPanelCollapsed]}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Messages</Text>
                        <TouchableOpacity style={styles.headerButton}>
                            <Ionicons name="create-outline" size={24} color={primaryColor} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={conversations}
                        renderItem={renderConversationItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={renderEmptyConversations}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={primaryColor}
                            />
                        }
                    />
                </View>

                {/* Chat Panel */}
                {selectedConversation ? (
                    <KeyboardAvoidingView
                        style={styles.chatPanel}
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
                    >
                        {/* Chat Header */}
                        <View style={styles.chatHeader}>
                            <TouchableOpacity
                                onPress={() => setSelectedConversation(null)}
                                style={styles.backButton}
                            >
                                <Ionicons name="arrow-back" size={24} color={fontColor} />
                            </TouchableOpacity>

                            <View style={styles.chatHeaderInfo}>
                                {selectedConversation.avatar ? (
                                    <Image
                                        source={{ uri: selectedConversation.avatar }}
                                        style={styles.chatAvatar}
                                    />
                                ) : (
                                    <View style={[styles.chatAvatar, styles.avatarPlaceholder]}>
                                        <Ionicons name="person" size={20} color="#999" />
                                    </View>
                                )}
                                <View style={styles.chatHeaderText}>
                                    <Text style={styles.chatHeaderName}>
                                        {selectedConversation.name}
                                    </Text>
                                    {selectedConversation.online && (
                                        <Text style={styles.chatHeaderStatus}>Online</Text>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity style={styles.headerButton}>
                                <Ionicons name="ellipsis-vertical" size={24} color={fontColor} />
                            </TouchableOpacity>
                        </View>

                        {/* Messages List */}
                        {loadingMessages ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={primaryColor} />
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                renderItem={renderMessageItem}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.messagesList}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={renderEmptyMessages}
                                onEndReached={loadMoreMessages}
                                onEndReachedThreshold={0.5}
                            />
                        )}

                        {/* Message Input */}
                        <View style={styles.inputContainer}>
                            <TouchableOpacity style={styles.attachButton}>
                                <Ionicons name="add-circle-outline" size={28} color={primaryColor} />
                            </TouchableOpacity>

                            <TextInput
                                style={styles.messageInput}
                                placeholder="Type a message..."
                                placeholderTextColor="#999"
                                value={messageText}
                                onChangeText={setMessageText}
                                multiline
                                maxLength={500}
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
                                    <ActivityIndicator size="small" color={whiteColor} />
                                ) : (
                                    <Ionicons name="send" size={20} color={whiteColor} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                ) : (
                    <View style={styles.noChatSelected}>
                        <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
                        <Text style={styles.noChatText}>Select a conversation</Text>
                        <Text style={styles.noChatSubtext}>
                            Choose a conversation from the list to start messaging
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

export default Messages;

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
    container: {
        flex: 1,
        flexDirection: "row",
    },
    // Conversations Panel
    conversationsPanel: {
        flex: 1,
        backgroundColor: whiteColor,
        borderRightWidth: 1,
        borderRightColor: "#F0F0F0",
    },
    conversationsPanelCollapsed: {
        display: "none",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: fontColor,
    },
    headerButton: {
        padding: 8,
    },
    conversationItem: {
        flexDirection: "row",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    conversationItemActive: {
        backgroundColor: "#F8F8F8",
    },
    conversationAvatar: {
        position: "relative",
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center",
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#4CAF50",
        borderWidth: 2,
        borderColor: whiteColor,
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    conversationName: {
        fontSize: 16,
        fontWeight: "600",
        color: fontColor,
        flex: 1,
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
    conversationMessage: {
        fontSize: 14,
        color: "#666",
        flex: 1,
    },
    unreadBadge: {
        backgroundColor: primaryColor,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    unreadCount: {
        color: whiteColor,
        fontSize: 11,
        fontWeight: "700",
    },
    // Chat Panel
    chatPanel: {
        flex: 2,
        backgroundColor: backgroundColor,
    },
    chatHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: whiteColor,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    chatHeaderInfo: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    chatAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    chatHeaderText: {
        flex: 1,
    },
    chatHeaderName: {
        fontSize: 16,
        fontWeight: "600",
        color: fontColor,
    },
    chatHeaderStatus: {
        fontSize: 12,
        color: "#4CAF50",
        marginTop: 2,
    },
    messagesList: {
        padding: 16,
        flexGrow: 1,
    },
    messageContainer: {
        flexDirection: "row",
        marginBottom: 16,
        maxWidth: "80%",
    },
    messageContainerLeft: {
        alignSelf: "flex-start",
    },
    messageContainerRight: {
        alignSelf: "flex-end",
        flexDirection: "row-reverse",
    },
    messageAvatar: {
        marginRight: 8,
    },
    smallAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    messageBubble: {
        borderRadius: 16,
        padding: 12,
        maxWidth: "100%",
    },
    messageBubbleLeft: {
        backgroundColor: whiteColor,
        borderBottomLeftRadius: 4,
    },
    messageBubbleRight: {
        backgroundColor: primaryColor,
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageTextLeft: {
        color: fontColor,
    },
    messageTextRight: {
        color: whiteColor,
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
    },
    messageTimeLeft: {
        color: "#999",
    },
    messageTimeRight: {
        color: "rgba(255, 255, 255, 0.7)",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 12,
        backgroundColor: whiteColor,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    attachButton: {
        padding: 8,
        marginRight: 8,
    },
    messageInput: {
        flex: 1,
        backgroundColor: backgroundColor,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: fontColor,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: primaryColor,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    // Empty States
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
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
        textAlign: "center",
    },
    noChatSelected: {
        flex: 2,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: backgroundColor,
        padding: 40,
    },
    noChatText: {
        fontSize: 20,
        fontWeight: "600",
        color: "#999",
        marginTop: 20,
    },
    noChatSubtext: {
        fontSize: 14,
        color: "#ccc",
        marginTop: 8,
        textAlign: "center",
    },
});
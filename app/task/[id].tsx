// app/task/[id].tsx - Task Detail Page
import { taskDetails, sendMessage, addSavedItem, removeSavedItem } from "@/api/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    primaryColor,
    secondaryColor,
    backgroundColor,
    whiteColor,
    fontColor,
    highlightColor, // Added highlightColor for consistency
} from "@/constants/GlobalConstants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TaskDetail {
    id: string;
    title: string;
    description?: string;
    content?: string;
    category?: string;
    price?: string;
    budget?: string;
    rating?: number;
    reviews?: number;
    image?: string;
    images?: string[];
    skills?: string[];
    deadline?: string;
    delivery_time?: string;
    location?: string;
    posted_date?: string;
    publish_date?: string;
    saved?: boolean;
    seller?: {
        id?: string;
        name?: string;
        avatar?: string;
        rating?: number;
        reviews?: number;
        level?: string;
        response_time?: string;
    };
    requirements?: string;
    features?: string[];
}

const TaskDetail = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // State
    const [task, setTask] = useState<TaskDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [savingItem, setSavingItem] = useState(false);

    // Modal States
    const [applyModalVisible, setApplyModalVisible] = useState(false);
    const [messageModalVisible, setMessageModalVisible] = useState(false);
    const [applying, setApplying] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);

    // Form States
    const [applicationData, setApplicationData] = useState({
        coverLetter: "",
        proposedPrice: "",
        deliveryTime: "",
    });
    const [messageText, setMessageText] = useState("");

    // Fetch task details
    useEffect(() => {
        fetchTaskDetails();
    }, [id]);

    const fetchTaskDetails = async () => {
        try {
            setLoading(true);
            // Ensure id is treated as a string for the API call
            const response = await taskDetails(id as string); 
            const taskData = response.data?.data?.task || response.data?.task || response.data;
            setTask(taskData);
            setSaved(taskData?.saved || false);
        } catch (error) {
            console.error("Error fetching task details:", error);
            Alert.alert("Error", "Failed to load task details");
        } finally {
            setLoading(false);
        }
    };

    // Handle save/unsave
    const handleSaveToggle = async () => {
        if (!task) return;

        setSavingItem(true);
        try {
            if (saved) {
                // Assuming post_type is 'task' for task items
                await removeSavedItem({ post_id: task.id, post_type: "task" }); 
                setSaved(false);
                Alert.alert("Success", "Task removed from saved items");
            } else {
                // Assuming post_type is 'task' for task items
                await addSavedItem({ post_id: task.id, post_type: "task" }); 
                setSaved(true);
                Alert.alert("Success", "Task saved successfully");
            }
        } catch (error: any) {
            console.error("Save/Unsave error:", error);
            Alert.alert("Error", error?.response?.data?.message || "Failed to save task");
        } finally {
            setSavingItem(false);
        }
    };

    // Handle apply
    const handleApply = () => {
        setApplyModalVisible(true);
    };

    const submitApplication = async () => {
        if (!applicationData.coverLetter.trim()) {
            Alert.alert("Error", "Please write a cover letter");
            return;
        }

        setApplying(true);
        try {
            // TODO: Implement your proposal submission API here
            await new Promise((resolve) => setTimeout(resolve, 1500)); // Mock API call

            Alert.alert(
                "Success",
                "Your application has been submitted successfully!",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            setApplyModalVisible(false);
                            setApplicationData({
                                coverLetter: "",
                                proposedPrice: "",
                                deliveryTime: "",
                            });
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error("Application error:", error);
            Alert.alert("Error", "Failed to submit application");
        } finally {
            setApplying(false);
        }
    };

    // Handle message
    const handleSendMessage = () => {
        if (!task?.seller?.id) {
            Alert.alert("Error", "Seller information not available");
            return;
        }
        setMessageModalVisible(true);
    };

    const sendMessageToSeller = async () => {
        if (!messageText.trim()) {
            Alert.alert("Error", "Please enter a message");
            return;
        }

        if (!task?.seller?.id) {
            Alert.alert("Error", "Seller information not available");
            return;
        }

        setSendingMessage(true);
        try {
            const response = await sendMessage({
                receiver_id: task.seller.id,
                message: messageText.trim(),
            });

            if (response.data?.type === "success" || response.status === 200) {
                Alert.alert(
                    "Success",
                    "Message sent successfully!",
                    [
                        {
                            text: "View Messages",
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
            } else {
                 throw new Error(response.data?.message_desc || "Unknown error");
            }
        } catch (error: any) {
            console.error("Send message error:", error);
            const errorMessage =
                error?.response?.data?.message_desc ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to send message";
            Alert.alert("Error", errorMessage);
        } finally {
            setSendingMessage(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={primaryColor} />
                <Text style={styles.loadingText}>Loading task details...</Text>
            </View>
        );
    }

    if (!task) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.headerButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={fontColor} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Task Details</Text>
                    <View style={styles.headerButton} /> {/* Placeholder for alignment */}
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
                    <Text style={styles.errorText}>Task not found</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Helper to render rating stars
    const renderRating = (rating: number = 0) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return (
            <View style={styles.ratingStarsContainer}>
                {Array(fullStars).fill(0).map((_, i) => (
                    <Ionicons key={`full-${i}`} name="star" size={16} color="#FFA500" />
                ))}
                {hasHalfStar && (
                    <Ionicons key="half" name="star-half" size={16} color="#FFA500" />
                )}
                {Array(emptyStars).fill(0).map((_, i) => (
                    <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFA500" />
                ))}
                <Text style={styles.ratingNumber}>
                    {rating.toFixed(1)}
                </Text>
            </View>
        );
    };

    // Helper for info boxes
    const renderInfoBox = (icon: keyof typeof Ionicons.glyphMap, color: string, label: string, value: string | undefined) => {
        if (!value) return null;
        return (
            <View style={styles.infoBox}>
                <Ionicons name={icon} size={24} color={color} />
                <Text style={styles.infoBoxLabel}>{label}</Text>
                <Text style={styles.infoBoxValue} numberOfLines={1}>{value}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.headerButton}
                >
                    <Ionicons name="arrow-back" size={24} color={fontColor} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Task Details</Text>
                <TouchableOpacity
                    onPress={handleSaveToggle}
                    style={styles.headerButton}
                    disabled={savingItem}
                >
                    {savingItem ? (
                        <ActivityIndicator size="small" color={primaryColor} />
                    ) : (
                        <Ionicons
                            name={saved ? "heart" : "heart-outline"}
                            size={24}
                            color={saved ? "#FF0000" : fontColor}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Image / Gallery */}
                {(task.image || (task.images && task.images.length > 0)) && (
                    <Image
                        source={{ uri: task.image || task.images?.[0] }}
                        style={styles.taskImage}
                    />
                )}
                
                <View style={styles.contentContainer}>
                    {/* Title and Category */}
                    <Text style={styles.categoryBadge}>{task.category || 'Uncategorized'}</Text>
                    <Text style={styles.title}>{task.title}</Text>

                    {/* Price and Rating */}
                    <View style={styles.priceAndRating}>
                        <Text style={styles.priceText}>{task.price || task.budget || 'Negotiable'}</Text>
                        <View style={styles.ratingSection}>
                            {renderRating(task.rating)}
                            {task.reviews !== undefined && (
                                <Text style={styles.reviewCount}>({task.reviews} reviews)</Text>
                            )}
                        </View>
                    </View>

                    {/* Quick Info Boxes */}
                    <View style={styles.infoBoxesContainer}>
                        {renderInfoBox("location-outline", "#7A50EC", "Location", task.location)}
                        {renderInfoBox("calendar-outline", "#4CAF50", "Posted", task.posted_date || task.publish_date)}
                        {renderInfoBox("time-outline", primaryColor, "Delivery", task.delivery_time || task.deadline)}
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.descriptionText}>
                            {task.content || task.description || "No detailed description provided."}
                        </Text>
                    </View>

                    {/* Requirements/Features */}
                    {(task.requirements || (task.features && task.features.length > 0)) && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {task.requirements ? "Requirements" : "Key Features"}
                            </Text>
                            {task.requirements ? (
                                <Text style={styles.listItemText}>{task.requirements}</Text>
                            ) : (
                                (task.features || []).map((feature, index) => (
                                    <View key={index} style={styles.listItem}>
                                        <Ionicons name="checkmark-circle" size={16} color={primaryColor} />
                                        <Text style={styles.listItemText}>{feature}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {/* Skills */}
                    {task.skills && task.skills.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Required Skills</Text>
                            <View style={styles.skillsContainer}>
                                {task.skills.map((skill, index) => (
                                    <View key={index} style={styles.skillTag}>
                                        <Text style={styles.skillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Seller Information */}
                    {task.seller && (
                        <TouchableOpacity 
                            style={styles.sellerSection}
                            onPress={() => task.seller?.id && router.push(`/freelancer/${task.seller.id}`)}
                        >
                            <Text style={styles.sectionTitle}>About the Client/Seller</Text>
                            <View style={styles.sellerContent}>
                                <Image
                                    source={{ uri: task.seller.avatar || 'https://via.placeholder.com/150' }}
                                    style={styles.sellerAvatar}
                                />
                                <View style={styles.sellerInfo}>
                                    <Text style={styles.sellerName}>{task.seller.name || "N/A"}</Text>
                                    {task.seller.level && (
                                        <Text style={styles.sellerLevel}>{task.seller.level}</Text>
                                    )}
                                    <View style={styles.sellerMeta}>
                                        {task.seller.rating !== undefined && renderRating(task.seller.rating)}
                                        {task.seller.reviews !== undefined && (
                                            <Text style={styles.sellerReviewCount}>({task.seller.reviews})</Text>
                                        )}
                                        {task.seller.response_time && (
                                            <Text style={styles.sellerResponseTime}>
                                                <Ionicons name="chatbox-outline" size={12} color="#999" /> 
                                                {' '}Responds in {task.seller.response_time}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#ccc" />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
                {/* ScrollView Padding */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.messageButton}
                    onPress={handleSendMessage}
                    disabled={!task.seller?.id}
                >
                    <Ionicons name="chatbubble-outline" size={24} color={primaryColor} />
                    <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApply}
                >
                    <Text style={styles.applyButtonText}>Apply Now</Text>
                </TouchableOpacity>
            </View>

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
                            <Text style={styles.modalTitle}>Submit Proposal</Text>
                            <TouchableOpacity
                                onPress={() => setApplyModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {task && (
                                <View style={styles.jobPreview}>
                                    <Text style={styles.jobPreviewTitle} numberOfLines={2}>
                                        {task.title}
                                    </Text>
                                    <Text style={styles.jobPreviewPrice}>{task.price || task.budget || 'Negotiable'}</Text>
                                </View>
                            )}

                            <Text style={styles.inputLabel}>Cover Letter *</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Explain why you're the best fit for this task..."
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
                                placeholder="Enter your proposed price (e.g., $150)"
                                placeholderTextColor="#999"
                                keyboardType="default"
                                value={applicationData.proposedPrice}
                                onChangeText={(text) =>
                                    setApplicationData({ ...applicationData, proposedPrice: text })
                                }
                            />

                            <Text style={styles.inputLabel}>Estimated Delivery Time (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 3 days"
                                placeholderTextColor="#999"
                                keyboardType="default"
                                value={applicationData.deliveryTime}
                                onChangeText={(text) =>
                                    setApplicationData({ ...applicationData, deliveryTime: text })
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
                                    disabled={applying || !applicationData.coverLetter.trim()}
                                >
                                    {applying ? (
                                        <ActivityIndicator color={whiteColor} />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Submit Proposal</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Message Modal */}
            <Modal
                visible={messageModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setMessageModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.messageModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Message {task.seller?.name || "Seller"}</Text>
                            <TouchableOpacity
                                onPress={() => setMessageModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.inputLabel}>Your Message</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Type your question or request here..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={5}
                            value={messageText}
                            onChangeText={setMessageText}
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            style={[styles.submitButton, sendingMessage && { opacity: 0.7 }]}
                            onPress={sendMessageToSeller}
                            disabled={sendingMessage || !messageText.trim()}
                        >
                            {sendingMessage ? (
                                <ActivityIndicator color={whiteColor} />
                            ) : (
                                <Text style={styles.submitButtonText}>Send Message</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default TaskDetail;

// Styles for TaskDetail
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
    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: whiteColor,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: fontColor,
        flex: 1,
        textAlign: 'center',
    },
    headerButton: {
        padding: 8,
    },
    // Error
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 20,
        fontWeight: "600",
        color: "#999",
        marginTop: 10,
    },
    backButton: {
        marginTop: 20,
        backgroundColor: primaryColor,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    backButtonText: {
        color: whiteColor,
        fontSize: 16,
        fontWeight: "600",
    },
    // Content
    scrollView: {
        flex: 1,
    },
    taskImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.6, // Aspect ratio
        resizeMode: "cover",
    },
    contentContainer: {
        padding: 20,
        backgroundColor: whiteColor,
    },
    categoryBadge: {
        fontSize: 13,
        fontWeight: "600",
        color: primaryColor,
        backgroundColor: highlightColor,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: fontColor,
        marginBottom: 15,
        lineHeight: 30,
    },
    priceAndRating: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        marginBottom: 20,
    },
    priceText: {
        fontSize: 22,
        fontWeight: "700",
        color: primaryColor,
    },
    ratingSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingStarsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    ratingNumber: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginLeft: 4,
    },
    reviewCount: {
        fontSize: 14,
        color: "#999",
    },
    infoBoxesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10,
    },
    infoBox: {
        width: '48%', // Approx. half of the width minus gap
        backgroundColor: backgroundColor,
        borderRadius: 12,
        padding: 15,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    infoBoxLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    infoBoxValue: {
        fontSize: 14,
        fontWeight: "600",
        color: fontColor,
        marginTop: 2,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: fontColor,
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 15,
        color: "#555",
        lineHeight: 24,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    listItemText: {
        fontSize: 15,
        color: "#555",
        marginLeft: 8,
        flex: 1,
        lineHeight: 24,
    },
    skillsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    skillTag: {
        backgroundColor: highlightColor,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    skillText: {
        fontSize: 13,
        color: primaryColor,
        fontWeight: "500",
    },
    // Seller Info
    sellerSection: {
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    sellerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: backgroundColor,
        borderRadius: 12,
        padding: 12,
    },
    sellerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    sellerInfo: {
        flex: 1,
    },
    sellerName: {
        fontSize: 16,
        fontWeight: "700",
        color: fontColor,
    },
    sellerLevel: {
        fontSize: 12,
        color: secondaryColor,
        fontWeight: "600",
        marginTop: 2,
    },
    sellerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        flexWrap: 'wrap',
    },
    sellerReviewCount: {
        fontSize: 12,
        color: "#999",
        marginLeft: 4,
        marginRight: 10,
    },
    sellerResponseTime: {
        fontSize: 12,
        color: "#999",
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Footer
    footer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
        backgroundColor: whiteColor,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
    },
    messageButton: {
        width: 100,
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: primaryColor,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    messageButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: primaryColor,
    },
    applyButton: {
        flex: 1,
        backgroundColor: primaryColor,
        borderRadius: 12,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    applyButtonText: {
        color: whiteColor,
        fontSize: 16,
        fontWeight: "700",
    },
    // Modal Styles (Copied from home.tsx for consistency)
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
    messageModalContent: {
        backgroundColor: whiteColor,
        borderRadius: 24,
        padding: 20,
        margin: 20,
        alignSelf: 'center',
        width: '90%',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    jobPreviewTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: fontColor,
        flexShrink: 1,
        marginRight: 10,
    },
    jobPreviewPrice: {
        fontSize: 16,
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
});
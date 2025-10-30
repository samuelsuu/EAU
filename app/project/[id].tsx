// app/project/[id].tsx - Project Detail Page
import {
    projectDetails,
    sendMessage,
    addSavedItem,
    removeSavedItem,
} from "@/api/api";
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
    highlightColor,
} from "@/constants/GlobalConstants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ProjectDetail {
    id: string;
    title: string;
    description?: string;
    content?: string;
    budget?: string;
    price?: string;
    deadline?: string;
    skills?: string[];
    posted_date?: string;
    publish_date?: string;
    location?: string;
    expertise?: string;
    project_type?: "fixed" | "hourly";
    featured?: boolean;
    saved?: boolean;
    duration?: string;
    attachments?: { file_id: string; file_url: string; filename: string }[];
    author?: {
        id?: string;
        name?: string;
        avatar?: string;
        label?: string;
        rating?: number;
        reviews?: number;
    };
}

const ProjectDetail = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // State
    const [project, setProject] = useState<ProjectDetail | null>(null);
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

    // Fetch project details
    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            setLoading(true);
            const response = await projectDetails(id as string);
            const projectData =
                response.data?.data?.project || response.data?.project || response.data;
            setProject(projectData);
            setSaved(projectData?.saved || false);
        } catch (error) {
            console.error("Error fetching project details:", error);
            Alert.alert("Error", "Failed to load project details");
        } finally {
            setLoading(false);
        }
    };

    // Handle save/unsave
    const handleSaveToggle = async () => {
        if (!project) return;

        setSavingItem(true);
        try {
            if (saved) {
                // Assuming post_type is 'project'
                await removeSavedItem({ post_id: project.id, post_type: "project" });
                setSaved(false);
                Alert.alert("Success", "Project removed from saved items");
            } else {
                // Assuming post_type is 'project'
                await addSavedItem({ post_id: project.id, post_type: "project" });
                setSaved(true);
                Alert.alert("Success", "Project saved successfully");
            }
        } catch (error: any) {
            console.error("Save/Unsave error:", error);
            Alert.alert(
                "Error",
                error?.response?.data?.message || "Failed to save project"
            );
        } finally {
            setSavingItem(false);
        }
    };

    // Handle apply (submit proposal)
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

            Alert.alert("Success", "Your proposal has been submitted successfully!", [
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
            ]);
        } catch (error: any) {
            console.error("Application error:", error);
            Alert.alert("Error", "Failed to submit proposal");
        } finally {
            setApplying(false);
        }
    };

    // Handle message
    const handleSendMessage = () => {
        if (!project?.author?.id) {
            Alert.alert("Error", "Client information not available");
            return;
        }
        setMessageModalVisible(true);
    };

    const sendMessageToClient = async () => {
        if (!messageText.trim()) {
            Alert.alert("Error", "Please enter a message");
            return;
        }

        if (!project?.author?.id) {
            Alert.alert("Error", "Client information not available");
            return;
        }

        setSendingMessage(true);
        try {
            const response = await sendMessage({
                receiver_id: project.author.id,
                message: messageText.trim(),
            });

            if (response.data?.type === "success" || response.status === 200) {
                Alert.alert("Success", "Message sent successfully!", [
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
                ]);
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
                <Text style={styles.loadingText}>Loading project details...</Text>
            </View>
        );
    }

    if (!project) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.headerButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={fontColor} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Project Details</Text>
                    <View style={styles.headerButton} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
                    <Text style={styles.errorText}>Project not found</Text>
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
                {Array(fullStars)
                    .fill(0)
                    .map((_, i) => (
                        <Ionicons key={`full-${i}`} name="star" size={16} color="#FFA500" />
                    ))}
                {hasHalfStar && (
                    <Ionicons key="half" name="star-half" size={16} color="#FFA500" />
                )}
                {Array(emptyStars)
                    .fill(0)
                    .map((_, i) => (
                        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFA500" />
                    ))}
                <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
            </View>
        );
    };

    // Helper for info boxes
    const renderInfoBox = (
        icon: keyof typeof Ionicons.glyphMap,
        color: string,
        label: string,
        value: string | undefined
    ) => {
        if (!value) return null;
        return (
            <View style={styles.infoBox}>
                <Ionicons name={icon} size={24} color={color} />
                <Text style={styles.infoBoxLabel}>{label}</Text>
                <Text style={styles.infoBoxValue} numberOfLines={1}>
                    {value}
                </Text>
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
                <Text style={styles.headerTitle} numberOfLines={1}>
                    Project Details
                </Text>
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
                <View style={styles.contentContainer}>
                    {/* Title and Featured Badge */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{project.title}</Text>
                        {project.featured && (
                            <View style={styles.featuredBadge}>
                                <Ionicons name="flash" size={14} color={primaryColor} />
                                <Text style={styles.featuredText}>Featured</Text>
                            </View>
                        )}
                    </View>

                    {/* Price and Type */}
                    <View style={styles.priceAndType}>
                        <Text style={styles.priceText}>
                            {project.price || project.budget || "Budget N/A"}
                        </Text>
                        <View style={styles.projectTypeTag}>
                            <Text style={styles.projectTypeText}>
                                {project.project_type === "hourly" ? "Hourly Rate" : "Fixed Price"}
                            </Text>
                        </View>
                    </View>

                    {/* Quick Info Boxes */}
                    <View style={styles.infoBoxesContainer}>
                        {renderInfoBox(
                            "location-outline",
                            "#7A50EC",
                            "Location",
                            project.location
                        )}
                        {renderInfoBox(
                            "calendar-outline",
                            "#4CAF50",
                            "Posted",
                            project.posted_date || project.publish_date
                        )}
                        {renderInfoBox(
                            "briefcase-outline",
                            "#912018",
                            "Expertise",
                            project.expertise
                        )}
                        {renderInfoBox(
                            "time-outline",
                            secondaryColor,
                            "Deadline",
                            project.deadline
                        )}
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Project Description</Text>
                        <Text style={styles.descriptionText}>
                            {project.content ||
                                project.description ||
                                "No detailed description provided."}
                        </Text>
                    </View>

                    {/* Skills */}
                    {project.skills && project.skills.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Required Skills</Text>
                            <View style={styles.skillsContainer}>
                                {project.skills.map((skill, index) => (
                                    <View key={index} style={styles.skillTag}>
                                        <Text style={styles.skillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Attachments */}
                    {project.attachments && project.attachments.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Attachments</Text>
                            {project.attachments.map((attachment, index) => (
                                <View key={index} style={styles.attachmentItem}>
                                    <Ionicons name="document-text-outline" size={18} color="#666" />
                                    <Text style={styles.attachmentText} numberOfLines={1}>
                                        {attachment.filename}
                                    </Text>
                                    <TouchableOpacity style={styles.downloadButton}>
                                        <Ionicons name="download-outline" size={18} color={primaryColor} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Client Information */}
                    {project.author && (
                        <TouchableOpacity
                            style={styles.clientSection}
                            // Assuming you have a route for client/author profiles
                            onPress={() => project.author?.id && router.push(`/client/${project.author.id}`)}
                        >
                            <Text style={styles.sectionTitle}>About the Client</Text>
                            <View style={styles.clientContent}>
                                <Image
                                    source={{ uri: project.author.avatar || 'https://via.placeholder.com/150' }}
                                    style={styles.clientAvatar}
                                />
                                <View style={styles.clientInfo}>
                                    <Text style={styles.clientName}>
                                        {project.author.name || "Anonymous Client"}
                                    </Text>
                                    {project.author.label && (
                                        <Text style={styles.clientLabel}>{project.author.label}</Text>
                                    )}
                                    <View style={styles.clientMeta}>
                                        {project.author.rating !== undefined &&
                                            renderRating(project.author.rating)}
                                        {project.author.reviews !== undefined && (
                                            <Text style={styles.clientReviewCount}>
                                                ({project.author.reviews} Reviews)
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
                    disabled={!project.author?.id}
                >
                    <Ionicons name="chatbubble-outline" size={24} color={primaryColor} />
                    <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                    <Text style={styles.applyButtonText}>Submit Proposal</Text>
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
                            {project && (
                                <View style={styles.jobPreview}>
                                    <Text style={styles.jobPreviewTitle} numberOfLines={2}>
                                        {project.title}
                                    </Text>
                                    <Text style={styles.jobPreviewPrice}>
                                        {project.price || project.budget || 'Negotiable'}
                                    </Text>
                                </View>
                            )}

                            <Text style={styles.inputLabel}>Cover Letter / Proposal *</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Explain your approach and why you're the best fit..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={6}
                                value={applicationData.coverLetter}
                                onChangeText={(text) =>
                                    setApplicationData({ ...applicationData, coverLetter: text })
                                }
                                textAlignVertical="top"
                            />

                            <Text style={styles.inputLabel}>Proposed Price (Required)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your bid/total project cost"
                                placeholderTextColor="#999"
                                keyboardType="default"
                                value={applicationData.proposedPrice}
                                onChangeText={(text) =>
                                    setApplicationData({ ...applicationData, proposedPrice: text })
                                }
                            />

                            <Text style={styles.inputLabel}>Estimated Completion Time</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 7 days or 10 hours"
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
                            <Text style={styles.modalTitle}>
                                Message {project.author?.name || "Client"}
                            </Text>
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
                            placeholder="Type your question or clarification here..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={5}
                            value={messageText}
                            onChangeText={setMessageText}
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            style={[styles.submitButton, sendingMessage && { opacity: 0.7 }]}
                            onPress={sendMessageToClient}
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

export default ProjectDetail;

// Styles for ProjectDetail (reusing/adapting TaskDetail styles)
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
    contentContainer: {
        padding: 20,
        backgroundColor: whiteColor,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: fontColor,
        flex: 1,
        marginRight: 10,
        lineHeight: 30,
    },
    featuredBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFE5DD",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        gap: 4,
    },
    featuredText: {
        fontSize: 12,
        color: primaryColor,
        fontWeight: "600",
    },
    priceAndType: {
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
    projectTypeTag: {
        backgroundColor: secondaryColor,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    projectTypeText: {
        fontSize: 13,
        fontWeight: "600",
        color: whiteColor,
    },
    infoBoxesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10,
    },
    infoBox: {
        width: '48%',
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
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: backgroundColor,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    attachmentText: {
        flex: 1,
        fontSize: 14,
        color: fontColor,
        marginLeft: 8,
    },
    downloadButton: {
        padding: 4,
    },
    // Client Info
    clientSection: {
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    clientContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: backgroundColor,
        borderRadius: 12,
        padding: 12,
    },
    clientAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 16,
        fontWeight: "700",
        color: fontColor,
    },
    clientLabel: {
        fontSize: 12,
        color: secondaryColor,
        fontWeight: "600",
        marginTop: 2,
    },
    clientMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        flexWrap: 'wrap',
    },
    clientReviewCount: {
        fontSize: 12,
        color: "#999",
        marginLeft: 4,
        marginRight: 10,
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
    // Modal Styles (Reused)
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
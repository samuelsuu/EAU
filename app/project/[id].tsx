// app/project/[id].tsx - Complete Fixed Project Detail Page
import {
    projectsDetails,
    sendMessage,
    addSavedItem,
    removeSavedItem,
    proposalSubmission,
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
    freelancer?: string;
    language?: string;
    attachments?: { file_id: string; file_url: string; filename: string }[];
    author?: {
        id?: string;
        name?: string;
        avatar?: string;
        label?: string;
        rating?: number;
        reviews?: number;
        online?: boolean;
    };
}

// Helper function to strip HTML tags
const stripHtml = (html: string) => {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .replace(/&#039;/g, "'") // Replace &#039; with '
        .replace(/&#8217;/g, "'") // Replace &#8217; with '
        .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
        .trim();
};

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
            const response = await projectsDetails(id as string);
            
            console.log('📦 Project details response:', response.data);
            
            // The API returns data in project_detail
            const projectData = response.data?.project_detail || response.data?.data?.project || response.data?.project || response.data;
            
            // Helper to extract skill names from skill objects or strings
            const extractSkills = (skills: any): string[] => {
                if (!skills || !Array.isArray(skills)) return [];
                return skills.map(skill => {
                    if (typeof skill === 'string') return skill;
                    if (typeof skill === 'object') return skill.name || skill.slug || skill.id?.toString() || '';
                    return '';
                }).filter(Boolean);
            };
            
            // Map the data to match your interface
            const mappedProject: ProjectDetail = {
                id: projectData.id?.toString() || id as string,
                title: projectData.title || '',
                description: projectData.description,
                content: projectData.content ? stripHtml(projectData.content) : undefined,
                budget: projectData.budget,
                price: projectData.price,
                deadline: projectData.deadline,
                skills: extractSkills(projectData.skills),
                posted_date: projectData.posted_date,
                publish_date: projectData.publish_date,
                location: projectData.location,
                expertise: projectData.expertise,
                project_type: projectData.project_type,
                featured: projectData.featured || false,
                saved: projectData.saved || false,
                duration: projectData.duration,
                freelancer: projectData.freelancer,
                language: projectData.language,
                attachments: projectData.attachments || [],
                author: projectData.author ? {
                    id: projectData.author.id?.toString(),
                    name: projectData.author.name,
                    avatar: projectData.author.avatar,
                    label: projectData.author.label,
                    rating: projectData.author.rating,
                    reviews: projectData.author.reviews,
                    online: projectData.author.online,
                } : undefined,
            };
            
            console.log('✅ Mapped project data:', mappedProject);
            
            setProject(mappedProject);
            setSaved(mappedProject.saved);
        } catch (error: any) {
            console.error("❌ Error fetching project details:", error);
            Alert.alert(
                "Error",
                error?.response?.data?.message || "Failed to load project details"
            );
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
                const response = await removeSavedItem({ 
                    post_id: project.id, 
                    post_type: "project" 
                });
                
                if (response.data?.type === "success" || response.status === 200) {
                    setSaved(false);
                    setProject({ ...project, saved: false });
                    Alert.alert("Success", "Project removed from saved items");
                }
            } else {
                const response = await addSavedItem({ 
                    post_id: project.id, 
                    post_type: "project" 
                });
                
                if (response.data?.type === "success" || response.status === 200) {
                    setSaved(true);
                    setProject({ ...project, saved: true });
                    Alert.alert("Success", "Project saved successfully");
                }
            }
        } catch (error: any) {
            console.error("❌ Save/Unsave error:", error);
            Alert.alert(
                "Error",
                error?.response?.data?.message || 
                error?.response?.data?.message_desc ||
                "Failed to save project"
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

        if (!applicationData.proposedPrice.trim()) {
            Alert.alert("Error", "Please enter your proposed price");
            return;
        }

        setApplying(true);
        try {
            console.log('📤 Submitting proposal for project:', id);
            
            const proposalData = {
                post_id: id as string,
                post_type: "project",
                proposal_content: applicationData.coverLetter,
                proposed_amount: applicationData.proposedPrice,
                delivery_time: applicationData.deliveryTime || "",
            };
            
            console.log('📝 Proposal data:', proposalData);
            
            const response = await proposalSubmission(proposalData);
            
            console.log('✅ Proposal response:', response.data);
            
            if (response.data?.type === "success" || response.status === 200) {
                Alert.alert(
                    "Success", 
                    response.data?.message || "Your proposal has been submitted successfully!",
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
                                fetchProjectDetails();
                            },
                        },
                    ]
                );
            } else {
                throw new Error(response.data?.message || "Failed to submit proposal");
            }
        } catch (error: any) {
            console.error("❌ Application error:", error);
            const errorMessage =
                error?.response?.data?.message_desc ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to submit proposal. Please try again.";
            Alert.alert("Error", errorMessage);
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
            console.log('💬 Sending message to client:', project.author.id);
            
            const response = await sendMessage({
                receiver_id: project.author.id,
                message: messageText.trim(),
            });

            console.log('✅ Message sent:', response.data);

            if (response.data?.type === "success" || response.status === 200) {
                Alert.alert(
                    "Success", 
                    response.data?.message || "Message sent successfully!",
                    [
                        {
                            text: "View Messages",
                            onPress: () => {
                                setMessageModalVisible(false);
                                setMessageText("");
                                router.push("/message/messages");
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
                throw new Error(response.data?.message || "Unknown error");
            }
        } catch (error: any) {
            console.error("❌ Send message error:", error);
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
                    {/* Header with date and featured badge */}
                    <View style={styles.projectCardHeader}>
                        <View style={styles.projectHeaderLeft}>
                            <Ionicons name="calendar-outline" size={14} color="#999" style={{ marginRight: 6 }} />
                            <Text style={styles.projectPostedDate}>
                                {project.publish_date || project.posted_date || "Recently posted"}
                            </Text>
                            {project.featured && (
                                <View style={styles.featuredBadge}>
                                    <Ionicons name="flash" size={12} color={primaryColor} />
                                    <Text style={styles.featuredText}>Featured</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{project.title}</Text>

                    {/* Description */}
                    {(project.content || project.description) && (
                        <View style={styles.section}>
                            <Text style={styles.descriptionText}>
                                {project.content || project.description}
                            </Text>
                        </View>
                    )}

                    {/* Meta Information Row */}
                    <View style={styles.projectMetaRow}>
                        {project.location && (
                            <View style={styles.projectMetaItem}>
                                <Ionicons name="location-outline" size={16} color="#7A50EC" />
                                <Text style={styles.projectMetaText}>{project.location}</Text>
                            </View>
                        )}
                        {project.expertise && (
                            <View style={styles.projectMetaItem}>
                                <Ionicons name="briefcase-outline" size={16} color="#912018" />
                                <Text style={[styles.projectMetaText, { color: "#912018" }]}>
                                    {project.expertise}
                                </Text>
                            </View>
                        )}
                        {project.freelancer && (
                            <View style={styles.projectMetaItem}>
                                <Ionicons name="people-outline" size={16} color="#4CAF50" />
                                <Text style={[styles.projectMetaText, { color: "#4CAF50" }]}>
                                    {project.freelancer}
                                </Text>
                            </View>
                        )}
                        {project.duration && (
                            <View style={styles.projectMetaItem}>
                                <Ionicons name="time-outline" size={16} color={secondaryColor} />
                                <Text style={[styles.projectMetaText, { color: secondaryColor }]}>
                                    {project.duration}
                                </Text>
                            </View>
                        )}
                        {project.language && (
                            <View style={styles.projectMetaItem}>
                                <Ionicons name="language-outline" size={16} color="#2E90FA" />
                                <Text style={[styles.projectMetaText, { color: "#2E90FA" }]}>
                                    {project.language}
                                </Text>
                            </View>
                        )}
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

                    {/* Footer with author and price */}
                    <View style={styles.projectFooter}>
                        <View style={styles.authorSection}>
                            {project.author?.avatar ? (
                                <Image 
                                    source={{ uri: project.author.avatar }} 
                                    style={styles.authorAvatar}
                                />
                            ) : (
                                <View style={[styles.authorAvatar, styles.avatarPlaceholder]}>
                                    <Ionicons name="person" size={18} color="#999" />
                                </View>
                            )}
                            <View style={styles.authorInfo}>
                                {project.author?.label && (
                                    <Text style={styles.authorLabel} numberOfLines={1}>
                                        {project.author.label}
                                    </Text>
                                )}
                                <Text style={styles.authorName} numberOfLines={1}>
                                    {project.author?.name || "Anonymous"}
                                </Text>
                                {project.author?.rating !== undefined && (
                                    <View style={styles.clientMeta}>
                                        {renderRating(project.author.rating)}
                                        {project.author.reviews !== undefined && (
                                            <Text style={styles.clientReviewCount}>
                                                ({project.author.reviews} Reviews)
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.priceSection}>
                            <Text style={styles.projectType}>
                                {project.project_type === "fixed" ? "Fixed Price" : "Hourly Rate"}
                            </Text>
                            <Text style={styles.projectPrice}>
                                {project.price || project.budget || "Negotiable"}
                            </Text>
                        </View>
                    </View>

                    {/* View Client Profile Button */}
                    {project.author?.id && (
                        <TouchableOpacity
                            style={styles.viewProfileButton}
                            onPress={() => router.push(`/freelancer/${project.author?.id}`)}
                        >
                            <Ionicons name="person-outline" size={20} color={primaryColor} />
                            <Text style={styles.viewProfileText}>View Client Profile</Text>
                            <Ionicons name="chevron-forward" size={20} color={primaryColor} />
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
                    <Ionicons name="chatbubble-outline" size={20} color={primaryColor} />
                    <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                    <Text style={styles.applyButtonText}>Submit Proposal</Text>
                    <Ionicons name="arrow-forward" size={18} color={whiteColor} />
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
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.jobPreviewTitle} numberOfLines={2}>
                                            {project.title}
                                        </Text>
                                        <Text style={styles.jobPreviewType}>
                                            {project.project_type === "fixed" ? "Fixed Price" : "Hourly Rate"}
                                        </Text>
                                    </View>
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

                            <Text style={styles.inputLabel}>Proposed Price *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your bid/total project cost"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
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
                                    disabled={
                                        applying || 
                                        !applicationData.coverLetter.trim() ||
                                        !applicationData.proposedPrice.trim()
                                    }
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
        paddingHorizontal: 16,
        paddingVertical: 12,
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
        width: 40,
    },
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
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        backgroundColor: whiteColor,
    },
    // Card Header Styles - Matching Home
    projectCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    projectHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    projectPostedDate: {
        fontSize: 13,
        color: "#999",
        fontWeight: "500",
    },
    featuredBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFE5DD",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 12,
        gap: 4,
    },
    featuredText: {
        fontSize: 11,
        color: primaryColor,
        fontWeight: "600",
    },
    // Title - Matching Home
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: fontColor,
        marginBottom: 12,
        lineHeight: 28,
    },
    // Description - Matching Home
    descriptionText: {
        fontSize: 15,
        color: "#585858",
        lineHeight: 22,
        marginBottom: 16,
    },
    // Meta Row - Matching Home
    projectMetaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 20,
        gap: 14,
    },
    projectMetaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    projectMetaText: {
        fontSize: 13,
        color: "#7A50EC",
        fontWeight: "500",
    },
    // Skills Section
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: fontColor,
        marginBottom: 12,
    },
    skillsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    skillTag: {
        backgroundColor: backgroundColor,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    skillText: {
        fontSize: 13,
        color: "#666",
        fontWeight: "500",
    },
    // Attachments
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: backgroundColor,
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
    },
    attachmentText: {
        flex: 1,
        fontSize: 14,
        color: fontColor,
        marginLeft: 10,
    },
    downloadButton: {
        padding: 6,
    },
    // Footer - Matching Home
    projectFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 16,
        paddingBottom: 16,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    authorSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    authorAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
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
        fontSize: 11,
        color: "#999",
        fontWeight: "500",
        marginBottom: 2,
    },
    authorName: {
        fontSize: 15,
        fontWeight: "600",
        color: fontColor,
        marginBottom: 4,
    },
    clientMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    ratingStarsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    ratingNumber: {
        fontSize: 13,
        color: "#666",
        fontWeight: "600",
        marginLeft: 4,
    },
    clientReviewCount: {
        fontSize: 12,
        color: "#999",
    },
    priceSection: {
        alignItems: "flex-end",
    },
    projectType: {
        fontSize: 12,
        color: "#999",
        fontWeight: "500",
        marginBottom: 4,
    },
    projectPrice: {
        fontSize: 20,
        fontWeight: "700",
        color: primaryColor,
    },
    // View Profile Button
    viewProfileButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: backgroundColor,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginTop: 16,
        gap: 8,
    },
    viewProfileText: {
        fontSize: 15,
        fontWeight: "600",
        color: primaryColor,
        flex: 1,
        textAlign: "center",
    },
    // Footer Buttons
    footer: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: whiteColor,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
        gap: 12,
    },
    messageButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: whiteColor,
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: primaryColor,
        gap: 8,
    },
    messageButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: primaryColor,
    },
    applyButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primaryColor,
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    applyButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: whiteColor,
    },
    // Modal Styles
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
        maxHeight: "85%",
    },
    messageModalContent: {
        backgroundColor: whiteColor,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: "70%",
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
    // Job Preview in Modal
    jobPreview: {
        flexDirection: "row",
        backgroundColor: backgroundColor,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        gap: 12,
    },
    jobPreviewTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: fontColor,
        marginBottom: 6,
    },
    jobPreviewType: {
        fontSize: 13,
        color: "#666",
    },
    jobPreviewPrice: {
        fontSize: 18,
        fontWeight: "700",
        color: primaryColor,
    },
    // Form Inputs
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: fontColor,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: fontColor,
        backgroundColor: backgroundColor,
        marginBottom: 16,
    },
    textArea: {
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: fontColor,
        minHeight: 120,
        backgroundColor: backgroundColor,
        marginBottom: 16,
        textAlignVertical: "top",
    },
    // Modal Buttons
    modalButtons: {
        flexDirection: "row",
        marginTop: 10,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
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
        backgroundColor: primaryColor,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    submitButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: whiteColor,
    },
});
// app/job/[id].tsx - Job Proposals View Screen
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  secondaryColor,
  backgroundColor,
  whiteColor,
  fontColor,
} from "@/constants/GlobalConstants";
import { supabase } from "@/lib/supabase";
import { getJobById } from "@/services/jobs";
import { getProfileById } from "@/services/login";

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
  user_id: string;
  proposal_count?: number;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
    email: string;
  };
  job_images?: Array<{
    id: string;
    image_url: string;
    created_at: string;
  }>;
}

interface Proposal {
  id: string;
  job_id: string;
  artisan_id: string;
  price: number | null;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  artisan?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
    email: string;
    bio: string | null;
    skills: string[];
    rating?: number;
    average_rating?: number;
    completed_projects?: number;
  };
}

const JobProposalsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const jobId = params.id as string;
  const user = useSelector((state: any) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [proposalDetailsModalVisible, setProposalDetailsModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch job details and proposals
  const fetchJobAndProposals = async () => {
    try {
      setLoading(true);

      // Fetch job details
      const jobRes = await getJobById(jobId);
      if (jobRes.success && jobRes.data) {
        setJob(jobRes.data);
      } else {
        Alert.alert("Error", jobRes.error || "Failed to load job details");
        router.back();
        return;
      }

      // Fetch proposals for this job
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("proposal")
        .select(`
          *,
          artisan:profiles!proposal_artisan_id_fkey(
            id,
            first_name,
            last_name,
            avatar,
            email,
            bio,
            skills,
            rating,
            average_rating,
            completed_projects
          )
        `)
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (proposalsError) {
        console.error("Error fetching proposals:", proposalsError);
        setProposals([]);
      } else {
        setProposals(proposalsData || []);
      }
    } catch (error: any) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJobAndProposals();
    }
  }, [jobId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobAndProposals();
  };

  // View artisan profile
  const handleViewProfile = async (userId: string) => {
    setLoadingProfile(true);
    setProfileModalVisible(true);
    try {
      const res = await getProfileById(userId);
      if (res.success && res.data) {
        setViewedProfile(res.data);
      } else {
        Alert.alert("Error", res.error || "Failed to load profile");
        setProfileModalVisible(false);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile");
      setProfileModalVisible(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Update proposal status
  const handleUpdateProposalStatus = async (proposalId: string, status: "accepted" | "rejected") => {
    if (!selectedProposal) return;

    setUpdatingStatus(true);
    try {
      // Update proposal status
      const { error: updateError } = await supabase
        .from("proposal")
        .update({ status })
        .eq("id", proposalId);

      if (updateError) throw updateError;

      // If accepted, create notification for the artisan
      if (status === "accepted" && selectedProposal.artisan) {
        const artisanId = selectedProposal.artisan.id;
        const jobTitle = job?.title || "a job";
        
        // Create notification
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: artisanId,
            type: "proposal_accepted",
            title: "Proposal Accepted! 🎉",
            body: `Your proposal for "${jobTitle}" has been accepted! You can now message the client.`,
            related_id: job?.id || null,
            is_read: false,
          });

        if (notifError) {
          console.error("Error creating notification:", notifError);
        }

        // Create initial message conversation
        if (job?.user_id) {
          const { error: messageError } = await supabase
            .from("messages")
            .insert({
              sender_id: job.user_id,
              receiver_id: artisanId,
              content: `Hi! I've accepted your proposal for "${jobTitle}". Let's discuss the details!`,
              is_read: false,
            });

          if (messageError) {
            console.error("Error creating initial message:", messageError);
          }
        }
      }

      // If rejected, create notification for the artisan
      if (status === "rejected" && selectedProposal.artisan) {
        const artisanId = selectedProposal.artisan.id;
        const jobTitle = job?.title || "a job";
        
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: artisanId,
            type: "proposal_rejected",
            title: "Proposal Update",
            body: `Your proposal for "${jobTitle}" was not accepted this time.`,
            related_id: job?.id || null,
            is_read: false,
          });

        if (notifError) {
          console.error("Error creating notification:", notifError);
        }
      }

      Alert.alert(
        "Success",
        status === "accepted" 
          ? "Proposal accepted successfully! A notification has been sent to the artisan."
          : "Proposal rejected successfully."
      );
      
      // Refresh data
      fetchJobAndProposals();
      setProposalDetailsModalVisible(false);
    } catch (error: any) {
      console.error("Error updating proposal:", error);
      Alert.alert("Error", "Failed to update proposal status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "#28a745";
      case "rejected":
        return "#DC3545";
      case "pending":
      default:
        return "#FFA500";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "#D1FAE5";
      case "rejected":
        return "#FEE2E2";
      case "pending":
      default:
        return "#FFF3CD";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Loading proposals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#DC3545" />
          <Text style={styles.errorText}>Job not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check if current user is the job owner
  const isJobOwner = user?.id === job.user_id;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={fontColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Proposals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Job Info Card */}
        <View style={styles.jobCard}>
          <View style={styles.jobCardHeader}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobBudget}>{formatBudget(job)}</Text>
          </View>
          <Text style={styles.jobDescription} numberOfLines={3}>
            {job.description}
          </Text>
          <View style={styles.jobMeta}>
            <View style={styles.jobMetaItem}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.jobMetaText}>Posted {formatDate(job.created_at)}</Text>
            </View>
            <View style={styles.jobMetaItem}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.jobMetaText}>{proposals.length} proposals</Text>
            </View>
          </View>
        </View>

        {/* Proposals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Proposals ({proposals.length})
          </Text>

          {proposals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No proposals yet</Text>
              <Text style={styles.emptySubtext}>
                Proposals from freelancers will appear here
              </Text>
            </View>
          ) : (
            proposals.map((proposal) => (
              <TouchableOpacity
                key={proposal.id}
                style={styles.proposalCard}
                onPress={() => {
                  setSelectedProposal(proposal);
                  setProposalDetailsModalVisible(true);
                }}
              >
                <View style={styles.proposalHeader}>
                  <View style={styles.proposalArtistInfo}>
                    {proposal.artisan?.avatar ? (
                      <Image
                        source={{ uri: proposal.artisan.avatar }}
                        style={styles.proposalAvatar}
                      />
                    ) : (
                      <View style={[styles.proposalAvatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={24} color="#999" />
                      </View>
                    )}
                    <View style={styles.proposalArtistDetails}>
                      <Text style={styles.proposalArtistName}>
                        {proposal.artisan
                          ? `${proposal.artisan.first_name} ${proposal.artisan.last_name}`
                          : "Unknown"}
                      </Text>
                      {proposal.artisan?.average_rating !== undefined && (
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.ratingText}>
                            {proposal.artisan.average_rating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBgColor(proposal.status) },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: getStatusColor(proposal.status) }]}
                    >
                      {proposal.status}
                    </Text>
                  </View>
                </View>

                {proposal.price && (
                  <View style={styles.proposalPriceContainer}>
                    <Ionicons name="cash-outline" size={16} color={primaryColor} />
                    <Text style={styles.proposalPrice}>${proposal.price}</Text>
                  </View>
                )}

                <Text style={styles.proposalMessage} numberOfLines={2}>
                  {proposal.message || "No cover letter provided"}
                </Text>

                <View style={styles.proposalFooter}>
                  <Text style={styles.proposalDate}>{formatDate(proposal.created_at)}</Text>
                  <TouchableOpacity style={styles.viewDetailsButton}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={14} color={primaryColor} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Proposal Details Modal */}
      <Modal
        visible={proposalDetailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProposalDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Proposal Details</Text>
              <TouchableOpacity
                onPress={() => setProposalDetailsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedProposal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Artisan Info */}
                <View style={styles.detailsArtisanSection}>
                  <TouchableOpacity
                    style={styles.detailsArtisanHeader}
                    onPress={() => {
                      if (selectedProposal.artisan?.id) {
                        handleViewProfile(selectedProposal.artisan.id);
                      }
                    }}
                  >
                    {selectedProposal.artisan?.avatar ? (
                      <Image
                        source={{ uri: selectedProposal.artisan.avatar }}
                        style={styles.detailsAvatar}
                      />
                    ) : (
                      <View style={[styles.detailsAvatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={32} color="#999" />
                      </View>
                    )}
                    <View style={styles.detailsArtisanInfo}>
                      <Text style={styles.detailsArtisanName}>
                        {selectedProposal.artisan
                          ? `${selectedProposal.artisan.first_name} ${selectedProposal.artisan.last_name}`
                          : "Unknown"}
                      </Text>
                      {selectedProposal.artisan?.email && (
                        <Text style={styles.detailsArtisanEmail}>
                          {selectedProposal.artisan.email}
                        </Text>
                      )}
                      <View style={styles.detailsArtisanStats}>
                        {selectedProposal.artisan?.average_rating !== undefined && (
                          <View style={styles.statItem}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.statText}>
                              {selectedProposal.artisan.average_rating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                        {selectedProposal.artisan?.completed_projects !== undefined && (
                          <View style={styles.statItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                            <Text style={styles.statText}>
                              {selectedProposal.artisan.completed_projects} projects
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {selectedProposal.artisan?.bio && (
                    <Text style={styles.detailsBio}>{selectedProposal.artisan.bio}</Text>
                  )}

                  {selectedProposal.artisan?.skills &&
                    selectedProposal.artisan.skills.length > 0 && (
                      <View style={styles.detailsSkillsSection}>
                        <Text style={styles.detailsSkillsTitle}>Skills</Text>
                        <View style={styles.detailsSkillsContainer}>
                          {selectedProposal.artisan.skills.map((skill, index) => (
                            <View key={index} style={styles.skillTag}>
                              <Text style={styles.skillText}>{skill}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                </View>

                {/* Proposal Info */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Proposal</Text>
                  
                  {selectedProposal.price && (
                    <View style={styles.detailsRow}>
                      <Ionicons name="cash-outline" size={20} color={primaryColor} />
                      <Text style={styles.detailsLabel}>Proposed Amount:</Text>
                      <Text style={styles.detailsValue}>${selectedProposal.price}</Text>
                    </View>
                  )}

                  <View style={styles.detailsRow}>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <Text style={styles.detailsLabel}>Submitted:</Text>
                    <Text style={styles.detailsValue}>
                      {formatDate(selectedProposal.created_at)}
                    </Text>
                  </View>

                  <View style={styles.detailsRow}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.detailsLabel}>Status:</Text>
                    <View
                      style={[
                        styles.detailsStatusBadge,
                        { backgroundColor: getStatusBgColor(selectedProposal.status) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailsStatusText,
                          { color: getStatusColor(selectedProposal.status) },
                        ]}
                      >
                        {selectedProposal.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Cover Letter */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Cover Letter</Text>
                  <Text style={styles.coverLetterText}>
                    {selectedProposal.message || "No cover letter provided"}
                  </Text>
                </View>

                {/* Action Buttons - Only for job owner and pending proposals */}
                {isJobOwner && selectedProposal.status === "pending" && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => {
                        Alert.alert(
                          "Reject Proposal",
                          "Are you sure you want to reject this proposal?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Reject",
                              style: "destructive",
                              onPress: () =>
                                handleUpdateProposalStatus(selectedProposal.id, "rejected"),
                            },
                          ]
                        );
                      }}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <ActivityIndicator color="#DC3545" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={20} color="#DC3545" />
                          <Text style={styles.rejectButtonText}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => {
                        Alert.alert(
                          "Accept Proposal",
                          "Are you sure you want to accept this proposal?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Accept",
                              onPress: () =>
                                handleUpdateProposalStatus(selectedProposal.id, "accepted"),
                            },
                          ]
                        );
                      }}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <ActivityIndicator color={whiteColor} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color={whiteColor} />
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
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
              style={styles.headerBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={fontColor} />
            </TouchableOpacity>
            <Text style={styles.profileHeaderTitle}>Profile</Text>
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
                  <Image source={{ uri: viewedProfile.avatar }} style={styles.profileViewAvatar} />
                ) : (
                  <View style={[styles.profileViewAvatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={48} color="#999" />
                  </View>
                )}
                <Text style={styles.profileViewName}>
                  {`${viewedProfile.first_name || ""} ${viewedProfile.last_name || ""}`.trim() ||
                    viewedProfile.username ||
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
};

export default JobProposalsScreen;

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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#DC3545",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: primaryColor,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: whiteColor,
    fontSize: 15,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: whiteColor,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
  },
  scrollView: {
    flex: 1,
  },
  jobCard: {
    backgroundColor: whiteColor,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: fontColor,
    flex: 1,
    marginRight: 12,
  },
  jobBudget: {
    fontSize: 18,
    fontWeight: "700",
    color: primaryColor,
  },
  jobDescription: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 12,
  },
  jobMeta: {
    flexDirection: "row",
    gap: 16,
  },
  jobMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  jobMetaText: {
    fontSize: 13,
    color: "#666",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
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
  proposalCard: {
    backgroundColor: whiteColor,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  proposalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  proposalArtistInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  proposalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  proposalArtistDetails: {
    flex: 1,
  },
  proposalArtistName: {
    fontSize: 16,
    fontWeight: "600",
    color: fontColor,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  proposalPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  proposalPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: primaryColor,
  },
  proposalMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  proposalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  proposalDate: {
    fontSize: 12,
    color: "#999",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: "600",
    color: primaryColor,
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
    maxHeight: "95%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: fontColor,
  },
  closeButton: {
    padding: 4,
  },
  detailsArtisanSection: {
    backgroundColor: backgroundColor,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailsArtisanHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailsAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  detailsArtisanInfo: {
    flex: 1,
  },
  detailsArtisanName: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 4,
  },
  detailsArtisanEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  detailsArtisanStats: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  detailsBio: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsSkillsSection: {
    marginTop: 8,
  },
  detailsSkillsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: fontColor,
    marginBottom: 8,
  },
  detailsSkillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillTag: {
    backgroundColor: whiteColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  skillText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
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
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  detailsLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  detailsValue: {
    fontSize: 14,
    fontWeight: "600",
    color: fontColor,
  },
  detailsStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailsStatusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  coverLetterText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFDDDD",
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC3545",
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: primaryColor,
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: whiteColor,
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
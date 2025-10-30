// app/(tabs)/home.tsx - Complete Enhanced Version
import { popularTasks, recentProjectsListing, topRatedFreelancers } from "@/api/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

const { width } = Dimensions.get("window");

interface Task {
  id: string;
  title: string;
  category?: string;
  description?: string;
  price?: string;
  rating?: number;
  image?: string;
}

interface Project {
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
  project_type?: string;
  featured?: boolean;
  saved?: boolean;
  freelancer?: string;
  author?: {
    avatar?: string;
    name?: string;
    label?: string;
    rating?: number;
  };
}

interface Freelancer {
  id: string;
  name: string;
  title?: string;
  rating?: number;
  reviews?: number;
  hourly_rate?: string;
  avatar?: string;
  skills?: string[];
}

const Home = () => {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);

  // compute display name from available fields
  const displayName = React.useMemo(() => {
    if (!user) return "Guest";
    if (typeof user === "string") return user;
    const name = user.name || user.user_name || user.username || user.userName || user.user_name;
    if (name) return name;
    const first = user.first_name || user.firstName || user.first;
    const last = user.last_name || user.lastName || user.last;
    const full = `${first || ""} ${last || ""}`.trim();
    if (full) return full;
    return user.email || "User";
  }, [user]);

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "projects">("projects");

  // Apply Modal State
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Task | Project | null>(null);
  const [applicationData, setApplicationData] = useState({
    coverLetter: "",
    proposedPrice: "",
  });
  const [applying, setApplying] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes, freelancersRes] = await Promise.all([
        popularTasks({ order: "desc", per_page: 10, paged: 1 }),
        recentProjectsListing({ order: "desc", per_page: 10, paged: 1 }),
        topRatedFreelancers({ order: "desc", per_page: 10, paged: 1 }),
      ]);

      setTasks(tasksRes.data?.data?.tasks || tasksRes.data?.tasks || []);
      setProjects(projectsRes.data?.data?.projects || projectsRes.data?.projects || []);
      setFreelancers(
        freelancersRes.data?.data?.freelancers || freelancersRes.data?.freelancers || []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Handle apply
  const handleApply = (job: Task | Project) => {
    setSelectedJob(job);
    setApplyModalVisible(true);
  };

  const submitApplication = async () => {
    if (!applicationData.coverLetter.trim()) {
      alert("Please write a cover letter");
      return;
    }

    setApplying(true);
    try {
      // TODO: Implement your API call here
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert("Application submitted successfully!");
      setApplyModalVisible(false);
      setApplicationData({ coverLetter: "", proposedPrice: "" });
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  // Render task card
  const renderTaskCard = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={styles.taskCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/task/${item.id.toString()}`)}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.taskImage} />
      )}
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.category && (
          <Text style={styles.taskCategory}>{item.category}</Text>
        )}
        {item.description && (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.taskFooter}>
          {item.price && (
            <Text style={styles.taskPrice}>{item.price}</Text>
          )}
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFA500" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={(e) => {
            e.stopPropagation();
            handleApply(item);
          }}
        >
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render enhanced project card
  const renderProjectCard = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/project/${item.id.toString()}`)}
    >
      {/* Header with date and featured badge */}
      <View style={styles.projectCardHeader}>
        <View style={styles.projectHeaderLeft}>
          <Text style={styles.projectPostedDate}>
            {item.publish_date || item.posted_date}
          </Text>
          {item.featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="flash" size={12} color={primaryColor} />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons 
            name={item.saved ? "heart" : "heart-outline"} 
            size={20} 
            color={item.saved ? "#FF0000" : "#999"} 
          />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.projectTitle} numberOfLines={2}>
        {item.title}
      </Text>

      {/* Description */}
      {(item.description || item.content) && (
        <Text style={styles.projectDescription} numberOfLines={2}>
          {item.content || item.description}
        </Text>
      )}

      {/* Meta Information */}
      <View style={styles.projectMetaRow}>
        {item.location && (
          <View style={styles.projectMetaItem}>
            <Ionicons name="location-outline" size={14} color="#7A50EC" />
            <Text style={styles.projectMetaText}>{item.location}</Text>
          </View>
        )}
        {item.expertise && (
          <View style={styles.projectMetaItem}>
            <Ionicons name="briefcase-outline" size={14} color="#912018" />
            <Text style={[styles.projectMetaText, { color: "#912018" }]}>
              {item.expertise}
            </Text>
          </View>
        )}
        {item.freelancer && (
          <View style={styles.projectMetaItem}>
            <Ionicons name="people-outline" size={14} color="#4CAF50" />
            <Text style={[styles.projectMetaText, { color: "#4CAF50" }]}>
              {item.freelancer}
            </Text>
          </View>
        )}
      </View>

      {/* Skills */}
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

      {/* Footer with author and price */}
      <View style={styles.projectFooter}>
        <View style={styles.authorSection}>
          {item.author?.avatar ? (
            <Image 
              source={{ uri: item.author.avatar }} 
              style={styles.authorAvatar}
            />
          ) : (
            <View style={[styles.authorAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={16} color="#999" />
            </View>
          )}
          <View style={styles.authorInfo}>
            {item.author?.label && (
              <Text style={styles.authorLabel} numberOfLines={1}>
                {item.author.label}
              </Text>
            )}
            <Text style={styles.authorName} numberOfLines={1}>
              {item.author?.name || "Anonymous"}
            </Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.projectType}>
            {item.project_type === "fixed" ? "Fixed Price" : "Hourly Rate"}
          </Text>
          <Text style={styles.projectPrice}>
            {item.price || item.budget}
          </Text>
        </View>
      </View>

      {/* Apply Button */}
      <TouchableOpacity
        style={styles.applyButton}
        onPress={(e) => {
          e.stopPropagation();
          handleApply(item);
        }}
      >
        <Text style={styles.applyButtonText}>Submit Proposal</Text>
        <Ionicons name="arrow-forward" size={16} color={whiteColor} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Empty component
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="file-tray-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No items found</Text>
      <Text style={styles.emptySubtext}>Check back later for updates</Text>
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
          <Text style={styles.greeting}>Hello, {displayName} 👋</Text>
          <Text style={styles.subtitle}>Find your next opportunity</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for tasks or projects..."
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
            style={[styles.tabText, activeTab === "tasks" && styles.activeTabText]}
          >
            Tasks
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
            Projects
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === "tasks" ? tasks : projects}
        renderItem={activeTab === "tasks" ? renderTaskCard : renderProjectCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

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
                  setApplicationData({ ...applicationData, proposedPrice: text })
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
  taskCard: {
    backgroundColor: whiteColor,
    borderRadius: 12,
    marginBottom: 40,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  taskImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  taskContent: {
    padding: 16,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 4,
  },
  taskCategory: {
    fontSize: 13,
    color: primaryColor,
    fontWeight: "600",
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  taskPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: primaryColor,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginLeft: 4,
  },
  // Enhanced Project Card Styles
  projectCard: {
    backgroundColor: whiteColor,
    borderRadius: 12,
    padding: 16,
    marginBottom: 50,
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
  },
  projectPostedDate: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5DD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
    gap: 4,
  },
  featuredText: {
    fontSize: 10,
    color: primaryColor,
    fontWeight: "600",
  },
  saveButton: {
    padding: 4,
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
    color: "#7A50EC",
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
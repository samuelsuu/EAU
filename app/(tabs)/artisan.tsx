// app/(tabs)/artisan.tsx - Complete with Enhanced Profile Modal & Messaging
import { freelancersFilters, getFreelancersList, freelancersDetails, sendMessage } from "@/api/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  primaryColor,
  secondaryColor,
  backgroundColor,
  whiteColor,
  fontColor,
} from "@/constants/GlobalConstants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Freelancer {
  id: string;
  name: string;
  profession?: string;
  title?: string;
  rating?: number;
  reviews?: number;
  hourly_rate?: string;
  avatar?: string;
  skills?: (string | { name?: string; slug?: string })[];
  location?: string;
  completed_jobs?: number;
  description?: string;
  experience_level?: string;
  languages?: string;
  english_level?: string;
  freelancer_type?: string;
  address?: string;
  views?: number;
  tagline?: string;
  average_rating?: number;
  rating_count?: number;
}

interface FilterData {
  categories?: any[];
  skills?: any[];
  expertise_levels?: any[];
  languages?: any[];
  locations?: any[];
  hourly_rate?: { min: number; max: number };
}

const Artisan = () => {
  const router = useRouter();

  // State
  const [artisans, setArtisans] = useState<Freelancer[]>([]);
  const [filteredArtisans, setFilteredArtisans] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Message State
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Filter State
  const [filters, setFilters] = useState({
    category: "",
    skill: "",
    expertise_level: "",
    language: "",
    location: "",
    min_price: "",
    max_price: "",
    sort_by: "rating",
    order: "desc",
  });

  const [tempFilters, setTempFilters] = useState({ ...filters });

  // Fetch artisans
  const fetchArtisans = async () => {
    try {
      setLoading(true);
      const params = {
        keyword: searchQuery,
        ...filters,
        per_page: 50,
        paged: 1,
      };

      const res = await getFreelancersList(params);
      const freelancersData =
        res.data?.data?.freelancers ||
        res.data?.freelancers ||
        res.data?.data ||
        [];
      setArtisans(freelancersData);
      setFilteredArtisans(freelancersData);
    } catch (error) {
      console.error("Error fetching artisans:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const res = await freelancersFilters();
      setFilterData(res.data?.data?.filters || res.data?.filters || null);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  useEffect(() => {
    fetchArtisans();
    fetchFilterOptions();
  }, [filters, searchQuery]);

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchArtisans();
  }, [filters, searchQuery]);

  // Apply filters
  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setFilterModalVisible(false);
  };

  // Reset filters
  const resetFilters = () => {
    const defaultFilters = {
      category: "",
      skill: "",
      expertise_level: "",
      language: "",
      location: "",
      min_price: "",
      max_price: "",
      sort_by: "rating",
      order: "desc",
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setFilterModalVisible(false);
  };

  // Count active filters
  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(
      ([key, value]) =>
        value !== "" &&
        key !== "sort_by" &&
        key !== "order" &&
        key !== "per_page" &&
        key !== "paged"
    ).length;
  };

  // Fetch and open freelancer detail
  const openFreelancerDetail = async (freelancer: Freelancer) => {
    setLoadingDetails(true);
    setDetailModalVisible(true);
    
    try {
      const response = await freelancersDetails(freelancer.id);
      const detailData = response.data?.data?.freelancer_detail || response.data?.freelancer_detail;
      
      setSelectedFreelancer({
        ...freelancer,
        ...detailData,
      });
    } catch (error) {
      console.error("Error fetching freelancer details:", error);
      setSelectedFreelancer(freelancer);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle message
  const handleSendMessage = (freelancer: Freelancer) => {
    setMessageModalVisible(true);
  };

  // Send message
  const sendMessageToFreelancer = async () => {
    if (!messageText.trim() || !selectedFreelancer) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    setSendingMessage(true);
    try {
      const response = await sendMessage({
        activity_id: selectedFreelancer.id,
        receiver_id: selectedFreelancer.id,
        message: messageText.trim(),
      });

      if (response.data?.type === "success") {
        Alert.alert(
          "Success",
          "Message sent successfully!",
          [
            {
              text: "View Messages",
              onPress: () => {
                setMessageModalVisible(false);
                setDetailModalVisible(false);
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
      }
    } catch (error: any) {
      console.error("Send message error:", error);
      const errorMessage = error?.response?.data?.message_desc || 
                          error?.response?.data?.message || 
                          "Failed to send message";
      Alert.alert("Error", errorMessage);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle hire
  const handleHire = (freelancer: Freelancer) => {
    Alert.alert(
      "Hire Artisan",
      `Would you like to hire ${freelancer.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Hire",
          onPress: () => {
            setDetailModalVisible(false);
            Alert.alert("Success", `Hiring request sent to ${freelancer.name}`);
          },
        },
      ]
    );
  };

  // Render freelancer card
  const renderFreelancerCard = ({ item }: { item: Freelancer }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => openFreelancerDetail(item)}
    >
      <View style={styles.cardHeader}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={32} color="#999" />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {(item.profession || item.title) && (
            <Text style={styles.profession} numberOfLines={1}>
              {item.profession || item.title}
            </Text>
          )}
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.location} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardStats}>
        {item.rating !== undefined && (
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#FFA500" />
            <Text style={styles.statText}>
              {item.rating} ({item.reviews || 0})
            </Text>
          </View>
        )}
        {item.completed_jobs !== undefined && (
          <View style={styles.statItem}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color="#4CAF50"
            />
            <Text style={styles.statText}>{item.completed_jobs} jobs</Text>
          </View>
        )}
      </View>

      {item.hourly_rate && (
        <Text style={styles.hourlyRate}>{item.hourly_rate}/hr</Text>
      )}

      {item.skills && item.skills.length > 0 && (
        <View style={styles.skillsContainer}>
          {item.skills.slice(0, 3).map((skill, index) => {
            const skillName =
              typeof skill === "object" ? skill.name || skill.slug : skill;
            return (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skillName}</Text>
              </View>
            );
          })}
          {item.skills.length > 3 && (
            <View style={styles.skillTag}>
              <Text style={styles.skillText}>+{item.skills.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.viewProfileButton}>
        <Text style={styles.viewProfileText}>View Profile</Text>
        <Ionicons name="arrow-forward" size={16} color={primaryColor} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Empty component
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No artisans found</Text>
      <Text style={styles.emptySubtext}>
        Try adjusting your filters or search
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Loading artisans...</Text>
      </View>
    );
  }

  const activeFilterCount = getActiveFilterCount();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Top Artisans</Text>
          <Text style={styles.headerSubtitle}>
            {filteredArtisans.length} talented professionals
          </Text>
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search artisans..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={22} color={primaryColor} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.sortChip,
              filters.sort_by === "rating" && styles.sortChipActive,
            ]}
            onPress={() =>
              setFilters({ ...filters, sort_by: "rating", order: "desc" })
            }
          >
            <Text
              style={[
                styles.sortChipText,
                filters.sort_by === "rating" && styles.sortChipTextActive,
              ]}
            >
              Highest Rated
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortChip,
              filters.sort_by === "completed_jobs" && styles.sortChipActive,
            ]}
            onPress={() =>
              setFilters({
                ...filters,
                sort_by: "completed_jobs",
                order: "desc",
              })
            }
          >
            <Text
              style={[
                styles.sortChipText,
                filters.sort_by === "completed_jobs" &&
                  styles.sortChipTextActive,
              ]}
            >
              Most Jobs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortChip,
              filters.sort_by === "hourly_rate" &&
                filters.order === "asc" &&
                styles.sortChipActive,
            ]}
            onPress={() =>
              setFilters({ ...filters, sort_by: "hourly_rate", order: "asc" })
            }
          >
            <Text
              style={[
                styles.sortChipText,
                filters.sort_by === "hourly_rate" &&
                  filters.order === "asc" &&
                  styles.sortChipTextActive,
              ]}
            >
              Price: Low to High
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredArtisans}
        renderItem={renderFreelancerCard}
        keyExtractor={(item) => item.id.toString()}
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

      {/* Filter Modal - Keeping your original filter modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Your filter options here - keeping original */}
              {filterData?.expertise_levels &&
                filterData.expertise_levels.length > 0 && (
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Experience Level</Text>
                    <View style={styles.filterOptions}>
                      {filterData.expertise_levels.map((level: any) => (
                        <TouchableOpacity
                          key={level.id || level.value}
                          style={[
                            styles.filterOption,
                            tempFilters.expertise_level ===
                              (level.slug || level.value) &&
                              styles.filterOptionActive,
                          ]}
                          onPress={() =>
                            setTempFilters({
                              ...tempFilters,
                              expertise_level:
                                tempFilters.expertise_level ===
                                (level.slug || level.value)
                                  ? ""
                                  : level.slug || level.value,
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.filterOptionText,
                              tempFilters.expertise_level ===
                                (level.slug || level.value) &&
                                styles.filterOptionTextActive,
                            ]}
                          >
                            {level.name || level.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enhanced Detail Modal with Message Integration */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.detailSafeArea}>
          {/* Header */}
          <View style={styles.detailHeaderBar}>
            <TouchableOpacity
              onPress={() => setDetailModalVisible(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={fontColor} />
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>Artisan Profile</Text>
            <View style={{ width: 24 }} />
          </View>

          {loadingDetails ? (
            <View style={styles.detailLoadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
              <Text style={styles.loadingText}>Loading details...</Text>
            </View>
          ) : selectedFreelancer ? (
            <ScrollView
              style={styles.detailScrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Header */}
              <View style={styles.detailProfileHeader}>
                {selectedFreelancer.avatar ? (
                  <Image
                    source={{ uri: selectedFreelancer.avatar }}
                    style={styles.detailAvatar}
                  />
                ) : (
                  <View style={[styles.detailAvatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={48} color="#999" />
                  </View>
                )}
                
                {selectedFreelancer.tagline && (
                  <Text style={styles.detailTagline}>
                    {selectedFreelancer.tagline}
                  </Text>
                )}
                
                <View style={styles.detailNameRow}>
                  <Text style={styles.detailName}>
                    {selectedFreelancer.name}
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color={primaryColor} />
                </View>

                {selectedFreelancer.hourly_rate && (
                  <View style={styles.detailPriceRow}>
                    <Text style={styles.detailPriceLabel}>Starting from</Text>
                    <Text style={styles.detailPrice}>
                      {selectedFreelancer.hourly_rate}
                    </Text>
                  </View>
                )}
              </View>

              {/* Stats Cards */}
              <View style={styles.detailStatsContainer}>
                {/* Reviews */}
                {(selectedFreelancer.average_rating || selectedFreelancer.rating) && (
                  <View style={styles.detailInfoCard}>
                    <View style={styles.detailInfoRow}>
                      <View style={[styles.detailIcon, { backgroundColor: "#FFF4ED" }]}>
                        <Ionicons name="star" size={16} color="#DC6803" />
                      </View>
                      <Text style={styles.detailInfoLabel}>Reviews</Text>
                    </View>
                    <Text style={styles.detailInfoValue}>
                      {selectedFreelancer.average_rating || selectedFreelancer.rating} (
                      {selectedFreelancer.rating_count || selectedFreelancer.reviews || 0})
                    </Text>
                  </View>
                )}

                {/* Views */}
                {selectedFreelancer.views && (
                  <View style={styles.detailInfoCard}>
                    <View style={styles.detailInfoRow}>
                      <View style={[styles.detailIcon, { backgroundColor: "#EFF8FF" }]}>
                        <Ionicons name="eye" size={16} color="#2E90FA" />
                      </View>
                      <Text style={styles.detailInfoLabel}>Views</Text>
                    </View>
                    <Text style={styles.detailInfoValue}>
                      {selectedFreelancer.views}
                    </Text>
                  </View>
                )}

                {/* Location */}
                {(selectedFreelancer.address || selectedFreelancer.location) && (
                  <View style={styles.detailInfoCard}>
                    <View style={styles.detailInfoRow}>
                      <View style={[styles.detailIcon, { backgroundColor: "#F4F3FF" }]}>
                        <Ionicons name="location" size={16} color="#7A50EC" />
                      </View>
                      <Text style={styles.detailInfoLabel}>Location</Text>
                    </View>
                    <Text style={styles.detailInfoValue}>
                      {selectedFreelancer.address || selectedFreelancer.location}
                    </Text>
                  </View>
                )}

                {/* Freelancer Type */}
                {selectedFreelancer.freelancer_type && (
                  <View style={styles.detailInfoCard}>
                    <View style={styles.detailInfoRow}>
                      <View style={[styles.detailIcon, { backgroundColor: "#FEE4E2" }]}>
                        <Ionicons name="person" size={16} color="#F04438" />
                      </View>
                      <Text style={styles.detailInfoLabel}>Freelancer</Text>
                    </View>
                    <Text style={styles.detailInfoValue}>
                      {selectedFreelancer.freelancer_type}
                    </Text>
                  </View>
                )}

                {/* Languages */}
                {selectedFreelancer.languages && (
                  <View style={styles.detailInfoCard}>
                    <View style={styles.detailInfoRow}>
                      <View style={[styles.detailIcon, { backgroundColor: "#DCFAE6" }]}>
                        <Ionicons name="globe" size={16} color="#17B26A" />
                      </View>
                      <Text style={styles.detailInfoLabel}>Languages</Text>
                    </View>
                    <Text style={styles.detailInfoValue}>
                      {selectedFreelancer.languages}
                    </Text>
                  </View>
                )}

                {/* English Level */}
                {selectedFreelancer.english_level && (
                  <View style={styles.detailInfoCard}>
                    <View style={styles.detailInfoRow}>
                      <View style={[styles.detailIcon, { backgroundColor: "#F7F7F8" }]}>
                        <Ionicons name="flag" size={16} color={secondaryColor} />
                      </View>
                      <Text style={styles.detailInfoLabel}>English Level</Text>
                    </View>
                    <Text style={styles.detailInfoValue}>
                      {selectedFreelancer.english_level}
                    </Text>
                  </View>
                )}
              </View>

              {/* Description/About */}
              {selectedFreelancer.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>About</Text>
                  <Text style={styles.detailDescription}>
                    {selectedFreelancer.description}
                  </Text>
                </View>
              )}

              {/* Skills */}
              {selectedFreelancer.skills && selectedFreelancer.skills.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Skills</Text>
                  <View style={styles.detailSkillsContainer}>
                    {selectedFreelancer.skills.map((skill, index) => {
                      const skillName =
                        typeof skill === "object" ? skill.name || skill.slug : skill;
                      return (
                        <View key={index} style={styles.detailSkillTag}>
                          <Text style={styles.detailSkillText}>{skillName}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Action Buttons with Message Integration */}
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailMessageButton}
                  onPress={() => handleSendMessage(selectedFreelancer)}
                >
                  <Ionicons name="chatbubble-outline" size={20} color={whiteColor} />
                  <Text style={styles.detailMessageText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailHireButton}
                  onPress={() => handleHire(selectedFreelancer)}
                >
                  <Text style={styles.detailHireText}>Hire Now</Text>
                  <Ionicons name="arrow-forward" size={20} color={whiteColor} />
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>

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
              <Text style={styles.modalTitle}>Send Message</Text>
              <TouchableOpacity
                onPress={() => {
                  setMessageModalVisible(false);
                  setMessageText("");
                }}
                disabled={sendingMessage}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedFreelancer && (
              <View style={styles.recipientInfo}>
                <View style={styles.recipientHeader}>
                  {selectedFreelancer.avatar ? (
                    <Image
                      source={{ uri: selectedFreelancer.avatar }}
                      style={styles.recipientAvatar}
                    />
                  ) : (
                    <View style={[styles.recipientAvatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={24} color="#999" />
                    </View>
                  )}
                  <View style={styles.recipientDetails}>
                    <Text style={styles.recipientName}>
                      {selectedFreelancer.name}
                    </Text>
                    {selectedFreelancer.profession && (
                      <Text style={styles.recipientProfession}>
                        {selectedFreelancer.profession}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.inputLabel}>Your Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              placeholderTextColor="#999"
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
                  (!messageText.trim() || sendingMessage) && { opacity: 0.5 },
                ]}
                onPress={sendMessageToFreelancer}
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Artisan;

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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: fontColor,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  searchFilterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: whiteColor,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 12,
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
    width: 48,
    height: 48,
    backgroundColor: whiteColor,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: primaryColor,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: whiteColor,
    fontSize: 10,
    fontWeight: "700",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginRight: 12,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: whiteColor,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  sortChipActive: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  sortChipTextActive: {
    color: whiteColor,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 4,
  },
  profession: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  location: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  cardStats: {
    flexDirection: "row",
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    marginLeft: 4,
  },
  hourlyRate: {
    fontSize: 18,
    fontWeight: "700",
    color: primaryColor,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  skillTag: {
    backgroundColor: backgroundColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  viewProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginTop: 8,
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: "600",
    color: primaryColor,
    marginRight: 6,
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
    maxHeight: "80%",
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
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: fontColor,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: whiteColor,
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterOptionTextActive: {
    color: whiteColor,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: primaryColor,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: whiteColor,
  },
  detailSafeArea: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  detailHeaderBar: {
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
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
  },
  detailLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  detailScrollView: {
    flex: 1,
  },
  detailProfileHeader: {
    backgroundColor: whiteColor,
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  detailAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: primaryColor,
  },
  detailTagline: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  detailNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailName: {
    fontSize: 24,
    fontWeight: "700",
    color: fontColor,
    marginRight: 8,
  },
  detailPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailPriceLabel: {
    fontSize: 14,
    color: secondaryColor,
    marginRight: 6,
  },
  detailPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: fontColor,
  },
  detailStatsContainer: {
    padding: 16,
  },
  detailInfoCard: {
    backgroundColor: whiteColor,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "rgba(16, 24, 40, 0.04)",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
    shadowOpacity: 1,
  },
  detailInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  detailInfoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailInfoValue: {
    fontSize: 15,
    color: fontColor,
    fontWeight: "600",
    marginLeft: 42,
  },
  detailSection: {
    backgroundColor: whiteColor,
    padding: 16,
    marginTop: 10,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 15,
    color: "#666",
    lineHeight: 24,
  },
  detailSkillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailSkillTag: {
    backgroundColor: backgroundColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  detailSkillText: {
    fontSize: 14,
    color: fontColor,
    fontWeight: "500",
  },
  detailActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  detailMessageButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: secondaryColor,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  detailMessageText: {
    fontSize: 16,
    fontWeight: "700",
    color: whiteColor,
  },
  detailHireButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: primaryColor,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  detailHireText: {
    fontSize: 16,
    fontWeight: "700",
    color: whiteColor,
  },
  messageModalContent: {
    backgroundColor: whiteColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  recipientInfo: {
    backgroundColor: backgroundColor,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  recipientHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "700",
    color: fontColor,
    marginBottom: 2,
  },
  recipientProfession: {
    fontSize: 14,
    color: "#666",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: fontColor,
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: fontColor,
    minHeight: 150,
    backgroundColor: backgroundColor,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginBottom: 20,
  },
  messageModalButtons: {
    flexDirection: "row",
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
  sendMessageButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: secondaryColor,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendMessageButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: whiteColor,
  },
});
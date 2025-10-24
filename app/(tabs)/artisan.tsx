// app/(tabs)/artisan.tsx
import { freelancersFilters, getFreelancersList } from "@/api/api";
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
  const [selectedFreelancer, setSelectedFreelancer] =
    useState<Freelancer | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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

  // Open freelancer detail
  const openFreelancerDetail = (freelancer: Freelancer) => {
    setSelectedFreelancer(freelancer);
    setDetailModalVisible(true);
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

      {/* <TouchableOpacity style={styles.viewProfileButton}>
        <Text style={styles.viewProfileText}>View Profile</Text>
        <Ionicons name="arrow-forward" size={16} color="#EE4710" />
      </TouchableOpacity> */}
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
        <ActivityIndicator size="large" color="#EE4710" />
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
          <Ionicons name="options-outline" size={22} color="#297F42" />
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
          <TouchableOpacity
            style={[
              styles.sortChip,
              filters.sort_by === "hourly_rate" &&
                filters.order === "desc" &&
                styles.sortChipActive,
            ]}
            onPress={() =>
              setFilters({ ...filters, sort_by: "hourly_rate", order: "desc" })
            }
          >
            <Text
              style={[
                styles.sortChipText,
                filters.sort_by === "hourly_rate" &&
                  filters.order === "desc" &&
                  styles.sortChipTextActive,
              ]}
            >
              Price: High to Low
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
            tintColor="#EE4710"
            colors={["#EE4710"]}
          />
        }
      />

      {/* Filter Modal */}
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
              {/* Experience Level */}
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

              {/* Location */}
              {filterData?.locations && filterData.locations.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Location</Text>
                  <View style={styles.filterOptions}>
                    {filterData.locations.slice(0, 10).map((loc: any) => (
                      <TouchableOpacity
                        key={loc.id || loc.value}
                        style={[
                          styles.filterOption,
                          tempFilters.location === (loc.slug || loc.value) &&
                            styles.filterOptionActive,
                        ]}
                        onPress={() =>
                          setTempFilters({
                            ...tempFilters,
                            location:
                              tempFilters.location === (loc.slug || loc.value)
                                ? ""
                                : loc.slug || loc.value,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            tempFilters.location === (loc.slug || loc.value) &&
                              styles.filterOptionTextActive,
                          ]}
                        >
                          {loc.name || loc.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Hourly Rate */}
              {filterData?.hourly_rate && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Hourly Rate Range</Text>
                  <View style={styles.priceInputContainer}>
                    <TextInput
                      style={styles.priceInput}
                      placeholder={`Min (${filterData.hourly_rate.min})`}
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={tempFilters.min_price}
                      onChangeText={(text) =>
                        setTempFilters({ ...tempFilters, min_price: text })
                      }
                    />
                    <Text style={styles.priceSeparator}>-</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder={`Max (${filterData.hourly_rate.max})`}
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={tempFilters.max_price}
                      onChangeText={(text) =>
                        setTempFilters({ ...tempFilters, max_price: text })
                      }
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
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

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <TouchableOpacity
              style={styles.detailCloseButton}
              onPress={() => setDetailModalVisible(false)}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>

            {selectedFreelancer && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  {selectedFreelancer.avatar ? (
                    <Image
                      source={{ uri: selectedFreelancer.avatar }}
                      style={styles.detailAvatar}
                    />
                  ) : (
                    <View
                      style={[styles.detailAvatar, styles.avatarPlaceholder]}
                    >
                      <Ionicons name="person" size={48} color="#999" />
                    </View>
                  )}
                  <Text style={styles.detailName}>
                    {selectedFreelancer.name}
                  </Text>
                  {selectedFreelancer.profession && (
                    <Text style={styles.detailProfession}>
                      {selectedFreelancer.profession}
                    </Text>
                  )}
                  {selectedFreelancer.rating !== undefined && (
                    <View style={styles.detailRating}>
                      <Ionicons name="star" size={20} color="#FFA500" />
                      <Text style={styles.detailRatingText}>
                        {selectedFreelancer.rating} (
                        {selectedFreelancer.reviews || 0} reviews)
                      </Text>
                    </View>
                  )}
                </View>

                {selectedFreelancer.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>About</Text>
                    <Text style={styles.detailDescription}>
                      {selectedFreelancer.description}
                    </Text>
                  </View>
                )}

                {selectedFreelancer.hourly_rate && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Hourly Rate</Text>
                    <Text style={styles.detailHourlyRate}>
                      {selectedFreelancer.hourly_rate}/hr
                    </Text>
                  </View>
                )}

                {selectedFreelancer.skills &&
                  selectedFreelancer.skills.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Skills</Text>
                      <View style={styles.detailSkills}>
                        {selectedFreelancer.skills.map((skill, index) => {
                          const skillName =
                            typeof skill === "object"
                              ? skill.name || skill.slug
                              : skill;
                          return (
                            <View key={index} style={styles.detailSkillTag}>
                              <Text style={styles.detailSkillText}>
                                {skillName}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                <View style={styles.detailButtons}>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => {
                      setDetailModalVisible(false);
                      // Navigate to freelancer profile or hire
                    }}
                  >
                    <Text style={styles.detailButtonText}>Hire Now</Text>
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

export default Artisan;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:  backgroundColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:  backgroundColor,
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
    color: "#1A1A1A",
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
    // 'gap' is not supported in React Native styles across all versions.
    // Use margin on children instead (searchContainer has right margin).
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
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
    color: "#1A1A1A",
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: "#fff",
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
    backgroundColor:  primaryColor,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#fff",
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
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  sortChipActive: {
    backgroundColor:  primaryColor,
    borderColor: primaryColor,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  sortChipTextActive: {
    color: "#fff",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
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
    color: "#1A1A1A",
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
    // replace gap with small left margin on the text
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
    backgroundColor: "#F4F4FB",
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
    // small spacing handled by icon/text margin
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginTop: 8,
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: "600",
    color:  primaryColor,
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
    backgroundColor: "#fff",
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
    color: "#1A1A1A",
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
    color: "#1A1A1A",
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    // spacing handled on individual filterOption elements
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#fff",
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor:  primaryColor,
    borderColor:  primaryColor,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterOptionTextActive: {
    color: "#fff",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    // spacing handled via input margin
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1A1A1A",
    marginRight: 12,
  },
  priceSeparator: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    marginRight: 12,
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
    backgroundColor:  primaryColor,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  detailModalContent: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: 60,
  },
  detailCloseButton: {
    position: "absolute",
    top: -50,
    right: 20,
    zIndex: 10,
  },
  detailHeader: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 20,
  },
  detailAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  detailProfession: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  detailRating: {
    flexDirection: "row",
    alignItems: "center",
    // spacing between icon and text handled by text margin
  },
  detailRatingText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
    marginLeft: 6,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 15,
    color: "#666",
    lineHeight: 24,
  },
  detailHourlyRate: {
    fontSize: 22,
    fontWeight: "700",
    color:  primaryColor,
  },
  detailSkills: {
    flexDirection: "row",
    flexWrap: "wrap",
    // spacing handled on skill tags
  },
  detailSkillTag: {
    backgroundColor: "#F4F4FB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  detailSkillText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailButtons: {
    marginTop: 20,
    marginBottom: 20,
  },
  detailButton: {
    backgroundColor:  primaryColor,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  detailButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

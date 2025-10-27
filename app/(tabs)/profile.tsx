import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { getProfileData, updateProfileData, updatePassword } from "@/api/api";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { setUser, logout } from "@/redux/slices/authSlice";
import { clearAllStorage, saveProfileBackup, getProfileBackup } from "@/utils/storageUtils";
import {
  primaryColor,
  secondaryColor,
  backgroundColor,
} from "@/constants/GlobalConstants";

interface UserProfile {
  id?: string;
  user_id?: string;
  profile_id?: number;
  avatar?: string;
  name?: string;
  user_name?: string;
  username?: string;
  email?: string;
  user_email?: string;
  phone?: string;
  role?: string;
  user_type?: string;
  bio?: string;
  location?: string;
  country?: string;
  skills?: string[];
  rating?: number;
  completedProjects?: number;
  memberSince?: string;
  first_name?: string;
  last_name?: string;
  wallet_amount?: string;
  is_verified?: string;
  notifications?: number;
  deactive_account?: number;
  identity_verified?: string;
  visible_profile?: string;
}

const Profile = () => {
  const [user, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const router = useRouter();
  const dispatch = useDispatch();
  const authUser = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);

  // Edit form state
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    country: "",
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    pushNotifications: true,
  });

  // Compute display name
  const displayName = React.useMemo(() => {
    const profileName = user?.name || user?.user_name || user?.username;
    const authName = authUser?.user_name || authUser?.name || authUser?.username;
    return profileName || authName || "User";
  }, [user, authUser]);

  // Compute display email
  const displayEmail = React.useMemo(() => {
    const profileEmail = user?.email || user?.user_email;
    const authEmail = authUser?.email || authUser?.user_email || authUser?.userEmail;
    return profileEmail || authEmail || "Email not provided";
  }, [user, authUser]);

  // Compute user ID
  const userId = React.useMemo(() => {
    const profileId = user?.user_id || user?.id;
    const authId = authUser?.user_id || authUser?.id;
    return profileId || authId || "N/A";
  }, [user, authUser]);

  // Compute user type/role
  const userType = React.useMemo(() => {
    const profileType = user?.user_type || user?.role;
    const authType = authUser?.user_type || authUser?.role;
    return profileType || authType;
  }, [user, authUser]);

  // Load profile with fallback chain - FIXED: Persisted data takes priority
  const loadProfile = async (forceApiUpdate = false) => {
    try {
      const res = await getProfileData();
      const profileData = res.data?.data || res.data;
      
      console.log("📋 Profile API Response:", profileData);
      
      // CRITICAL: Check if we have newer persisted data
      const persistedData = authUser;
      const hasPersistedData = persistedData && Object.keys(persistedData).length > 0;
      
      // If we have persisted data and not forcing API update, prefer persisted data
      let mergedData;
      if (hasPersistedData && !forceApiUpdate) {
        console.log("🔒 Using persisted data (has priority over API)");
        // Persisted data takes priority, only fill missing fields from API
        mergedData = {
          ...profileData, // Base: API data
          ...persistedData, // Override: Persisted data (has priority)
        };
      } else {
        console.log("🌐 Using API data (force update or no persisted data)");
        // API data takes priority on force update or first load
        mergedData = {
          ...persistedData,
          ...profileData,
        };
      }
      
      console.log("🔄 Merged profile data:", mergedData);
      
      // Only update if data is different or if forcing
      const currentDataStr = JSON.stringify(user);
      const newDataStr = JSON.stringify(mergedData);
      
      if (currentDataStr !== newDataStr || forceApiUpdate) {
        setUserProfile(mergedData);
        
        // Only update Redux if forcing or no persisted data
        if (forceApiUpdate || !hasPersistedData) {
          dispatch(setUser(mergedData));
          await saveProfileBackup(mergedData);
        }
      }
      
      // Populate edit form
      const fullName = mergedData?.user_name || mergedData?.name || "";
      const nameParts = fullName.trim().split(" ");
      const firstName = mergedData?.first_name || nameParts[0] || "";
      const lastName = mergedData?.last_name || nameParts.slice(1).join(" ") || "";
      
      setEditForm({
        first_name: firstName,
        last_name: lastName,
        email: mergedData?.email || mergedData?.user_email || "",
        phone: mergedData?.phone || "",
        bio: mergedData?.bio || "",
        location: mergedData?.location || "",
        country: mergedData?.country || "",
      });
    } catch (error: any) {
      console.log("❌ Profile API error:", error);
      
      // Fallback chain
      let fallbackData = null;
      
      // Fallback 1: Use Redux persisted data
      if (authUser && Object.keys(authUser).length > 0) {
        console.log("📋 Fallback 1: Using Redux persisted data");
        fallbackData = authUser;
      } 
      // Fallback 2: Check AsyncStorage backup
      else {
        console.log("📦 Fallback 2: Checking AsyncStorage backup");
        fallbackData = await getProfileBackup();
      }
      
      if (fallbackData) {
        setUserProfile(fallbackData);
        
        // If we got data from backup but not Redux, update Redux
        if (!authUser || Object.keys(authUser).length === 0) {
          dispatch(setUser(fallbackData));
        }
        
        const fullName = fallbackData?.user_name || fallbackData?.name || "";
        const nameParts = fullName.trim().split(" ");
        
        setEditForm({
          first_name: fallbackData?.first_name || nameParts[0] || "",
          last_name: fallbackData?.last_name || nameParts.slice(1).join(" ") || "",
          email: fallbackData?.email || fallbackData?.user_email || "",
          phone: fallbackData?.phone || "",
          bio: fallbackData?.bio || "",
          location: fallbackData?.location || "",
          country: fallbackData?.country || "",
        });
      } else {
        Alert.alert(
          "Error",
          "Failed to load profile. Please try logging in again.",
          [{ text: "OK", onPress: () => router.replace("/auth/login") }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log("🔍 Auth User from Redux:", authUser);
    console.log("🔍 Auth Token:", token ? "Token exists" : "No token");
    
    // On mount, load profile but don't override persisted data
    loadProfile(false);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // On refresh, force API update
    loadProfile(true);
  };

  // Handle logout with proper cleanup
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all storage
              await clearAllStorage();
              
              // Dispatch logout action
              dispatch(logout());
              
              console.log("✅ Logout successful");
              
              // Navigate to login
              router.replace("/auth/login");
              
            } catch (error) {
              console.error("❌ Logout error:", error);
              
              // Force logout even if cleanup fails
              dispatch(logout());
              router.replace("/auth/login");
            }
          }
        }
      ]
    );
  };

  // Handle profile update with all field variations
  const handleUpdateProfile = async () => {
    const trimmedForm = {
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      location: editForm.location.trim(),
      country: editForm.country.trim(),
      bio: editForm.bio.trim(),
    };

    if (!trimmedForm.first_name) {
      Alert.alert("Error", "First name is required");
      return;
    }

    if (!trimmedForm.country) {
      Alert.alert("Error", "Country is required");
      return;
    }

    if (!trimmedForm.email || !/\S+@\S+\.\S+/.test(trimmedForm.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setUpdating(true);
    try {
      console.log("📤 Sending profile update:", trimmedForm);
      
      const response = await updateProfileData(trimmedForm);
      
      console.log("📥 Update response:", response.data);
      
      if (response.data?.type === "success") {
        // Create complete user object with ALL field name variations
        const fullName = `${trimmedForm.first_name} ${trimmedForm.last_name}`.trim();
        
        const updatedUser = { 
          ...user,
          ...trimmedForm,
          // Explicitly set all name variations
          first_name: trimmedForm.first_name,
          last_name: trimmedForm.last_name,
          user_name: fullName,
          name: fullName,
          username: fullName,
          // Explicitly set all email variations
          email: trimmedForm.email,
          user_email: trimmedForm.email,
          userEmail: trimmedForm.email,
          // Other fields
          phone: trimmedForm.phone,
          bio: trimmedForm.bio,
          location: trimmedForm.location,
          country: trimmedForm.country,
          // Add timestamp to track when this was updated
          _lastUpdated: new Date().toISOString(),
        };
        
        console.log("✅ Updated user object:", updatedUser);
        
        // CRITICAL: Update in correct order
        // 1. Update Redux FIRST (this persists via redux-persist)
        dispatch(setUser(updatedUser));
        console.log("✅ Redux updated");
        
        // 2. Save backup to AsyncStorage
        await saveProfileBackup(updatedUser);
        console.log("✅ Backup saved");
        
        // 3. Update local state LAST (for immediate UI update)
        setUserProfile(updatedUser);
        console.log("✅ Local state updated");
        
        Alert.alert("Success", "Profile updated successfully!", [
          {
            text: "OK",
            onPress: () => {
              setEditModalVisible(false);
              // Don't reload from API immediately - give server time to update
              console.log("✅ Profile update complete - NOT reloading from API to prevent overwrite");
            }
          }
        ]);
      } else {
        throw new Error(response.data?.message || "Update failed");
      }
    } catch (error: any) {
      console.error("❌ Update error:", error);
      
      const errorMessage = error?.response?.data?.message_desc || 
                          error?.response?.data?.message || 
                          error?.message ||
                          "Failed to update profile. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!settingsForm.currentPassword || !settingsForm.newPassword) {
      Alert.alert("Error", "Please fill all password fields");
      return;
    }

    if (settingsForm.newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters");
      return;
    }

    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setUpdating(true);
    try {
      console.log("🔐 Attempting password change...");
      
      const response = await updatePassword({
        old_password: settingsForm.currentPassword,
        new_password: settingsForm.newPassword,
        confirm_password: settingsForm.confirmPassword,
      });

      console.log("📥 Password change response:", response.data);

      if (response.data?.type === "success" || response.data?.status === "success") {
        Alert.alert(
          "Success", 
          "Password changed successfully. Please login again with your new password.",
          [
            {
              text: "OK",
              onPress: async () => {
                setSettingsModalVisible(false);
                await clearAllStorage();
                dispatch(logout());
                router.replace("/auth/login");
              }
            }
          ]
        );
        
        setSettingsForm({
          ...settingsForm,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      console.error("❌ Password change error:", error);
      
      const errorMessage = error?.response?.data?.message_desc || 
                          error?.response?.data?.message || 
                          "Failed to change password. Please check your current password.";
      Alert.alert("Error", errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EE4710" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.avatar || "https://via.placeholder.com/120" }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{displayEmail}</Text>
        
        {user?.role || userType ? (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || userType}</Text>
          </View>
        ) : null}

        <View style={styles.userIdContainer}>
          <Ionicons name="id-card-outline" size={14} color="#999" />
          <Text style={styles.userId}>ID: {userId}</Text>
        </View>
      </View>

      {/* Stats Section */}
      {(user?.rating || user?.completedProjects !== undefined) && (
        <View style={styles.statsContainer}>
          {user?.rating && (
            <View style={styles.statItem}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{user.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          )}
          {user?.completedProjects !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color="#28a745" />
              <Text style={styles.statValue}>{user.completedProjects}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
          )}
        </View>
      )}

      {/* Bio Section */}
      {user?.bio && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#EE4710" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      )}

      {/* Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={20} color="#EE4710" />
          <Text style={styles.sectionTitle}>Information</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color="#666" />
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{displayEmail}</Text>
        </View>

        {user?.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#666" />
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}

        {user?.location && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#666" />
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{user.location}</Text>
          </View>
        )}

        {user?.wallet_amount && (
          <View style={styles.infoRow}>
            <Ionicons name="wallet-outline" size={18} color="#666" />
            <Text style={styles.infoLabel}>Wallet:</Text>
            <Text style={styles.infoValue}>{user.wallet_amount}</Text>
          </View>
        )}

        {user?.is_verified && (
          <View style={styles.infoRow}>
            <Ionicons 
              name={user.is_verified === "yes" ? "checkmark-circle" : "close-circle"} 
              size={18} 
              color={user.is_verified === "yes" ? "#28a745" : "#666"} 
            />
            <Text style={styles.infoLabel}>Verified:</Text>
            <Text style={[styles.infoValue, { color: user.is_verified === "yes" ? "#28a745" : "#666" }]}>
              {user.is_verified === "yes" ? "Yes" : "No"}
            </Text>
          </View>
        )}

        {user?.memberSince && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.infoLabel}>Member Since:</Text>
            <Text style={styles.infoValue}>{user.memberSince}</Text>
          </View>
        )}
      </View>

      {/* Skills Section */}
      {user?.skills && user.skills.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code-slash-outline" size={20} color="#EE4710" />
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
          <View style={styles.skillsContainer}>
            {user.skills.map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Ionicons name="settings-outline" size={20} color="#EE4710" />
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </TouchableOpacity>

        {/* Sync Button - Pull fresh data from server */}
        <TouchableOpacity
          style={styles.syncButton}
          onPress={() => {
            Alert.alert(
              "Sync from Server",
              "This will fetch your latest profile data from the server and may overwrite local changes. Continue?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sync",
                  onPress: () => {
                    setRefreshing(true);
                    loadProfile(true);
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="cloud-download-outline" size={20} color="#007AFF" />
          <Text style={styles.syncButtonText}>Sync from Server</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => router.push("/(tabs)/home")}
        >
          <Ionicons name="home-outline" size={20} color="#666" />
          <Text style={styles.outlineButtonText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC3545" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#999"
                value={editForm.first_name}
                onChangeText={(text) => setEditForm({ ...editForm, first_name: text })}
                editable={!updating}
              />

              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#999"
                value={editForm.last_name}
                onChangeText={(text) => setEditForm({ ...editForm, last_name: text })}
                editable={!updating}
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!updating}
              />

              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                keyboardType="phone-pad"
                editable={!updating}
              />

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your location"
                placeholderTextColor="#999"
                value={editForm.location}
                onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                editable={!updating}
              />

              <Text style={styles.inputLabel}>Country *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your country"
                placeholderTextColor="#999"
                value={editForm.country}
                onChangeText={(text) => setEditForm({ ...editForm, country: text })}
                editable={!updating}
              />

              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={editForm.bio}
                onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                textAlignVertical="top"
                editable={!updating}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                  disabled={updating}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, updating && { opacity: 0.7 }]}
                  onPress={handleUpdateProfile}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity
                onPress={() => setSettingsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Password Section */}
              <Text style={styles.sectionTitleModal}>Change Password</Text>
              
              <Text style={styles.inputLabel}>Current Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor="#999"
                secureTextEntry
                value={settingsForm.currentPassword}
                onChangeText={(text) =>
                  setSettingsForm({ ...settingsForm, currentPassword: text })
                }
                editable={!updating}
              />

              <Text style={styles.inputLabel}>New Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor="#999"
                secureTextEntry
                value={settingsForm.newPassword}
                onChangeText={(text) =>
                  setSettingsForm({ ...settingsForm, newPassword: text })
                }
                editable={!updating}
              />

              <Text style={styles.inputLabel}>Confirm New Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                secureTextEntry
                value={settingsForm.confirmPassword}
                onChangeText={(text) =>
                  setSettingsForm({ ...settingsForm, confirmPassword: text })
                }
                editable={!updating}
              />

              <TouchableOpacity
                style={[styles.submitButton, { marginBottom: 20 }, updating && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>

              {/* Notifications Section */}
              <Text style={styles.sectionTitleModal}>Notifications</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="mail-outline" size={20} color="#666" />
                  <Text style={styles.settingLabel}>Email Notifications</Text>
                </View>
                <Switch
                  value={settingsForm.emailNotifications}
                  onValueChange={(value) =>
                    setSettingsForm({ ...settingsForm, emailNotifications: value })
                  }
                  trackColor={{ false: "#ddd", true: "#EE4710" }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="notifications-outline" size={20} color="#666" />
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                </View>
                <Switch
                  value={settingsForm.pushNotifications}
                  onValueChange={(value) =>
                    setSettingsForm({ ...settingsForm, pushNotifications: value })
                  }
                  trackColor={{ false: "#ddd", true: "#EE4710" }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setSettingsModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: backgroundColor,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: backgroundColor,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: primaryColor,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 5,
  },
  email: {
    fontSize: 15,
    color: "#6c757d",
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: primaryColor,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 5,
  },
  roleText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  userIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#F4F4FB",
    borderRadius: 12,
  },
  userId: {
    fontSize: 12,
    color: "#999",
    marginLeft: 6,
    fontFamily: "monospace",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 20,
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#212529",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginLeft: 8,
  },
  bioText: {
    fontSize: 15,
    color: "#495057",
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: "#6c757d",
    marginLeft: 10,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 15,
    color: "#212529",
    fontWeight: "500",
    flex: 1,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    backgroundColor: "#FFE5DD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFCCBB",
  },
  skillText: {
    color: primaryColor,
    fontSize: 13,
    fontWeight: "500",
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: primaryColor,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: "row",
    backgroundColor: secondaryColor,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: secondaryColor,
  },
  secondaryButtonText: {
    color: primaryColor,
    fontWeight: "600",
    fontSize: 16,
  },
  outlineButton: {
    flexDirection: "row",
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  outlineButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#FFF5F5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFDDDD",
  },
  logoutButtonText: {
    color: "#DC3545",
    fontWeight: "600",
    fontSize: 16,
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
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  closeButton: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1A1A1A",
    marginBottom: 8,
    backgroundColor: "#F4F4FB",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1A1A1A",
    marginBottom: 8,
    minHeight: 100,
    backgroundColor: "#F4F4FB",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
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
    color: "#fff",
  },
  sectionTitleModal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 10,
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: "#1A1A1A",
    marginLeft: 12,
    fontWeight: "500",
  },
});
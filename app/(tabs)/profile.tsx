import {
  backgroundColor,
  primaryColor,
  secondaryColor,
} from "@/constants/GlobalConstants";
import { supabase } from "@/lib/supabase";
import { logout, setUser } from "@/redux/slices/authSlice";
import {
  getProfileById,
  logoutUser,
  updateProfileById,
} from "@/services/login";
import {
  clearAllStorage,
  getProfileBackup,
  saveProfileBackup,
} from "@/utils/storageUtils";
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import DateTimePicker from '@react-native-community/datetimepicker';

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
  completed_projects?: number;
  completedProjects?: number;
  member_since?: string;
  memberSince?: string;
  first_name?: string;
  last_name?: string;
  wallet_amount?: string;
  is_verified?: boolean | string;
  notifications?: number;
  deactive_account?: boolean | number;
  identity_verified?: boolean | string;
  visible_profile?: boolean | string;
  is_available?: boolean;
  average_rating?: number;
  rating_count?: number;
  reviews?: number;
  views?: number;
}

interface EditForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  country: string;
  role: "user" | "artisan";
  skills: string[];
}

interface Job {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  images?: { id: string; image_url: string }[];
  job_images?: { id: string; image_url: string }[];
  job_type?: "task" | "project";
  budget_min?: number;
  budget_max?: number;
  budget_type?: "fixed" | "hourly";
  location?: string;
  category?: string;
  deadline?: string | null;
  deadline_text?: string;
  skills?: string[];
}

interface JobForm {
  title: string;
  description: string;
  images: string[];
  job_type: "task" | "project";
  budget_min: string;
  budget_max: string;
  budget_type: "fixed" | "hourly";
  location: string;
  category: string;
  deadline: string;
  skills: string[];
}

const Profile = () => {
  const [user, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [editJobModalVisible, setEditJobModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newJobSkill, setNewJobSkill] = useState("");
  const scrollY = useRef(new Animated.Value(0)).current;

  const router = useRouter();
  const dispatch = useDispatch();
  const authUser = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);

  const [editForm, setEditForm] = useState<EditForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    country: "",
    role: "user",
    skills: [],
  });

  const [jobForm, setJobForm] = useState<JobForm>({
    title: "",
    description: "",
    images: [],
    job_type: "project",
    budget_min: "",
    budget_max: "",
    budget_type: "fixed",
    location: "",
    category: "",
    deadline: "",
    skills: [],
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [newSkill, setNewSkill] = useState("");

  const [settingsForm, setSettingsForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    pushNotifications: true,
  });

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [jobImageUploading, setJobImageUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Permission to access media library is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: false,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const mime = asset.mimeType?.toLowerCase();
      const fileName = asset.fileName?.toLowerCase();
      const isPng = mime?.includes("png") || fileName?.endsWith(".png");
      const isJpeg = mime?.includes("jpeg") || mime?.includes("jpg") || fileName?.match(/\.jpe?g$/);

      if (mime && !(isPng || isJpeg)) {
        Alert.alert("Unsupported format", "Please select a JPG or PNG image.");
        return;
      }

      setAvatarUploading(true);

      const manip = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300 } }],
        {
          compress: 0.7,
          format: isPng ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
        }
      );

      if (user?.id) {
        const updateRes = await updateProfileById(user.id, { avatar: manip.uri });
        if (updateRes.success) {
          setUserProfile((prev) => (prev ? { ...prev, avatar: manip.uri } : prev));
          dispatch(setUser({ ...user, avatar: manip.uri }));
          await saveProfileBackup({ ...user, avatar: manip.uri });
        } else {
          Alert.alert("Error", updateRes.error || "Failed to update avatar.");
        }
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to pick image.");
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    loadProfile(false);
  }, []);

  useEffect(() => {
    if (user && (user.role === "artisan" || userType === "artisan")) {
      loadJobs();
    }
  }, [user?.id, user?.role]);

  const loadJobs = async () => {
    if (!user?.id) return;

    setLoadingJobs(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`*, job_images (id, image_url)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error("Error loading jobs:", error);
      Alert.alert("Error", "Failed to load jobs");
    } finally {
      setLoadingJobs(false);
    }
  };

  const handlePickJobImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Permission to access media library is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
      });

      if (result.canceled || !result.assets?.length) return;

      if (jobForm.images.length + result.assets.length > 2) {
        Alert.alert("Limit Reached", "You can only add up to 2 images per job");
        return;
      }

      setJobImageUploading(true);

      const newImages = await Promise.all(
        result.assets.map(async (asset) => {
          const manip = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );
          return manip.uri;
        })
      );

      setJobForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to pick images.");
    } finally {
      setJobImageUploading(false);
    }
  };

  const handleRemoveJobImage = (index: number) => {
    setJobForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    const imageArray = job.images || job.job_images || [];
    const existingImages = imageArray.map((img) => img.image_url);

    // Parse existing deadline
    let deadlineValue = "";
    if (job.deadline) {
      deadlineValue = job.deadline;
      setSelectedDate(new Date(job.deadline));
    } else if (job.deadline_text) {
      deadlineValue = job.deadline_text;
    }

    setJobForm({
      title: job.title || "",
      description: job.description || "",
      images: existingImages,
      job_type: job.job_type || "project",
      budget_min: job.budget_min?.toString() || "",
      budget_max: job.budget_max?.toString() || "",
      budget_type: job.budget_type || "fixed",
      location: job.location || "",
      category: job.category || "",
      deadline: deadlineValue,
      skills: job.skills || [],
    });

    setEditJobModalVisible(true);
  };

  const handleSaveJob = async () => {
    if (!jobForm.title.trim()) {
      Alert.alert("Error", "Job title is required");
      return;
    }

    if (!jobForm.description.trim()) {
      Alert.alert("Error", "Job description is required");
      return;
    }

    if (jobForm.budget_min && isNaN(Number(jobForm.budget_min))) {
      Alert.alert("Error", "Minimum budget must be a number");
      return;
    }

    if (jobForm.budget_max && isNaN(Number(jobForm.budget_max))) {
      Alert.alert("Error", "Maximum budget must be a number");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User ID not found");
      return;
    }

    setUpdating(true);
    try {
      // Parse deadline - if it's a valid date, use it; otherwise store as null and use deadline_text
      let parsedDeadline = null;
      let deadlineText = jobForm.deadline.trim() || null;
      
      if (deadlineText) {
        // Try to parse as date (YYYY-MM-DD format)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(deadlineText)) {
          const testDate = new Date(deadlineText);
          if (!isNaN(testDate.getTime())) {
            parsedDeadline = deadlineText;
            deadlineText = null; // Clear text if we have valid date
          }
        }
      }

      const jobData = {
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        job_type: jobForm.job_type,
        budget_min: jobForm.budget_min ? parseFloat(jobForm.budget_min) : null,
        budget_max: jobForm.budget_max ? parseFloat(jobForm.budget_max) : null,
        budget_type: jobForm.budget_type,
        location: jobForm.location.trim() || null,
        category: jobForm.category.trim() || null,
        deadline: parsedDeadline,
        deadline_text: deadlineText,
        skills: jobForm.skills.length > 0 ? jobForm.skills : null,
      };

      if (editingJob) {
        const { error: jobError } = await supabase
          .from("jobs")
          .update(jobData)
          .eq("id", editingJob.id);

        if (jobError) throw jobError;

        const { error: deleteError } = await supabase
          .from("job_images")
          .delete()
          .eq("job_id", editingJob.id);

        if (deleteError) throw deleteError;

        if (jobForm.images.length > 0) {
          const imageInserts = jobForm.images.map((imageUri) => ({
            job_id: editingJob.id,
            image_url: imageUri,
          }));

          const { error: imageError } = await supabase.from("job_images").insert(imageInserts);
          if (imageError) throw imageError;
        }

        Alert.alert("Success", "Job updated successfully!");
      } else {
        const { data: newJobData, error: jobError } = await supabase
          .from("jobs")
          .insert({ user_id: user.id, status: "open", ...jobData })
          .select()
          .single();

        if (jobError) throw jobError;

        if (jobForm.images.length > 0) {
          const imageInserts = jobForm.images.map((imageUri) => ({
            job_id: newJobData.id,
            image_url: imageUri,
          }));

          const { error: imageError } = await supabase.from("job_images").insert(imageInserts);
          if (imageError) throw imageError;
        }

        Alert.alert("Success", "Job posted successfully!");
      }

      setJobModalVisible(false);
      setEditJobModalVisible(false);
      setJobForm({
        title: "",
        description: "",
        images: [],
        job_type: "project",
        budget_min: "",
        budget_max: "",
        budget_type: "fixed",
        location: "",
        category: "",
        deadline: "",
        skills: [],
      });
      setEditingJob(null);
      await loadJobs();
    } catch (error: any) {
      console.error("Error saving job:", error);
      Alert.alert("Error", error?.message || "Failed to save job");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddJobSkill = () => {
    const trimmedSkill = newJobSkill.trim();
    if (!trimmedSkill) {
      Alert.alert("Error", "Please enter a skill");
      return;
    }

    const currentSkills = jobForm.skills || [];

    if (currentSkills.includes(trimmedSkill)) {
      Alert.alert("Error", "This skill already exists");
      return;
    }

    if (currentSkills.length >= 10) {
      Alert.alert("Error", "Maximum 10 skills allowed");
      return;
    }

    setJobForm({ ...jobForm, skills: [...currentSkills, trimmedSkill] });
    setNewJobSkill("");
  };

  const handleRemoveJobSkill = (skillToRemove: string) => {
    const currentSkills = jobForm.skills || [];
    setJobForm({
      ...jobForm,
      skills: currentSkills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      setJobForm({ ...jobForm, deadline: formattedDate });
    }
  };

  const clearDeadline = () => {
    setJobForm({ ...jobForm, deadline: "" });
    setSelectedDate(new Date());
  };

  const handleDeleteJob = async (jobId: number) => {
    Alert.alert(
      "Delete Job",
      "Are you sure you want to delete this job? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("jobs").delete().eq("id", jobId);
              if (error) throw error;
              Alert.alert("Success", "Job deleted successfully");
              loadJobs();
            } catch (error: any) {
              console.error("Error deleting job:", error);
              Alert.alert("Error", "Failed to delete job");
            }
          },
        },
      ]
    );
  };

  const displayName = React.useMemo(() => {
    const profileFirstName = user?.first_name;
    const profileLastName = user?.last_name;
    const authFirstName = authUser?.first_name;
    const authLastName = authUser?.last_name;

    const profileFullName = [profileFirstName, profileLastName].filter(Boolean).join(" ").trim();
    const authFullName = [authFirstName, authLastName].filter(Boolean).join(" ").trim();

    const profileName = user?.name || user?.user_name || user?.username;
    const authName = authUser?.user_name || authUser?.name || authUser?.username;

    return profileFullName || authFullName || profileName || authName || "User";
  }, [user, authUser]);

  const displayEmail = React.useMemo(() => {
    const profileEmail = user?.email || user?.user_email;
    const authEmail = authUser?.email || authUser?.user_email || authUser?.userEmail;
    return profileEmail || authEmail || "Email not provided";
  }, [user, authUser]);

  const userId = React.useMemo(() => {
    const profileId = user?.user_id || user?.id;
    const authId = authUser?.user_id || authUser?.id;
    return profileId || authId || "N/A";
  }, [user, authUser]);

  const userType = React.useMemo(() => {
    const profileType = user?.user_type || user?.role;
    const authType = authUser?.user_type || authUser?.role;
    return profileType || authType;
  }, [user, authUser]);

  const isAccountDeactivated = React.useMemo(() => {
    const deactiveValue = user?.deactive_account;
    return deactiveValue === true || deactiveValue === 1 || deactiveValue === "1";
  }, [user]);

  const isArtisan = React.useMemo(() => {
    return user?.role === "artisan" || userType === "artisan";
  }, [user?.role, userType]);

  const loadProfile = async (forceApiUpdate = false) => {
    try {
      const res = await getProfileById(authUser?.id);
      if (!res.success) throw new Error(res.error);
      const profileData = res.data;

      const persistedData = authUser;
      const hasPersistedData = persistedData && Object.keys(persistedData).length > 0;

      let mergedData;
      if (hasPersistedData && !forceApiUpdate) {
        mergedData = { ...profileData, ...persistedData };
      } else {
        mergedData = { ...persistedData, ...profileData };
      }

      const currentDataStr = JSON.stringify(user);
      const newDataStr = JSON.stringify(mergedData);

      if (currentDataStr !== newDataStr || forceApiUpdate) {
        setUserProfile(mergedData);

        if (forceApiUpdate || !hasPersistedData) {
          dispatch(setUser(mergedData));
          await saveProfileBackup(mergedData);
        }
      }

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
        role: mergedData?.role || "user",
        skills: mergedData?.skills || [],
      });

      if (mergedData?.role === "artisan") {
        loadJobs();
      }
    } catch (error: any) {
      let fallbackData = null;

      if (authUser && Object.keys(authUser).length > 0) {
        fallbackData = authUser;
      } else {
        fallbackData = await getProfileBackup();
      }

      if (fallbackData) {
        setUserProfile(fallbackData);

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
          role: fallbackData?.role || "user",
          skills: fallbackData?.skills || [],
        });
      } else {
        Alert.alert("Error", "Failed to load profile. Please try logging in again.", [
          { text: "OK", onPress: () => router.replace("/auth/login") },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile(true);
  };

  const handleUpdateProfile = async () => {
    const trimmedForm = {
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      location: editForm.location.trim(),
      country: editForm.country.trim(),
      bio: editForm.bio.trim(),
      role: editForm.role,
      skills: editForm.skills,
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
      const userId = user && typeof user.id === "string" ? user.id : undefined;
      const response = userId
        ? await updateProfileById(userId, trimmedForm)
        : { success: false, error: "No user id" };

      if (response.success) {
        const fullName = `${trimmedForm.first_name} ${trimmedForm.last_name}`.trim();

        const updatedUser = {
          ...user,
          ...trimmedForm,
          first_name: trimmedForm.first_name,
          last_name: trimmedForm.last_name,
          user_name: fullName,
          name: fullName,
          username: fullName,
          email: trimmedForm.email,
          user_email: trimmedForm.email,
          userEmail: trimmedForm.email,
          phone: trimmedForm.phone,
          bio: trimmedForm.bio,
          location: trimmedForm.location,
          country: trimmedForm.country,
          role: trimmedForm.role,
          skills: trimmedForm.skills,
          _lastUpdated: new Date().toISOString(),
        };

        dispatch(setUser(updatedUser));
        await saveProfileBackup(updatedUser);
        setUserProfile(updatedUser);

        Alert.alert("Success", "Profile updated successfully!", [
          { text: "OK", onPress: () => setEditModalVisible(false) },
        ]);
      } else {
        throw new Error(response.error || "Update failed");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message_desc ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update profile. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAccountStatus = async () => {
    const newStatus = !isAccountDeactivated;
    const action = newStatus ? "deactivate" : "activate";

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Account`,
      `Are you sure you want to ${action} your account? ${
        newStatus ? "You won't be able to access most features." : "Your account will be fully restored."
      }`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: newStatus ? "destructive" : "default",
          onPress: async () => {
            if (user?.id) {
              setUpdating(true);
              const res = await updateProfileById(user.id, { deactive_account: newStatus });
              setUpdating(false);

              if (res.success) {
                const updatedUser = { ...user, deactive_account: newStatus };
                setUserProfile(updatedUser);
                dispatch(setUser(updatedUser));
                await saveProfileBackup(updatedUser);
                Alert.alert("Success", `Account ${action}d successfully!`);
              } else {
                Alert.alert("Error", res.error || `Failed to ${action} account`);
              }
            }
          },
        },
      ]
    );
  };

  const handleAddSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (!trimmedSkill) {
      Alert.alert("Error", "Please enter a skill");
      return;
    }

    if (editForm.skills.includes(trimmedSkill)) {
      Alert.alert("Error", "This skill already exists");
      return;
    }

    if (editForm.skills.length >= 10) {
      Alert.alert("Error", "Maximum 10 skills allowed");
      return;
    }

    setEditForm({ ...editForm, skills: [...editForm.skills, trimmedSkill] });
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter((skill) => skill !== skillToRemove),
    });
  };

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
      const { error } = await supabase.auth.updateUser({ password: settingsForm.newPassword });
      if (error) throw error;
      Alert.alert("Success", "Password changed successfully. Please login again.");
      setSettingsModalVisible(false);
      await clearAllStorage();
      dispatch(logout());
      router.replace("/auth/login");
    } catch (error: any) {
      const msg = error?.message || "Failed to change password.";
      Alert.alert("Error", msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    setUpdating(true);
    const result = await logoutUser();
    setUpdating(false);
    if (result.success) {
      await clearAllStorage();
      dispatch(logout());
      router.replace("/auth/login");
    } else {
      Alert.alert("Error", result.error || "Failed to log out");
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

  // RENDER JOB MODAL CONTENT
  const renderJobModalContent = () => (
    <>
      <Text style={styles.inputLabel}>Job Type *</Text>
      <View style={styles.jobTypeContainer}>
        <TouchableOpacity
          style={[styles.jobTypeButton, jobForm.job_type === "task" && styles.jobTypeButtonActive]}
          onPress={() => setJobForm({ ...jobForm, job_type: "task" })}
          disabled={updating}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={jobForm.job_type === "task" ? "#fff" : primaryColor}
          />
          <Text style={[styles.jobTypeText, jobForm.job_type === "task" && styles.jobTypeTextActive]}>
            Task
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.jobTypeButton, jobForm.job_type === "project" && styles.jobTypeButtonActive]}
          onPress={() => setJobForm({ ...jobForm, job_type: "project" })}
          disabled={updating}
        >
          <Ionicons
            name="briefcase-outline"
            size={20}
            color={jobForm.job_type === "project" ? "#fff" : primaryColor}
          />
          <Text style={[styles.jobTypeText, jobForm.job_type === "project" && styles.jobTypeTextActive]}>
            Project
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>Job Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Professional Plumbing Services"
        placeholderTextColor="#999"
        value={jobForm.title}
        onChangeText={(text) => setJobForm({ ...jobForm, title: text })}
        editable={!updating}
      />

      <Text style={styles.inputLabel}>Category</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Plumbing, Electrical, Carpentry"
        placeholderTextColor="#999"
        value={jobForm.category}
        onChangeText={(text) => setJobForm({ ...jobForm, category: text })}
        editable={!updating}
      />

      <Text style={styles.inputLabel}>Description *</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Describe your services, experience, and what makes you stand out..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={6}
        value={jobForm.description}
        onChangeText={(text) => setJobForm({ ...jobForm, description: text })}
        textAlignVertical="top"
        editable={!updating}
      />

      <Text style={styles.inputLabel}>Budget Type *</Text>
      <View style={styles.budgetTypeContainer}>
        <TouchableOpacity
          style={[styles.budgetTypeButton, jobForm.budget_type === "fixed" && styles.budgetTypeButtonActive]}
          onPress={() => setJobForm({ ...jobForm, budget_type: "fixed" })}
          disabled={updating}
        >
          <Text style={[styles.budgetTypeText, jobForm.budget_type === "fixed" && styles.budgetTypeTextActive]}>
            Fixed Price
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.budgetTypeButton, jobForm.budget_type === "hourly" && styles.budgetTypeButtonActive]}
          onPress={() => setJobForm({ ...jobForm, budget_type: "hourly" })}
          disabled={updating}
        >
          <Text style={[styles.budgetTypeText, jobForm.budget_type === "hourly" && styles.budgetTypeTextActive]}>
            Hourly Rate
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.budgetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>
            Min Budget {jobForm.budget_type === "hourly" ? "(₦/hr)" : "(₦)"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5000"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={jobForm.budget_min}
            onChangeText={(text) => setJobForm({ ...jobForm, budget_min: text })}
            editable={!updating}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.inputLabel}>
            Max Budget {jobForm.budget_type === "hourly" ? "(₦/hr)" : "(₦)"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 15000"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={jobForm.budget_max}
            onChangeText={(text) => setJobForm({ ...jobForm, budget_max: text })}
            editable={!updating}
          />
        </View>
      </View>

      <Text style={styles.inputLabel}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Port Harcourt, Rivers State"
        placeholderTextColor="#999"
        value={jobForm.location}
        onChangeText={(text) => setJobForm({ ...jobForm, location: text })}
        editable={!updating}
      />

      <Text style={styles.inputLabel}>Deadline (Optional)</Text>
      <View style={styles.deadlineContainer}>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
          disabled={updating}
        >
          <Ionicons name="calendar-outline" size={20} color={primaryColor} />
          <Text style={styles.datePickerButtonText}>
            {jobForm.deadline ? jobForm.deadline : "Select Date"}
          </Text>
        </TouchableOpacity>
        {jobForm.deadline && (
          <TouchableOpacity
            style={styles.clearDateButton}
            onPress={clearDeadline}
            disabled={updating}
          >
            <Ionicons name="close-circle" size={24} color="#DC3545" />
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
          textColor={primaryColor}
        />
      )}

      {Platform.OS === 'ios' && showDatePicker && (
        <View style={styles.iosDatePickerActions}>
          <TouchableOpacity
            style={styles.iosDateButton}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.iosDateButtonTextCancel}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iosDateButton, styles.iosDateButtonDone]}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.iosDateButtonTextDone}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.inputLabel}>Required Skills</Text>
      <View style={styles.skillsInputContainer}>
        <TextInput
          style={styles.skillInput}
          placeholder="Add a skill (e.g., Pipe fitting, Welding)"
          placeholderTextColor="#999"
          value={newJobSkill}
          onChangeText={setNewJobSkill}
          onSubmitEditing={handleAddJobSkill}
          returnKeyType="done"
          editable={!updating}
        />
        <TouchableOpacity
          style={styles.addSkillButton}
          onPress={handleAddJobSkill}
          disabled={updating || !newJobSkill.trim()}
        >
          <Ionicons name="add-circle" size={24} color={newJobSkill.trim() ? primaryColor : "#ccc"} />
        </TouchableOpacity>
      </View>

      {jobForm.skills && jobForm.skills.length > 0 && (
        <View style={styles.skillsContainer}>
          {jobForm.skills.map((skill, index) => (
            <View key={index} style={styles.skillChipEditable}>
              <Text style={styles.skillText}>{skill}</Text>
              <TouchableOpacity onPress={() => handleRemoveJobSkill(skill)} disabled={updating} style={styles.removeSkillButton}>
                <Ionicons name="close-circle" size={18} color={primaryColor} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.inputLabel}>Images (Optional - Max 2)</Text>
      <TouchableOpacity
        style={styles.imagePickerButton}
        onPress={handlePickJobImages}
        disabled={jobImageUploading || jobForm.images.length >= 2}
      >
        {jobImageUploading ? (
          <ActivityIndicator color={primaryColor} />
        ) : (
          <>
            <Ionicons name="images-outline" size={24} color={primaryColor} />
            <Text style={styles.imagePickerText}>
              {jobForm.images.length >= 2 ? "Maximum images reached" : "Add Images"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {jobForm.images.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.inputLabel, { marginBottom: 8 }]}>
            Selected Images ({jobForm.images.length}/2)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedImagesScroll}>
            {jobForm.images.map((imageUri, index) => (
              <View key={index} style={styles.selectedImageContainer}>
                <Image source={{ uri: imageUri }} style={styles.selectedImage} resizeMode="cover" />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveJobImage(index)}>
                  <Ionicons name="close-circle" size={24} color="#DC3545" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <Animated.View
        style={[
          styles.fixedHeader,
          {
            opacity: scrollY.interpolate({
              inputRange: [0, 100],
              outputRange: [1, 0.95],
              extrapolate: "clamp",
            }),
          },
        ]}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: user?.avatar || "https://via.placeholder.com/120" }} style={styles.avatar} />
          <TouchableOpacity style={styles.editAvatarButton} onPress={handlePickAvatar} disabled={avatarUploading}>
            {avatarUploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="camera" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{displayEmail}</Text>

        {user?.role || userType ? (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || userType}</Text>
          </View>
        ) : null}

        {isAccountDeactivated && (
          <View style={styles.deactivatedBadge}>
            <Ionicons name="warning" size={14} color="#DC3545" />
            <Text style={styles.deactivatedText}>Account Deactivated</Text>
          </View>
        )}

        <View style={styles.userIdContainer}>
          <Ionicons name="id-card-outline" size={14} color="#999" />
          <Text style={styles.userId}>ID: {userId}</Text>
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          {(user?.average_rating !== undefined || user?.rating !== undefined) && (
            <View style={styles.statItem}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{(user.average_rating || user.rating || 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>
                {user?.rating_count || user?.reviews || 0}{" "}
                {(user?.rating_count || user?.reviews || 0) === 1 ? "Review" : "Reviews"}
              </Text>
            </View>
          )}
          {(user?.completed_projects !== undefined || user?.completedProjects !== undefined) && (
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color="#28a745" />
              <Text style={styles.statValue}>{user.completed_projects || user.completedProjects}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
          )}

          {user?.views !== undefined && user?.role === "artisan" && (
            <View style={styles.statItem}>
              <Ionicons name="eye" size={24} color="#007AFF" />
              <Text style={styles.statValue}>{user.views}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          )}
        </View>

        {/* Jobs Section - Only for Artisans */}
        {isArtisan && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="briefcase-outline" size={20} color="#EE4710" />
              <Text style={styles.sectionTitle}>My Jobs</Text>
              <TouchableOpacity
                style={styles.addJobButton}
                onPress={() => {
                  setEditingJob(null);
                  setJobForm({
                    title: "",
                    description: "",
                    images: [],
                    job_type: "project",
                    budget_min: "",
                    budget_max: "",
                    budget_type: "fixed",
                    location: "",
                    category: "",
                    deadline: "",
                    skills: [],
                  });
                  setJobModalVisible(true);
                }}
              >
                <Ionicons name="add-circle" size={24} color={primaryColor} />
              </TouchableOpacity>
            </View>

            {loadingJobs ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : jobs.length === 0 ? (
              <Text style={styles.noJobsText}>No jobs posted yet. Tap + to add your first job!</Text>
            ) : (
              <View style={styles.jobsList}>
                {jobs.map((job) => (
                  <View key={job.id} style={styles.jobCard}>
                    {((job.images && job.images.length > 0) || (job.job_images && job.job_images.length > 0)) && (
                      <View style={styles.jobImageContainer}>
                        {(job.images || job.job_images || []).slice(0, 2).map((img, index) => (
                          <TouchableOpacity key={img.id || index} style={styles.jobImageWrapper}>
                            <Image source={{ uri: img.image_url }} style={styles.jobCardImage} resizeMode="cover" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <View style={styles.jobContent}>
                      <View style={styles.jobHeader}>
                        <Text style={styles.jobTitle} numberOfLines={2}>
                          {job.title}
                        </Text>
                        <View style={styles.jobActions}>
                          <View
                            style={[
                              styles.statusBadge,
                              job.status === "open" ? styles.statusOpen : styles.statusClosed,
                            ]}
                          >
                            <Text style={styles.statusText}>{job.status}</Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.jobDescription} numberOfLines={3}>
                        {job.description}
                      </Text>

                      <View style={styles.jobFooter}>
                        <View style={styles.jobDateContainer}>
                          <Ionicons name="calendar-outline" size={14} color="#6c757d" />
                          <Text style={styles.jobDate}>{new Date(job.created_at).toLocaleDateString()}</Text>
                        </View>

                        <View style={styles.jobActionButtons}>
                          <TouchableOpacity onPress={() => handleEditJob(job)} style={styles.jobActionButton}>
                            <Ionicons name="create-outline" size={20} color="#007AFF" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteJob(job.id)} style={styles.jobActionButton}>
                            <Ionicons name="trash-outline" size={20} color="#DC3545" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
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

          {user?.is_verified !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons
                name={
                  user.is_verified === true || user.is_verified === "yes" || user.is_verified === 1
                    ? "checkmark-circle"
                    : "close-circle"
                }
                size={18}
                color={
                  user.is_verified === true || user.is_verified === "yes" || user.is_verified === 1
                    ? "#28a745"
                    : "#666"
                }
              />
              <Text style={styles.infoLabel}>Verified:</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      user.is_verified === true || user.is_verified === "yes" || user.is_verified === 1
                        ? "#28a745"
                        : "#666",
                  },
                ]}
              >
                {user.is_verified === true || user.is_verified === "yes" || user.is_verified === 1 ? "Yes" : "No"}
              </Text>
            </View>
          )}

          {(user?.memberSince || user?.member_since) && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.infoLabel}>Member Since:</Text>
              <Text style={styles.infoValue}>{user.memberSince || user.member_since}</Text>
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
          <TouchableOpacity style={styles.primaryButton} onPress={() => setEditModalVisible(true)}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setSettingsModalVisible(true)}>
            <Ionicons name="settings-outline" size={20} color="#EE4710" />
            <Text style={styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>

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
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="cloud-download-outline" size={20} color="#007AFF" />
            <Text style={styles.syncButtonText}>Sync from Server</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#DC3545" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Deactivate/Activate Account Button */}
        <TouchableOpacity
          style={isAccountDeactivated ? styles.activateButton : styles.deactivateButton}
          onPress={handleToggleAccountStatus}
          disabled={updating}
        >
          <Ionicons
            name={isAccountDeactivated ? "checkmark-circle-outline" : "close-circle-outline"}
            size={20}
            color={isAccountDeactivated ? "#28a745" : "#DC3545"}
          />
          <Text style={isAccountDeactivated ? styles.activateButtonText : styles.deactivateButtonText}>
            {isAccountDeactivated ? "Activate Account" : "Deactivate Account"}
          </Text>
        </TouchableOpacity>

        {/* Add Job Modal */}
        <Modal
          visible={jobModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setJobModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Post a New Job</Text>
                <TouchableOpacity onPress={() => setJobModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {renderJobModalContent()}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setJobModalVisible(false);
                      setJobForm({
                        title: "",
                        description: "",
                        images: [],
                        job_type: "project",
                        budget_min: "",
                        budget_max: "",
                        budget_type: "fixed",
                        location: "",
                        category: "",
                        deadline: "",
                        skills: [],
                      });
                    }}
                    disabled={updating}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, updating && { opacity: 0.7 }]}
                    onPress={handleSaveJob}
                    disabled={updating}
                  >
                    {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Post Job</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Edit Job Modal */}
        <Modal
          visible={editJobModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setEditJobModalVisible(false);
            setEditingJob(null);
            setJobForm({
              title: "",
              description: "",
              images: [],
              job_type: "project",
              budget_min: "",
              budget_max: "",
              budget_type: "fixed",
              location: "",
              category: "",
              deadline: "",
              skills: [],
            });
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Job</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditJobModalVisible(false);
                    setEditingJob(null);
                    setJobForm({
                      title: "",
                      description: "",
                      images: [],
                      job_type: "project",
                      budget_min: "",
                      budget_max: "",
                      budget_type: "fixed",
                      location: "",
                      category: "",
                      deadline: "",
                      skills: [],
                    });
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {renderJobModalContent()}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditJobModalVisible(false);
                      setEditingJob(null);
                      setJobForm({
                        title: "",
                        description: "",
                        images: [],
                        job_type: "project",
                        budget_min: "",
                        budget_max: "",
                        budget_type: "fixed",
                        location: "",
                        category: "",
                        deadline: "",
                        skills: [],
                      });
                    }}
                    disabled={updating}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, updating && { opacity: 0.7 }]}
                    onPress={handleSaveJob}
                    disabled={updating}
                  >
                    {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Update Job</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

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
                <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeButton}>
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

                <Text style={styles.inputLabel}>Skills</Text>
                <View style={styles.skillsInputContainer}>
                  <TextInput
                    style={styles.skillInput}
                    placeholder="Add a skill (e.g., Plumbing, Carpentry)"
                    placeholderTextColor="#999"
                    value={newSkill}
                    onChangeText={setNewSkill}
                    onSubmitEditing={handleAddSkill}
                    returnKeyType="done"
                    editable={!updating}
                  />
                  <TouchableOpacity
                    style={styles.addSkillButton}
                    onPress={handleAddSkill}
                    disabled={updating || !newSkill.trim()}
                  >
                    <Ionicons name="add-circle" size={24} color={newSkill.trim() ? primaryColor : "#ccc"} />
                  </TouchableOpacity>
                </View>

                {editForm.skills.length > 0 && (
                  <View style={styles.skillsContainer}>
                    {editForm.skills.map((skill, index) => (
                      <View key={index} style={styles.skillChipEditable}>
                        <Text style={styles.skillText}>{skill}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveSkill(skill)}
                          disabled={updating}
                          style={styles.removeSkillButton}
                        >
                          <Ionicons name="close-circle" size={18} color={primaryColor} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.inputLabel}>Account Type</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <Text style={{ marginRight: 12 }}>User</Text>
                  <Switch
                    value={(editForm.role || user?.role) === "artisan"}
                    onValueChange={async (value) => {
                      const newRole = value ? "artisan" : "user";
                      setEditForm({ ...editForm, role: newRole });
                      if (user?.id) {
                        setUpdating(true);
                        const res = await updateProfileById(user.id, { role: newRole });
                        setUpdating(false);
                        if (res.success) {
                          setUserProfile((prev) => (prev ? { ...prev, role: newRole } : prev));
                          dispatch(setUser({ ...user, role: newRole }));
                          await saveProfileBackup({ ...user, role: newRole });
                        } else {
                          Alert.alert("Error", res.error || "Failed to update role");
                        }
                      }
                    }}
                    disabled={updating}
                    trackColor={{ false: "#ddd", true: primaryColor }}
                    thumbColor={primaryColor}
                  />
                  <Text style={{ marginLeft: 12 }}>Artisan</Text>
                </View>

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
                    {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Save Changes</Text>}
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
                <TouchableOpacity onPress={() => setSettingsModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitleModal}>Change Password</Text>

                <Text style={styles.inputLabel}>Current Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={settingsForm.currentPassword}
                  onChangeText={(text) => setSettingsForm({ ...settingsForm, currentPassword: text })}
                  editable={!updating}
                />

                <Text style={styles.inputLabel}>New Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password (min 6 characters)"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={settingsForm.newPassword}
                  onChangeText={(text) => setSettingsForm({ ...settingsForm, newPassword: text })}
                  editable={!updating}
                />

                <Text style={styles.inputLabel}>Confirm New Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={settingsForm.confirmPassword}
                  onChangeText={(text) => setSettingsForm({ ...settingsForm, confirmPassword: text })}
                  editable={!updating}
                />

                <TouchableOpacity
                  style={[styles.submitButton, { marginBottom: 20 }, updating && { opacity: 0.7 }]}
                  onPress={handleChangePassword}
                  disabled={updating}
                >
                  {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Change Password</Text>}
                </TouchableOpacity>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setSettingsModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Animated.ScrollView>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  fixedHeader: {
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
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
  deactivatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFDDDD",
    gap: 4,
  },
  deactivatedText: {
    color: "#DC3545",
    fontSize: 13,
    fontWeight: "600",
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
    flex: 1,
  },
  addJobButton: {
    padding: 4,
  },
  noJobsText: {
    fontSize: 15,
    color: "#6c757d",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  jobsList: {
    gap: 16,
  },
  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  jobImageContainer: {
    flexDirection: "row",
    height: 180,
    backgroundColor: "#F8F9FA",
  },
  jobImageWrapper: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#fff",
  },
  jobCardImage: {
    width: "100%",
    height: "100%",
  },
  jobContent: {
    padding: 16,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  jobActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  jobDescription: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 20,
    marginBottom: 16,
  },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  jobDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  jobDate: {
    fontSize: 13,
    color: "#6c757d",
  },
  jobActionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  jobActionButton: {
    padding: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  statusOpen: {
    backgroundColor: "#D1FAE5",
  },
  statusClosed: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#065F46",
  },
  jobImagesScroll: {
    marginVertical: 8,
  },
  jobImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
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
  skillChipEditable: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5DD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFCCBB",
    gap: 6,
  },
  skillText: {
    color: primaryColor,
    fontSize: 13,
    fontWeight: "500",
  },
  removeSkillButton: {
    marginLeft: 2,
  },
  skillsInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A1A1A",
    backgroundColor: "#F4F4FB",
  },
  addSkillButton: {
    padding: 4,
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
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: secondaryColor,
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  syncButtonText: {
    color: primaryColor,
    fontWeight: "600",
    fontSize: 16,
  },
  deactivateButton: {
    flexDirection: "row",
    backgroundColor: "#FFF5F5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFDDDD",
    marginTop: 8,
    marginBottom: 70,
  },
  deactivateButtonText: {
    color: "#DC3545",
    fontWeight: "600",
    fontSize: 16,
  },
  activateButton: {
    flexDirection: "row",
    backgroundColor: "#F0FFF4",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#C6F6D5",
    marginTop: 8,
    marginBottom: 70,
  },
  activateButtonText: {
    color: "#28a745",
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
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: secondaryColor,
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  imagePickerText: {
    color: primaryColor,
    fontWeight: "600",
    fontSize: 15,
  },
  selectedImagesScroll: {
    marginBottom: 12,
  },
  selectedImageContainer: {
    position: "relative",
    marginRight: 8,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
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
  jobTypeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  jobTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: secondaryColor,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: secondaryColor,
    gap: 8,
  },
  jobTypeButtonActive: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  jobTypeText: {
    color: primaryColor,
    fontWeight: "600",
    fontSize: 15,
  },
  jobTypeTextActive: {
    color: "#fff",
  },
  budgetTypeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  budgetTypeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4FB",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5E5",
  },
  budgetTypeButtonActive: {
    backgroundColor: "#FFE5DD",
    borderColor: primaryColor,
  },
  budgetTypeText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },
  budgetTypeTextActive: {
    color: primaryColor,
  },
  budgetRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4FB",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    gap: 10,
  },
  datePickerButtonText: {
    color: "#1A1A1A",
    fontSize: 15,
    fontWeight: "500",
  },
  clearDateButton: {
    padding: 4,
  },
  iosDatePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F4F4FB",
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  iosDateButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  iosDateButtonDone: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  iosDateButtonTextCancel: {
    color: "#666",
    fontSize: 15,
    fontWeight: "600",
  },
  iosDateButtonTextDone: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
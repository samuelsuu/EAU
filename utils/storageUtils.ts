// utils/storageUtils.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistor } from "@/redux/Store";

/**
 * Clear all stored data (for logout)
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    // 1. Purge Redux Persist
    await persistor.purge();
    console.log("✅ Redux persist purged");

    // 2. Clear specific AsyncStorage keys
    const keysToRemove = [
      "persist:root",
      "user_profile",
      "user_profile_backup",
      "auth_token",
      "user_data",
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log("✅ AsyncStorage cleared");

    // Optional: Clear ALL AsyncStorage (nuclear option)
    // await AsyncStorage.clear();
  } catch (error) {
    console.error("❌ Error clearing storage:", error);
    throw error;
  }
};

/**
 * Save user profile backup
 */
export const saveProfileBackup = async (userData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      "user_profile_backup",
      JSON.stringify(userData)
    );
    console.log("✅ Profile backup saved");
  } catch (error) {
    console.warn("⚠️ Failed to save profile backup:", error);
  }
};

/**
 * Get user profile backup
 */
export const getProfileBackup = async (): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem("user_profile_backup");
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.warn("⚠️ Failed to get profile backup:", error);
    return null;
  }
};

/**
 * Debug: Log all storage contents
 */
export const debugStorage = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log("📦 All AsyncStorage Keys:", allKeys);

    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      try {
        console.log(`🔑 ${key}:`, value ? JSON.parse(value) : null);
      } catch {
        console.log(`🔑 ${key}:`, value);
      }
    }
  } catch (error) {
    console.error("❌ Debug storage error:", error);
  }
};
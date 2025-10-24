// app/index.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/Store";

export default function Index() {
  const router = useRouter();
  const { token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Small delay to show splash/loading if needed
    const timer = setTimeout(() => {
      if (token && user) {
        // User is logged in, go to main app
        router.replace("/(tabs)/home");
      } else {
        // User is not logged in, go to login
        router.replace("/auth/login");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [token, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#EE4710" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F4FB",
  },
});
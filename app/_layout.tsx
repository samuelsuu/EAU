// app/_layout.tsx
import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { store, persistor, RootState } from "@/redux/Store";
import AlertComponent from "@/components/base/AlertComponent";
import { useDispatch } from "react-redux";
import { hideAlert } from "@/redux/slices/alertSlice";

// Loading Screen Component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#EE4710" />
    </View>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";

    // If user is logged in and trying to access auth pages, redirect to home
    if (token && user && inAuthGroup) {
      router.replace("/(tabs)/home");
    }

    // If user is not logged in and trying to access protected pages, redirect to login
    if (!token && inTabsGroup) {
      router.replace("/auth/login");
    }
  }, [token, user, segments]);

  return <>{children}</>;
}

// Alert Dialog Handler
function AlertDialog() {
  const dispatch = useDispatch();
  const { visible, alertData } = useSelector((state: RootState) => state.alert);

  const handleAlertPress = (action?: string) => {
    dispatch(hideAlert());
    // Add any additional logic based on action
  };

  return (
    <AlertComponent
      type={alertData?.type || "info"}
      message={alertData?.message}
      message_desc={alertData?.message_desc}
      visible={visible}
      onPress={handleAlertPress}
      buttonText={alertData?.buttonText || "OK"}
      buttonText2={alertData?.buttonText2 || "Close"}
      showLoginButton={alertData?.showLoginButton || false}
      isLoading={false}
    />
  );
}

// Inner Layout (with Redux access)
function RootLayoutNav() {
  return (
    <ProtectedRoute>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth screens */}
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        
        {/* Main app screens */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Other screens */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
         <Stack.Screen name="task" options={{ headerShown: false }} />
         <Stack.Screen name="project" options={{ headerShown: false }} />
      </Stack>
      <AlertDialog />
    </ProtectedRoute>
  );
}

// Root Layout (with Provider and PersistGate)
export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <RootLayoutNav />
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
// app/index.tsx
import {
  primaryColor,
  secondaryColor,
  whiteColor
} from "@/constants/GlobalConstants";
import { RootState } from "@/redux/Store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

const { width, height } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  const { token, user } = useSelector((state: RootState) => state.auth);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Scale up logo
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Slide up text
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Start rotating loading indicator
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    // Navigation logic - wait minimum 3 seconds
    const timer = setTimeout(() => {
      if (token && user) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/auth/onboarding");
      }
    }, 3000); 

    return () => clearTimeout(timer);
  }, [token, user, fadeAnim, scaleAnim, slideAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={[primaryColor, "#1A5E32", secondaryColor]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="briefcase" size={64} color={primaryColor} />
          </View>
        </View>

        {/* App name */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.appName}>Artisan Network</Text>
          <Text style={styles.tagline}>Connect. Work. Grow.</Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View style={styles.loadingRing} />
        </Animated.View>
      </Animated.View>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.footerText}>Powered by Artisan Network</Text>
        <Text style={styles.version}>v1.0.0</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: primaryColor,
  },
  circle: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 999,
  },
  circle1: {
    top: -100,
    right: -100,
    width: 300,
    height: 300,
  },
  circle2: {
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
  },
  circle3: {
    top: height * 0.3,
    left: -80,
    width: 160,
    height: 160,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: whiteColor,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: whiteColor,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 3,
    fontWeight: "400",
    textTransform: "uppercase",
  },
  loadingContainer: {
    marginTop: 20,
  },
  loadingRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderTopColor: whiteColor,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  version: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10,
    marginTop: 4,
  },
});
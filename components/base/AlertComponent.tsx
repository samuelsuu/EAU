import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { BlurView } from 'expo-blur';
import { Ionicons } from "@expo/vector-icons";
import * as Constant from "@/constants/GlobalConstants";
import { usePrimaryColor } from "@/hooks/index";
import { useSelector } from "react-redux";

const { width } = Dimensions.get("window");

interface AlertComponentProps {
  type: "success" | "error" | "warning" | "info";
  message?: string;
  message_desc?: string;
  onPress: (action?: string) => void;
  visible: boolean;
  buttonText?: string;
  buttonText2?: string;
  showLoginButton?: boolean;
  isLoading?: boolean;
}

interface RootState {
  global?: {
    globalSettings?: {
      data?: {
        localize?: {
          success?: string;
          error?: string;
        };
      };
    };
  };
}

const AlertComponent: React.FC<AlertComponentProps> = ({
  type = "success",
  message,
  message_desc,
  onPress,
  visible,
  buttonText = "OK",
  buttonText2 = "Cancel",
  showLoginButton = false,
  isLoading = false,
}) => {
  const settings = useSelector(
    (state: RootState) => state?.global?.globalSettings?.data
  );
  const primaryColor = usePrimaryColor();

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const defaultMessage =
    type === "success"
      ? settings?.localize?.success || "Success"
      : settings?.localize?.error || "Error";

  // Configuration based on type
  const config = {
    success: {
      icon: "checkmark-circle",
      iconColor: "#10b981",
      bgGradient: ["#ecfdf5", "#d1fae5"],
      borderColor: "#6ee7b7",
      titleColor: "#059669",
      glowColor: "rgba(16, 185, 129, 0.3)",
    },
    error: {
      icon: "close-circle",
      iconColor: "#ef4444",
      bgGradient: ["#fef2f2", "#fee2e2"],
      borderColor: "#fca5a5",
      titleColor: "#dc2626",
      glowColor: "rgba(239, 68, 68, 0.3)",
    },
    warning: {
      icon: "warning",
      iconColor: "#f59e0b",
      bgGradient: ["#fffbeb", "#fef3c7"],
      borderColor: "#fcd34d",
      titleColor: "#d97706",
      glowColor: "rgba(245, 158, 11, 0.3)",
    },
    info: {
      icon: "information-circle",
      iconColor: "#3b82f6",
      bgGradient: ["#eff6ff", "#dbeafe"],
      borderColor: "#93c5fd",
      titleColor: "#2563eb",
      glowColor: "rgba(59, 130, 246, 0.3)",
    },
  };

  const currentConfig = config[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => onPress()}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Blur Effect (iOS) */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        )}

        <Animated.View
          style={[
            styles.dialogContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Glow Effect */}
          <View
            style={[
              styles.glowEffect,
              {
                shadowColor: currentConfig.iconColor,
                backgroundColor: currentConfig.glowColor,
              },
            ]}
          />

          <View
            style={[
              styles.dialogContent,
              {
                borderColor: currentConfig.borderColor,
              },
            ]}
          >
            {/* Animated Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: currentConfig.iconColor,
                  transform: [
                    {
                      rotate: scaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["-180deg", "0deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name={currentConfig.icon as any}
                size={50}
                color="#fff"
              />
              
              {/* Pulse Animation */}
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    borderColor: currentConfig.iconColor,
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.3],
                    }),
                    transform: [
                      {
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </Animated.View>

            {/* Content */}
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.typemessage,
                  { color: currentConfig.titleColor },
                ]}
              >
                {message || defaultMessage}
              </Text>
              {message_desc && (
                <Text style={styles.message}>{message_desc}</Text>
              )}
            </View>

            {/* Decorative Line */}
            <View
              style={[
                styles.decorativeLine,
                { backgroundColor: currentConfig.borderColor },
              ]}
            />

            {/* Buttons */}
            <View style={styles.buttonWrapper}>
              {/* Cancel/Secondary Button */}
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => onPress("cancel")}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-outline"
                  size={20}
                  color="#6b7280"
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.buttonText, { color: "#374151" }]}>
                  {buttonText2}
                </Text>
              </TouchableOpacity>

              {/* Primary Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  {
                    backgroundColor: showLoginButton
                      ? primaryColor
                      : currentConfig.iconColor,
                  },
                ]}
                onPress={() => onPress("login")}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-outline"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.buttonText, { color: "#fff" }]}>
                      {buttonText}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialogContainer: {
    width: "100%",
    maxWidth: 380,
    position: "relative",
  },
  glowEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    opacity: 0.4,
    shadowRadius: 30,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  dialogContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingTop: 80,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
    overflow: "hidden",
  },
  iconContainer: {
    position: "absolute",
    top: -45,
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  pulseRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  typemessage: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: Constant.primaryFontSemiBold,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    fontFamily: Constant.primaryFontRegular,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  decorativeLine: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
    opacity: 0.3,
  },
  buttonWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  cancelButton: {
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  primaryButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Constant.primaryFontMedium,
    letterSpacing: 0.3,
  },
});

export default AlertComponent;
// app/(auth)/Login.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import CustomTextInput from "@/components/base/TextInput";
import Button from "@/components/base/Button";
import AlertComponent from "@/components/base/AlertComponent";
import { loginUser } from "@/api/api";
import { setToken, setUser } from "@/redux/slices/authSlice";
import {
  primaryColor,
  secondaryColor,
  backgroundColor,
  whiteColor,
  fontColor,
} from "@/constants/GlobalConstants";

const Login: React.FC = () => {
  const { width: windowWidth } = Dimensions.get("window");
  const router = useRouter();
  const dispatch = useDispatch();

  // ---------------- State ----------------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    type: "error" as "error" | "success",
    message: "",
    message_desc: "",
  });

  // ---------------- Animation ----------------
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // ---------------- Validation ----------------
  const validateInputs = () => {
    const newErrors: any = {};

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- Handle Input Change ----------------
  const handleInputChange = (field: "email" | "password", value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    if (field === "email") {
      setEmail(value);
    } else {
      setPassword(value);
    }
  };

  // ---------------- Handle Login ----------------
  const handleLogin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const loginData = {
        email: email.trim(),
        password: password,
      };

      console.log("📤 Attempting login with:", { email: loginData.email });

      const response = await loginUser(loginData);
      
      console.log("📥 Full API response:", response);
      console.log("📥 Response data:", response?.data);

      const data = response?.data;
      
      if (data?.type === "success" && data?.token && data?.user) {
        console.log("✅ Login successful!");
        
        const userWithEmail = {
          ...data.user,
          email: email.trim(),
          user_email: email.trim(),
        };
        
        dispatch(setToken(data.token));
        dispatch(setUser(userWithEmail));
        
        console.log("💾 Saved user data:", userWithEmail);

        setAlert({
          visible: true,
          type: "success",
          message: data.message || "Login Successful",
          message_desc: data.message_desc || "Welcome back!",
        });
        
        setEmail("");
        setPassword("");
      } else {
        console.error("❌ Login failed");
        setAlert({
          visible: true,
          type: "error",
          message: "Login Failed",
          message_desc: data?.message || data?.message_desc || "Invalid credentials. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("❌ Login error:", error);
      
      const errorData = error?.response?.data;
      const errorMessage = 
        errorData?.message_desc ||
        errorData?.message ||
        error?.message ||
        "An unexpected error occurred. Please try again.";
      
      console.error("❌ Error message:", errorMessage);
      
      setAlert({
        visible: true,
        type: "error",
        message: "Login Failed",
        message_desc: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Alert Handler ----------------
  const handleAlertPress = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
    if (alert.type === "success") {
      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 100);
    }
  };

  // ---------------- UI ----------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => router.replace("/(tabs)/home")}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.skipText}>Skip</Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={primaryColor}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoContainer}>
              {/* <View style={styles.logoCircle}>
                <Ionicons name="lock-closed" size={40} color={whiteColor} />
              </View> */}
              <Image source={require('@/assets/images/splash-icon.png')} style={{ marginTop: 10, width: windowWidth * 0.5, height: 60, resizeMode: 'contain' }} />
            </View>

            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Sign In</Text>
              <Text style={styles.subtitle}>
                Please enter your credentials to continue.
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <CustomTextInput
                value={email}
                onChangeText={(text) => handleInputChange("email", text)}
                placeholder="Email"
                borderColor={touched.email && errors.email ? "#FF6167" : undefined}
                type="text"
                required={false}
                error={touched.email && errors.email}
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <CustomTextInput
                value={password}
                onChangeText={(text) => handleInputChange("password", text)}
                placeholder="Password"
                type="password"
                borderColor={touched.password && errors.password ? "#FF6167" : undefined}
                required={false}
                error={touched.password && errors.password}
                editable={!loading}
              />
            </View>

            {/* Sign In Button */}
            <View style={styles.buttonContainer}>
              <Button
                backgroundColor={primaryColor}
                text="Sign In"
                onPress={handleLogin}
                color={whiteColor}
                disabled={loading}
                loading={loading}
              />
            </View>

            {/* Sign Up Button */}
            <View style={styles.buttonContainer}>
              <Button
                backgroundColor={backgroundColor}
                text="Don't have an account? Sign Up"
                color={primaryColor}
                borderColor="#eaeaea"
                borderRequired
                onPress={() => router.push("/auth/register")}
                disabled={loading}
              />
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              disabled={loading}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Alert Modal */}
          <AlertComponent
            type={alert.type}
            message={alert.message}
            message_desc={alert.message_desc}
            visible={alert.visible}
            onPress={handleAlertPress}
            buttonText="OK"
            buttonText2="Close"
            showLoginButton={false}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginBottom: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: "500",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: primaryColor,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: primaryColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    color: fontColor,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    fontSize: 16,
    fontWeight: "400",
  },
  inputContainer: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  forgotPasswordButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  forgotText: {
    color: primaryColor,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
  },
});
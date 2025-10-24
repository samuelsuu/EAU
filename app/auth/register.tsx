// app/(auth)/Register.tsx
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import CustomTextInput from "@/components/base/TextInput";
import Button from "@/components/base/Button";
import AlertComponent from "@/components/base/AlertComponent";
import { registerUser } from "@/api/api";
import { setToken, setUser } from "@/redux/slices/authSlice";
import {
  primaryColor,
  secondaryColor,
  backgroundColor,
  whiteColor,
  fontColor,
  highlightColor,
} from "@/constants/GlobalConstants";

const Register: React.FC = () => {
  const { width: windowWidth } = Dimensions.get("window");
  const router = useRouter();
  const dispatch = useDispatch();

  // ---------------- State ----------------
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    user_name: "",
    email: "",
    password: "",
    role: "freelancers" as "freelancers" | "employers",
    agree_terms: false,
  });

  const [errors, setErrors] = useState<{
    first_name?: string;
    last_name?: string;
    user_name?: string;
    email?: string;
    password?: string;
    agree_terms?: string;
  }>({});

  const [touched, setTouched] = useState<{
    first_name?: boolean;
    last_name?: boolean;
    user_name?: boolean;
    email?: boolean;
    password?: boolean;
    agree_terms?: boolean;
  }>({});

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

    if (!form.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!form.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.agree_terms) {
      newErrors.agree_terms = "You must agree to the terms and privacy policy";
    }

    setErrors(newErrors);
    setTouched({
      first_name: true,
      last_name: true,
      user_name: true,
      email: true,
      password: true,
      agree_terms: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  // ---------------- Handle Input Change ----------------
  const handleInputChange = (
    field: keyof typeof form,
    value: string | boolean
  ) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ---------------- Handle Register ----------------
  const handleRegister = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const payload: any = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        type: form.role,
        agree_terms: form.agree_terms ? "true" : "false",
      };

      if (form.user_name.trim()) {
        payload.user_name = form.user_name.trim();
      }

      console.log("📤 Attempting registration with:", {
        email: payload.email,
        type: payload.type,
        has_username: !!payload.user_name,
      });

      const response = await registerUser(payload);

      console.log("📥 Registration response:", response);

      const data = response?.data;
      const token = data?.token || data?.data?.token;
      const user = data?.user || data?.data?.user;
      const type = data?.type;
      const message = data?.message || data?.message_desc;

      const isSuccess =
        type === "success" ||
        response?.status === 200 ||
        (token && user) ||
        (message && message.toLowerCase().includes("success"));

      if (isSuccess) {
        console.log("✅ Registration successful!");

        if (token && user) {
          dispatch(setToken(token));
          dispatch(setUser(user));
          console.log("✅ Auto-login successful");

          setAlert({
            visible: true,
            type: "success",
            message: data?.message || "Account Created!",
            message_desc:
              data?.message_desc || "Your account has been created and you're now logged in!",
          });
        } else {
          setAlert({
            visible: true,
            type: "success",
            message: data?.message || "Account Created!",
            message_desc:
              data?.message_desc ||
              "Your account has been created successfully. Please login to continue.",
          });
        }

        setForm({
          first_name: "",
          last_name: "",
          user_name: "",
          email: "",
          password: "",
          role: "freelancers",
          agree_terms: false,
        });
      } else {
        console.error("❌ Registration failed");
        setAlert({
          visible: true,
          type: "error",
          message: "Registration Failed",
          message_desc: message || "Unable to create account. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      console.error("❌ Error response:", error?.response?.data);

      const errorData = error?.response?.data;
      const errorMessage =
        errorData?.message_desc ||
        errorData?.message ||
        error?.message ||
        "An unexpected error occurred. Please try again.";

      setAlert({
        visible: true,
        type: "error",
        message: "Registration Failed",
        message_desc: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Alert Handler ----------------
  const handleAlertPress = () => {
    const wasSuccess = alert.type === "success";
    setAlert((prev) => ({ ...prev, visible: false }));

    if (wasSuccess) {
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
        <Animated.View
          style={[styles.container, { transform: [{ translateY }] }]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Back Button */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={24} color={fontColor} />
              </TouchableOpacity>
            </View>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="person-add" size={40} color={whiteColor} />
              </View>
            </View>

            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join us and start your journey today
              </Text>
            </View>

            {/* First Name */}
            <View style={styles.inputContainer}>
              <CustomTextInput
                value={form.first_name}
                onChangeText={(text) => handleInputChange("first_name", text)}
                placeholder="First Name"
                borderColor={
                  touched.first_name && errors.first_name ? "#FF6167" : undefined
                }
                type="text"
                required={false}
                error={touched.first_name && errors.first_name}
                editable={!loading}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <CustomTextInput
                value={form.last_name}
                onChangeText={(text) => handleInputChange("last_name", text)}
                placeholder="Last Name"
                borderColor={
                  touched.last_name && errors.last_name ? "#FF6167" : undefined
                }
                type="text"
                required={false}
                error={touched.last_name && errors.last_name}
                editable={!loading}
              />
            </View>

            {/* Username (Optional) */}
            <View style={styles.inputContainer}>
              <CustomTextInput
                value={form.user_name}
                onChangeText={(text) => handleInputChange("user_name", text)}
                placeholder="Username (optional)"
                borderColor={
                  touched.user_name && errors.user_name ? "#FF6167" : undefined
                }
                type="text"
                required={false}
                error={touched.user_name && errors.user_name}
                editable={!loading}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <CustomTextInput
                value={form.email}
                onChangeText={(text) => handleInputChange("email", text)}
                placeholder="Email"
                borderColor={
                  touched.email && errors.email ? "#FF6167" : undefined
                }
                type="text"
                required={false}
                error={touched.email && errors.email}
                editable={!loading}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <CustomTextInput
                value={form.password}
                onChangeText={(text) => handleInputChange("password", text)}
                placeholder="Password"
                type="password"
                borderColor={
                  touched.password && errors.password ? "#FF6167" : undefined
                }
                required={false}
                error={touched.password && errors.password}
                editable={!loading}
              />
            </View>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>I want to:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    form.role === "employers" && styles.activeRole,
                  ]}
                  onPress={() => handleInputChange("role", "employers")}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="briefcase"
                    size={20}
                    color={form.role === "employers" ? whiteColor : secondaryColor}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      form.role === "employers" && styles.activeRoleText,
                    ]}
                  >
                    Hire Talent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    form.role === "freelancers" && styles.activeRole,
                  ]}
                  onPress={() => handleInputChange("role", "freelancers")}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="code-working"
                    size={20}
                    color={form.role === "freelancers" ? whiteColor : primaryColor}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      form.role === "freelancers" && styles.activeRoleText,
                    ]}
                  >
                    Find Work
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() =>
                handleInputChange("agree_terms", !form.agree_terms)
              }
              disabled={loading}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  form.agree_terms && styles.checkboxChecked,
                  touched.agree_terms &&
                    errors.agree_terms &&
                    !form.agree_terms && {
                      borderColor: "#FF6167",
                      borderWidth: 2,
                    },
                ]}
              >
                {form.agree_terms && (
                  <Ionicons name="checkmark" size={18} color={whiteColor} />
                )}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the{" "}
                <Text style={styles.linkText}>Terms of Service</Text> and{" "}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {touched.agree_terms && errors.agree_terms && (
              <Text style={styles.errorText}>{errors.agree_terms}</Text>
            )}

            {/* Register Button */}
            <View style={styles.buttonContainer}>
              <Button
                backgroundColor={primaryColor}
                text="Create Account"
                onPress={handleRegister}
                color={whiteColor}
                disabled={loading}
                loading={loading}
              />
            </View>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push("/auth")}
              disabled={loading}
            >
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text style={styles.loginTextBold}>Sign In</Text>
              </Text>
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

export default Register;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
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
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: fontColor,
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: primaryColor,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: whiteColor,
  },
  activeRole: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  roleText: {
    color: primaryColor,
    fontWeight: "600",
    fontSize: 15,
  },
  activeRoleText: {
    color: whiteColor,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  checkboxText: {
    flex: 1,
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: primaryColor,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF6167",
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  loginLink: {
    paddingVertical: 10,
    alignItems: "center",
  },
  loginText: {
    color: "#666",
    fontSize: 15,
  },
  loginTextBold: {
    color: primaryColor,
    fontWeight: "600",
  },
});
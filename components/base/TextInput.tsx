import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Text,
  Animated,
  Platform,
  TextInputProps,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import * as Constant from "@/constants/GlobalConstants";

interface CustomTextInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  Color?: string;
  iconRequired?: boolean;
  iconName?: string;
  iconColor?: string;
  iconSize?: number;
  width?: number | string;
  borderColor?: string;
  required?: boolean;
  keyboardTyped?: "text" | "number";
  placeholder: string;
  error?: boolean;
  type?: "text" | "password";
  placeholderTextColor?: string;
  style?: object;
}

const CustomTextInput: React.FC<CustomTextInputProps> = (props) => {
  const {
    value,
    onChangeText,
    Color,
    iconRequired,
    iconName,
    iconColor = Constant.secondaryColor,
    iconSize = 20,
    borderColor,
    required,
    keyboardTyped = "text",
    placeholder,
    error,
    type = "text",
    placeholderTextColor = Constant.secondaryColor,
  } = props;

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const animatedPlaceholder = useState(new Animated.Value(value ? 1 : 0))[0];
  const inputRef = useRef<TextInput>(null);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedPlaceholder, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedPlaceholder, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  useEffect(() => {
    if (value) {
      Animated.timing(animatedPlaceholder, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [value]);

  const placeholderStyle = {
    left: Platform.OS === "ios" ? 10 : 12,
    position: "absolute" as const,
    top: animatedPlaceholder.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 4],
    }),
    fontSize: animatedPlaceholder.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: Constant.secondaryColor,
  };

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={[
        styles.container,
        {
          backgroundColor: Color || Constant.whiteColor,
          borderColor: error
            ? "#FF6167"
            : isFocused
            ? borderColor || "#E0E0E0"
            : "transparent",
          borderWidth: 1,
        },
      ]}
      onPress={handleContainerPress}
    >
      {/* Floating Placeholder */}
      <Animated.Text style={[styles.placeholder, placeholderStyle]}>
        {placeholder}
      </Animated.Text>

      <TextInput
        {...props}
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.input,
          props.style,
          { width: type === "password" ? "85%" : "95%" },
        ]}
        placeholder=""
        placeholderTextColor={placeholderTextColor}
        secureTextEntry={type === "password" && !isPasswordVisible}
        keyboardType={keyboardTyped === "number" ? "number-pad" : "default"}
      />

      <View style={styles.iconWrapper}>
        {iconRequired && iconName && (
          <Feather name={iconName} color={iconColor} size={iconSize} />
        )}

        <View style={styles.rightIcons}>
          {required && (
            <Text
              style={[
                styles.requiredAsterisk,
                { marginRight: type === "password" ? 10 : 0 },
              ]}
            >
              *
            </Text>
          )}

          {type === "password" && (
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              style={styles.eyeIcon}
            >
              <Feather
                name={isPasswordVisible ? "eye" : "eye-off"}
                color={Constant.secondaryColor}
                size={20}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    shadowColor: "rgba(16, 24, 40, 0.03)",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 10,
    elevation: 10,
    shadowOpacity: 1,
    borderRadius: 10,
    backgroundColor: "#fff",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    justifyContent: "space-between",
    height: 58,
  },
  input: {
    fontSize: 16,
    fontFamily: Constant.primaryFontRegular,
    color: Constant.blackColor,
    paddingVertical: 0,
    height: "100%",
    marginTop: 12,
  },
  placeholder: {
    height: 30,
  },
  requiredAsterisk: {
    color: "#F04438",
    fontSize: 20,
    lineHeight: 24,
  },
  iconWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightIcons: {
    justifyContent: "flex-end",
    flexDirection: "row",
    alignItems: "center",
  },
  eyeIcon: {
    marginLeft: 4,
  },
});

export default CustomTextInput;

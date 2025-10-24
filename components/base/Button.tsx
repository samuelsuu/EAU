import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import * as Constant from "@/constants/GlobalConstants";

// ✅ Define prop types
interface ButtonProps extends TouchableOpacityProps {
  backgroundColor: string;
  text: string;
  onPress: () => void;
  borderRequired?: boolean;
  borderColor?: string;
  color?: string;
  loaderColor?: string;
  weight?: TextStyle["fontWeight"];
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  backgroundColor,
  text,
  onPress,
  borderRequired = false,
  borderColor,
  color = Constant.whiteColor,
  loaderColor = "#fff",
  weight = "500",
  loading = false,
  disabled = false,
  style,
  ...rest
}) => {
  return (
    <TouchableOpacity
      {...rest}
      style={[
        styles.button,
        {
          backgroundColor,
          borderWidth: borderRequired ? 1 : 0,
          borderColor: borderColor,
          flexDirection: "row",
          opacity: disabled ? 0.7 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { color, fontWeight: weight }]}>
        {text}
      </Text>

      {loading && (
        <ActivityIndicator
          style={{ marginLeft: 10, transform: [{ scale: 0.7 }] }}
          size="small"
          color={loaderColor}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontFamily: Constant.primaryFontBold,
  },
});

export default Button;

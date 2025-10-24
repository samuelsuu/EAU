import { Platform } from "react-native";

// ✅ Define a type for color values
type ColorHex = `#${string}`;

// 🎨 New Theme Colors
export const primaryColor: ColorHex = "#297F42"; // Primary (Green)
export const secondaryColor: ColorHex = "#05304A"; // Secondary / Accent (Dark Blue)
export const highlightColor: ColorHex = "#E3822A"; // Highlight / Warning (Orange)
export const backgroundColor: ColorHex = "#F2F2F3"; // Background (Light Gray)

// 🧱 App Basic Colors
export const bgColor: ColorHex = "#F2F2F3";
export const darkGrayColor: ColorHex = "#EAEAEA";
export const borderColor: ColorHex = "#DDDDDD";
export const fontColor: ColorHex = "#05304A";
export const secondaryfontColor: ColorHex = "#297F42";
export const grayColor: ColorHex = "#F5F5F5";
export const iconColor: ColorHex = "#297F42";
export const whiteColor: ColorHex = "#FFFFFF";
export const blackColor: ColorHex = "#000000";
export const primaryBlackColor: ColorHex = "#000000";

// ✳️ Accents
export const greenColor: ColorHex = "#297F42";
export const blueColor: ColorHex = "#05304A";
export const lightGrayColor: ColorHex = "#999999";
export const astaricColor: ColorHex = "#E3822A";

// 🧍‍♂️ UI Element Colors
export const userProfileBackColor: ColorHex = "#EAF6EF";
export const userProfileIconColor: ColorHex = "#297F42";
export const infoBadgeBackgroundColor: ColorHex = "#E8F0F6";
export const briefCaseIconColor: ColorHex = "#05304A";
export const locationBackgroundColor: ColorHex = "#EDF6F9";
export const locationIconColor: ColorHex = "#297F42";
export const eyeIconBackgroundColor: ColorHex = "#FEE9E0";
export const eyeIconColor: ColorHex = "#E3822A";

// 🟢 Status Colors
export const greenPrimaryColor: ColorHex = "#297F42";
export const lightGreenBackgroundColor: ColorHex = "#EAF6EF";
export const orangePrimaryColor: ColorHex = "#E3822A";
export const lightOrangeBackgroundColor: ColorHex = "#FEF3E9";
export const cancelledBackgroundColor: ColorHex = "#FEE4E2";
export const cancelledTextColor: ColorHex = "#912018";
export const ongoingBackgroundColor: ColorHex = "#E3822A1A";
export const ongoingTextColor: ColorHex = "#E3822A";

// 🆎 Fonts
export const primaryFontBold =
  Platform.OS === "android" ? "Roboto-Bold" : "Roboto Bold";
export const primaryFontLight =
  Platform.OS === "android" ? "Roboto-Light" : "Roboto Light";
export const primaryFontRegular =
  Platform.OS === "android" ? "Roboto-Regular" : "Roboto Regular";
export const primaryFontMedium =
  Platform.OS === "android" ? "Roboto-Medium" : "Roboto Medium";
export const primaryFontSemiBold =
  Platform.OS === "android" ? "Roboto-Medium" : "Roboto Medium";

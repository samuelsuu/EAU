import React from "react";
import { View, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import {
  primaryColor,
  secondaryColor,
  backgroundColor,
  whiteColor,
  fontColor,
  highlightColor,
} from "@/constants/GlobalConstants";

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: primaryColor,
          tabBarInactiveTintColor: "#9ca3af",
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginBottom: Platform.OS === "ios" ? 4 : 6,
          },
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            borderTopWidth: 0.5,
            borderTopColor: "#e5e7eb",
            height: 65,
            elevation: 20,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 8,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size + 2}
                color={color}
              />
            ),
          }}
        />

        {/* Middle Floating Tab */}
        <Tabs.Screen
          name="artisan"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  backgroundColor: focused ? primaryColor : secondaryColor,
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 30, // Raises it above the bar
                  shadowColor: primaryColor,
                  shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                  elevation: 10,
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={30}
                  color="#ffffff"
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size + 2}
                color={color}
              />
            ),
          }}
        />

        {/* <Tabs.Screen
          name="profile-setup"
          options={{
            title: "profile-setup",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size + 2}
                color={color}
              />
            ),
          }}
        /> */}

      </Tabs>

      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton
        phoneNumber="+2349127724646"
        message="Hello! I need assistance with the Artisan Network app."
        position="bottom-right"
        bottom={90} // still above the floating center button
        right={20}
      />
    </View>
  );
}

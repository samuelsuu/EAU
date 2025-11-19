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
    <View style={{ flex: 1, backgroundColor: "#fafbfc" }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: primaryColor,
          tabBarInactiveTintColor: "#64748b",
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: Platform.OS === "ios" ? 2 : 4,
            letterSpacing: 0.3,
          },
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#f1f5f9",
            height: Platform.OS === "ios" ? 88 : 68,
            paddingTop: 8,
            paddingBottom: Platform.OS === "ios" ? 24 : 8,
            elevation: 24,
            shadowColor: "#0f172a",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 12,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 2,
                }}
              >
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={24}
                  color={focused ? primaryColor : color}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="proposals"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  position: "relative",
                  marginTop: -28,
                }}
              >
                {/* Outer glow ring */}
                <View
                  style={{
                    position: "absolute",
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    backgroundColor: focused ? primaryColor : secondaryColor,
                    opacity: 0.15,
                    top: -3,
                    left: -3,
                  }}
                />
                
                {/* Main button */}
                <View
                  style={{
                    backgroundColor: focused ? primaryColor : secondaryColor,
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 4,
                    borderColor: "#ffffff",
                    shadowColor: focused ? primaryColor : secondaryColor,
                    shadowOpacity: 0.35,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 12,
                    elevation: 12,
                  }}
                >
                  <Ionicons
                    name={focused ? "document-text" : "document-text-outline"}
                    size={32}
                    color="#ffffff"
                  />
                </View>
              </View>
            ),
          }}
        />

        {/* Middle Floating Tab */}
        <Tabs.Screen
          name="artisan"
          options={{
            title: "Artisan",
            tabBarIcon: ({ color, size, focused }) => (
              <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 2,
              }}
              >
            
                  <Ionicons
                    name={focused ? "people" : "people-outline"}
                    size={24}
                    color={focused ? primaryColor : color}
                  />
            
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  position: "relative",
                  marginTop: -28,
                }}
              >
                {/* Outer glow ring */}
                <View
                  style={{
                    position: "absolute",
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    backgroundColor: focused ? primaryColor : secondaryColor,
                    opacity: 0.15,
                    top: -3,
                    left: -3,
                  }}
                />
                
                {/* Main button */}
                <View
                  style={{
                    backgroundColor: focused ? primaryColor : secondaryColor,
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 4,
                    borderColor: "#ffffff",
                    shadowColor: focused ? primaryColor : secondaryColor,
                    shadowOpacity: 0.35,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 12,
                    elevation: 12,
                  }}
                >
                  <Ionicons
                    name={focused ? "person" : "person-outline"}
                    size={32}
                    color="#ffffff"
                  />
                </View>
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 2,
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: focused ? primaryColor : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: focused ? 2 : 0,
                    borderColor: focused ? primaryColor : "transparent",
                    shadowColor: focused ? primaryColor : "transparent",
                    shadowOpacity: focused ? 0.2 : 0,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 8,
                    elevation: focused ? 8 : 0,
                  }}
                >
                  <Ionicons
                    name={focused ? "settings" : "settings-outline"}
                    size={24}
                    color={focused ? "#ffffff" : color}
                  />
                </View>
              </View>
            ),
          }}
        />
      </Tabs>

      {/* Premium Floating WhatsApp Button */}
      <FloatingWhatsAppButton
        phoneNumber="+2349127724646"
        message="Hello! I need assistance with the Artisan Network app."
        position="bottom-right"
        bottom={Platform.OS === "ios" ? 108 : 88}
        right={20}
      />
    </View>
  );
}
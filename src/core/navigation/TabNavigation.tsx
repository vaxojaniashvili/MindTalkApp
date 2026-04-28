import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import HomeScreen from "../../screens/HomeScreen";
import PsychologistsScreen from "../../screens/PsychologistsScreen";
import CoursesScreen from "../../screens/CoursesScreen";
import ProfileScreen from "../../screens/ProfileScreen";
import { Colors, FontWeight } from "../../constants/theme";
import type { MainTabParamList } from "../../types";
import { Platform } from "react-native";

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<
  keyof MainTabParamList,
  {
    focused: keyof typeof Ionicons.glyphMap;
    default: keyof typeof Ionicons.glyphMap;
  }
> = {
  Home: { focused: "home", default: "home-outline" },
  Psychologists: { focused: "people", default: "people-outline" },
  Courses: { focused: "book", default: "book-outline" },
  Profile: { focused: "person", default: "person-outline" },
};

export default function TabNavigation() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIcons[route.name];
          const iconName = focused ? icons.focused : icons.default;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary.ink,
        tabBarInactiveTintColor: Colors.ink.muted,
        tabBarStyle: {
          backgroundColor: Colors.cream[50],
          borderTopColor: Colors.border,
          paddingBottom: 4,
          height: Platform.OS === "ios" ? 68 : 110,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: FontWeight.medium,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t("tabs.home") }}
      />
      <Tab.Screen
        name="Psychologists"
        component={PsychologistsScreen}
        options={{ tabBarLabel: t("tabs.psychologists") }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={{ tabBarLabel: t("tabs.courses") }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t("tabs.profile") }}
      />
    </Tab.Navigator>
  );
}

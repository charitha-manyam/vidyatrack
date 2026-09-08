import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { ParentHomeScreen } from "../screens/parent/ParentHomeScreen";
import { ParentFeesScreen } from "../screens/parent/ParentFeesScreen";
import { ParentAttendanceScreen } from "../screens/parent/ParentAttendanceScreen";
import { ParentHomeworkScreen } from "../screens/parent/ParentHomeworkScreen";
import { colors } from "../theme/colors";
import { ChildProvider } from "../context/ChildContext";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ParentChildrenScreen } from "../screens/parent/ParentChildrenScreen";
import { ParentHolidaysScreen } from "../screens/parent/ParentHolidaysScreen";
import { ParentAnnouncementsScreen } from "../screens/parent/ParentAnnouncementsScreen";
import { ParentMarksScreen } from "../screens/parent/ParentMarksScreen";
import { ParentTimetableScreen } from "../screens/parent/ParentTimetableScreen";
import { ParentPaymentHistoryScreen } from "../screens/parent/ParentPaymentHistoryScreen";
import { ParentComplaintsScreen } from "../screens/parent/ParentComplaintsScreen";
import { ParentMoreMenuScreen } from "../screens/parent/ParentMoreMenuScreen";
import { ParentProfileScreen } from "../screens/parent/ParentProfileScreen";
import { ParentTrackMyBusScreen } from "../screens/parent/ParentTrackMyBusScreen";
import type { ParentMoreStackParamList, ParentTabParamList } from "./types";

const Tab = createBottomTabNavigator<ParentTabParamList>();
const MoreStack = createNativeStackNavigator<ParentMoreStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.ink,
  headerTitleStyle: { color: colors.ink, fontWeight: "600" as const },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

function ParentMoreNavigator() {
  const navigation = useNavigation();

  // Always show the More menu (root) when returning to the More tab — the
  // nested stack must not remember a previously pushed screen (Marks,
  // Timetable, ...) after the parent dips into another tab.
  useEffect(() => {
    const unsubFocus = navigation.addListener("focus", () => {
      const state = navigation.getState();
      const moreRoute = state?.routes.find((r) => r.name === "More");
      const nested = moreRoute?.state;
      if (nested && nested.type === "stack" && typeof nested.index === "number" && nested.index > 0) {
        navigation.dispatch({
          ...CommonActions.reset({ index: 0, routes: [{ name: "MoreMenu" }] }),
          target: nested.key,
        });
      }
    });
    return unsubFocus;
  }, [navigation]);

  return (
    <MoreStack.Navigator screenOptions={headerOptions}>
      <MoreStack.Screen name="MoreMenu" component={ParentMoreMenuScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="Children" component={ParentChildrenScreen} options={{ title: "Children" }} />
      <MoreStack.Screen name="Holidays" component={ParentHolidaysScreen} options={{ title: "Holidays" }} />
      <MoreStack.Screen name="Announcements" component={ParentAnnouncementsScreen} options={{ title: "Announcements" }} />
      <MoreStack.Screen name="Marks" component={ParentMarksScreen} options={{ title: "Marks & Results" }} />
      <MoreStack.Screen name="Timetable" component={ParentTimetableScreen} options={{ title: "Timetable" }} />
      <MoreStack.Screen name="PaymentHistory" component={ParentPaymentHistoryScreen} options={{ title: "Payment History" }} />
      <MoreStack.Screen name="TrackMyBus" component={ParentTrackMyBusScreen} options={{ title: "Track the bus" }} />
      <MoreStack.Screen name="Complaints" component={ParentComplaintsScreen} options={{ title: "Complaints" }} />
      <MoreStack.Screen name="Profile" component={ParentProfileScreen} options={{ title: "Profile" }} />
    </MoreStack.Navigator>
  );
}

export function ParentNavigator() {
  return (
    <ChildProvider>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.brand600 }}>
        <Tab.Screen
          name="Home"
          component={ParentHomeScreen}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Fees"
          component={ParentFeesScreen}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="credit-card" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Attendance"
          component={ParentAttendanceScreen}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="check-square" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Homework"
          component={ParentHomeworkScreen}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="book-open" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="More"
          component={ParentMoreNavigator}
          options={{ title: "More", tabBarIcon: ({ color, size }) => <Feather name="menu" color={color} size={size} /> }}
        />
      </Tab.Navigator>
    </ChildProvider>
  );
}

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { ParentHomeScreen } from "../screens/parent/ParentHomeScreen";
import { ParentFeesScreen } from "../screens/parent/ParentFeesScreen";
import { ParentAttendanceScreen } from "../screens/parent/ParentAttendanceScreen";
import { ParentHomeworkScreen } from "../screens/parent/ParentHomeworkScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme/colors";
import { ChildProvider } from "../context/ChildContext";
import type { ParentTabParamList } from "./types";

const Tab = createBottomTabNavigator<ParentTabParamList>();

export function ParentNavigator() {
  return (
    <ChildProvider kids={
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
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }}
        />
      </Tab.Navigator>
    }>
    </ChildProvider>
  );
}

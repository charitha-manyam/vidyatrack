import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { MarketingHomeScreen } from "../screens/marketing/MarketingHomeScreen";
import { MarkAttendanceScreen } from "../screens/marketing/MarkAttendanceScreen";
import { LogVisitScreen } from "../screens/marketing/LogVisitScreen";
import { AddLeadScreen } from "../screens/marketing/AddLeadScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

export function MarketingNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.brand600 }}>
      <Tab.Screen
        name="Home"
        component={MarketingHomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="target" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Attendance"
        component={MarkAttendanceScreen}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="check-square" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Visit"
        component={LogVisitScreen}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="map-pin" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Lead"
        component={AddLeadScreen}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="user-plus" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

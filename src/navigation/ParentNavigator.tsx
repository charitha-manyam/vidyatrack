import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { ParentHomeScreen } from "../screens/parent/ParentHomeScreen";
import { ParentFeesScreen } from "../screens/parent/ParentFeesScreen";
import { ParentAttendanceScreen } from "../screens/parent/ParentAttendanceScreen";
import { ParentHomeworkScreen } from "../screens/parent/ParentHomeworkScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme/colors";
import { ChildProvider } from "../context/ChildContext";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ParentChildrenScreen } from "../screens/parent/ParentChildrenScreen";
import { ParentHolidaysScreen } from "../screens/parent/ParentHolidaysScreen";
import { ParentAnnouncementsScreen } from "../screens/parent/ParentAnnouncementsScreen";
import { ParentMarksScreen } from "../screens/parent/ParentMarksScreen";
import { ParentTimetableScreen } from "../screens/parent/ParentTimetableScreen";
import { ParentComplaintsScreen } from "../screens/parent/ParentComplaintsScreen";
import { ParentMoreMenuScreen } from "../screens/parent/ParentMoreMenuScreen";
import type { ParentTabParamList } from "./types";

const Tab = createBottomTabNavigator<ParentTabParamList>();
const MoreStack = createNativeStackNavigator<import("./types").ParentMoreStackParamList>();

function ParentMoreNavigator() {
  return (
    <MoreStack.Navigator>
      <MoreStack.Screen name="MoreMenu" component={ParentMoreMenuScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="Children" component={ParentChildrenScreen} options={{ title: "Children" }} />
      <MoreStack.Screen name="Holidays" component={ParentHolidaysScreen} options={{ title: "Holidays" }} />
      <MoreStack.Screen name="Announcements" component={ParentAnnouncementsScreen} options={{ title: "Announcements" }} />
      <MoreStack.Screen name="Marks" component={ParentMarksScreen} options={{ title: "Marks & Results" }} />
      <MoreStack.Screen name="Timetable" component={ParentTimetableScreen} options={{ title: "Timetable" }} />
      <MoreStack.Screen name="Complaints" component={ParentComplaintsScreen} options={{ title: "Complaints" }} />
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
          options={{ title: "More", tabBarIcon: ({ color, size }) => <Feather name="more-horizontal" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }}
        />
      </Tab.Navigator>
    </ChildProvider>
  );
}

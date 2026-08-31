import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { DashboardScreen } from "../screens/staff/DashboardScreen";
import { StudentsScreen } from "../screens/staff/StudentsScreen";
import { StudentDetailScreen } from "../screens/staff/StudentDetailScreen";
import { StudentFormScreen } from "../screens/staff/StudentFormScreen";
import { ClassesScreen } from "../screens/staff/ClassesScreen";
import { ClassDetailScreen } from "../screens/staff/ClassDetailScreen";
import { ClassFormScreen } from "../screens/staff/ClassFormScreen";
import { SectionFormScreen } from "../screens/staff/SectionFormScreen";
import { FeesScreen } from "../screens/staff/FeesScreen";
import { MarkAttendanceScreen } from "../screens/staff/MarkAttendanceScreen";
import { AttendanceReportScreen } from "../screens/staff/AttendanceReportScreen";
import { StaffDirectoryScreen } from "../screens/staff/StaffDirectoryScreen";
import { MoreMenuScreen } from "../screens/staff/MoreMenuScreen";
import { RolesScreen } from "../screens/staff/RolesScreen";
import { RoleFormScreen } from "../screens/staff/RoleFormScreen";
import { AcademicYearsScreen } from "../screens/staff/AcademicYearsScreen";
import { AcademicYearFormScreen } from "../screens/staff/AcademicYearFormScreen";
import { ModulePlaceholderScreen } from "../screens/staff/ModulePlaceholderScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { useAuth } from "../context/AuthContext";
import { hasPermission, MODULES } from "../config/rbac";
import { staffPermissions } from "../components/PermissionGate";
import { colors } from "../theme/colors";
import type {
  ClassesStackParamList,
  MoreStackParamList,
  StaffTabParamList,
  StudentsStackParamList,
} from "./types";

const Tab = createBottomTabNavigator<StaffTabParamList>();
const StudentsStack = createNativeStackNavigator<StudentsStackParamList>();
const ClassesStack = createNativeStackNavigator<ClassesStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function StudentsNavigator() {
  return (
    <StudentsStack.Navigator screenOptions={{ headerShown: false }}>
      <StudentsStack.Screen name="StudentsList" component={StudentsScreen} />
      <StudentsStack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <StudentsStack.Screen
        name="StudentForm"
        component={StudentFormScreen}
        options={{ headerShown: true, title: "Student", headerTitleStyle: { color: colors.ink } }}
      />
    </StudentsStack.Navigator>
  );
}

function ClassesNavigator() {
  return (
    <ClassesStack.Navigator screenOptions={{ headerShown: false }}>
      <ClassesStack.Screen name="ClassesList" component={ClassesScreen} />
      <ClassesStack.Screen name="ClassDetail" component={ClassDetailScreen} />
      <ClassesStack.Screen
        name="ClassForm"
        component={ClassFormScreen}
        options={{ headerShown: true, title: "Class", headerTitleStyle: { color: colors.ink } }}
      />
      <ClassesStack.Screen
        name="SectionForm"
        component={SectionFormScreen}
        options={{ headerShown: true, title: "Section", headerTitleStyle: { color: colors.ink } }}
      />
    </ClassesStack.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: true, headerTitleStyle: { color: colors.ink } }}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="Roles" component={RolesScreen} options={{ title: "Roles & Permissions" }} />
      <MoreStack.Screen
        name="RoleForm"
        component={RoleFormScreen}
        options={{ title: "Role", headerTitleStyle: { color: colors.ink } }}
      />
      <MoreStack.Screen
        name="AcademicYears"
        component={AcademicYearsScreen}
        options={{ title: "Academic Years" }}
      />
      <MoreStack.Screen
        name="AcademicYearForm"
        component={AcademicYearFormScreen}
        options={({ route }) => ({ title: route.params?.yearId ? "Edit year" : "Add year", headerTitleStyle: { color: colors.ink } })}
      />
      <MoreStack.Screen
        name="ModulePlaceholder"
        component={ModulePlaceholderScreen}
        options={({ route }) => ({ title: route.params?.title ?? "Module" })}
      />
      <MoreStack.Screen name="MarkAttendance" component={MarkAttendanceScreen} options={{ title: "Mark attendance" }} />
      <MoreStack.Screen name="AttendanceReport" component={AttendanceReportScreen} options={{ title: "Attendance alerts" }} />
      <MoreStack.Screen name="StaffDirectory" component={StaffDirectoryScreen} options={{ title: "Staff directory" }} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </MoreStack.Navigator>
  );
}

// Tab visibility is a pure function of the session's tenant permissions —
// same gating rules as getVisibleNavGroups on the admin-portal sidebar.
export function StaffNavigator() {
  const { session } = useAuth();
  const permissions = staffPermissions(session);

  const canReadStudents = hasPermission(permissions, MODULES.STUDENTS, "read");
  const canReadClasses = hasPermission(permissions, MODULES.CLASSES, "read");
  const canReadFees = hasPermission(permissions, MODULES.FEES, "read");

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.brand600 }}>
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }}
      />
      {canReadStudents ? (
        <Tab.Screen
          name="Students"
          component={StudentsNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="users" color={color} size={size} /> }}
        />
      ) : null}
      {canReadClasses ? (
        <Tab.Screen
          name="Classes"
          component={ClassesNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="book-open" color={color} size={size} /> }}
        />
      ) : null}
      {canReadFees ? (
        <Tab.Screen
          name="Fees"
          component={FeesScreen}
          options={{ tabBarIcon: ({ color, size }) => <Feather name="credit-card" color={color} size={size} /> }}
        />
      ) : null}
      <Tab.Screen
        name="More"
        component={MoreNavigator}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="menu" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

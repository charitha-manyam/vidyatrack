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
import { FeesMenuScreen } from "../screens/staff/FeesMenuScreen";
import { FeeHeadsScreen, FeeHeadFormScreen } from "../screens/staff/FeeHeadsScreen";
import { FeeStructuresScreen, FeeStructureFormScreen } from "../screens/staff/FeeStructuresScreen";
import { FeeAssignmentsScreen, FeeAssignmentFormScreen } from "../screens/staff/FeeAssignmentsScreen";
import { ConcessionsScreen, ConcessionFormScreen } from "../screens/staff/ConcessionsScreen";
import { FeePaymentsScreen, FeePaymentFormScreen } from "../screens/staff/FeePaymentsScreen";
import { FeePaymentLinksScreen } from "../screens/staff/FeePaymentLinksScreen";
import { StudentFeeSummaryScreen } from "../screens/staff/StudentFeeSummaryScreen";
import { PendingFeesScreen } from "../screens/staff/PendingFeesScreen";
import { MarkAttendanceScreen } from "../screens/staff/MarkAttendanceScreen";
import { AttendanceReportScreen } from "../screens/staff/AttendanceReportScreen";
import { StaffAttendanceScreen } from "../screens/staff/StaffAttendanceScreen";
import { LeavesScreen } from "../screens/staff/LeavesScreen";
import { LeaveAllocationsScreen } from "../screens/staff/LeaveAllocationsScreen";
import { PayslipsScreen } from "../screens/staff/PayslipsScreen";
import { StaffDirectoryScreen } from "../screens/staff/StaffDirectoryScreen";
import { StaffFormScreen } from "../screens/staff/StaffFormScreen";
import { MoreMenuScreen } from "../screens/staff/MoreMenuScreen";
import { RolesScreen } from "../screens/staff/RolesScreen";
import { RoleFormScreen } from "../screens/staff/RoleFormScreen";
import { AcademicYearsScreen } from "../screens/staff/AcademicYearsScreen";
import { AcademicYearFormScreen } from "../screens/staff/AcademicYearFormScreen";
import { AcademicYearPromotionScreen } from "../screens/staff/AcademicYearPromotionScreen";
import { ModulePlaceholderScreen } from "../screens/staff/ModulePlaceholderScreen";
import { ResourceListScreen } from "../screens/staff/ResourceListScreen";
import { ResourceFormScreen } from "../screens/staff/ResourceFormScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { useAuth } from "../context/AuthContext";
import { hasPermission, MODULES } from "../config/rbac";
import { staffPermissions } from "../components/PermissionGate";
import { colors } from "../theme/colors";
import type {
  ClassesStackParamList,
  FeesStackParamList,
  MoreStackParamList,
  StaffTabParamList,
  StudentsStackParamList,
} from "./types";

const Tab = createBottomTabNavigator<StaffTabParamList>();
const StudentsStack = createNativeStackNavigator<StudentsStackParamList>();
const ClassesStack = createNativeStackNavigator<ClassesStackParamList>();
const FeesStack = createNativeStackNavigator<FeesStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.ink,
  headerTitleStyle: { color: colors.ink, fontWeight: "600" as const },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

function StudentsNavigator() {
  return (
    <StudentsStack.Navigator screenOptions={{ headerShown: false }}>
      <StudentsStack.Screen name="StudentsList" component={StudentsScreen} />
      <StudentsStack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <StudentsStack.Screen
        name="StudentForm"
        component={StudentFormScreen}
        options={{ headerShown: true, title: "Add student", ...headerOptions }}
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
        options={{ headerShown: true, title: "Class", ...headerOptions }}
      />
      <ClassesStack.Screen
        name="SectionForm"
        component={SectionFormScreen}
        options={{ headerShown: true, title: "Section", ...headerOptions }}
      />
    </ClassesStack.Navigator>
  );
}

function FeesNavigator() {
  return (
    <FeesStack.Navigator screenOptions={{ headerShown: true, ...headerOptions }}>
      <FeesStack.Screen name="FeesMenu" component={FeesMenuScreen} options={{ headerShown: false }} />
      <FeesStack.Screen name="FeeHeads" component={FeeHeadsScreen} options={{ title: "Fee Heads" }} />
      <FeesStack.Screen name="FeeHeadForm" component={FeeHeadFormScreen} options={{ title: "Fee head" }} />
      <FeesStack.Screen name="FeeStructures" component={FeeStructuresScreen} options={{ title: "Fee Structures" }} />
      <FeesStack.Screen name="FeeStructureForm" component={FeeStructureFormScreen} options={{ title: "Fee structure" }} />
      <FeesStack.Screen name="FeeAssignments" component={FeeAssignmentsScreen} options={{ title: "Student Fee Assignments" }} />
      <FeesStack.Screen name="FeeAssignmentForm" component={FeeAssignmentFormScreen} options={{ title: "Assignment" }} />
      <FeesStack.Screen name="Concessions" component={ConcessionsScreen} options={{ title: "Concessions" }} />
      <FeesStack.Screen name="ConcessionForm" component={ConcessionFormScreen} options={{ title: "Concession" }} />
      <FeesStack.Screen name="FeePayments" component={FeePaymentsScreen} options={{ title: "Fee Payments" }} />
      <FeesStack.Screen name="FeePaymentForm" component={FeePaymentFormScreen} options={{ title: "Record payment" }} />
      <FeesStack.Screen name="FeePaymentLinks" component={FeePaymentLinksScreen} options={{ title: "Fee Payment Links" }} />
      <FeesStack.Screen name="StudentFeeSummary" component={StudentFeeSummaryScreen} options={{ title: "Student Fee Summary" }} />
      <FeesStack.Screen name="PendingFees" component={PendingFeesScreen} options={{ title: "Pending Fees" }} />
    </FeesStack.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: true, ...headerOptions }}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="Roles" component={RolesScreen} options={{ title: "Roles & Permissions" }} />
      <MoreStack.Screen
        name="RoleForm"
        component={RoleFormScreen}
        options={{ title: "Role" }}
      />
      <MoreStack.Screen
        name="AcademicYears"
        component={AcademicYearsScreen}
        options={{ title: "Academic Years" }}
      />
      <MoreStack.Screen
        name="AcademicYearForm"
        component={AcademicYearFormScreen}
        options={({ route }) => ({ title: route.params?.yearId ? "Edit year" : "Add year" })}
      />
      <MoreStack.Screen
        name="AcademicYearPromotion"
        component={AcademicYearPromotionScreen}
        options={({ route }) => ({ title: route.params.kind === "students" ? "Promote students" : "Promote staff" })}
      />
      <MoreStack.Screen
        name="ModulePlaceholder"
        component={ModulePlaceholderScreen}
        options={({ route }) => ({ title: route.params?.title ?? "Module" })}
      />
      <MoreStack.Screen
        name="ResourceList"
        component={ResourceListScreen}
        options={({ route }) => ({ title: route.params.resourceId })}
      />
      <MoreStack.Screen
        name="ResourceForm"
        component={ResourceFormScreen}
        options={{ title: "Module" }}
      />
      <MoreStack.Screen name="MarkAttendance" component={MarkAttendanceScreen} options={{ title: "Mark attendance" }} />
      <MoreStack.Screen name="AttendanceReport" component={AttendanceReportScreen} options={{ title: "Attendance alerts" }} />
      <MoreStack.Screen name="StaffAttendance" component={StaffAttendanceScreen} options={{ title: "Staff Attendance" }} />
      <MoreStack.Screen name="Leaves" component={LeavesScreen} options={{ title: "Leaves" }} />
      <MoreStack.Screen name="LeaveAllocations" component={LeaveAllocationsScreen} options={{ title: "Staff Leave Allocations" }} />
      <MoreStack.Screen name="Payslips" component={PayslipsScreen} options={{ title: "Payslips" }} />
      <MoreStack.Screen name="StaffDirectory" component={StaffDirectoryScreen} options={{ title: "Staff directory" }} />
      <MoreStack.Screen name="StaffForm" component={StaffFormScreen} options={{ title: "Add staff member" }} />
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
          component={FeesNavigator}
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

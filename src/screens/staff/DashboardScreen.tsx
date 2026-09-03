import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { BarChartCard } from "../../components/ui/BarChartCard";
import { DonutBreakdownCard } from "../../components/ui/DonutBreakdownCard";
import { useAuth } from "../../context/AuthContext";
import { getClasses, getPendingFeeSummary, getStaffStats, getStudents } from "../../api/school.api";
import { hasPermission, MODULES } from "../../config/rbac";
import { staffPermissions } from "../../components/PermissionGate";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { StaffTabParamList } from "../../navigation/types";

type Props = BottomTabScreenProps<StaffTabParamList, "Home">;

type ModuleLink = {
  title: string;
  onPress: () => void;
};

function ModuleCard({
  title,
  icon,
  links,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  links: ModuleLink[];
}) {
  return (
    <View style={styles.moduleCard}>
      <View style={styles.moduleHeader}>
        <View style={styles.moduleIcon}>
          <Feather name={icon} size={18} color={colors.brand600} />
        </View>
        <View style={styles.moduleHeaderText}>
          <Text style={styles.moduleTitle}>{title}</Text>
          <Text style={styles.moduleCount}>{links.length} {links.length === 1 ? "item" : "items"}</Text>
        </View>
      </View>
      <View style={styles.moduleLinks}>
        {links.map((link) => (
          <ListRow key={link.title} title={link.title} chevron onPress={link.onPress} />
        ))}
      </View>
    </View>
  );
}

function formatCurrency(value: number) {
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DashboardScreen({ navigation }: Props) {
  const { session } = useAuth();
  const staffSession = session && session.type === "staff" ? session : null;
  const permissions = staffPermissions(session);
  // Element-level RBAC — same rules the admin-portal dashboard uses: stats
  // and quick links only render when the user can read that module.
  const canReadStudents = hasPermission(permissions, MODULES.STUDENTS, "read");
  const canReadClasses = hasPermission(permissions, MODULES.CLASSES, "read");
  const canReadStaff =
    hasPermission(permissions, MODULES.TEACHING_STAFF, "read") ||
    hasPermission(permissions, MODULES.NON_TEACHING_STAFF, "read");
  const canReadFees = hasPermission(permissions, MODULES.FEES, "read");
  const canMarkAttendance = hasPermission(permissions, MODULES.ATTENDANCE, "create");
  const canReadAttendance = hasPermission(permissions, MODULES.ATTENDANCE, "read");
  const canReadRoles = hasPermission(permissions, MODULES.ROLES, "read");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    students: number;
    classes: number;
    staff: { totalStaff: number; teacherCount: number; nonTeachingCount: number } | null;
    pendingLeaves: number;
    pendingAmount: number;
    pendingStudents: number;
  } | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [students, classes, staffStats, fees] = await Promise.all([
        getStudents(),
        getClasses(),
        getStaffStats().catch(() => null),
        getPendingFeeSummary().catch(() => ({ totalPendingAmount: 0, totalStudentsWithPendingFees: 0, items: [] })),
      ]);
      setData({
        students: students.length,
        classes: classes.length,
        staff: staffStats,
        pendingLeaves: staffStats?.pendingLeaves ?? 0,
        pendingAmount: fees.totalPendingAmount,
        pendingStudents: fees.totalStudentsWithPendingFees,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brand600} />}
    >
      <PageHeader
        title={`Welcome back${staffSession?.name ? `, ${staffSession.name.split(" ")[0]}` : ""}`}
        description={todayLabel()}
        actions={
          <>
            {staffSession?.role?.name ? <Badge tone="brand">{staffSession.role.name}</Badge> : null}
            {staffSession?.academicYear?.yearName ? <Badge>{staffSession.academicYear.yearName}</Badge> : null}
          </>
        }
      />

      <DataState loading={loading} error={error} retry={() => load()}>
        {data && (
          <View style={styles.content}>
            {(canReadStudents || canReadClasses) && (
              <View style={styles.grid}>
                {canReadStudents && (
                  <StatCard label="Students" value={data.students} icon="users" tone="brand" onPress={() => navigation.navigate("Students", { screen: "StudentsList" })} />
                )}
                {canReadClasses && (
                  <StatCard label="Classes" value={data.classes} icon="layers" tone="gray" onPress={() => navigation.navigate("Classes", { screen: "ClassesList" })} />
                )}
              </View>
            )}
            {(canReadStaff || canReadFees) && (
              <View style={styles.grid}>
                {canReadStaff && (
                  <StatCard
                    label="Staff"
                    value={data.staff?.totalStaff ?? "—"}
                    sublabel={data.staff ? `${data.staff.teacherCount} teaching, ${data.staff.nonTeachingCount} non-teaching` : undefined}
                    icon="user-check"
                    tone="gray"
                    onPress={() => navigation.navigate("More", { screen: "StaffDirectory" })}
                  />
                )}
                {canReadFees && (
                  <StatCard
                    label="Pending fees"
                    value={formatCurrency(data.pendingAmount)}
                    sublabel={`${data.pendingStudents} ${data.pendingStudents === 1 ? "student" : "students"}`}
                    icon="credit-card"
                    tone={data.pendingAmount > 0 ? "red" : "green"}
                    onPress={() => navigation.navigate("Fees")}
                  />
                )}
              </View>
            )}

            {(canReadStaff || canReadFees || canReadAttendance) && (
              <BarChartCard
                title="Action items across modules"
                description="Items that need attention"
                data={[
                  ...(canReadStaff ? [{ label: "Pending leaves", value: data.pendingLeaves }] : []),
                  ...(canReadFees ? [{ label: "Students with dues", value: data.pendingStudents }] : []),
                ]}
              />
            )}

            {canReadStaff && (
              <DonutBreakdownCard
                title="Staff breakdown"
                description="Teaching and non-teaching staff"
                data={[
                  { label: "Teaching", value: data.staff?.teacherCount ?? 0, color: colors.brand600 },
                  { label: "Non-teaching", value: data.staff?.nonTeachingCount ?? 0, color: colors.brand400 },
                ]}
              />
            )}

            {(canReadStudents || canReadClasses || canReadFees || canMarkAttendance || canReadAttendance || canReadRoles) && (
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Quick access</Text>
                <Text style={styles.sectionDescription}>Open the areas you manage most</Text>
              </View>
            )}
            {(canReadStudents || canReadClasses) && (
              <ModuleCard
                title="Academics"
                icon="book-open"
                links={[
                  ...(canReadClasses
                    ? [{ title: "Classes & sections", onPress: () => navigation.navigate("Classes", { screen: "ClassesList" }) }]
                    : []),
                  ...(canReadStudents
                    ? [{ title: "Students", onPress: () => navigation.navigate("Students", { screen: "StudentsList" }) }]
                    : []),
                ]}
              />
            )}
            {canReadStaff && (
              <ModuleCard
                title="People and access"
                icon="users"
                links={[
                  { title: "Staff directory", onPress: () => navigation.navigate("More", { screen: "StaffDirectory" }) },
                  ...(canReadRoles
                    ? [{ title: "Roles & permissions", onPress: () => navigation.navigate("More", { screen: "Roles" }) }]
                    : []),
                ]}
              />
            )}
            {(canMarkAttendance || canReadAttendance) && (
              <ModuleCard
                title="Attendance and leave"
                icon="calendar"
                links={[
                  ...(canMarkAttendance
                    ? [{ title: "Mark attendance", onPress: () => navigation.navigate("More", { screen: "MarkAttendance" }) }]
                    : []),
                  ...(canReadAttendance
                    ? [{ title: "Attendance alerts", onPress: () => navigation.navigate("More", { screen: "AttendanceReport" }) }]
                    : []),
                ]}
              />
            )}
            {canReadFees && (
              <ModuleCard title="Fees" icon="credit-card" links={[{ title: "Pending fee summary", onPress: () => navigation.navigate("Fees") }]} />
            )}
          </View>
        )}
      </DataState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.inkGhost,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
  },
  sectionHeading: {
    gap: 4,
    marginTop: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  moduleCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    gap: 12,
  },
  moduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand50,
  },
  moduleHeaderText: {
    flex: 1,
    gap: 2,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  moduleCount: {
    fontSize: 12,
    color: colors.inkGhost,
  },
  moduleLinks: {
    gap: 8,
  },
});

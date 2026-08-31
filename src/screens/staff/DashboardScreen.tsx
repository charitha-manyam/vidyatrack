import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
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
                    sublabel={data.staff ? `${data.staff.teacherCount} teaching · ${data.staff.nonTeachingCount} non-teaching` : undefined}
                    icon="user-check"
                    tone="gray"
                    onPress={() => navigation.navigate("More", { screen: "StaffDirectory" })}
                  />
                )}
                {canReadFees && (
                  <StatCard
                    label="Pending Fees"
                    value={formatCurrency(data.pendingAmount)}
                    sublabel={`${data.pendingStudents} student(s)`}
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
                description="Things waiting on someone right now"
                data={[
                  ...(canReadStaff ? [{ label: "Pending leaves", value: data.pendingLeaves }] : []),
                  ...(canReadFees ? [{ label: "Students with dues", value: data.pendingStudents }] : []),
                ]}
              />
            )}

            {canReadStaff && (
              <DonutBreakdownCard
                title="Staff breakdown"
                description="Teaching vs non-teaching"
                data={[
                  { label: "Teaching", value: data.staff?.teacherCount ?? 0, color: colors.brand600 },
                  { label: "Non-teaching", value: data.staff?.nonTeachingCount ?? 0, color: colors.brand400 },
                ]}
              />
            )}

            {(canReadStudents || canReadClasses || canReadFees || canMarkAttendance || canReadAttendance || canReadRoles) && (
              <Text style={styles.sectionTitle}>Quick access</Text>
            )}
            {canReadStudents && (
              <ListRow title="Students" subtitle="Directory, profiles & fees" chevron onPress={() => navigation.navigate("Students", { screen: "StudentsList" })} />
            )}
            {canReadClasses && (
              <ListRow title="Classes" subtitle="Classes, sections & subjects" chevron onPress={() => navigation.navigate("Classes", { screen: "ClassesList" })} />
            )}
            {canReadFees && (
              <ListRow title="Fees" subtitle="Pending fee summary" chevron onPress={() => navigation.navigate("Fees")} />
            )}
            {canMarkAttendance && (
              <ListRow title="Mark attendance" subtitle="Class · section · date roster" chevron onPress={() => navigation.navigate("More", { screen: "MarkAttendance" })} />
            )}
            {canReadAttendance && (
              <ListRow title="Attendance alerts" subtitle="Absent more than 5 days" chevron onPress={() => navigation.navigate("More", { screen: "AttendanceReport" })} />
            )}
            {canReadRoles && (
              <ListRow title="Roles & Permissions" subtitle="Control what each staff role can do" chevron onPress={() => navigation.navigate("More", { screen: "Roles" })} />
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
});

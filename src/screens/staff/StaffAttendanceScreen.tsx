import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { DateInput } from "../../components/DateInput";
import { Input } from "../../components/Input";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { bulkMarkStaffAttendance, getStaffList } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { StaffAttendanceStatus, StaffListItem } from "../../types/school";

type Props = NativeStackScreenProps<MoreStackParamList, "StaffAttendance">;

const STAFF_STATUSES: { value: StaffAttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "halfday", label: "Half Day" },
  { value: "leave", label: "Leave" },
];

const STAFF_STATUS_COLORS: Record<StaffAttendanceStatus, string> = {
  present: "#059669",
  absent: "#dc2626",
  halfday: "#d97706",
  leave: "#6b7280",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function StatusDropdown({
  value,
  onSelect,
  disabled,
}: {
  value: StaffAttendanceStatus;
  onSelect: (v: StaffAttendanceStatus) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = STAFF_STATUSES.find((s) => s.value === value)?.label ?? "Present";
  const color = STAFF_STATUS_COLORS[value] ?? STAFF_STATUS_COLORS.present;

  if (open) {
    return (
      <View style={styles.statusInline}>
        {STAFF_STATUSES.map((s) => (
          <Pressable
            key={s.value}
            style={[
              styles.statusInlineOption,
              value === s.value && styles.statusInlineOptionActive,
            ]}
            onPress={() => {
              onSelect(s.value);
              setOpen(false);
            }}
          >
            <Text
              style={[
                styles.statusInlineText,
                { color: STAFF_STATUS_COLORS[s.value] },
                value === s.value && styles.statusInlineTextActive,
              ]}
            >
              {s.label}
            </Text>
            {value === s.value ? (
              <Feather name="check" size={14} color={STAFF_STATUS_COLORS[s.value]} />
            ) : null}
          </Pressable>
        ))}
      </View>
    );
  }

  if (disabled) {
    return (
      <View style={styles.statusTrigger}>
        <Text style={[styles.statusTriggerText, { color }]}>{label}</Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.statusTrigger} onPress={() => setOpen(true)}>
      <Text style={[styles.statusTriggerText, { color }]}>{label}</Text>
      <Feather name="chevron-down" size={14} color={color} />
    </Pressable>
  );
}

export function StaffAttendanceScreen({}: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite =
    hasPermission(permissions, MODULES.TEACHING_STAFF, "create") ||
    hasPermission(permissions, MODULES.NON_TEACHING_STAFF, "create");

  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [statuses, setStatuses] = useState<Record<string, StaffAttendanceStatus>>({});
  const [date, setDate] = useState(todayISO());
  const [schoolCode, setSchoolCode] = useState(session?.type === "staff" ? session.schoolcode : "");
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    setLoadingStaff(true);
    setError(null);
    try {
      const roster = await getStaffList();
      setStaff(roster);
      setStatuses((prev) =>
        Object.fromEntries(roster.map((s) => [s.id, (prev[s.id] as StaffAttendanceStatus | undefined) ?? "present"]))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStaff();
    }, [loadStaff])
  );

  function setStatus(staffId: string, status: StaffAttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [staffId]: status }));
  }

  async function handleSubmit() {
    if (!schoolCode) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await bulkMarkStaffAttendance(
        staff.map((s) => ({ staff_id: s.id, date, status: statuses[s.id] ?? "present" })),
        schoolCode
      );
      const parts: string[] = [];
      if (result.count > 0) parts.push(`${result.count} staff attendance record${result.count === 1 ? "" : "s"} saved`);
      if (result.auto_leaves?.length) {
        parts.push(
          `${result.auto_leaves.length} staff auto-marked "leave" (approved leave overlaps this date)`
        );
      }
      if (result.errors?.length) {
        parts.push(`${result.errors.length} ${result.errors.length === 1 ? "record" : "records"} skipped`);
      }
      Alert.alert("Attendance saved", parts.length ? parts.join("\n") : result.message || "Attendance saved.");
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PermissionGate module="Attendance" action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.outer}>
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.pageTitle}>Staff Attendance</Text>
            <Text style={styles.description}>
              Staff with an approved leave covering this date are auto-marked &quot;leave&quot;, overriding whatever&apos;s
              picked here.
            </Text>

            <View style={styles.filters}>
              <DateInput
                label="Date"
                value={date}
                onChangeDate={setDate}
                placeholder="mm/dd/yyyy"
              />
              <Input
                label="School code"
                value={schoolCode}
                onChangeText={setSchoolCode}
                placeholder="School code"
                autoCapitalize="none"
              />
            </View>

            {canWrite ? (
              <Button
                title={submitting ? "Saving..." : "Save attendance"}
                onPress={handleSubmit}
                isLoading={submitting}
                disabled={!schoolCode}
              />
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {loadingStaff ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.brand600} size="large" />
                <Text style={styles.loadingText}>Loading staff...</Text>
              </View>
            ) : null}

            {!loadingStaff && staff.length === 0 ? (
              <Text style={styles.empty}>No staff found. Add staff members before marking attendance.</Text>
            ) : null}

            {staff.length > 0 && (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.colName]}>Staff</Text>
                  <Text style={[styles.tableHeaderCell, styles.colRole]}>Role</Text>
                  <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
                </View>

                <FlatList
                  data={staff}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  removeClippedSubviews={false}
                  contentContainerStyle={styles.staffList}
                  renderItem={({ item }) => (
                    <View style={styles.staffRow}>
                      <Text style={[styles.staffCell, styles.colName]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.staffCell, styles.colRole]} numberOfLines={1}>
                        {item.role || "-"}
                      </Text>
                      <View style={styles.colStatus}>
                        <StatusDropdown
                          value={statuses[item.id] ?? "present"}
                          onSelect={(v) => setStatus(item.id, v)}
                          disabled={!canWrite}
                        />
                      </View>
                    </View>
                  )}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Screen>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  screen: { flex: 1 },
  container: { padding: 16, gap: 14, paddingBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: colors.ink },
  description: { fontSize: 13, lineHeight: 19, color: colors.inkFaint },
  filters: { gap: 4 },
  error: { fontSize: 13, color: colors.danger },
  loadingBox: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadingText: { fontSize: 13, color: colors.inkFaint },
  empty: {
    fontSize: 14,
    color: colors.inkFaint,
    textAlign: "center",
    paddingVertical: 24,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkGhost,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  colName: { flex: 2.2 },
  colRole: { flex: 1.4 },
  colStatus: { flex: 1.4 },
  staffList: { gap: 8, paddingBottom: 16 },
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  staffCell: { fontSize: 14, color: colors.ink },
  statusTrigger: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusTriggerText: { fontSize: 13, fontWeight: "600" },
  statusInline: { gap: 4 },
  statusInlineOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  statusInlineOptionActive: { backgroundColor: colors.brand50, borderColor: colors.brand300 },
  statusInlineText: { fontSize: 13, fontWeight: "600" },
  statusInlineTextActive: { fontWeight: "700" },
});
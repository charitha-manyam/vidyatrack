import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { approveLeave, deleteLeave, getLeaves, rejectLeave } from "../../api/leave.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { Leave, LeaveStatus } from "../../types/leave";

type Props = NativeStackScreenProps<MoreStackParamList, "Leaves">;

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_TONE: Record<LeaveStatus, BadgeTone> = {
  pending: "amber",
  approved: "green",
  rejected: "red",
};

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function InlineSelect({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = options.find((o) => o.value === value);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={[styles.select, open && styles.selectOpen]} onPress={() => setOpen((c) => !c)}>
        <Text style={display && display.value ? styles.selectText : styles.placeholder}>
          {display ? display.label : "Select"}
        </Text>
        <View style={[styles.chevron, open && styles.chevronOpen]}>
          <Feather
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={open ? colors.white : colors.inkFaint}
          />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.options}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.option, value === option.value && styles.optionActive]}
              onPress={() => {
                onSelect(option.value);
                setOpen(false);
              }}
            >
              <Text style={[styles.optionText, value === option.value && styles.optionTextActive]}>
                {option.label}
              </Text>
              {value === option.value ? <Feather name="check" size={16} color={colors.brand700} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function LeavesScreen({ navigation }: Props) {
  const { session } = useAuth();
  const staffSession = session && session.type === "staff" ? session : null;
  const permissions = staffPermissions(session);
  const canManage = hasPermission(permissions, MODULES.TEACHING_STAFF, "update");

  const [statusFilter, setStatusFilter] = useState("");
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLeaves(await getLeaves(statusFilter ? { status: statusFilter } : undefined));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function handleApprove(leave: Leave) {
    if (!staffSession) return;
    Alert.alert("Approve leave?", `Approve this ${capitalize(leave.leave_type)} leave request?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "destructive",
        onPress: async () => {
          try {
            await approveLeave(leave.id, staffSession.userId);
            load();
          } catch (err) {
            Alert.alert("Could not approve", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  function handleReject(leave: Leave) {
    if (!staffSession) return;
    Alert.alert("Reject leave?", `Reject this ${capitalize(leave.leave_type)} leave request?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await rejectLeave(leave.id, staffSession.userId);
            load();
          } catch (err) {
            Alert.alert("Could not reject", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  function handleDelete(leave: Leave) {
    Alert.alert("Delete leave request?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteLeave(leave.id);
            load();
          } catch (err) {
            Alert.alert("Delete failed", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  return (
    <PermissionGate module={[MODULES.TEACHING_STAFF, MODULES.NON_TEACHING_STAFF]} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.outer}>
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topBar}>
              <Button
                title="+ Request Leave"
                variant="secondary"
                onPress={() => navigation.navigate("ResourceForm", { resourceId: "leaves" })}
                style={styles.requestBtn}
                textStyle={styles.requestBtnText}
              />
            </View>

            <InlineSelect
              label="Status"
              value={statusFilter}
              options={STATUS_FILTERS}
              onSelect={setStatusFilter}
            />

            <DataState
              loading={loading}
              error={error}
              retry={load}
              empty={leaves.length === 0 ? "No leave requests found." : null}
            >
            <FlatList
              data={leaves}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
              removeClippedSubviews={false}
              renderItem={({ item }) => (
                <Card style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.staff_name || "Staff"}</Text>
                    <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type</Text>
                    <Text style={styles.infoValue}>{capitalize(item.leave_type)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Dates</Text>
                    <Text style={styles.infoValue}>
                      {item.start_date} → {item.end_date}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Days</Text>
                    <Text style={styles.infoValue}>{item.total_days}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Reason</Text>
                    <Text style={styles.infoValue}>{item.reason || "-"}</Text>
                  </View>
                  {item.status === "pending" ? (
                    <View style={styles.cardActions}>
                      {canManage ? (
                        <>
                          <Pressable
                            style={[styles.iconBtn, styles.approveBtn]}
                            hitSlop={8}
                            onPress={() => handleApprove(item)}
                          >
                            <Feather name="check" size={16} color="#15803d" />
                          </Pressable>
                          <Pressable
                            style={[styles.iconBtn, styles.rejectBtn]}
                            hitSlop={8}
                            onPress={() => handleReject(item)}
                          >
                            <Feather name="x" size={16} color="#b91c1c" />
                          </Pressable>
                        </>
                      ) : null}
                      <Pressable
                        style={[styles.iconBtn, styles.deleteBtn]}
                        hitSlop={8}
                        onPress={() => handleDelete(item)}
                      >
                        <Feather name="trash-2" size={16} color="#64748b" />
                      </Pressable>
                    </View>
                  ) : null}
                </Card>
              )}
            />
          </DataState>
        </ScrollView>
        </View>
      </Screen>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  screen: { flex: 1 },
  container: { padding: 14, gap: 12, paddingBottom: 24 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  requestBtn: { backgroundColor: colors.gradientStart, borderColor: colors.gradientStart },
  requestBtnText: { color: colors.white },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: colors.ink },
  select: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
  },
  selectOpen: { borderColor: colors.brand500 },
  selectText: { flex: 1, fontSize: 15, color: colors.ink },
  placeholder: { flex: 1, fontSize: 15, color: colors.inkFaint },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronOpen: { backgroundColor: colors.brand600 },
  options: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionActive: { backgroundColor: colors.brand50 },
  optionText: { fontSize: 14, color: colors.ink },
  optionTextActive: { color: colors.brand700, fontWeight: "600" },
  list: { gap: 12, paddingBottom: 20 },
  card: { gap: 0 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.ink, flex: 1 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  infoLabel: { fontSize: 13, color: colors.inkSoft },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.ink,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  approveBtn: { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" },
  rejectBtn: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  deleteBtn: { borderColor: colors.lineStrong },
});
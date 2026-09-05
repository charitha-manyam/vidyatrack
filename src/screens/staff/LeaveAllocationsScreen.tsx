import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { useSelectOptions } from "../../hooks/useSelectOptions";
import { getLeaveAllocations, setLeaveAllocations } from "../../api/leave.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import { LEAVE_TYPES } from "../../types/leave";
import type { StaffLeaveAllocation } from "../../types/leave";

type Props = NativeStackScreenProps<MoreStackParamList, "LeaveAllocations">;

function InlineSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = options.find((o) => o.value === value);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={[styles.select, open && styles.selectOpen]} onPress={() => setOpen((c) => !c)}>
        <Text style={display && display.value ? styles.selectText : styles.placeholder}>
          {display ? display.label : placeholder}
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

export function LeaveAllocationsScreen(_: Props) {
  const { session } = useAuth();
  const staffSession = session && session.type === "staff" ? session : null;
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.TEACHING_STAFF, "update");

  const { options: optionSets } = useSelectOptions(["years"]);
  const years = (optionSets.years ?? []) as { value: string; label: string }[];

  const [academicYearId, setAcademicYearId] = useState("");
  const [schoolCode, setSchoolCode] = useState(staffSession?.schoolcode ?? "");
  const [days, setDays] = useState<Record<string, string>>({});
  const [allocations, setAllocations] = useState<StaffLeaveAllocation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllocations = useCallback(async () => {
    setError(null);
    try {
      setAllocations(await getLeaveAllocations());
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllocations();
    }, [loadAllocations])
  );

  useEffect(() => {
    const relevant = allocations.filter((a) => a.academicYearId === academicYearId);
    const next: Record<string, string> = {};
    LEAVE_TYPES.forEach((t) => {
      const existing = relevant.find((a) => a.leave_type === t);
      next[t] = existing ? String(existing.allocated_days) : "";
    });
    setDays((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [allocations, academicYearId]);

  const hasValues = LEAVE_TYPES.some((t) => (days[t] ?? "").trim() !== "");
  const canSave = Boolean(schoolCode && academicYearId && hasValues) && !submitting;

  async function handleSave() {
    if (!academicYearId || !schoolCode) return;
    setSubmitting(true);
    setError(null);
    try {
      const toSave = LEAVE_TYPES.filter((t) => (days[t] ?? "").trim() !== "").map((t) => ({
        leave_type: t,
        allocated_days: Number(days[t]),
      }));
      await setLeaveAllocations(academicYearId, schoolCode, toSave);
      Alert.alert("Saved", "Leave allocations saved.");
      loadAllocations();
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
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
            <Text style={styles.description}>
              One quota per leave type, applied school-wide for the academic year — not per individual staff
              member.
            </Text>

            <InlineSelect
              label="Academic year"
              value={academicYearId}
              options={years}
              onSelect={setAcademicYearId}
              placeholder="Select year"
            />

            <Input
              label="School code"
              value={schoolCode}
              onChangeText={setSchoolCode}
              placeholder="School code"
              autoCapitalize="none"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {academicYearId ? (
              <Card style={styles.card}>
                {LEAVE_TYPES.map((type) => (
                  <View key={type} style={styles.allocRow}>
                    <Text style={styles.allocLabel}>{type}</Text>
                    <TextInput
                      value={days[type] ?? ""}
                      onChangeText={(v) => setDays((prev) => ({ ...prev, [type]: v }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.inkFaint}
                      editable={canWrite}
                      style={[styles.allocInput, !canWrite && styles.allocInputDisabled]}
                    />
                  </View>
                ))}
                {canWrite ? (
                  <Button
                    title={submitting ? "Saving..." : "Save allocations"}
                    variant="secondary"
                    onPress={handleSave}
                    isLoading={submitting}
                    disabled={!canSave}
                    style={styles.saveBtn}
                    textStyle={styles.saveBtnText}
                  />
                ) : null}
              </Card>
            ) : null}
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
  description: { fontSize: 13, lineHeight: 19, color: colors.inkFaint },
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
  error: { fontSize: 13, color: colors.danger },
  card: { gap: 0, paddingVertical: 4 },
  allocRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  allocLabel: { fontSize: 15, fontWeight: "600", color: colors.ink, textTransform: "capitalize" },
  allocInput: {
    width: 92,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.ink,
    textAlign: "center",
  },
  allocInputDisabled: { backgroundColor: colors.brand50, borderColor: colors.lineStrong },
  saveBtn: {
    marginTop: 4,
    backgroundColor: colors.gradientStart,
    borderColor: colors.gradientStart,
  },
  saveBtnText: { color: colors.white },
});
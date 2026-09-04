import { useCallback, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { Button } from "../../components/Button";
import { Badge } from "../../components/ui/Badge";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import {
  deleteAcademicYear,
  getAcademicYears,
  selectAcademicYear,
} from "../../api/academicYear.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { AcademicYearFull } from "../../types/academicYear";

type Props = NativeStackScreenProps<MoreStackParamList, "AcademicYears">;

const carryForwardModules = ["Classes", "Sections", "Subjects", "Fee heads", "Fee structures", "Concessions", "Student fee assignments", "Payroll", "Exam types", "Exam schedules", "Transport routes", "Departments", "Subject assignments"];

function formatDate(value: string | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Port of the admin portal's academic years list.
// years with the Active badge, set the active year, create/edit/delete.
// Same nav gating as the web sidebar: visible only with Classes:create.
export function AcademicYearsScreen({ navigation }: Props) {
  const { session, setSession } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.CLASSES, "create");

  const [years, setYears] = useState<AcademicYearFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [carryForwardVisible, setCarryForwardVisible] = useState(false);
  const [carryTarget, setCarryTarget] = useState("");
  const [modules, setModules] = useState<string[]>(carryForwardModules);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setYears(await getAcademicYears());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSelect(year: AcademicYearFull) {
    setSelectingId(year.id);
    try {
      await selectAcademicYear(year.id);
      // Keep the session's academic-year badge in sync, same as the web
      // portal's authStore.setAcademicYear.
      if (session && session.type === "staff") {
        setSession({ ...session, academicYear: { id: year.id, yearName: year.yearName } });
      }
      load();
    } catch (err) {
      Alert.alert("Couldn't set active year", getErrorMessage(err));
    } finally {
      setSelectingId(null);
    }
  }

  const confirmDelete = (year: AcademicYearFull) => {
    Alert.alert(
      `Delete ${year.yearName}?`,
      "This can't be undone and may affect any records still linked to this year.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAcademicYear(year.id);
              load();
            } catch (err) {
              Alert.alert("Delete failed", getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const rowActions = (year: AcademicYearFull) => {
    const options: Array<{ text: string; style?: "cancel" | "destructive"; onPress?: () => void }> = [
      { text: "Cancel", style: "cancel" },
    ];
    if (!year.isActive) options.push({ text: "Set as active", onPress: () => handleSelect(year) });
    options.push({
      text: "Edit",
      onPress: () =>
        navigation.navigate("AcademicYearForm", {
          yearId: year.id,
          yearName: year.yearName,
          startDate: year.startDate,
          endDate: year.endDate,
        }),
    });
    options.push({ text: "Delete", style: "destructive", onPress: () => confirmDelete(year) });
    Alert.alert(year.yearName, undefined, options);
  };

  return (
    <PermissionGate module={MODULES.CLASSES} action="create">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          {canWrite ? (
            <View style={styles.actions}>
              <Button variant="secondary" title="Promote students" onPress={() => navigation.navigate("AcademicYearPromotion", { kind: "students" })} style={styles.actionButton} />
              <Button variant="secondary" title="Promote staff" onPress={() => navigation.navigate("AcademicYearPromotion", { kind: "staff" })} style={styles.actionButton} />
              <Button variant="secondary" title="Carry forward" onPress={() => setCarryForwardVisible(true)} style={styles.actionButton} />
              <Button title="Add year" onPress={() => navigation.navigate("AcademicYearForm", undefined)} style={styles.actionButton} />
            </View>
          ) : null}
          <DataState loading={loading} error={error} retry={load} empty={years.length === 0 ? "No academic years yet." : null}>
            <FlatList
              contentContainerStyle={styles.listContent}
              data={years}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  disabled={!canWrite}
                  onPress={() =>
                    navigation.navigate("AcademicYearForm", {
                      yearId: item.id,
                      yearName: item.yearName,
                      startDate: item.startDate,
                      endDate: item.endDate,
                    })
                  }
                  onLongPress={canWrite ? () => rowActions(item) : undefined}
                >
                  <View style={styles.textWrap}>
                    <View style={styles.nameLine}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.yearName}
                      </Text>
                      {item.isActive ? <Badge tone="green">Active</Badge> : null}
                    </View>
                    <Text style={styles.subtitle}>
                      {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </Text>
                  </View>
                  {!item.isActive && canWrite ? (
                    <Pressable
                      hitSlop={8}
                      disabled={selectingId === item.id}
                      onPress={() => handleSelect(item)}
                      style={({ pressed }) => [styles.selectBtn, (pressed || selectingId === item.id) && styles.pressed]}
                    >
                      <Feather name="check-circle" size={20} color={colors.success} />
                    </Pressable>
                  ) : null}
                  {canWrite ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() => confirmDelete(item)}
                      style={({ pressed }) => [styles.selectBtn, pressed && styles.pressed]}
                    >
                      <Feather name="trash-2" size={18} color={colors.danger} />
                    </Pressable>
                  ) : null}
                  <Feather name="chevron-right" size={18} color={colors.inkGhost} />
                </Pressable>
              )}
            />
          </DataState>
        </View>
        <Modal visible={carryForwardVisible} transparent animationType="fade" onRequestClose={() => setCarryForwardVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Carry forward to a new academic year</Text>
                <Pressable onPress={() => setCarryForwardVisible(false)} hitSlop={10}>
                  <Feather name="x" size={22} color={colors.inkFaint} />
                </Pressable>
              </View>
              <Text style={styles.modalDescription}>Copies data from the immediately previous year into the one you pick. Students and staff are handled separately through promotion decisions.</Text>
              <Text style={styles.modalLabel}>Carry forward into</Text>
              <Pressable style={styles.select} onPress={() => {
                const availableYears = years.filter((year) => !year.isActive);
                if (availableYears.length === 0) {
                  Alert.alert("No target year", "Create another academic year before carrying data forward.");
                  return;
                }
                Alert.alert("Select target year", undefined, [
                  ...availableYears.map((year) => ({ text: year.yearName, onPress: () => setCarryTarget(year.id) })),
                  { text: "Cancel", style: "cancel" },
                ]);
              }}>
                <Text style={carryTarget ? styles.selectText : styles.placeholder}>{carryTarget ? years.find((year) => year.id === carryTarget)?.yearName ?? "Target academic year" : "Select target year"}</Text>
                <Feather name="chevron-down" size={18} color={colors.inkFaint} />
              </Pressable>
              <Text style={styles.modalLabel}>Modules to carry forward</Text>
              <View style={styles.moduleGrid}>
                {carryForwardModules.map((module) => {
                  const selected = modules.includes(module);
                  return <Pressable key={module} style={styles.moduleOption} onPress={() => setModules((current) => selected ? current.filter((item) => item !== module) : [...current, module])}>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected ? <Feather name="check" size={13} color={colors.white} /> : null}</View>
                    <Text style={styles.moduleText}>{module}</Text>
                  </Pressable>;
                })}
              </View>
              <View style={styles.modalFooter}>
                <Button variant="secondary" title="Cancel" onPress={() => setCarryForwardVisible(false)} />
                <Button title="Preview" disabled={!carryTarget || modules.length === 0} onPress={() => Alert.alert("Preview unavailable", "Carry-forward preview will be connected when the server operation is enabled.")} />
              </View>
            </View>
          </View>
        </Modal>
      </Screen>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    flexGrow: 1,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  pressed: {
    backgroundColor: colors.surfaceHover,
  },
  selectBtn: {
    padding: 2,
    opacity: 0.9,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(20, 36, 33, 0.45)" },
  modalCard: { backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, gap: 12 },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  modalTitle: { flex: 1, fontSize: 19, fontWeight: "700", color: colors.ink },
  modalDescription: { fontSize: 13, lineHeight: 19, color: colors.inkFaint },
  modalLabel: { fontSize: 14, fontWeight: "600", color: colors.ink, marginTop: 4 },
  select: { minHeight: 50, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectText: { fontSize: 15, color: colors.ink },
  placeholder: { fontSize: 15, color: colors.inkFaint },
  moduleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moduleOption: { width: "48%", flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  checkboxSelected: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  moduleText: { flex: 1, fontSize: 13, color: colors.inkSoft },
  modalFooter: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },
});

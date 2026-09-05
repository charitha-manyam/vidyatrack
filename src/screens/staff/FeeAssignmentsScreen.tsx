import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { sectionsFor, studentsFor, useSelectOptions } from "../../hooks/useSelectOptions";
import {
  bulkCreateAssignments,
  createFeeAssignment,
  deleteFeeAssignment,
  getAssignmentsByStudent,
  getFeeAssignments,
  getFeeStructures,
  updateFeeAssignment,
} from "../../api/fees.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";
import type { FeeStructure, StudentFeeAssignment } from "../../types/fees";

// ---------------- List ----------------
type ListProps = NativeStackScreenProps<FeesStackParamList, "FeeAssignments">;

function statusTone(status?: string): BadgeTone {
  if (status === "PAID") return "green";
  if (status === "PARTIAL") return "amber";
  return "red";
}

export function FeeAssignmentsScreen({ navigation }: ListProps) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");
  const { options } = useSelectOptions(["classes", "sections", "students"]);

  const [items, setItems] = useState<StudentFeeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk assign modal state — mirrors admin-portal's BulkAssignFeeDialog.
  const [bulkOpen, setBulkOpen] = useState(false);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [bulkFeeStructureId, setBulkFeeStructureId] = useState("");
  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkSectionId, setBulkSectionId] = useState("");
  const [bulkStudentIds, setBulkStudentIds] = useState<string[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  useEffect(() => {
    if (bulkOpen) {
      setStructures([]);
      setBulkFeeStructureId("");
      setBulkClassId("");
      setBulkSectionId("");
      setBulkStudentIds([]);
      setBulkError(null);
      getFeeStructures()
        .then(setStructures)
        .catch(() => setStructures([]));
    }
  }, [bulkOpen]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getFeeAssignments());
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

  useLayoutEffect(() => {
    if (canWrite) {
      navigation.setOptions({
        headerRight: () => (
          <View style={styles.headerRow}>
            <Button
              title="Bulk"
              variant="secondary"
              onPress={() => setBulkOpen(true)}
              style={styles.headerBtn}
            />
            <Button
              title="+ Add"
              variant="secondary"
              onPress={() => navigation.navigate("FeeAssignmentForm", undefined)}
              style={styles.headerBtn}
            />
          </View>
        ),
      });
    }
  }, [canWrite, navigation]);

  const bulkSections = sectionsFor(options, bulkClassId);
  const bulkStudents = studentsFor(options, bulkClassId, bulkSectionId);
  const bulkStructureOptions: SelectOption[] = structures.map((s) => ({
    value: s.id,
    label: `${s.feeName ?? "Fee"}${s.className ? ` - ${s.className}${s.sectionName ? `-${s.sectionName}` : ""}` : ""} (Rs ${s.amount})`,
  }));

  function toggleBulkStudent(id: string) {
    setBulkStudentIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function handleBulkAssign() {
    if (!bulkFeeStructureId || bulkStudentIds.length === 0) return;
    setBulkSubmitting(true);
    setBulkError(null);
    try {
      const res = await bulkCreateAssignments({
        feeStructureId: bulkFeeStructureId,
        studentIds: bulkStudentIds,
      });
      Alert.alert(
        "Assigned",
        res?.message ?? `Assigned to ${bulkStudentIds.length} student(s).`
      );
      setBulkOpen(false);
      load();
    } catch (err) {
      setBulkError(getErrorMessage(err));
    } finally {
      setBulkSubmitting(false);
    }
  }

  function confirmDelete(item: StudentFeeAssignment) {
    Alert.alert("Delete assignment?", `${item.studentName ?? "This assignment"} will lose its fee record.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFeeAssignment(item.id);
            load();
          } catch (err) {
            Alert.alert("Delete failed", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  return (
    <PermissionGate module={MODULES.FEES} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <Text style={styles.pageTitle}>Student Fee Assignments</Text>
          <Text style={styles.description}>Fee structures assigned to individual students.</Text>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={items.length === 0 ? "No assignments yet — tap Add." : null}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.studentName ?? "Student"}
                    </Text>
                    <Badge tone={statusTone(item.status)}>{item.status ?? "PENDING"}</Badge>
                  </View>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {item.feeHeadName ?? "Fee"}
                  </Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Due</Text>
                      <Text style={styles.infoValue}>Rs {Number(item.dueAmount || 0).toLocaleString("en-IN")}</Text>
                    </View>
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Final</Text>
                      <Text style={styles.infoValue}>Rs {Number(item.finalAmount || 0).toLocaleString("en-IN")}</Text>
                    </View>
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Paid</Text>
                      <Text style={styles.infoValue}>Rs {Number(item.paidAmount || 0).toLocaleString("en-IN")}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <Button
                      title="Edit"
                      variant="secondary"
                      onPress={() => navigation.navigate("FeeAssignmentForm", { assignmentId: item.id })}
                      style={styles.smallBtn}
                    />
                    {canWrite ? (
                      <Button
                        title="Delete"
                        variant="danger"
                        onPress={() => confirmDelete(item)}
                        style={styles.smallBtn}
                      />
                    ) : null}
                  </View>
                </Card>
              ))}
            </View>
          </DataState>
        </View>
      </Screen>

      <Modal visible={bulkOpen} transparent animationType="fade" onRequestClose={() => setBulkOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk assign fee to students</Text>
              <Pressable onPress={() => setBulkOpen(false)} hitSlop={10}>
                <Feather name="x" size={20} color={colors.inkFaint} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <InlineSelect
                label="Fee structure"
                value={bulkFeeStructureId}
                options={bulkStructureOptions}
                onSelect={setBulkFeeStructureId}
                placeholder={structures.length === 0 ? (bulkOpen ? "Loading…" : "Select fee structure") : "Select fee structure"}
              />
              <View style={styles.rowGap}>
                <InlineSelect
                  label="Class"
                  value={bulkClassId}
                  options={(options.classes ?? []) as SelectOption[]}
                  onSelect={(v) => {
                    setBulkClassId(v);
                    setBulkSectionId("");
                    setBulkStudentIds([]);
                  }}
                  placeholder="Select class"
                />
                <InlineSelect
                  label="Section"
                  value={bulkSectionId}
                  options={bulkSections}
                  onSelect={(v) => {
                    setBulkSectionId(v);
                    setBulkStudentIds([]);
                  }}
                  placeholder={bulkClassId ? "Select section" : "Select class first"}
                />
              </View>

              {bulkClassId && bulkSectionId ? (
                <View>
                  <View style={styles.bulkListHeader}>
                    <Text style={styles.bulkListCount}>{bulkStudentIds.length} selected</Text>
                    <View style={styles.rowGap}>
                      <Pressable onPress={() => setBulkStudentIds(bulkStudents.map((s) => s.value))}>
                        <Text style={styles.bulkLink}>Select all</Text>
                      </Pressable>
                      <Pressable onPress={() => setBulkStudentIds([])}>
                        <Text style={styles.bulkLink}>Clear</Text>
                      </Pressable>
                    </View>
                  </View>
                  {bulkStudents.length === 0 ? (
                    <Text style={styles.infoLabel}>No students found for this class/section.</Text>
                  ) : (
                    <View style={styles.bulkList}>
                      {bulkStudents.map((s) => {
                        const checked = bulkStudentIds.includes(s.value);
                        return (
                          <Pressable
                            key={s.value}
                            style={styles.bulkRow}
                            onPress={() => toggleBulkStudent(s.value)}
                          >
                            <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                              {checked ? <Feather name="check" size={13} color={colors.white} /> : null}
                            </View>
                            <Text style={styles.bulkRowLabel} numberOfLines={1}>
                              {s.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              ) : null}

              {bulkError ? (
                <Text style={styles.warnText}>{bulkError}</Text>
              ) : null}
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="secondary" onPress={() => setBulkOpen(false)} style={styles.flexBtn} />
              <Button
                title={
                  bulkStudentIds.length > 0
                    ? `Assign to ${bulkStudentIds.length} student${bulkStudentIds.length === 1 ? "" : "s"}`
                    : "Assign"
                }
                isLoading={bulkSubmitting}
                disabled={!bulkFeeStructureId || bulkStudentIds.length === 0}
                onPress={handleBulkAssign}
                style={styles.flexBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </PermissionGate>
  );
}

// ---------------- Form ----------------
type FormProps = NativeStackScreenProps<FeesStackParamList, "FeeAssignmentForm">;

export function FeeAssignmentFormScreen({ navigation, route }: FormProps) {
  const editing = Boolean(route.params?.assignmentId);
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");
  const { options } = useSelectOptions(["students"]);

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const structureOptions: SelectOption[] = structures.map((s) => ({
    value: s.id,
    label: `${s.feeName ?? "Fee"}${s.className ? ` - ${s.className}${s.sectionName ? `-${s.sectionName}` : ""}` : ""} (Rs ${s.amount})`,
  }));

  const [studentId, setStudentId] = useState("");
  const [feeStructureId, setFeeStructureId] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [loadingEdit, setLoadingEdit] = useState(editing);
  const [loadingStructures, setLoadingStructures] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStructures = useCallback(async () => {
    setLoadingStructures(true);
    try {
      setStructures(await getFeeStructures());
    } catch {
      setStructures([]);
    } finally {
      setLoadingStructures(false);
    }
  }, []);

  const loadExisting = useCallback(async () => {
    if (!route.params?.assignmentId) return;
    try {
      const all = await getFeeAssignments();
      const a = all.find((x) => x.id === route.params!.assignmentId);
      if (a) {
        setStudentId(a.studentId ?? "");
        setFeeStructureId(a.feeStructureId ?? "");
        setOriginalAmount(a.originalAmount != null ? String(a.originalAmount) : "");
        setDiscountAmount(a.discountAmount != null ? String(a.discountAmount) : "0");
        setPaidAmount(a.paidAmount != null ? String(a.paidAmount) : "0");
      }
    } catch (err) {
      Alert.alert("Could not load assignment", getErrorMessage(err));
    } finally {
      setLoadingEdit(false);
    }
  }, [route.params?.assignmentId]);

  useFocusEffect(
    useCallback(() => {
      if (editing) loadExisting();
    }, [editing, loadExisting])
  );

  useFocusEffect(
    useCallback(() => {
      loadStructures();
    }, [loadStructures])
  );

  // The backend rejects (studentId + feeStructureId) duplicates with a 409 —
  // surface that before the user submits instead of failing on save.
  useEffect(() => {
    let alive = true;
    setDuplicateWarning(null);
    if (editing || !studentId || !feeStructureId) return;
    (async () => {
      try {
        const existing = await getAssignmentsByStudent(studentId);
        if (alive && existing.some((a) => a.feeStructureId === feeStructureId)) {
          setDuplicateWarning("This fee structure is already assigned to this student — pick another fee or student.");
        }
      } catch {
        // ignore network hiccup; the backend still guards on submit
      }
    })();
    return () => {
      alive = false;
    };
  }, [editing, studentId, feeStructureId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editing ? "Edit assignment" : "Add assignment",
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [editing, navigation]);

  function onStructureSelect(v: string) {
    setFeeStructureId(v);
    if (!editing) {
      const s = structures.find((x) => x.id === v);
      if (s && !originalAmount) setOriginalAmount(String(s.amount));
    }
  }

  const original = Number(originalAmount || 0);
  const discount = Number(discountAmount || 0);
  const final = Math.max(original - discount, 0);

  async function handleSubmit() {
    if (!studentId) return setFieldError("Select a student.");
    if (!feeStructureId) return setFieldError("Select a fee structure.");
    if (duplicateWarning) {
      return setFieldError("This fee is already assigned to this student.");
    }
    setFieldError(null);
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateFeeAssignment(route.params!.assignmentId!, {
          originalAmount: original,
          discountAmount: discount,
          paidAmount: Number(paidAmount || 0),
        });
      } else {
        await createFeeAssignment({
          studentId,
          feeStructureId,
          originalAmount: original,
          discountAmount: discount,
          paidAmount: Number(paidAmount || 0),
        });
      }
      Alert.alert(editing ? "Assignment updated" : "Assignment created", undefined, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Save failed", getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingEdit) return <DataState loading />;

  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {editing ? (
            <Text style={styles.smallHint}>
              Student and fee structure are locked on edit; adjust amounts instead.
            </Text>
          ) : null}
          <InlineSelect
            label="Student"
            value={studentId}
            options={(options.students ?? []) as SelectOption[]}
            onSelect={editing ? () => {} : setStudentId}
            placeholder="Select student"
          />
          <InlineSelect
            label="Fee structure"
            value={feeStructureId}
            options={structureOptions}
            onSelect={editing ? () => {} : onStructureSelect}
            placeholder={loadingStructures ? "Loading…" : "Select fee structure"}
          />
          {duplicateWarning ? <Text style={styles.warnText}>{duplicateWarning}</Text> : null}
          <Input
            label="Original amount (Rs)"
            value={originalAmount}
            onChangeText={setOriginalAmount}
            keyboardType="numeric"
          />
          <Input
            label="Discount (Rs)"
            value={discountAmount}
            onChangeText={setDiscountAmount}
            keyboardType="numeric"
          />
          {editing ? (
            <Input
              label="Paid (Rs)"
              value={paidAmount}
              onChangeText={setPaidAmount}
              keyboardType="numeric"
            />
          ) : (
            <View style={styles.finalRow}>
              <Text style={styles.infoLabel}>Final amount</Text>
              <Text style={styles.finalValue}>Rs {final.toLocaleString("en-IN")}</Text>
            </View>
          )}
          {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}
          <View style={styles.footer}>
            <Button
              title={editing ? "Save changes" : "Create assignment"}
              onPress={handleSubmit}
              isLoading={isSubmitting}
              disabled={!canWrite || Boolean(duplicateWarning)}
            />
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: colors.ink, marginBottom: 4 },
  description: { fontSize: 13, lineHeight: 19, color: colors.inkFaint, marginBottom: 12 },
  headerRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  headerBtn: { marginRight: 4 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 18 },
  modalSheet: {
    backgroundColor: colors.paper,
    borderRadius: 16,
    maxHeight: "78%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.ink },
  modalBody: { padding: 16, gap: 14 },
  modalFooter: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.line },
  flexBtn: { flex: 1 },
  rowGap: { gap: 10 },
  bulkListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  bulkListCount: { fontSize: 12, fontWeight: "600", color: colors.inkFaint },
  bulkLink: { fontSize: 12, fontWeight: "600", color: colors.brand700, paddingHorizontal: 4 },
  bulkList: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 6,
    gap: 2,
  },
  bulkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  checkboxOn: { backgroundColor: colors.gradientStart, borderColor: colors.gradientStart },
  bulkRowLabel: { fontSize: 14, color: colors.ink, flex: 1 },
  list: { gap: 10 },
  card: { padding: 14, gap: 6 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.ink, flex: 1 },
  cardSubtitle: { fontSize: 13, color: colors.inkFaint, lineHeight: 18 },
  infoGrid: { flexDirection: "row", gap: 10, paddingTop: 4 },
  infoCell: { flex: 1 },
  infoLabel: { fontSize: 12, color: colors.inkSoft },
  infoValue: { fontSize: 14, fontWeight: "600", color: colors.ink },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  smallBtn: { flexGrow: 1, paddingVertical: 6 },
  form: { gap: 14, paddingBottom: 32 },
  smallHint: { fontSize: 12, color: colors.inkFaint, lineHeight: 17 },
  warnText: {
    fontSize: 13,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    padding: 10,
    lineHeight: 18,
  },
  finalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.brand50,
    borderRadius: 10,
    padding: 12,
  },
  finalValue: { fontSize: 15, fontWeight: "700", color: colors.brand800 },
  error: { fontSize: 13, color: colors.danger },
  footer: { marginTop: 4 },
});
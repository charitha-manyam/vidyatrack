import { useCallback, useLayoutEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { DateInput } from "../../components/DateInput";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { InlineSelect } from "../../components/InlineSelect";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { useSelectOptions, sectionsFor, studentsFor, type SelectOption } from "../../hooks/useSelectOptions";
import {
  createFeeStructure,
  deleteFeeStructure,
  getFeeStructures,
  updateFeeStructure,
} from "../../api/fees.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";
import type { FeeStructure } from "../../types/fees";
import { APPLICABLE_TO_OPTIONS, BILLING_CYCLE_OPTIONS, STATUS_OPTIONS } from "../../types/fees";

// ---------------- List ----------------
type ListProps = NativeStackScreenProps<FeesStackParamList, "FeeStructures">;

function toneForStatus(status?: string) {
  return status === "ACTIVE" ? ("green" as const) : ("gray" as const);
}

export function FeeStructuresScreen({ navigation }: ListProps) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");

  const [items, setItems] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getFeeStructures());
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
          <Button
            title="+ Add"
            variant="secondary"
            onPress={() => navigation.navigate("FeeStructureForm", undefined)}
            style={styles.headerBtn}
          />
        ),
      });
    }
  }, [canWrite, navigation]);

  function confirmDelete(item: FeeStructure) {
    Alert.alert("Delete fee structure?", `${item.feeName ?? "This structure"} will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFeeStructure(item.id);
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
          <Text style={styles.pageTitle}>Fee Structures</Text>
          <Text style={styles.description}>Amount, due date and billing cycle per class and section.</Text>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={items.length === 0 ? "No fee structures yet — tap Add." : null}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.feeName ?? "Fee"}
                    </Text>
                    <Badge tone={toneForStatus(item.status)}>{item.status ?? "ACTIVE"}</Badge>
                  </View>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {[item.className, item.sectionName].filter(Boolean).join(" - ") || "All sections"}
                    {" · "}
                    {item.billingCycle ? item.billingCycle.replace("_", " ").toLowerCase() : "one time"}
                  </Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Due {item.dueDate ?? "—"}</Text>
                    <Text style={styles.infoValue}>Rs {Number(item.amount || 0).toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Button
                      title="Edit"
                      variant="secondary"
                      onPress={() => navigation.navigate("FeeStructureForm", { feeStructureId: item.id })}
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
    </PermissionGate>
  );
}

// ---------------- Form ----------------
type FormProps = NativeStackScreenProps<FeesStackParamList, "FeeStructureForm">;

export function FeeStructureFormScreen({ navigation, route }: FormProps) {
  const editing = Boolean(route.params?.feeStructureId);
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");
  const { options } = useSelectOptions(["feeHeads", "years", "classes", "sections", "students"]);

  const [feeHeadId, setFeeHeadId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billingCycle, setBillingCycle] = useState("ONE_TIME");
  const [isMandatory, setIsMandatory] = useState(true);
  const [allowConcession, setAllowConcession] = useState(true);
  const [applicableTo, setApplicableTo] = useState("ALL_STUDENTS");
  const [status, setStatus] = useState("ACTIVE");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(editing);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!route.params?.feeStructureId) return;
    try {
      const all = await getFeeStructures();
      const s = all.find((x) => x.id === route.params!.feeStructureId);
      if (s) {
        setFeeHeadId(s.feeHeadId ?? "");
        setAcademicYearId(s.academicYearId ?? "");
        setClassId(s.classId ?? "");
        setSectionId(s.sectionId ?? "");
        setAmount(s.amount != null ? String(s.amount) : "");
        setDueDate((s.dueDate ?? "").slice(0, 10));
        setBillingCycle(s.billingCycle || "ONE_TIME");
        setIsMandatory(Boolean(s.isMandatory));
        setAllowConcession(Boolean(s.allowConcession));
        setApplicableTo(s.applicableTo || "ALL_STUDENTS");
        setStatus(s.status || "ACTIVE");
        setSelectedStudents(s.selectedStudentIds ?? []);
      }
    } catch (err) {
      Alert.alert("Could not load structure", getErrorMessage(err));
    } finally {
      setLoadingEdit(false);
    }
  }, [route.params?.feeStructureId]);

  useFocusEffect(
    useCallback(() => {
      if (editing) loadExisting();
    }, [editing, loadExisting])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editing ? "Edit fee structure" : "Add fee structure",
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [editing, navigation]);

  const sections = sectionsFor(options, classId);
  const candidateStudents = studentsFor(options, classId, applicableTo === "SELECTED_STUDENTS" ? sectionId : "");

  function toggleStudent(id: string) {
    setSelectedStudents((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function handleSubmit() {
    if (!feeHeadId) return setFieldError("Select a fee head.");
    if (!academicYearId) return setFieldError("Select an academic year.");
    if (!classId) return setFieldError("Select a class.");
    if (!sectionId) return setFieldError("Select a section.");
    const amt = Number(amount || 0);
    if (!isFinite(amt) || amt <= 0) return setFieldError("Amount must be greater than 0.");
    if (applicableTo === "SELECTED_STUDENTS" && selectedStudents.length === 0) {
      return setFieldError("Select at least one student.");
    }
    setFieldError(null);
    setIsSubmitting(true);
    const values = {
      feeHeadId,
      academicYearId,
      classId,
      sectionId,
      amount: amt,
      dueDate,
      billingCycle,
      isMandatory,
      allowConcession,
      applicableTo,
      status,
      ...(applicableTo === "SELECTED_STUDENTS" ? { selectedStudentIds: selectedStudents } : {}),
    };
    try {
      if (editing) {
        await updateFeeStructure(route.params!.feeStructureId!, {
          amount: amt,
          dueDate,
          billingCycle,
          isMandatory,
          allowConcession,
          applicableTo,
          status,
        });
      } else {
        await createFeeStructure(values);
      }
      Alert.alert(editing ? "Fee structure updated" : "Fee structure created", undefined, [
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
          <InlineSelect
            label="Fee head"
            value={feeHeadId}
            options={(options.feeHeads ?? []) as SelectOption[]}
            onSelect={setFeeHeadId}
            placeholder="Select fee head"
          />
          <InlineSelect
            label="Academic year"
            value={academicYearId}
            options={(options.years ?? []) as SelectOption[]}
            onSelect={setAcademicYearId}
            placeholder="Select year"
          />
          <InlineSelect
            label="Class"
            value={classId}
            options={(options.classes ?? []) as SelectOption[]}
            onSelect={(v) => {
              setClassId(v);
              setSectionId("");
              setSelectedStudents([]);
            }}
            placeholder="Select class"
          />
          <InlineSelect
            label="Section"
            value={sectionId}
            options={sections}
            onSelect={setSectionId}
            placeholder="Select section"
          />
          <Input label="Amount (Rs)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="e.g. 25000" />
          <DateInput label="Due date" value={dueDate} onChangeDate={setDueDate} />
          <InlineSelect
            label="Billing cycle"
            value={billingCycle}
            options={BILLING_CYCLE_OPTIONS}
            onSelect={setBillingCycle}
          />
          <InlineSelect
            label="Applicable to"
            value={applicableTo}
            options={APPLICABLE_TO_OPTIONS}
            onSelect={setApplicableTo}
          />

          {applicableTo === "SELECTED_STUDENTS" ? (
            <View style={styles.studentList}>
              <Text style={styles.sectionLabel}>
                Students in {sections.find((s) => s.value === sectionId)?.label ?? "selected section"} (
                {candidateStudents.length})
              </Text>
              {candidateStudents.length === 0 ? (
                <Text style={styles.smallHint}>No students for the selected class/section.</Text>
              ) : editing ? (
                <Text style={styles.smallHint}>
                  {selectedStudents.length} student(s) selected — adjust in the Students module or recreate.
                </Text>
              ) : (
                candidateStudents.map((s) => {
                  const checked = selectedStudents.includes(s.value);
                  return (
                    <Pressable key={s.value} style={styles.checkRow} onPress={() => toggleStudent(s.value)}>
                      <View style={[styles.checkBox, checked && styles.checkBoxChecked]}>
                        {checked ? <Feather name="check" size={13} color={colors.white} /> : null}
                      </View>
                      <Text style={styles.checkLabel}>{s.label}</Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : null}

          <View style={styles.checkRow}>
            <Pressable style={styles.checkBoxWrap} onPress={() => setIsMandatory(!isMandatory)}>
              <View style={[styles.checkBox, isMandatory && styles.checkBoxChecked]}>
                {isMandatory ? <Feather name="check" size={13} color={colors.white} /> : null}
              </View>
            </Pressable>
            <Pressable style={styles.checkLabelWrap} onPress={() => setIsMandatory(!isMandatory)}>
              <Text style={styles.checkLabel}>Mandatory fee</Text>
            </Pressable>
          </View>
          <View style={styles.checkRow}>
            <Pressable style={styles.checkBoxWrap} onPress={() => setAllowConcession(!allowConcession)}>
              <View style={[styles.checkBox, allowConcession && styles.checkBoxChecked]}>
                {allowConcession ? <Feather name="check" size={13} color={colors.white} /> : null}
              </View>
            </Pressable>
            <Pressable style={styles.checkLabelWrap} onPress={() => setAllowConcession(!allowConcession)}>
              <Text style={styles.checkLabel}>Allow concession</Text>
            </Pressable>
          </View>

          {!editing ? (
            <InlineSelect
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onSelect={setStatus}
            />
          ) : null}

          {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}
          <View style={styles.footer}>
            <Button
              title={editing ? "Save changes" : "Create fee structure"}
              onPress={handleSubmit}
              isLoading={isSubmitting}
              disabled={!canWrite}
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
  headerBtn: { marginRight: 8 },
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  infoLabel: { fontSize: 13, color: colors.inkSoft },
  infoValue: { fontSize: 13, fontWeight: "600", color: colors.ink },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  smallBtn: { flexGrow: 1, paddingVertical: 6 },
  form: { gap: 14, paddingBottom: 32 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: colors.ink },
  studentList: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  smallHint: { fontSize: 12, color: colors.inkFaint, lineHeight: 17 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 32 },
  checkBoxWrap: { width: 24, alignItems: "center" },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxChecked: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  checkLabelWrap: { flex: 1 },
  checkLabel: { fontSize: 14, color: colors.ink },
  error: { fontSize: 13, color: colors.danger },
  footer: { marginTop: 4 },
});
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { DataState } from "../../components/DataState";
import { useAuth } from "../../context/AuthContext";
import { sectionsFor, studentsFor, useSelectOptions } from "../../hooks/useSelectOptions";
import { createTransportFee, getTransportFeeById, updateTransportFee } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { TransportFee } from "../../types/transport";

type Props = NativeStackScreenProps<MoreStackParamList, "TransportFeeForm">;

function numOrUndef(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return isFinite(n) ? n : null;
}

export function TransportFeeFormScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const editing = Boolean(route.params?.transportFeeId);
  const academicYearId = session?.type === "staff" ? session.academicYear?.id : undefined;
  const { options } = useSelectOptions(["classes", "sections", "students", "feeHeads"]);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [feeheadId, setFeeheadId] = useState("");
  const [slabName, setSlabName] = useState("");
  const [fromKm, setFromKm] = useState("");
  const [toKm, setToKm] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [annualFee, setAnnualFee] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(editing);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existing, setExisting] = useState<TransportFee | null>(null);

  const loadExisting = useCallback(async () => {
    if (!route.params?.transportFeeId) return;
    try {
      const f = await getTransportFeeById(route.params.transportFeeId);
      if (f) {
        setExisting(f);
        setClassId(f.class_id);
        setSectionId(f.section_id);
        setStudentId(f.student_id);
        setFeeheadId(f.feehead_id);
        setSlabName(f.slab_name ?? "");
        setFromKm(f.from_km != null ? String(f.from_km) : "");
        setToKm(f.to_km != null ? String(f.to_km) : "");
        setMonthlyFee(f.monthly_fee != null ? String(f.monthly_fee) : "");
        setAnnualFee(f.annual_fee != null ? String(f.annual_fee) : "");
      }
    } catch (err) {
      Alert.alert("Could not load transport fee", getErrorMessage(err));
    } finally {
      setLoadingEdit(false);
    }
  }, [route.params?.transportFeeId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editing ? "Edit transport fee" : "Add transport fee",
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [editing, navigation]);

  useEffect(() => {
    if (editing) loadExisting();
  }, [editing, loadExisting]);

  const classOptions: SelectOption[] = (options.classes ?? []).map((o) => o);
  const sectionOptions = sectionsFor(options, classId);
  const studentOptions = studentsFor(options, classId, sectionId);

  async function handleSubmit() {
    if (!classId || !sectionId || !studentId || !feeheadId) {
      setFieldError("Class, section, student and fee head are required.");
      return;
    }
    setFieldError(null);
    setIsSubmitting(true);
    const values = {
      feehead_id: feeheadId,
      student_id: studentId,
      section_id: sectionId,
      class_id: classId,
      slab_name: slabName.trim() || undefined,
      from_km: numOrUndef(fromKm),
      to_km: numOrUndef(toKm),
      monthly_fee: numOrUndef(monthlyFee),
      annual_fee: numOrUndef(annualFee),
      ...(academicYearId ? { academicYearId } : {}),
    };
    try {
      if (editing) {
        await updateTransportFee(route.params!.transportFeeId!, values);
      } else {
        await createTransportFee(values);
      }
      Alert.alert(editing ? "Transport fee updated" : "Transport fee created", undefined, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Save failed", getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingEdit) return <DataState loading />;

  const enabled = !editing;

  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {editing && existing ? (
            <>
              <View style={styles.readonly}>
                <Text style={styles.infoLabel}>Student</Text>
                <Text style={styles.infoValue}>{existing.studentName ?? "Student"}</Text>
              </View>
              <View style={styles.readonly}>
                <Text style={styles.infoLabel}>Class · Section</Text>
                <Text style={styles.infoValue}>
                  {[existing.className, existing.sectionName].filter(Boolean).join(" · ") || "—"}
                </Text>
              </View>
            </>
          ) : (
            <>
              <InlineSelect label="Class" value={classId} options={classOptions} onSelect={setClassId} placeholder="Select class" />
              <InlineSelect
                label="Section"
                value={sectionId}
                options={sectionOptions}
                onSelect={setSectionId}
                placeholder="Select section"
                disabled={!classId}
              />
              <InlineSelect
                label="Student"
                value={studentId}
                options={studentOptions}
                onSelect={setStudentId}
                placeholder="Select student"
                disabled={!classId || !sectionId}
              />
            </>
          )}

          <InlineSelect label="Fee head" value={feeheadId} options={options.feeHeads ?? []} onSelect={setFeeheadId} placeholder="Select fee head" />

          <Input label="Slab name (optional)" placeholder="Route name from the assignment" value={slabName} onChangeText={setSlabName} />
          <View style={styles.row}>
            <Input label="From (km)" value={fromKm} onChangeText={setFromKm} keyboardType="numeric" style={styles.half} />
            <Input label="To (km)" value={toKm} onChangeText={setToKm} keyboardType="numeric" style={styles.half} />
          </View>
          <Input label="Monthly fee (Rs)" value={monthlyFee} onChangeText={setMonthlyFee} keyboardType="numeric" />
          <Input label="Annual fee (Rs)" value={annualFee} onChangeText={setAnnualFee} keyboardType="numeric" />

          {!editing ? (
            <Text style={styles.hint}>
              Leave the slab name and fee amounts blank to pull them from the student's current transport route
              assignment.
            </Text>
          ) : null}
          {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}
          <View style={styles.footer}>
            <Button title={editing ? "Save changes" : "Create transport fee"} onPress={handleSubmit} isLoading={isSubmitting} disabled={!feeheadId} />
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  form: { gap: 14, paddingBottom: 32 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  readonly: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
  },
  infoLabel: { fontSize: 13, color: colors.inkSoft },
  infoValue: { fontSize: 14, fontWeight: "600", color: colors.ink },
  hint: { fontSize: 12, lineHeight: 17, color: colors.inkFaint },
  error: { fontSize: 13, color: colors.danger },
  footer: { marginTop: 4 },
});
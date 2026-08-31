import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataState } from "../../components/DataState";
import { createStudent, getClasses, getSectionsByClass, getStudentById, updateStudent, type StudentFormValues } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import type { StudentsStackParamList } from "../../navigation/types";
import type { SchoolClass, Section } from "../../types/school";

type Props = NativeStackScreenProps<StudentsStackParamList, "StudentForm">;

const GENDERS: { value: StudentFormValues["gender"]; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export function StudentFormScreen({ route, navigation }: Props) {
  const { session } = useAuth();
  const staffSession = session && session.type === "staff" ? session : null;
  const studentId = route.params?.studentId;

  const [loading, setLoading] = useState(Boolean(studentId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [form, setForm] = useState<StudentFormValues>({
    first_name: "",
    last_name: "",
    gender: "male",
    roll_number: "",
    school_code: staffSession?.schoolcode ?? "",
    class_id: "",
    sectionId: "",
    admission_number: "",
    date_of_birth: "",
    address: "",
    father_name: "",
    mother_name: "",
    father_email: "",
    mother_email: "",
    father_phone: "",
    mother_phone: "",
  });

  const set = (key: keyof StudentFormValues) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const classList = await getClasses();
      setClasses(classList);
      if (studentId) {
        const student = await getStudentById(studentId);
        if (!student) return;
        setForm({
          first_name: student.first_name ?? "",
          last_name: student.last_name ?? "",
          gender: student.gender ?? "male",
          roll_number: student.roll_number ?? "",
          school_code: student.school_code ?? staffSession?.schoolcode ?? "",
          class_id: student.class_id ?? "",
          sectionId: student.sectionId ?? "",
          admission_number: student.admission_number ?? "",
          date_of_birth: student.date_of_birth ?? "",
          address: student.address ?? "",
          father_name: "",
          mother_name: "",
          father_email: "",
          mother_email: "",
          father_phone: "",
          mother_phone: "",
        });
      }
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const pickClass = async (classId: string) => {
    setForm((prev) => ({ ...prev, class_id: classId, sectionId: "" }));
    try {
      setSections(await getSectionsByClass(classId));
    } catch {
      setSections([]);
    }
  };

  const save = async () => {
    if (!form.first_name.trim()) {
      setError("First name is required");
      return;
    }
    if (!form.roll_number.trim()) {
      setError("Roll number is required");
      return;
    }
    if (!form.school_code.trim()) {
      setError("School code is required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (studentId) {
        await updateStudent(studentId, form);
      } else {
        await createStudent(form);
      }
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <PageHeader title={studentId ? "Edit student" : "Add student"} />
      <DataState loading={loading} error={loadError} retry={load}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.row}>
            <Input label="First name" value={form.first_name} onChangeText={set("first_name")} style={styles.half} />
            <Input label="Last name" value={form.last_name} onChangeText={set("last_name")} style={styles.half} />
          </View>

          <Text style={styles.groupLabel}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((g) => (
              <Pressable
                key={g.value}
                onPress={() => set("gender")(g.value)}
                style={[styles.chip, form.gender === g.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, form.gender === g.value && styles.chipTextActive]}>{g.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.row}>
            <Input label="Roll number" value={form.roll_number} onChangeText={set("roll_number")} style={styles.half} />
            <Input
              label="School code"
              autoCapitalize="characters"
              value={form.school_code}
              onChangeText={set("school_code")}
              style={styles.half}
            />
          </View>

          <View style={styles.row}>
            <Input label="Admission number" value={form.admission_number} onChangeText={set("admission_number")} style={styles.half} />
            <Input
              label="Date of birth"
              placeholder="YYYY-MM-DD"
              value={form.date_of_birth}
              onChangeText={set("date_of_birth")}
              style={styles.half}
            />
          </View>

          <Text style={styles.label}>Class</Text>
          <View style={styles.chipRow}>
            {classes.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => pickClass(c.id)}
                style={[styles.chip, form.class_id === c.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, form.class_id === c.id && styles.chipTextActive]}>{c.class_name}</Text>
              </Pressable>
            ))}
            {classes.length === 0 ? <Text style={styles.emptyHint}>No classes yet — create one first.</Text> : null}
          </View>

          {form.class_id ? (
            <>
              <Text style={styles.label}>Section (optional — auto-assigned if the class only has one)</Text>
              <View style={styles.chipRow}>
                {sections.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => set("sectionId")(s.id)}
                    style={[styles.chip, form.sectionId === s.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, form.sectionId === s.id && styles.chipTextActive]}>
                      {s.sectionName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <Input label="Address" value={form.address} onChangeText={set("address")} multiline />

          <Text style={styles.groupLabel}>Parent details (optional)</Text>
          <View style={styles.row}>
            <Input label="Father's name" value={form.father_name} onChangeText={set("father_name")} style={styles.half} />
            <Input label="Mother's name" value={form.mother_name} onChangeText={set("mother_name")} style={styles.half} />
          </View>
          <View style={styles.row}>
            <Input
              label="Father's email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.father_email}
              onChangeText={set("father_email")}
              style={styles.half}
            />
            <Input
              label="Mother's email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.mother_email}
              onChangeText={set("mother_email")}
              style={styles.half}
            />
          </View>
          <View style={styles.row}>
            <Input
              label="Father's phone"
              keyboardType="phone-pad"
              value={form.father_phone}
              onChangeText={set("father_phone")}
              style={styles.half}
            />
            <Input
              label="Mother's phone"
              keyboardType="phone-pad"
              value={form.mother_phone}
              onChangeText={set("mother_phone")}
              style={styles.half}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title={studentId ? "Save changes" : "Create student"} onPress={save} isLoading={saving} />
          <Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </DataState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
  groupLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: colors.inkGhost,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.ink,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand600,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.inkSoft,
  },
  chipTextActive: {
    color: colors.brand700,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
});

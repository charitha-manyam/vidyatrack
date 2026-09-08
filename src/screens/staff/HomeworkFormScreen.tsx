import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { DateInput } from "../../components/DateInput";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { getClasses, getSectionsByClass, getSubjects, getStaff } from "../../api/school.api";
import { getHomeworkById, createHomework, updateHomework } from "../../api/homework.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { Homework, HomeworkFormValues } from "../../types/homework";

type Props = NativeStackScreenProps<MoreStackParamList, "HomeworkForm">;

// Port of admin-portal's features/homework/HomeworkFormDialog — the same
// fields in the same order: Title, Description, Class, Section (optional,
// filtered by class), Subject (optional, filtered by class), Teacher (teacher
// role only), Due date, Publish-immediately toggle. On edit the form pre-fills
// from getHomeworkById and calls updatehomeworkById instead of createhomework.
export function HomeworkFormScreen({ navigation, route }: Props) {
  const homeworkId = route.params?.homeworkId;
  const isEdit = Boolean(homeworkId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? "Edit homework" : "Assign homework",
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [navigation, isEdit]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [classes, setClasses] = useState<SelectOption[]>([]);
  const [sections, setSections] = useState<SelectOption[]>([]);
  const [subjects, setSubjects] = useState<SelectOption[]>([]);
  const [teachers, setTeachers] = useState<SelectOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all dropdown sources + optional existing homework in one pass.
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [classRows, teacherRows, existing] = await Promise.all([
        getClasses(),
        getStaff({ role: "teacher" }),
        homeworkId ? getHomeworkById(homeworkId) : Promise.resolve(null),
      ]);
      setClasses(classRows.map((c) => ({ label: c.class_name, value: c.id })));
      setTeachers(teacherRows.map((s) => ({ label: s.name || `Staff ${s.id}`, value: s.id })));

      if (existing) {
        setTitle(existing.title);
        setDescription(existing.description);
        setClassId(existing.class_id);
        setTeacherId(existing.teacher_id);
        setDueDate(existing.submission_date);
        setIsPublished(existing.is_published);
        if (existing.section_id) setSectionId(existing.section_id);
        if (existing.subject_id) setSubjectId(existing.subject_id);

        // Pre-load sections/subjects for the selected class so the user sees
        // the correct option highlighted immediately.
        const [sectionRows, subjectRows] = await Promise.all([
          getSectionsByClass(existing.class_id).catch(() => []),
          getSubjects({ class_id: existing.class_id }).catch(() => []),
        ]);
        setSections(sectionRows.map((s) => ({ label: s.sectionName, value: s.id })));
        setSubjects(subjectRows.map((s) => ({ label: s.subject_name ?? s.name ?? "—", value: s.id })));
      }
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [homeworkId]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch sections and subjects whenever the class changes.
  useEffect(() => {
    if (!classId) {
      setSections([]);
      setSubjects([]);
      return;
    }
    let alive = true;
    Promise.all([getSectionsByClass(classId).catch(() => []), getSubjects({ class_id: classId }).catch(() => [])]).then(
      ([s, sub]) => {
        if (!alive) return;
        setSections(s.map((r) => ({ label: r.sectionName, value: r.id })));
        setSubjects(sub.map((r) => ({ label: r.subject_name ?? r.name ?? "—", value: r.id })));
      }
    );
    return () => {
      alive = false;
    };
  }, [classId]);

  function handleClassChange(id: string) {
    setClassId(id);
    setSectionId("");
    setSubjectId("");
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Missing info", "Title is required.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Missing info", "Description is required.");
      return;
    }
    if (!classId) {
      Alert.alert("Missing info", "Class is required.");
      return;
    }
    if (!teacherId) {
      Alert.alert("Missing info", "Teacher is required.");
      return;
    }
    if (!dueDate) {
      Alert.alert("Missing info", "Due date is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const values: HomeworkFormValues = {
        title: title.trim(),
        description: description.trim(),
        class_id: classId,
        section_id: sectionId || undefined,
        subject_id: subjectId || undefined,
        teacher_id: teacherId,
        submission_date: dueDate,
        is_published: isPublished,
      };

      if (isEdit && homeworkId) {
        await updateHomework(homeworkId, values);
        Alert.alert("Homework updated", undefined, [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else {
        await createHomework(values);
        Alert.alert("Homework assigned", undefined, [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      Alert.alert("Save failed", getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false} topInset={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand600} size="large" />
        </View>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen scroll={false} topInset={false}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Button variant="secondary" title="Retry" onPress={load} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} topInset={false}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Input
          label="Title"
          placeholder="e.g. Read chapter 3"
          value={title}
          onChangeText={setTitle}
        />
        <Input
          label="Description"
          placeholder="What is this homework about?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <InlineSelect
              label="Class"
              value={classId}
              options={classes}
              onSelect={handleClassChange}
              placeholder="Select class"
            />
          </View>
          <View style={styles.half}>
            <InlineSelect
              label="Section (optional)"
              value={sectionId}
              options={sections}
              onSelect={setSectionId}
              placeholder="All sections"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <InlineSelect
              label="Subject (optional)"
              value={subjectId}
              options={subjects}
              onSelect={setSubjectId}
              placeholder="None"
            />
          </View>
          <View style={styles.half}>
            <InlineSelect
              label="Teacher"
              value={teacherId}
              options={teachers}
              onSelect={setTeacherId}
              placeholder="Select teacher"
            />
          </View>
        </View>
        <DateInput
          label="Due date"
          value={dueDate}
          onChangeDate={setDueDate}
          placeholder="YYYY-MM-DD"
        />
        <Pressable
          style={styles.checkboxRow}
          onPress={() => setIsPublished((p) => !p)}
        >
          <View style={[styles.checkbox, isPublished && styles.checkboxSelected]}>
            {isPublished ? <Feather name="check" size={13} color={colors.white} /> : null}
          </View>
          <Text style={styles.checkboxLabel}>Publish immediately (notifies students and parents)</Text>
        </Pressable>
        <View style={styles.footer}>
          <Button title={isEdit ? "Save changes" : "Assign homework"} onPress={handleSubmit} isLoading={isSubmitting} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 20,
    gap: 10,
    paddingBottom: 32,
  },
  center: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 48,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.inkSoft,
  },
  footer: {
    marginTop: 4,
  },
});
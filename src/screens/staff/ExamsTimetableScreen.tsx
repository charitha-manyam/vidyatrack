import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { DateInput } from "../../components/DateInput";
import { TimeInput } from "../../components/TimeInput";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { apiClient } from "../../lib/apiClient";
import { getClasses, getSectionsByClass, getStaff, getSubjects } from "../../api/school.api";
import {
  createExamsTimetableEntry,
  deleteExamsTimetableEntry,
  getExams,
  getExamsTimetable,
  updateExamsTimetableEntry,
} from "../../api/exam.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { ApiResponse } from "../../types/api";
import type { ExamsTimetableEntry } from "../../types/exam";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "ExamsTimetable">;

// Port of admin-portal's features/exams/ExamsTimetablePage — scheduled exam
// sessions per class/subject. This screen replaces the old generic CRUD view
// whose /tenant/exams-timetable list path had no backend route (the real list
// endpoint is /tenant/getallexams-timetable).
export function ExamsTimetableScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.EXAMS, "create");
  const canDelete = hasPermission(permissions, MODULES.EXAMS, "delete");
  const academicYearId = session && session.type === "staff" ? session.academicYear?.id ?? undefined : undefined;

  const [entries, setEntries] = useState<ExamsTimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [classes, setClasses] = useState<SelectOption[]>([]);
  const [exams, setExams] = useState<SelectOption[]>([]);
  const [teachers, setTeachers] = useState<SelectOption[]>([]);
  const [sections, setSections] = useState<SelectOption[]>([]);
  const [subjects, setSubjects] = useState<SelectOption[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExamsTimetableEntry | null>(null);
  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getExamsTimetable()
      .then(setEntries)
      .catch((e) => setLoadError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Static pickers (classes, exams, teachers) load once on mount.
  useEffect(() => {
    let alive = true;
    Promise.all([
      getClasses().catch(() => []),
      apiClient
        .get<ApiResponse<Array<{ id: string; exam_name?: string; examName?: string; name?: string }>>>(
          "/tenant/getallexams"
        )
        .catch(() => null),
      getStaff({ role: "teacher" }).catch(() => []),
    ]).then(([classRows, examRes, teacherRows]) => {
      if (!alive) return;
      setClasses(classRows.map((c) => ({ label: c.class_name, value: c.id })));
      setExams(
        (examRes?.data.data ?? []).map((e) => ({
          value: e.id,
          label: e.exam_name ?? e.examName ?? e.name ?? "—",
        }))
      );
      setTeachers(teacherRows.map((t) => ({ label: t.name, value: t.id })));
    });
    return () => {
      alive = false;
    };
  }, []);

  // Sections + subjects belong to a class.
  useEffect(() => {
    setSectionId("");
    setSubjectId("");
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

  function openCreate() {
    setEditing(null);
    setExamId("");
    setClassId("");
    setSectionId("");
    setSubjectId("");
    setExamDate("");
    setStartTime("");
    setEndTime("");
    setRoomNo("");
    setTeacherId("");
    setSyllabus("");
    setFormOpen(true);
  }

  function openEdit(entry: ExamsTimetableEntry) {
    setEditing(entry);
    setExamId(entry.exam?.id ?? "");
    setClassId(entry.class?.id ?? "");
    setSectionId(entry.section?.id ?? "");
    setSubjectId(entry.subject?.id ?? "");
    setExamDate(entry.exam_date ?? "");
    setStartTime(entry.start_time ?? "");
    setEndTime(entry.end_time ?? "");
    setRoomNo(entry.room_no ?? "");
    setTeacherId(entry.teacher?.id ?? "");
    setSyllabus(entry.syllabus ?? "");
    setFormOpen(true);
  }

  async function handleSubmit() {
    const required: { value: string; label: string }[] = [
      { value: examId, label: "Exam" },
      { value: classId, label: "Class" },
      { value: sectionId, label: "Section" },
      { value: subjectId, label: "Subject" },
      { value: examDate, label: "Exam date" },
      { value: startTime, label: "Start time" },
      { value: endTime, label: "End time" },
    ];
    const missing = required.find((f) => !f.value);
    if (missing) {
      Alert.alert("Missing info", `${missing.label} is required.`);
      return;
    }
    const values = {
      examnameid: examId,
      class_id: classId,
      section_id: sectionId,
      subject_id: subjectId,
      exam_date: examDate,
      start_time: startTime,
      end_time: endTime,
      room_no: roomNo.trim() || undefined,
      teacher_id: teacherId || undefined,
      syllabus: syllabus.trim() || undefined,
      academicYearId: academicYearId ?? editing?.academicYearId ?? undefined,
    };
    setSubmitting(true);
    try {
      if (editing) {
        await updateExamsTimetableEntry(editing.id, values);
      } else {
        await createExamsTimetableEntry(values);
      }
      setFormOpen(false);
      load();
    } catch (err) {
      Alert.alert(editing ? "Update failed" : "Schedule failed", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete(entry: ExamsTimetableEntry) {
    Alert.alert("Delete this exam schedule entry?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(entry) },
    ]);
  }

  async function handleDelete(entry: ExamsTimetableEntry) {
    try {
      await deleteExamsTimetableEntry(entry.id);
      load();
    } catch (err) {
      Alert.alert("Delete failed", getErrorMessage(err));
    }
  }

  return (
    <PermissionGate module={MODULES.EXAMS} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Exams Timetable</Text>
                <Text style={styles.subtitle}>Scheduled exam sessions per class/subject.</Text>
              </View>
              {canWrite ? (
                <Button title="Schedule exam" onPress={openCreate} style={styles.headerAction} />
              ) : null}
            </View>
          </Card>

          {!academicYearId ? (
            <Card>
              <Text style={styles.hint}>An academic year is required to load the schedule. Contact your school admin if none is selected on this account.</Text>
            </Card>
          ) : null}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.brand600} size="large" />
            </View>
          ) : loadError ? (
            <Card>
              <Text style={styles.hint}>{loadError}</Text>
              <View style={styles.retryRow}>
                <Button title="Retry" variant="secondary" onPress={load} />
              </View>
            </Card>
          ) : entries.length === 0 ? (
            <Card>
              <Text style={styles.hint}>No exams scheduled yet. Pick an exam, class, section and subject to schedule a session.</Text>
            </Card>
          ) : (
            <View style={styles.list}>
              {entries.map((entry) => (
                <View key={entry.id} style={styles.row}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {entry.exam?.exam_name || "—"}
                    </Text>
                    <View style={styles.rowActions}>
                      {canWrite ? (
                        <Pressable style={styles.iconBtn} onPress={() => openEdit(entry)}>
                          <Feather name="edit-2" size={16} color={colors.inkSoft} />
                        </Pressable>
                      ) : null}
                      {canDelete ? (
                        <Pressable style={styles.iconBtn} onPress={() => confirmDelete(entry)}>
                          <Feather name="trash-2" size={16} color={colors.danger} />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                  <Text style={styles.rowLine}>
                    {entry.class?.class_name || "—"} • {entry.section?.sectionName || "—"} • {entry.subject?.subject_name || "—"}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {entry.exam_date || "—"} • {entry.start_time} – {entry.end_time}
                    {entry.room_no ? ` • Room ${entry.room_no}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Modal visible={formOpen} transparent animationType="fade" onRequestClose={() => setFormOpen(false)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setFormOpen(false)} />
            <View style={styles.modalPanel}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>{editing ? "Edit exam schedule" : "Schedule an exam"}</Text>
                <Text style={styles.modalDescription}>
                  Blocked on Sundays and if it overlaps another exam for the same class/section/room/teacher.
                </Text>
                <View style={styles.form}>
                  <InlineSelect label="Exam" value={examId} options={exams} onSelect={setExamId} placeholder="Select exam" />
                  <View style={styles.formRow}>
                    <View style={styles.half}>
                      <InlineSelect label="Class" value={classId} options={classes} onSelect={setClassId} placeholder="Select class" />
                    </View>
                    <View style={styles.half}>
                      <InlineSelect label="Section" value={sectionId} options={sections} onSelect={setSectionId} placeholder="Select section" />
                    </View>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.half}>
                      <InlineSelect label="Subject" value={subjectId} options={subjects} onSelect={setSubjectId} placeholder="Select subject" />
                    </View>
                    <View style={styles.half}>
                      <InlineSelect
                        label="Invigilator (optional)"
                        value={teacherId}
                        options={teachers}
                        onSelect={setTeacherId}
                        placeholder="None"
                      />
                    </View>
                  </View>
                  <DateInput label="Exam date" value={examDate} onChangeDate={setExamDate} />
                  <View style={styles.formRow}>
                    <View style={styles.half}>
                      <TimeInput label="Start time" value={startTime} onChangeTime={setStartTime} />
                    </View>
                    <View style={styles.half}>
                      <TimeInput label="End time" value={endTime} onChangeTime={setEndTime} />
                    </View>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.half}>
                      <Input label="Room no." value={roomNo} onChangeText={setRoomNo} style={styles.inputField} />
                    </View>
                  </View>
                  <Input label="Syllabus (optional)" value={syllabus} onChangeText={setSyllabus} multiline numberOfLines={3} style={styles.inputField} />
                  <View style={styles.modalActions}>
                    <Button title="Cancel" variant="secondary" onPress={() => setFormOpen(false)} style={styles.modalBtn} />
                    <Button
                      title={editing ? "Save changes" : "Schedule exam"}
                      onPress={handleSubmit}
                      isLoading={submitting}
                      style={styles.modalBtn}
                    />
                  </View>
                </View>
              </ScrollView>
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
    padding: 20,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkFaint,
  },
  headerAction: {
    alignSelf: "flex-start",
  },
  center: {
    paddingVertical: 48,
    alignItems: "center",
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkFaint,
    textAlign: "center",
  },
  retryRow: {
    marginTop: 12,
    alignItems: "center",
  },
  list: {
    gap: 10,
  },
  row: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  rowLine: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  rowMeta: {
    fontSize: 12,
    color: colors.inkGhost,
  },
  rowActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 20, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalPanel: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
  },
  modalDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkFaint,
    marginTop: 4,
  },
  form: {
    marginTop: 14,
    gap: 10,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
  },
  half: {
    flex: 1,
  },
  inputField: {
    minHeight: 48,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  modalBtn: {
    minWidth: 110,
  },
});
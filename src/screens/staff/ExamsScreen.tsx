import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { getAcademicYears } from "../../api/academicYear.api";
import { createExam, deleteExam, getExams, updateExam } from "../../api/exam.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { Exam } from "../../types/exam";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "Exams">;

// Port of admin-portal's features/exams/ExamsPage — define exams per academic
// year (exam_name + academicYearId), then schedule them per class/subject in
// the Exams Timetable screen. The old generic CRUD config rendered the same
// fields but had no concept of the per-year FK or the schedule shortcut.
export function ExamsScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.EXAMS, "create");
  const canDelete = hasPermission(permissions, MODULES.EXAMS, "delete");

  const [exams, setExams] = useState<Exam[]>([]);
  const [years, setYears] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [examName, setExamName] = useState("");
  const [yearId, setYearId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      getExams().catch((e) => {
        setLoadError(getErrorMessage(e));
        return [] as Exam[];
      }),
      getAcademicYears().catch(() => []),
    ]).then(([examRows, yearRows]) => {
      setExams(examRows);
      setYears(yearRows.map((y) => ({ label: y.yearName, value: y.id })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setExamName("");
    setYearId("");
    setFormOpen(true);
  }

  function openEdit(exam: Exam) {
    setEditing(exam);
    setExamName(exam.exam_name ?? "");
    setYearId(exam.academicYearId ?? "");
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!examName.trim()) {
      Alert.alert("Missing info", "Exam name is required.");
      return;
    }
    if (!yearId) {
      Alert.alert("Missing info", "Pick an academic year.");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await updateExam(editing.id, { exam_name: examName.trim(), academicYearId: yearId });
      } else {
        await createExam({ exam_name: examName.trim(), academicYearId: yearId });
      }
      setFormOpen(false);
      load();
    } catch (err) {
      Alert.alert(editing ? "Update failed" : "Create failed", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete(exam: Exam) {
    Alert.alert("Delete exam?", `"${exam.exam_name}" will be removed. This doesn't delete its scheduled exams.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(exam) },
    ]);
  }

  async function handleDelete(exam: Exam) {
    try {
      await deleteExam(exam.id);
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
                <Text style={styles.title}>Exams</Text>
                <Text style={styles.subtitle}>Define exams here, then schedule them per class/subject in Exams Timetable.</Text>
              </View>
              {canWrite ? (
                <Button title="Add exam" onPress={openCreate} style={styles.headerAction} />
              ) : null}
            </View>
          </Card>

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
          ) : exams.length === 0 ? (
            <Card>
              <Text style={styles.hint}>No exams yet. Add the school&apos;s exams (e.g. Mid-Term) so they can be scheduled in Exams Timetable.</Text>
            </Card>
          ) : (
            <View style={styles.list}>
              {exams.map((exam) => (
                <View key={exam.id} style={styles.row}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{exam.exam_name || "—"}</Text>
                    <Text style={styles.rowMeta}>{exam.academicYear?.yearName ?? "—"}</Text>
                  </View>
                  <View style={styles.rowActions}>
                    {canWrite ? (
                      <Pressable style={styles.iconBtn} onPress={() => openEdit(exam)}>
                        <Feather name="edit-2" size={16} color={colors.inkSoft} />
                      </Pressable>
                    ) : null}
                    {canDelete ? (
                      <Pressable style={styles.iconBtn} onPress={() => confirmDelete(exam)}>
                        <Feather name="trash-2" size={16} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
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
                <Text style={styles.modalTitle}>{editing ? "Edit exam" : "Add exam"}</Text>
                <View style={styles.form}>
                  <Input label="Exam name" placeholder="e.g. Mid-Term 2026" value={examName} onChangeText={setExamName} autoCapitalize="none" />
                  <InlineSelect
                    label="Academic year"
                    value={yearId}
                    options={years}
                    onSelect={setYearId}
                    placeholder="Select year"
                  />
                  <View style={styles.modalActions}>
                    <Button title="Cancel" variant="secondary" onPress={() => setFormOpen(false)} style={styles.modalBtn} />
                    <Button
                      title={editing ? "Save changes" : "Create exam"}
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
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
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
  },
  form: {
    marginTop: 14,
    gap: 10,
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
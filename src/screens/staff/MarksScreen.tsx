import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { apiClient } from "../../lib/apiClient";
import { getClasses, getSectionsByClass, getSubjects } from "../../api/school.api";
import { createMarksBulk, getMarksReport, getStudentsBySubject, publishResults } from "../../api/mark.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { ApiResponse } from "../../types/api";
import type { MarkEntry, MarksReport, PublishScope, RosterStudent } from "../../types/mark";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "Marks">;

interface RowState {
  marks_obtained: string;
  is_absent: boolean;
  remarks: string;
}

const PUBLISH_SCOPES: { value: PublishScope; label: string; description: string }[] = [
  {
    value: "CLASS_SECTION",
    label: "This class & section",
    description: "Publish for exactly the class/section you're viewing.",
  },
  {
    value: "CLASS",
    label: "Entire class (all sections)",
    description: "Publish for every section of this class.",
  },
  {
    value: "ENTIRE_EXAM",
    label: "Entire exam",
    description: "Publish for every class/section that has marks for this exam.",
  },
];

function reportBadge(status: MarksReport["status"]): "green" | "amber" | "gray" {
  return status === "PUBLISHED" ? "green" : status === "PARTIALLY_PUBLISHED" ? "amber" : "gray";
}

// Port of admin-portal's features/marks/MarksPage — pick exam/class/section/
// subject, enter marks per student (marks obtained, absent toggle, remarks),
// save in bulk to /tenant/marks/bulk, then publish from a scope picker to
// /tenant/markspublish. The old generic CRUD config could not drive this flow
// (getMarks 400s without exam_id/class_id/section_id/subject_id).
export function MarksScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.RESULTS, "create");
  const academicYearId =
    session && session.type === "staff" ? session.academicYear?.id ?? undefined : undefined;
  const sessionSchoolCode = session && session.type === "staff" ? session.schoolcode : "";

  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [schoolCode, setSchoolCode] = useState(sessionSchoolCode);
  const [maxMarks, setMaxMarks] = useState("100");

  const [exams, setExams] = useState<SelectOption[]>([]);
  const [classes, setClasses] = useState<SelectOption[]>([]);
  const [sections, setSections] = useState<SelectOption[]>([]);
  const [subjects, setSubjects] = useState<SelectOption[]>([]);

  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [report, setReport] = useState<MarksReport | null>(null);

  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishScope, setPublishScope] = useState<PublishScope>("CLASS_SECTION");
  const [publishing, setPublishing] = useState(false);

  // Exams + classes are static dropdown sources — load once on mount.
  useEffect(() => {
    let alive = true;
    Promise.all([
      apiClient
        .get<ApiResponse<Array<{ id: string; exam_name?: string; examName?: string; name?: string }>>>(
          "/tenant/getallexams"
        )
        .catch(() => null),
      getClasses().catch(() => []),
    ]).then(([examRes, classRows]) => {
      if (!alive) return;
      setExams(
        (examRes?.data.data ?? []).map((e) => ({
          value: e.id,
          label: e.exam_name ?? e.examName ?? e.name ?? "—",
        }))
      );
      setClasses(classRows.map((c) => ({ label: c.class_name, value: c.id })));
    });
    return () => {
      alive = false;
    };
  }, []);

  // Sections + subjects belong to a class — refetch when it changes.
  useEffect(() => {
    setSections([]);
    setSubjects([]);
    if (!classId) return;
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

  const canLoadRoster = Boolean(classId && sectionId && subjectId && academicYearId);
  const canLoadReport = Boolean(examId && classId && sectionId && subjectId);

  // Roster + report follow the four filters; reset entered rows on any change.
  useEffect(() => {
    setRows({});
    setReport(null);
    setRoster([]);
    if (!canLoadRoster) return;
    let alive = true;
    setRosterLoading(true);
    getStudentsBySubject({ class_id: classId, section_id: sectionId, subject_id: subjectId, academicYearId: academicYearId! })
      .then((r) => {
        if (alive) setRoster(r);
      })
      .catch(() => {
        if (alive) setRoster([]);
      })
      .finally(() => {
        if (alive) setRosterLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [classId, sectionId, subjectId, academicYearId, canLoadRoster]);

  useEffect(() => {
    setReport(null);
    if (!canLoadReport) return;
    let alive = true;
    getMarksReport({ exam_id: examId, class_id: classId, section_id: sectionId, subject_id: subjectId })
      .then((r) => {
        if (alive) setReport(r);
      })
      .catch(() => {
        if (alive) setReport(null);
      });
    return () => {
      alive = false;
    };
  }, [examId, classId, sectionId, subjectId, canLoadReport]);

  function updateRow(studentId: string, patch: Partial<RowState>) {
    const defaults: RowState = { marks_obtained: "", is_absent: false, remarks: "" };
    setRows((prev) => {
      const existing = prev[studentId] ?? defaults;
      return { ...prev, [studentId]: { ...existing, ...patch } };
    });
  }

  async function handleSave() {
    if (!examId) {
      Alert.alert("Missing info", "Select an exam first.");
      return;
    }
    if (!schoolCode) {
      Alert.alert("Missing info", "School code is required.");
      return;
    }
    const marks: MarkEntry[] = roster
      .filter((s) => {
        const row = rows[s.student_id];
        return row && row.marks_obtained !== "" && row.marks_obtained !== undefined;
      })
      .map((s) => ({
        student_id: s.student_id,
        exam_id: examId,
        subject_id: subjectId,
        class_id: classId,
        section_id: sectionId,
        marks_obtained: Number(rows[s.student_id].marks_obtained),
        max_marks: Number(maxMarks),
        school_code: schoolCode,
        is_absent: rows[s.student_id].is_absent,
        remarks: rows[s.student_id].remarks || undefined,
      }));

    if (!marks.length) {
      Alert.alert("Nothing to save", "Enter at least one mark before saving.");
      return;
    }

    setSaving(true);
    try {
      await createMarksBulk(marks, schoolCode);
      Alert.alert("Marks saved");
      if (canLoadReport) {
        const next = await getMarksReport({ exam_id: examId, class_id: classId, section_id: sectionId, subject_id: subjectId }).catch(() => null);
        setReport(next);
      }
    } catch (err) {
      Alert.alert("Save failed", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(scope: PublishScope) {
    if (!canLoadReport) return;
    setPublishing(true);
    try {
      const { data } = await publishResults({
        exam_id: examId,
        academicYearId: academicYearId ?? "",
        ...(scope === "CLASS_SECTION" ? { class_id: classId, section_id: sectionId } : {}),
        ...(scope === "CLASS" ? { class_id: classId } : {}),
      });
      if (!data.status) {
        Alert.alert("Publish failed", data.message ?? "Unknown error");
        return;
      }
      Alert.alert("Results published");
      setPublishOpen(false);
      const next = await getMarksReport({ exam_id: examId, class_id: classId, section_id: sectionId, subject_id: subjectId }).catch(() => null);
      setReport(next);
    } catch (err) {
      Alert.alert("Publish failed", getErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  }

  const renderedRoster = roster.map((s) => {
    const row = rows[s.student_id] ?? { marks_obtained: "", is_absent: false, remarks: "" };
    return (
      <View key={s.student_id} style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName} numberOfLines={1}>
              {s.student_name || "Student"}
            </Text>
            <Text style={styles.studentMeta}>Roll {s.rollNumber ?? "—"}</Text>
          </View>
          <Pressable
            disabled={!canWrite}
            style={[styles.absentChip, row.is_absent && styles.absentChipOn]}
            onPress={() => updateRow(s.student_id, { is_absent: !row.is_absent })}
          >
            <Text style={[styles.absentText, row.is_absent && styles.absentTextOn]}>ABS</Text>
          </Pressable>
        </View>
        <View style={styles.studentBody}>
          <View style={styles.marksField}>
            <Text style={styles.fieldLabel}>Marks obtained</Text>
            <TextInput
              style={[styles.smallInput, !canWrite && styles.inputDisabled]}
              keyboardType="number-pad"
              editable={canWrite}
              placeholder={`/ ${maxMarks}`}
              placeholderTextColor={colors.inkGhost}
              value={row.marks_obtained}
              onChangeText={(v) => updateRow(s.student_id, { marks_obtained: v })}
            />
          </View>
          <View style={styles.remarksField}>
            <Text style={styles.fieldLabel}>Remarks</Text>
            <TextInput
              style={[styles.remarksInput, !canWrite && styles.inputDisabled]}
              editable={canWrite}
              placeholder="Optional"
              placeholderTextColor={colors.inkGhost}
              value={row.remarks}
              onChangeText={(v) => updateRow(s.student_id, { remarks: v })}
            />
          </View>
        </View>
      </View>
    );
  });

  return (
    <PermissionGate module={MODULES.RESULTS} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <Card>
            <View style={styles.grid}>
              <View style={styles.half}>
                <InlineSelect label="Exam" value={examId} options={exams} onSelect={setExamId} placeholder="Select exam" />
              </View>
              <View style={styles.half}>
                <InlineSelect
                  label="Class"
                  value={classId}
                  options={classes}
                  onSelect={(v) => {
                    setClassId(v);
                    setSectionId("");
                    setSubjectId("");
                  }}
                  placeholder="Select class"
                />
              </View>
              <View style={styles.half}>
                <InlineSelect label="Section" value={sectionId} options={sections} onSelect={setSectionId} placeholder="Select section" />
              </View>
              <View style={styles.half}>
                <InlineSelect label="Subject" value={subjectId} options={subjects} onSelect={setSubjectId} placeholder="Select subject" />
              </View>
            </View>
          </Card>

          {!academicYearId ? (
            <Card>
              <Text style={styles.hint}>An academic year is required to load the roster. Contact your school admin if none is selected on this account.</Text>
            </Card>
          ) : null}

          {report ? (
            <View style={styles.summaryRow}>
              <Badge tone={reportBadge(report.status)}>{report.status.replace(/_/g, " ")}</Badge>
              <Text style={styles.summaryText}>
                {report.marksEntered}/{report.totalStudents} entered ({report.completionPercentage}%)
              </Text>
              <Text style={styles.summaryText}>Avg: {report.averageMarks}</Text>
              {canWrite ? (
                <View style={styles.summaryAction}>
                  <Button variant="secondary" title="Publish results" onPress={() => setPublishOpen(true)} />
                </View>
              ) : null}
            </View>
          ) : null}

          {!canLoadRoster ? (
            <Card>
              <Text style={styles.hint}>Select class, section, and subject — the student roster will load once all three are picked.</Text>
            </Card>
          ) : rosterLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.brand600} size="large" />
            </View>
          ) : roster.length === 0 ? (
            <Card>
              <Text style={styles.hint}>No students found for this class, section and subject.</Text>
            </Card>
          ) : (
            <View style={styles.rosterBlock}>
              <View style={styles.controlsRow}>
                <Input label="School code" value={schoolCode} onChangeText={setSchoolCode} style={styles.schoolCodeInput} />
                <Input label="Max marks (all)" value={maxMarks} onChangeText={setMaxMarks} keyboardType="number-pad" style={styles.maxMarksInput} />
                {canWrite ? <Button title="Save marks" onPress={handleSave} isLoading={saving} style={styles.saveButton} /> : null}
              </View>
              <DataState loading={false} error={null}>
                <View style={styles.students}>{renderedRoster}</View>
              </DataState>
            </View>
          )}
        </View>

        <Modal visible={publishOpen} transparent animationType="fade" onRequestClose={() => setPublishOpen(false)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setPublishOpen(false)} />
            <View style={styles.modalPanel}>
              <Text style={styles.modalTitle}>Publish results</Text>
              <Text style={styles.modalDescription}>
                Published marks become visible to students and parents. This can&apos;t be selectively un-published.
              </Text>
              <View style={styles.scopeList}>
                {PUBLISH_SCOPES.map((s) => {
                  const selected = publishScope === s.value;
                  return (
                    <Pressable key={s.value} style={[styles.scopeOption, selected && styles.scopeOptionSelected]} onPress={() => setPublishScope(s.value)}>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? <Feather name="check" size={12} color={colors.white} /> : null}
                      </View>
                      <View style={styles.scopeTextWrap}>
                        <Text style={styles.scopeLabel}>{s.label}</Text>
                        <Text style={styles.scopeDescription}>{s.description}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setPublishOpen(false)} style={styles.modalBtn} />
                <Button title="Publish" onPress={() => handlePublish(publishScope)} isLoading={publishing} style={styles.modalBtn} />
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
    padding: 20,
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  half: {
    width: "47%",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryText: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  summaryAction: {
    marginLeft: "auto",
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkFaint,
    textAlign: "center",
  },
  center: {
    paddingVertical: 48,
    alignItems: "center",
  },
  rosterBlock: {
    gap: 12,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 10,
  },
  schoolCodeInput: {
    width: 130,
  },
  maxMarksInput: {
    width: 130,
  },
  saveButton: {
    alignSelf: "flex-start",
  },
  students: {
    gap: 10,
  },
  studentCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  studentMeta: {
    fontSize: 12,
    color: colors.inkGhost,
    marginTop: 2,
  },
  absentChip: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  absentChipOn: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  absentText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkFaint,
    letterSpacing: 0.5,
  },
  absentTextOn: {
    color: colors.white,
  },
  studentBody: {
    flexDirection: "row",
    gap: 10,
  },
  marksField: {
    width: 130,
  },
  remarksField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.inkSoft,
    marginBottom: 6,
  },
  smallInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  remarksInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.7,
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
    gap: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkFaint,
  },
  scopeList: {
    gap: 10,
  },
  scopeOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
  },
  scopeOptionSelected: {
    borderColor: colors.brand600,
    backgroundColor: colors.brand50,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  radioSelected: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  scopeTextWrap: {
    flex: 1,
    gap: 2,
  },
  scopeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  scopeDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkGhost,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 2,
  },
  modalBtn: {
    minWidth: 96,
  },
});
import { useCallback, useEffect, useRef, useState } from "react";
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
import { getClasses, getSectionsByClass, getStaff, getSubjects } from "../../api/school.api";
import {
  bulkAddTimetable,
  createTimetableEntry,
  deleteTimetableEntry,
  getTimetable,
  updateTimetableEntry,
} from "../../api/timetable.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import { DAYS_OF_WEEK, type TimetableEntry } from "../../types/timetable";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "Timetable">;

const DAY_OPTIONS: SelectOption[] = DAYS_OF_WEEK.map((d) => ({
  label: d[0].toUpperCase() + d.slice(1),
  value: d,
}));

const ALL_CLASSES: SelectOption = { label: "All classes", value: "" };

// Port of admin-portal's features/timetable/TimetablePage — class-wise weekly
// timetable. The web portal gates write access off the Classes module, so the
// mobile port mirrors that (CLASSES create) rather than adding a new module.
export function TimetableScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  // Mirror the web: TimetablePage uses MODULES.CLASSES for both read nav and
  // the create/delete buttons.
  const canWrite = hasPermission(permissions, MODULES.CLASSES, "create");
  const academicYearId = session && session.type === "staff" ? session.academicYear?.id ?? undefined : undefined;

  const [classFilter, setClassFilter] = useState("");
  const [classes, setClasses] = useState<SelectOption[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<SelectOption[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimetableEntry | null>(null);
  const [day, setDay] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [periodNo, setPeriodNo] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [sections, setSections] = useState<SelectOption[]>([]);
  const [subjects, setSubjects] = useState<SelectOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);

  // Static pickers (classes, teachers) load once on mount.
  useEffect(() => {
    let alive = true;
    Promise.all([getClasses().catch(() => []), getStaff({ role: "teacher" }).catch(() => [])]).then(([classRows, teacherRows]) => {
      if (!alive) return;
      setClasses(classRows.map((c) => ({ label: c.class_name, value: c.id })));
      setTeachers(teacherRows.map((t) => ({ label: t.name, value: t.id })));
    });
    return () => {
      alive = false;
    };
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getTimetable(classFilter ? { class_id: classFilter } : undefined)
      .then(setEntries)
      .catch((e) => setLoadError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [classFilter]);

  useEffect(() => {
    load();
  }, [load]);

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
    setDay("");
    setClassId("");
    setSectionId("");
    setSubjectId("");
    setTeacherId("");
    setPeriodNo("");
    setTimeSlot("");
    setRoomNo("");
    setFormOpen(true);
  }

  function openEdit(entry: TimetableEntry) {
    setEditing(entry);
    setDay(entry.day_of_week ?? "");
    setClassId(entry.class_id ?? "");
    setSectionId(entry.section_id ?? "");
    setSubjectId(entry.subject_id ?? "");
    setTeacherId(entry.teacher_id ?? "");
    setPeriodNo(entry.period_no != null ? String(entry.period_no) : "");
    setTimeSlot(entry.time_sloat ?? "");
    setRoomNo(entry.room_no ?? "");
    setFormOpen(true);
  }

  async function handleSubmit() {
    const required: { value: string; label: string }[] = [
      { value: day, label: "Day" },
      { value: classId, label: "Class" },
      { value: sectionId, label: "Section" },
      { value: teacherId, label: "Teacher" },
    ];
    const missing = required.find((f) => !f.value);
    if (missing) {
      Alert.alert("Missing info", `${missing.label} is required.`);
      return;
    }
    const values = {
      day_of_week: day,
      class_id: classId,
      section_id: sectionId,
      teacher_id: teacherId,
      subject_id: subjectId || undefined,
      period_no: periodNo.trim() !== "" ? Number(periodNo) : undefined,
      time_sloat: timeSlot.trim() || undefined,
      room_no: roomNo.trim() || undefined,
      // The backend list filters by the session's academic year, so stamp new
      // entries with it — otherwise they'd never appear in the default list.
      academicYearId: academicYearId ?? editing?.academicYearId ?? undefined,
    };
    setSubmitting(true);
    try {
      if (editing) {
        await updateTimetableEntry(editing.id, values);
      } else {
        await createTimetableEntry(values);
      }
      setFormOpen(false);
      load();
    } catch (err) {
      Alert.alert(editing ? "Update failed" : "Create failed", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete(entry: TimetableEntry) {
    Alert.alert("Delete this timetable entry?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(entry) },
    ]);
  }

  async function handleDelete(entry: TimetableEntry) {
    try {
      await deleteTimetableEntry(entry.id);
      load();
    } catch (err) {
      Alert.alert("Delete failed", getErrorMessage(err));
    }
  }

  return (
    <PermissionGate module={MODULES.CLASSES} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Timetable</Text>
                <Text style={styles.subtitle}>Class-wise weekly timetable. Conflicts are caught server-side.</Text>
              </View>
              {canWrite ? (
                <View style={styles.headerActions}>
                  <Button title="Bulk add" variant="secondary" onPress={() => setBulkOpen(true)} />
                  <Button title="Add entry" onPress={openCreate} />
                </View>
              ) : null}
            </View>
          </Card>

          <Card>
            <InlineSelect label="Filter by class" value={classFilter} options={[ALL_CLASSES, ...classes]} onSelect={setClassFilter} placeholder="All classes" />
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
          ) : entries.length === 0 ? (
            <Card>
              <Text style={styles.hint}>No timetable entries yet. Add an entry to start building the weekly timetable.</Text>
            </Card>
          ) : (
            <View style={styles.list}>
              {entries.map((entry) => (
                <View key={entry.id} style={styles.row}>
                  <View style={styles.rowTop}>
                    <Text style={styles.dayChip}>{entry.day_of_week ? entry.day_of_week[0].toUpperCase() + entry.day_of_week.slice(1) : "—"}</Text>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {entry.period_no != null ? `Period ${entry.period_no}` : "—"}
                    </Text>
                    <View style={styles.rowActions}>
                      {canWrite ? (
                        <Pressable style={styles.iconBtn} onPress={() => openEdit(entry)}>
                          <Feather name="edit-2" size={16} color={colors.inkSoft} />
                        </Pressable>
                      ) : null}
                      {canWrite ? (
                        <Pressable style={styles.iconBtn} onPress={() => confirmDelete(entry)}>
                          <Feather name="trash-2" size={16} color={colors.danger} />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                  <Text style={styles.rowLine}>
                    {entry.class?.class_name || "—"} • {entry.section?.sectionName || "—"}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {entry.subject?.subject_name ?? "—"} • {entry.teacher?.name ?? "—"}
                    {entry.time_sloat ? ` • ${entry.time_sloat}` : ""}
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
                <Text style={styles.modalTitle}>{editing ? "Edit timetable entry" : "Add timetable entry"}</Text>
                <Text style={styles.modalDescription}>
                  Conflicts (teacher double-booked, non-working day, overlapping breaks) are caught server-side and shown as errors.
                </Text>
                <View style={styles.form}>
                  <View style={styles.formRow}>
                    <View style={styles.half}>
                      <InlineSelect label="Day" value={day} options={DAY_OPTIONS} onSelect={setDay} placeholder="Select day" />
                    </View>
                    <View style={styles.half}>
                      <Input label="Period no." value={periodNo} onChangeText={setPeriodNo} keyboardType="number-pad" style={styles.inputField} />
                    </View>
                  </View>
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
                      <InlineSelect label="Subject" value={subjectId} options={subjects} onSelect={setSubjectId} placeholder="None" />
                    </View>
                    <View style={styles.half}>
                      <InlineSelect label="Teacher" value={teacherId} options={teachers} onSelect={setTeacherId} placeholder="Select teacher" />
                    </View>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.half}>
                      <Input label="Time slot" placeholder="09:00 AM-09:40 AM" value={timeSlot} onChangeText={setTimeSlot} style={styles.inputField} />
                    </View>
                    <View style={styles.half}>
                      <Input label="Room no." value={roomNo} onChangeText={setRoomNo} style={styles.inputField} />
                    </View>
                  </View>
                  <View style={styles.modalActions}>
                    <Button title="Cancel" variant="secondary" onPress={() => setFormOpen(false)} style={styles.modalBtn} />
                    <Button
                      title={editing ? "Save changes" : "Create entry"}
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

        <BulkAddTimetableModal
          visible={bulkOpen}
          classes={classes}
          teachers={teachers}
          academicYearId={academicYearId}
          onClose={() => setBulkOpen(false)}
          onDone={load}
        />
      </Screen>
    </PermissionGate>
  );
}

interface BulkRowState {
  id: number;
  day: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  periodNo: string;
  timeSlot: string;
  roomNo: string;
  sections: SelectOption[];
  subjects: SelectOption[];
}

interface BulkAddTimetableModalProps {
  visible: boolean;
  classes: SelectOption[];
  teachers: SelectOption[];
  academicYearId?: string;
  onClose: () => void;
  onDone: () => void;
}

// Bulk-adds many timetable rows at once. The web portal uploads a spreadsheet;
// on mobile the same backend endpoint also accepts a JSON { timetables: [] }
// body, so this builds rows from the pickers (real UUIDs) and posts them
// directly — identical dedup / working-day / teacher-overlap processing.
function BulkAddTimetableModal({ visible, classes, teachers, academicYearId, onClose, onDone }: BulkAddTimetableModalProps) {
  const nextId = useRef(0);
  const [rows, setRows] = useState<BulkRowState[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSubmitting(false);
    setRows([freshRow()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function freshRow(): BulkRowState {
    nextId.current += 1;
    return {
      id: nextId.current,
      day: "",
      classId: "",
      sectionId: "",
      subjectId: "",
      teacherId: "",
      periodNo: "",
      timeSlot: "",
      roomNo: "",
      sections: [],
      subjects: [],
    };
  }

  function patchRow(id: number, patch: Partial<BulkRowState>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function changeRowClass(id: number, classId: string) {
    patchRow(id, { classId, sectionId: "", subjectId: "", sections: [], subjects: [] });
    if (!classId) return;
    Promise.all([getSectionsByClass(classId).catch(() => []), getSubjects({ class_id: classId }).catch(() => [])]).then(
      ([s, sub]) => {
        setRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  classId,
                  sections: s.map((x) => ({ label: x.sectionName, value: x.id })),
                  subjects: sub.map((x) => ({ label: x.subject_name ?? x.name ?? "—", value: x.id })),
                }
              : r
          )
        );
      }
    );
  }

  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  async function handleSubmit() {
    const incomplete = rows
      .map((r, i) => {
        const missing = [
          { v: r.day, l: "Day" },
          { v: r.classId, l: "Class" },
          { v: r.sectionId, l: "Section" },
          { v: r.teacherId, l: "Teacher" },
        ]
          .filter((f) => !f.v)
          .map((f) => f.l);
        return { row: i + 1, missing };
      })
      .find((r) => r.missing.length > 0);
    if (incomplete) {
      Alert.alert("Incomplete row", `Row ${incomplete.row} is missing: ${incomplete.missing.join(", ")}.`);
      return;
    }

    const timetables = rows.map((r) => ({
      day_of_week: r.day,
      class_id: r.classId,
      section_id: r.sectionId,
      teacher_id: r.teacherId,
      subject_id: r.subjectId || undefined,
      period_no: r.periodNo.trim() !== "" ? Number(r.periodNo) : undefined,
      time_sloat: r.timeSlot.trim() || undefined,
      room_no: r.roomNo.trim() || undefined,
      academicYearId: academicYearId ?? undefined,
    }));

    setSubmitting(true);
    try {
      const res = await bulkAddTimetable(timetables);
      if (res.inserted > 0) onDone();
      onClose();
      const errorDetail = res.errors.length ? res.errors.slice(0, 10).map((e) => `Row ${e.row}: ${e.message}`).join("\n") : "";
      if (res.inserted === 0) {
        Alert.alert("Nothing added", `All ${rows.length} row${rows.length === 1 ? "" : "s"} skipped or failed.${errorDetail ? `\n\n${errorDetail}` : ""}`);
      } else if (res.failed > 0 || res.skipped > 0) {
        Alert.alert(
          "Bulk add finished",
          `${res.inserted} added, ${res.skipped} skipped, ${res.failed} failed.${errorDetail ? `\n\n${errorDetail}` : ""}`
        );
      } else {
        Alert.alert("Bulk add complete", `${res.inserted} timetable ${res.inserted === 1 ? "entry" : "entries"} added.`);
      }
    } catch (err) {
      Alert.alert("Bulk add failed", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalPanel}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Bulk add timetable</Text>
            <Text style={styles.modalDescription}>
              Add several periods at once. Each row needs a day, class, section and teacher — the same fields the single-entry form needs.
              Rows on non-working days, duplicates, and double-booked teachers are caught server-side.
            </Text>
            <View style={styles.bulkRows}>
              {rows.map((row, index) => (
                <View key={row.id} style={styles.bulkRow}>
                  <View style={styles.bulkRowHeader}>
                    <Text style={styles.bulkRowLabel}>Row {index + 1}</Text>
                    <Pressable style={styles.iconBtn} onPress={() => removeRow(row.id)}>
                      <Feather name="x" size={16} color={colors.inkGhost} />
                    </Pressable>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.half}>
                      <InlineSelect label="Day" value={row.day} options={DAY_OPTIONS} onSelect={(v) => patchRow(row.id, { day: v })} placeholder="Select day" />
                    </View>
                    <View style={styles.half}>
                      <Input label="Period no." value={row.periodNo} onChangeText={(v) => patchRow(row.id, { periodNo: v })} keyboardType="number-pad" style={styles.inputField} />
                    </View>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.half}>
                      <InlineSelect label="Class" value={row.classId} options={classes} onSelect={(v) => changeRowClass(row.id, v)} placeholder="Select class" />
                    </View>
                    <View style={styles.half}>
                      <InlineSelect label="Section" value={row.sectionId} options={row.sections} onSelect={(v) => patchRow(row.id, { sectionId: v })} placeholder="Select section" />
                    </View>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.half}>
                      <InlineSelect label="Subject" value={row.subjectId} options={row.subjects} onSelect={(v) => patchRow(row.id, { subjectId: v })} placeholder="None" />
                    </View>
                    <View style={styles.half}>
                      <InlineSelect label="Teacher" value={row.teacherId} options={teachers} onSelect={(v) => patchRow(row.id, { teacherId: v })} placeholder="Select teacher" />
                    </View>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.half}>
                      <Input label="Time slot" placeholder="09:00 AM-09:40 AM" value={row.timeSlot} onChangeText={(v) => patchRow(row.id, { timeSlot: v })} style={styles.inputField} />
                    </View>
                    <View style={styles.half}>
                      <Input label="Room no." value={row.roomNo} onChangeText={(v) => patchRow(row.id, { roomNo: v })} style={styles.inputField} />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <Button title="+ Add another row" variant="secondary" onPress={() => setRows((prev) => [...prev, freshRow()])} style={styles.addRowBtn} />

            <View style={styles.modalActions}>
              <Button title="Close" variant="secondary" onPress={onClose} style={styles.modalBtn} />
              <Button title="Upload & add entries" onPress={handleSubmit} isLoading={submitting} style={styles.modalBtn} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  headerActions: {
    gap: 8,
    alignItems: "stretch",
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
  dayChip: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.brand700,
    backgroundColor: colors.brand50,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
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
  bulkRows: {
    marginTop: 14,
    gap: 14,
  },
  bulkRow: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  bulkRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bulkRowLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkSoft,
  },
  addRowBtn: {
    marginTop: 6,
  },
});
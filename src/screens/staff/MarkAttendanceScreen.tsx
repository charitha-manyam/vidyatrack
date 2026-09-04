import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { DateInput } from "../../components/DateInput";
import { markAttendance } from "../../api/school.api";
import { getClasses, getSectionsByClass, getStudents } from "../../api/school.api";
import { useAuth } from "../../context/AuthContext";
import { useSelectOptions } from "../../hooks/useSelectOptions";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { AttendanceStatus, SchoolClass, Section, Student } from "../../types/school";

type Props = NativeStackScreenProps<MoreStackParamList, "MarkAttendance">;

type SelectItem = string | { label: string; value: string };

const STATUSES: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "half-day", label: "Half Day" },
  { value: "leave", label: "Leave" },
];

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "#059669",
  absent: "#dc2626",
  late: "#d97706",
  "half-day": "#ea580c",
  leave: "#6b7280",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function InlineSelect({
  label,
  value,
  placeholder,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: SelectItem[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  function labelOf(item: SelectItem): string {
    return typeof item === "string" ? item : item.label;
  }
  function valOf(item: SelectItem): string {
    return typeof item === "string" ? item : item.value;
  }
  const display = options.find((o) => valOf(o) === value);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        style={[styles.select, open && styles.selectOpen]}
        onPress={() => setOpen((c) => !c)}
      >
        <Text style={value ? styles.selectText : styles.placeholder}>
          {display ? labelOf(display) : placeholder}
        </Text>
        <View style={[styles.chevron, open && styles.chevronOpen]}>
          <Feather
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={open ? colors.white : colors.inkFaint}
          />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.options}>
          {options.length === 0 ? (
            <Text style={styles.noOptions}>No options available.</Text>
          ) : (
            options.map((option) => {
              const v = valOf(option);
              const l = labelOf(option);
              return (
                <Pressable
                  key={v}
                  style={[styles.option, value === v && styles.optionActive]}
                  onPress={() => { onSelect(v); setOpen(false); }}
                >
                  <Text style={[styles.optionText, value === v && styles.optionTextActive]}>{l}</Text>
                  {value === v ? <Feather name="check" size={16} color={colors.brand700} /> : null}
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

function StatusDropdown({
  value,
  onSelect,
}: {
  value: AttendanceStatus;
  onSelect: (v: AttendanceStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = STATUSES.find((s) => s.value === value)?.label ?? "Present";
  const color = STATUS_COLORS[value] ?? STATUS_COLORS.present;

  if (open) {
    return (
      <View style={styles.statusInline}>
        {STATUSES.map((s) => (
          <Pressable
            key={s.value}
            style={[
              styles.statusInlineOption,
              value === s.value && styles.statusInlineOptionActive,
            ]}
            onPress={() => {
              onSelect(s.value);
              setOpen(false);
            }}
          >
            <Text
              style={[
                styles.statusInlineText,
                { color: STATUS_COLORS[s.value] },
                value === s.value && styles.statusInlineTextActive,
              ]}
            >
              {s.label}
            </Text>
            {value === s.value ? (
              <Feather name="check" size={14} color={STATUS_COLORS[s.value]} />
            ) : null}
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <Pressable style={styles.statusTrigger} onPress={() => setOpen(true)}>
      <Text style={[styles.statusTriggerText, { color }]}>{label}</Text>
      <Feather name="chevron-down" size={14} color={color} />
    </Pressable>
  );
}

export function MarkAttendanceScreen({ }: Props) {
  const { session } = useAuth();
  const staffSession = session && session.type === "staff" ? session : null;

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [date, setDate] = useState(todayISO());
  const [markedBy, setMarkedBy] = useState(staffSession?.userId ?? "");
  const { options: selectOptions } = useSelectOptions(["staff"]);
  const staffOptions = selectOptions.staff ?? [];
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClasses()
      .then(setClasses)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!classId) {
      setSections([]);
      setSectionId("");
      setStudents([]);
      return;
    }
    setSectionId("");
    setStudents([]);
    getSectionsByClass(classId)
      .then(setSections)
      .catch((err) => setError(getErrorMessage(err)));
  }, [classId]);

  const loadRoster = useCallback(async () => {
    if (!classId || !sectionId) return;
    setLoadingRoster(true);
    setError(null);
    try {
      const roster = await getStudents({ class_id: classId, sectionId });
      setStudents(roster);
      setStatuses(
        Object.fromEntries(roster.map((s) => [s.id, "present" as AttendanceStatus]))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingRoster(false);
    }
  }, [classId, sectionId]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  async function handleSubmit() {
    if (!classId || !sectionId || !markedBy) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await markAttendance({
        class_id: classId,
        section_id: sectionId,
        teacher_id: markedBy,
        date,
        academicYearId: staffSession?.academicYear?.id,
        attendance: students.map((s) => ({
          studentId: s.id,
          status: statuses[s.id] ?? "present",
        })),
      });
      Alert.alert(
        "Attendance saved",
        `Total: ${result.total} - Present: ${result.present} - Absent: ${result.absent}${
          result.errors?.length
            ? `\n${result.errors.length} ${result.errors.length === 1 ? "row" : "rows"} failed`
            : ""
        }`
      );
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const classOptions = classes.map((c) => ({ label: c.class_name, value: c.id }));
  const sectionOptions = sections.map((s) => ({ label: s.sectionName, value: s.id }));

  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.outer}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.pageTitle}>Mark Attendance</Text>

          <View style={styles.filters}>
            <View style={styles.filterRow}>
              <View style={styles.filterHalf}>
                <InlineSelect
                  label="Class"
                  value={classId}
                  placeholder="Select class"
                  options={classOptions}
                  onSelect={setClassId}
                />
              </View>
              <View style={styles.filterHalf}>
                <InlineSelect
                  label="Section"
                  value={sectionId}
                  placeholder="Select section"
                  options={sectionOptions}
                  onSelect={setSectionId}
                />
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterHalf}>
                <InlineSelect
                  label="Marked by"
                  value={markedBy}
                  placeholder="Select teacher"
                  options={staffOptions}
                  onSelect={setMarkedBy}
                />
              </View>
              <View style={styles.filterHalf}>
                <DateInput
                  label="Date"
                  value={date}
                  onChangeDate={setDate}
                  placeholder="mm/dd/yyyy"
                />
              </View>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {classId && sectionId && !loadingRoster && students.length === 0 ? (
            <Button
              title="Load students"
              variant="secondary"
              onPress={loadRoster}
            />
          ) : null}

          {loadingRoster ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.brand600} size="large" />
              <Text style={styles.loadingText}>Loading students...</Text>
            </View>
          ) : null}

          {students.length > 0 && (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colRoll]}>Roll No</Text>
                <Text style={[styles.tableHeaderCell, styles.colName]}>Student Name</Text>
                <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
              </View>

              <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                removeClippedSubviews={false}
                contentContainerStyle={styles.studentList}
                renderItem={({ item }) => (
                  <View style={styles.studentRow}>
                    <Text style={[styles.studentCell, styles.colRoll]} numberOfLines={1}>
                      {item.roll_number}
                    </Text>
                    <Text style={[styles.studentCell, styles.colName]} numberOfLines={1}>
                      {`${item.first_name} ${item.last_name ?? ""}`.trim()}
                    </Text>
                    <View style={styles.colStatus}>
                      <StatusDropdown
                        value={statuses[item.id] ?? "present"}
                        onSelect={(v) => setStatus(item.id, v)}
                      />
                    </View>
                  </View>
                )}
              />
            </>
          )}
        </ScrollView>

        {students.length > 0 && (
          <View style={styles.footer}>
            <Button
              title={submitting ? "Saving..." : "Save Attendance"}
              onPress={handleSubmit}
              isLoading={submitting}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  screen: { flex: 1 },
  container: { padding: 16, gap: 14, paddingBottom: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },
  pageTitle: { fontSize: 22, fontWeight: "700", color: colors.ink },
  filters: { gap: 12 },
  filterRow: { flexDirection: "row", gap: 12 },
  filterHalf: { flex: 1 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: colors.ink },
  select: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
  },
  selectOpen: { borderColor: colors.brand500 },
  selectText: { flex: 1, fontSize: 15, color: colors.ink },
  placeholder: { flex: 1, fontSize: 15, color: colors.inkFaint },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronOpen: { backgroundColor: colors.brand600 },
  options: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionActive: { backgroundColor: colors.brand50 },
  optionText: { fontSize: 14, color: colors.ink },
  optionTextActive: { color: colors.brand700, fontWeight: "600" },
  noOptions: { padding: 14, fontSize: 14, color: colors.inkFaint },
  error: { fontSize: 13, color: colors.danger },
  loadingBox: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadingText: { fontSize: 13, color: colors.inkFaint },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkGhost,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  colRoll: { flex: 1 },
  colName: { flex: 2.5 },
  colStatus: { flex: 1.5 },
  studentList: { gap: 8, paddingBottom: 8 },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  studentCell: { fontSize: 14, color: colors.ink },
  statusTrigger: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusTriggerText: { fontSize: 13, fontWeight: "600" },
  statusInline: { gap: 4 },
  statusInlineOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  statusInlineOptionActive: { backgroundColor: colors.brand50, borderColor: colors.brand300 },
  statusInlineText: { fontSize: 13, fontWeight: "600" },
  statusInlineTextActive: { fontWeight: "700" },
});

import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { DataState } from "../../components/DataState";
import { Input } from "../../components/Input";
import { markAttendance } from "../../api/school.api";
import { getClasses, getSectionsByClass, getStudents } from "../../api/school.api";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { AttendanceStatus, SchoolClass, Section, Student } from "../../types/school";

type Props = NativeStackScreenProps<MoreStackParamList, "MarkAttendance">;

const STATUS_CYCLE: AttendanceStatus[] = ["present", "absent", "late", "half-day", "leave"];

const statusColor: Record<AttendanceStatus, string> = {
  present: colors.success,
  absent: colors.danger,
  late: colors.warning,
  "half-day": colors.warning,
  leave: colors.inkFaint,
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function MarkAttendanceScreen({ }: Props) {
  const { session } = useAuth();
  const staffSession = session && session.type === "staff" ? session : null;
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [date, setDate] = useState(todayISO());
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
      setSectionId(null);
      return;
    }
    setSectionId(null);
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
      setStatuses(Object.fromEntries(roster.map((s) => [s.id, "present" as AttendanceStatus])));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingRoster(false);
    }
  }, [classId, sectionId]);

  function cycleStatus(studentId: string) {
    setStatuses((prev) => {
      const current = prev[studentId] ?? "present";
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
      return { ...prev, [studentId]: next };
    });
  }

  async function handleSubmit() {
    if (!classId || !sectionId || !staffSession) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await markAttendance({
        class_id: classId,
        section_id: sectionId,
        teacher_id: staffSession.userId,
        date,
        academicYearId: staffSession.academicYear?.id,
        attendance: students.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? "present" })),
      });
      Alert.alert(
        "Attendance saved",
        `Total: ${result.total} - Present: ${result.present} - Absent: ${result.absent}${
          result.errors?.length ? `\n${result.errors.length} ${result.errors.length === 1 ? "row" : "rows"} failed` : ""
        }`
      );
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const presentCount = students.filter((s) => (statuses[s.id] ?? "present") === "present").length;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Mark attendance</Text>
        <Card>
        <Text style={styles.label}>Class</Text>
        <View style={styles.chips}>
          {classes.map((c) => (
            <Chip key={c.id} label={c.class_name} active={classId === c.id} onPress={() => setClassId(c.id)} />
          ))}
          {classes.length === 0 && !error && <Text style={styles.hint}>No classes available.</Text>}
        </View>

        {sections.length > 0 && (
          <>
            <Text style={styles.label}>Section</Text>
            <View style={styles.chips}>
              {sections.map((s) => (
                <Chip key={s.id} label={s.sectionName} active={sectionId === s.id} onPress={() => setSectionId(s.id)} />
              ))}
            </View>
          </>
        )}

        <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-08-21" />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {sectionId && (
        <Button title={loadingRoster ? "Loading…" : "Load roster"} variant="secondary" onPress={loadRoster} disabled={loadingRoster} />
      )}

      {students.length > 0 && (
        <>
          <Text style={styles.rosterMeta}>
            {students.length} students - {presentCount} marked present. Tap a name to change status.
          </Text>
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const status = statuses[item.id] ?? "present";
              return (
                <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => cycleStatus(item.id)}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{`${item.first_name} ${item.last_name ?? ""}`.trim()}</Text>
                    <Text style={styles.rowSub}>Roll {item.roll_number}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusColor[status] }]}>
                    <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                  </View>
                </Pressable>
              );
            }}
          />
          <Button title={submitting ? "Saving…" : "Save attendance"} onPress={handleSubmit} isLoading={submitting} />
        </>
      )}
      </View>
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkFaint,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  chipText: {
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.white,
  },
  hint: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  rosterMeta: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  list: {
    gap: 8,
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pressed: {
    backgroundColor: colors.brand50,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  rowSub: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.4,
  },
});

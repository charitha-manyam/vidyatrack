import { useCallback, useMemo, useState } from "react";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { NeedChild } from "../../components/NeedChild";
import { useActiveChild } from "../../context/ChildContext";
import { getChildTimetable } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { ChildTimetableEntry } from "../../types/parent";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABEL: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export function ParentTimetableScreen() {
  const { activeChild } = useActiveChild();
  const [items, setItems] = useState<ChildTimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeChild) { setLoading(false); return; }
    setLoading(true); setError(null);
    try { setItems(await getChildTimetable(activeChild.id)); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  }, [activeChild]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sections = useMemo(() => {
    const byDay = new Map<string, ChildTimetableEntry[]>();
    for (const entry of items) {
      const day = entry.day_of_week.toLowerCase();
      const list = byDay.get(day) ?? [];
      list.push(entry);
      byDay.set(day, list);
    }
    for (const list of byDay.values()) list.sort((a, b) => a.period_no - b.period_no);
    return DAY_ORDER
      .filter((day) => byDay.has(day))
      .map((day) => ({ title: DAY_LABEL[day] ?? day, data: byDay.get(day)! }));
  }, [items]);

  if (!activeChild) return <NeedChild />;

  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>
        <DataState
          loading={loading}
          error={error}
          retry={load}
          empty={items.length === 0 ? "No timetable published yet." : null}
        >
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderSectionHeader={({ section }) => (
              <Text style={styles.dayHeader}>{section.title}</Text>
            )}
            renderItem={({ item }) => (
              <View style={styles.periodRow}>
                <View style={styles.periodText}>
                  <Text style={styles.subject}>{item.subject?.subject_name ?? "—"}</Text>
                  <Text style={styles.teacher} numberOfLines={1}>
                    {item.teacher?.name ?? "—"}
                    {item.room_no ? ` · Room ${item.room_no}` : ""}
                  </Text>
                </View>
                <Text style={styles.time}>{item.time_sloat}</Text>
              </View>
            )}
          />
        </DataState>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  list: {
    paddingBottom: 12,
  },
  dayHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    textTransform: "capitalize",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 6,
    overflow: "hidden",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  periodText: {
    flex: 1,
    gap: 2,
  },
  subject: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.ink,
  },
  teacher: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  time: {
    fontSize: 12,
    color: colors.inkFaint,
    marginLeft: 12,
  },
});

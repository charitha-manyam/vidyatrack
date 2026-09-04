import { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { NeedChild } from "../../components/NeedChild";
import { useActiveChild } from "../../context/ChildContext";
import { getChildTimetable } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import type { ChildTimetableEntry } from "../../types/parent";

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
  if (!activeChild) return <NeedChild />;
  return <Screen scroll={false} topInset={false}><View style={styles.container}><DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? "No timetable published yet." : null}><FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <ListRow title={`${item.day_of_week} · Period ${item.period_no}`} subtitle={`${item.subject?.subject_name ?? "Free period"}${item.teacher ? ` · ${item.teacher.name}` : ""}`} meta={item.time_sloat} tone="brand" />} /></DataState></View></Screen>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, gap: 12 }, list: { gap: 8, paddingBottom: 12 } });

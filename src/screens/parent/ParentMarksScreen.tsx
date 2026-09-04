import { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { NeedChild } from "../../components/NeedChild";
import { useActiveChild } from "../../context/ChildContext";
import { getChildMarks } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import type { ChildMark } from "../../types/parent";

export function ParentMarksScreen() {
  const { activeChild } = useActiveChild();
  const [items, setItems] = useState<ChildMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!activeChild) { setLoading(false); return; }
    setLoading(true); setError(null);
    try { setItems(await getChildMarks(activeChild.id)); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  }, [activeChild]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (!activeChild) return <NeedChild />;
  return <Screen scroll={false} topInset={false}><View style={styles.container}><DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? "Results have not been published yet." : null}><FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <ListRow title={`${item.subject_name ?? "Subject"}${item.exam_name ? ` · ${item.exam_name}` : ""}`} subtitle={item.remarks ?? (item.is_absent ? "Absent" : "Published result")} meta={item.is_absent ? "Absent" : `${item.marks_obtained}/${item.max_marks}${item.grade ? ` · ${item.grade}` : ""}`} tone={item.is_absent ? "danger" : "brand"} />} /></DataState></View></Screen>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, gap: 12 }, list: { gap: 8, paddingBottom: 12 } });

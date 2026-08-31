import { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { getHolidays } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import type { Holiday } from "../../types/parent";

export function ParentHolidaysScreen() {
  const [items, setItems] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await getHolidays()); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <Screen scroll={false}><View style={styles.container}><PageHeader title="Holidays" description="School holidays and special days." /><DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? "No holidays published yet." : null}><FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <ListRow title={item.holidayname} subtitle={`${item.date}${item.note ? ` · ${item.note}` : ""}`} meta={item.type} tone={item.type === "public" ? "brand" : "neutral"} />} /></DataState></View></Screen>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, gap: 12 }, list: { gap: 8, paddingBottom: 12 } });

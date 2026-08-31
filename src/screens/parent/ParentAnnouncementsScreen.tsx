import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { PageHeader } from "../../components/ui/PageHeader";
import { getParentAnnouncements } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import type { ParentAnnouncement } from "../../types/parent";

export function ParentAnnouncementsScreen() {
  const [items, setItems] = useState<ParentAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await getParentAnnouncements()); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <Screen scroll={false}><View style={styles.container}><PageHeader title="Announcements" description="Updates from your school." /><DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? "No announcements yet." : null}><FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <View style={styles.card}><Text style={styles.title}>{item.title}</Text><Text style={styles.message}>{item.message}</Text>{item.createdAt ? <Text style={styles.date}>{item.createdAt}</Text> : null}</View>} /></DataState></View></Screen>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, gap: 12 }, list: { gap: 10, paddingBottom: 12 }, card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 16, gap: 6 }, title: { fontSize: 15, fontWeight: "700", color: "#111827" }, message: { fontSize: 14, lineHeight: 20, color: "#4b5563" }, date: { fontSize: 11, color: "#9ca3af" } });

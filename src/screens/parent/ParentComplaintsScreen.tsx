import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { getMyComplaints, createMyComplaint } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import type { MyComplaint } from "../../types/parent";

export function ParentComplaintsScreen() {
  const [items, setItems] = useState<MyComplaint[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setItems(await getMyComplaints()); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function submit() {
    if (!subject.trim() || !description.trim()) { setError("Subject and description are required."); return; }
    setSaving(true); setError(null);
    try { await createMyComplaint({ subject: subject.trim(), category: category.trim() || "General", description: description.trim() }); setSubject(""); setDescription(""); Alert.alert("Complaint submitted", "The school office has received your message."); await load(); } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  }
  return <Screen><PageHeader title="Complaints" description="Raise an issue with the school office." /><Input label="Subject" value={subject} onChangeText={setSubject} placeholder="What do you need help with?" /><Input label="Category" value={category} onChangeText={setCategory} /><Input label="Description" value={description} onChangeText={setDescription} multiline placeholder="Add the details" />{error ? <View><ListRow title={error} /></View> : null}<Button title="Submit complaint" onPress={submit} isLoading={saving} /><DataState loading={loading} error={null} retry={load} empty={items.length === 0 ? "No previous complaints." : null}><FlatList scrollEnabled={false} data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <ListRow title={item.subject} subtitle={`${item.category} · ${item.description}`} meta={item.status} tone={item.status === "resolved" ? "success" : item.status === "rejected" ? "danger" : "warning"} />} /></DataState></Screen>;
}
const styles = StyleSheet.create({ list: { gap: 8, paddingTop: 12, paddingBottom: 12 } });

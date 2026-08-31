import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { getResource } from "../../config/resources";
import { listResource, createResource, updateResource } from "../../api/resource.api";
import { useSelectOptions } from "../../hooks/useSelectOptions";
import { getErrorMessage } from "../../lib/errors";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "ResourceForm">;
export function ResourceFormScreen({ navigation, route }: Props) {
  const config = getResource(route.params.resourceId);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(Boolean(route.params.itemId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sources = Array.from(new Set((config?.fields ?? []).map((field) => field.source).filter(Boolean))) as Parameters<typeof useSelectOptions>[0];
  const { options } = useSelectOptions(sources);
  const load = useCallback(async () => {
    if (!config || !route.params.itemId) { setLoading(false); return; }
    setLoading(true); setError(null);
    try { const item = (await listResource(config)).find((row) => String(row[config.mutationIdKey ?? "id"] ?? "") === route.params.itemId); if (item) setForm(Object.fromEntries(config.fields.map((field) => [field.key, String(item[field.key] ?? "")]))); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  }, [config, route.params.itemId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (!config) return <Screen><Text>This module is not configured.</Text></Screen>;
  async function save() {
    const missing = config!.fields.find((field) => field.required && !String(form[field.key] ?? "").trim());
    if (missing) { setError(`${missing.label} is required.`); return; }
    setSaving(true); setError(null);
    try { const values = Object.fromEntries(config!.fields.map((field) => [field.key, field.type === "number" ? Number(form[field.key]) : form[field.key] ?? ""])); if (route.params.itemId && config!.updatePath) await updateResource(config!, route.params.itemId, values); else if (config!.createPath) await createResource(config!, values); else { setError("This module does not support create or update."); return; } navigation.goBack(); } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  }
  return <Screen scroll={false}><View style={styles.container}><PageHeader title={route.params.itemId ? `Edit ${config.title}` : `Add ${config.title}`} /><ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">{loading ? <Text>Loading...</Text> : config.fields.map((field) => field.type === "select" ? <View key={field.key}><Text style={styles.label}>{field.label}</Text><View style={styles.chips}>{(field.options ?? (field.source ? options[field.source] : []) ?? []).map((option) => <Pressable key={option.value} onPress={() => setForm((current) => ({ ...current, [field.key]: option.value }))} style={[styles.chip, form[field.key] === option.value && styles.active]}><Text style={[styles.chipText, form[field.key] === option.value && styles.activeText]}>{option.label}</Text></Pressable>)}</View></View> : <Input key={field.key} label={field.label} value={form[field.key] ?? ""} onChangeText={(value) => setForm((current) => ({ ...current, [field.key]: value }))} keyboardType={field.type === "number" ? "numeric" : "default"} multiline={field.type === "textarea"} />)}{error ? <Text style={styles.error}>{error}</Text> : null}<Button title={route.params.itemId ? "Save changes" : "Create"} onPress={save} isLoading={saving} /><Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} /></ScrollView></View></Screen>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, gap: 12 }, form: { gap: 14, paddingBottom: 32 }, label: { fontSize: 12, fontWeight: "700", color: "#6b7280", marginBottom: 8 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }, active: { backgroundColor: "#3525cd", borderColor: "#3525cd" }, chipText: { color: "#374151", fontSize: 13 }, activeText: { color: "#fff" }, error: { color: "#dc2626", fontSize: 13 } });

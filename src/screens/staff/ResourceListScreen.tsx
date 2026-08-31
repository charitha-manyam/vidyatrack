import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../config/rbac";
import { getResource } from "../../config/resources";
import { deleteResource, listResource, runRowAction } from "../../api/resource.api";
import { getErrorMessage } from "../../lib/errors";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "ResourceList">;

type Row = Record<string, unknown>;
function value(row: Row, key: string) { const v = row[key]; return v === undefined || v === null ? "" : String(v); }
function rowId(config: NonNullable<ReturnType<typeof getResource>>, row: Row) { return value(row, config.mutationIdKey ?? "id"); }

export function ResourceListScreen({ navigation, route }: Props) {
  const config = getResource(route.params.resourceId);
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canCreate = Boolean(config && hasPermission(permissions, config.module, config.createAction ?? "create"));

  const load = useCallback(async () => {
    if (!config) { setError("This module is not configured."); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setItems(await listResource(config)); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  }, [config]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!config) return <Screen><DataState error="This module is not configured." retry={() => navigation.goBack()}><View /></DataState></Screen>;

  function actions(row: Row) {
    const id = rowId(config!, row);
    const options: Array<{ text: string; style?: "cancel" | "destructive"; onPress?: () => void }> = [{ text: "Cancel", style: "cancel" }];
    if (config!.updatePath && hasPermission(permissions, config!.module, config!.updateAction ?? "update")) options.push({ text: "Edit", onPress: () => navigation.navigate("ResourceForm", { resourceId: config!.id, itemId: id }) });
    if (config!.deletePath && hasPermission(permissions, config!.module, config!.deleteAction ?? "delete")) options.push({ text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete item?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await deleteResource(config!, id); load(); } catch (err) { Alert.alert("Delete failed", getErrorMessage(err)); } } }]) });
    for (const action of config!.rowActions ?? []) if (action.visible?.(row) !== false) options.push({ text: action.label, style: action.destructive ? "destructive" : undefined, onPress: async () => { try { await runRowAction(action, id); load(); } catch (err) { Alert.alert("Action failed", getErrorMessage(err)); } } });
    Alert.alert(value(row, config!.titleKey ?? "name") || config!.title, undefined, options);
  }

  return <PermissionGate module={config.module} action={config.readAction ?? "read"}><Screen scroll={false}><View style={styles.container}><PageHeader title={config.title} description={config.description} actions={canCreate && config.createPath ? <Button title="+ Add" onPress={() => navigation.navigate("ResourceForm", { resourceId: config!.id })} /> : null} /><DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? `No ${config.title.toLowerCase()} found.` : null}><FlatList data={items} keyExtractor={(item, index) => rowId(config!, item) || String(index)} contentContainerStyle={styles.list} renderItem={({ item }) => <ListRow title={value(item, config!.titleKey ?? "name") || config!.title} subtitle={(config!.subtitleKeys ?? []).map((key) => value(item, key)).filter(Boolean).join(" · ") || undefined} meta={value(item, "status") || undefined} chevron={Boolean(config!.updatePath)} onPress={config!.updatePath ? () => navigation.navigate("ResourceForm", { resourceId: config!.id, itemId: rowId(config!, item) }) : undefined} onLongPress={() => actions(item)} />} /></DataState></View></Screen></PermissionGate>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, gap: 12 }, list: { gap: 8, paddingBottom: 12 } });

import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../config/rbac";
import { getResource } from "../../config/resources";
import { deleteResource, listResource, runRowAction } from "../../api/resource.api";
import { useSelectOptions } from "../../hooks/useSelectOptions";
import { getErrorMessage } from "../../lib/errors";
import type { MoreStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<MoreStackParamList, "ResourceList">;

type Row = Record<string, unknown>;
function value(row: Row, key: string) { const v = row[key]; return v === undefined || v === null ? "" : String(v); }
function rowId(config: NonNullable<ReturnType<typeof getResource>>, row: Row) { return value(row, config.mutationIdKey ?? "id"); }

function nestedValue(row: Row, keys: string[]) {
  for (const key of keys) {
    const direct = value(row, key);
    if (direct) return direct;
    const nested = row[key.split(".")[0]];
    if (nested && typeof nested === "object") {
      const nestedValue = value(nested as Row, key.split(".").slice(1).join("."));
      if (nestedValue) return nestedValue;
    }
  }
  return "";
}

function displayDays(row: Row) {
  const raw = nestedValue(row, ["selected_days", "working_days", "workingDays", "days", "weekdays"]);
  if (!raw) return "No days selected";
  if (Array.isArray(row.selected_days)) return row.selected_days.join(", ");
  if (Array.isArray(row.working_days)) return row.working_days.join(", ");
  return raw.replace(/[\[\]"]+/g, "").replace(/,/g, ", ");
}

function displayTime(valueToFormat: string) {
  if (!valueToFormat) return "-";
  const match = valueToFormat.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return valueToFormat;
  const hour = Number(match[1]);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${String(hour % 12 || 12).padStart(2, "0")}:${match[2]} ${suffix}`;
}

export function ResourceListScreen({ navigation, route }: Props) {
  const config = getResource(route.params.resourceId);
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canCreate = Boolean(config && hasPermission(permissions, config.module, config.createAction ?? "create"));

  const { options: yearOptions } = useSelectOptions(["years"]);
  const yearMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of yearOptions.years ?? []) map.set(opt.value, opt.label);
    return map;
  }, [yearOptions.years]);

  const load = useCallback(async () => {
    if (!config) { setError("This module is not configured."); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setItems(await listResource(config)); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  }, [config]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => config && canCreate && config.createPath ? <Button title={config.id === "school-working-days" ? "Configure" : "+ Add"} onPress={() => navigation.navigate("ResourceForm", { resourceId: config!.id })} /> : null,
    });
  }, [navigation, config, canCreate]);

  if (!config) return <Screen topInset={false}><DataState error="This module is not configured." retry={() => navigation.goBack()}><View /></DataState></Screen>;

  if (config.id === "school-working-days") {
    return (
      <PermissionGate module={config.module} action={config.readAction ?? "read"}>
        <Screen scroll={false} topInset={false}>
          <View style={styles.workingContainer}>
            <View style={styles.workingHeader}>
              <View style={styles.workingHeaderText}>
                <Text style={styles.workingTitle}>School Working Days</Text>
                <Text style={styles.workingDescription}>One configuration per academic year. Timetable and Exams Timetable both validate against this.</Text>
              </View>
              {canCreate ? <Button title="Configure" onPress={() => navigation.navigate("ResourceForm", { resourceId: config!.id })} /> : null}
            </View>
            <DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? "No working-days configuration found." : null}>
              <FlatList
                data={items}
                keyExtractor={(item, index) => rowId(config!, item) || String(index)}
                contentContainerStyle={styles.workingList}
                renderItem={({ item }) => {
                  const yearName = yearMap.get(String(item.academicYearId ?? "")) || "Unknown year";
                  const start = displayTime(value(item, "start_time"));
                  const end = displayTime(value(item, "end_time"));
                  const days = displayDays(item);
                  const periods = value(item, "no_of_periods") || "-";
                  const duration = value(item, "duration_of_period") || "-";
                  return (
                    <Card style={styles.workingCard}>
                      <View style={styles.workingCardHeader}>
                        <Text style={styles.workingCardTitle}>{yearName}</Text>
                        <View style={styles.workingCardActions}>
                          {config.updatePath ? <Pressable hitSlop={10} onPress={() => navigation.navigate("ResourceForm", { resourceId: config!.id, itemId: rowId(config!, item) })}><Feather name="edit-2" size={18} color={colors.inkSoft} /></Pressable> : null}
                          {config.deletePath ? <Pressable hitSlop={10} onPress={() => actions(item)}><Feather name="trash-2" size={18} color={colors.danger} /></Pressable> : null}
                        </View>
                      </View>
                      <View style={styles.workingInfoGrid}>
                        <View style={styles.workingInfoRow}><Text style={styles.workingInfoLabel}>Working days</Text><Text style={styles.workingInfoValue}>{days}</Text></View>
                        <View style={styles.workingInfoRow}><Text style={styles.workingInfoLabel}>Hours</Text><Text style={styles.workingInfoValue}>{start} – {end}</Text></View>
                        <View style={styles.workingInfoRow}><Text style={styles.workingInfoLabel}>Periods</Text><Text style={styles.workingInfoValue}>{periods}</Text></View>
                        <View style={styles.workingInfoRow}><Text style={styles.workingInfoLabel}>Period length</Text><Text style={styles.workingInfoValue}>{duration} min</Text></View>
                      </View>
                    </Card>
                  );
                }}
              />
            </DataState>
          </View>
        </Screen>
      </PermissionGate>
    );
  }

  if (config.id === "subjects") {
    return (
      <PermissionGate module={config.module} action={config.readAction ?? "read"}>
        <Screen scroll={false} topInset={false}>
          <View style={styles.container}>
            <View style={styles.subjectsHeader}>
              <View style={styles.subjectsHeaderText}>
                <Text style={styles.subjectsTitle}>Subjects</Text>
                <Text style={styles.subjectsDescription}>Subjects taught per class and section.</Text>
              </View>
              {canCreate && config.createPath ? (
                <Button title="+ Add subject" onPress={() => navigation.navigate("ResourceForm", { resourceId: config!.id })} />
              ) : null}
            </View>
            <DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? "No subjects found." : null}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.tableColSubject]}>Subject</Text>
                <Text style={[styles.tableHeaderCell, styles.tableColClass]}>Class</Text>
                <Text style={[styles.tableHeaderCell, styles.tableColSection]}>Section</Text>
                <Text style={[styles.tableHeaderCell, styles.tableColTeacher]}>Teacher</Text>
                <Text style={[styles.tableHeaderCell, styles.tableColActions]} />
              </View>
              <FlatList
                data={items}
                keyExtractor={(item, index) => rowId(config!, item) || String(index)}
                contentContainerStyle={styles.subjectsList}
                renderItem={({ item }) => (
                  <View style={styles.subjectRow}>
                    <Text style={[styles.subjectCell, styles.tableColSubject]} numberOfLines={1}>{value(item, "subject_name")}</Text>
                    <Text style={[styles.subjectCell, styles.tableColClass]} numberOfLines={1}>{value(item, "class_name") || "-"}</Text>
                    <Text style={[styles.subjectCell, styles.tableColSection]} numberOfLines={1}>{value(item, "section_name") || "-"}</Text>
                    <Text style={[styles.subjectCell, styles.tableColTeacher]} numberOfLines={1}>{value(item, "teacher_name") || "-"}</Text>
                    <View style={[styles.subjectActions, styles.tableColActions]}>
                      {config!.updatePath ? (
                        <Pressable hitSlop={10} onPress={() => navigation.navigate("ResourceForm", { resourceId: config!.id, itemId: rowId(config!, item) })}>
                          <Feather name="edit-2" size={18} color={colors.inkSoft} />
                        </Pressable>
                      ) : null}
                      {config!.deletePath ? (
                        <Pressable hitSlop={10} onPress={() => actions(item)}>
                          <Feather name="trash-2" size={18} color={colors.danger} />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                )}
              />
            </DataState>
          </View>
        </Screen>
      </PermissionGate>
    );
  }

  if (config.id === "designations") {
    return (
      <PermissionGate module={config.module} action={config.readAction ?? "read"}>
        <Screen scroll={false} topInset={false}>
          <View style={styles.container}>
            <View style={styles.subjectsHeader}>
              <View style={styles.subjectsHeaderText}>
                <Text style={styles.subjectsTitle}>Designations</Text>
                <Text style={styles.subjectsDescription}>Staff designations for this school.</Text>
              </View>
              {canCreate && config.createPath ? (
                <Button title="+ Add designation" onPress={() => navigation.navigate("ResourceForm", { resourceId: config!.id })} />
              ) : null}
            </View>
            <DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? "No designations found." : null}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.desigColName]}>Designation</Text>
                <Text style={[styles.tableHeaderCell, styles.desigColYear]}>Academic Year</Text>
                <Text style={[styles.tableHeaderCell, styles.tableColActions]} />
              </View>
              <FlatList
                data={items}
                keyExtractor={(item, index) => rowId(config!, item) || String(index)}
                contentContainerStyle={styles.subjectsList}
                renderItem={({ item }) => {
                  const yearName = nestedValue(item, ["academicYear.yearName", "academicYearId"]);
                  return (
                    <View style={styles.subjectRow}>
                      <Text style={[styles.subjectCell, styles.desigColName]} numberOfLines={1}>{value(item, "name")}</Text>
                      <Text style={[styles.subjectCell, styles.desigColYear]} numberOfLines={1}>{yearMap.get(String(item.academicYearId ?? "")) || yearName || "-"}</Text>
                      <View style={[styles.subjectActions, styles.tableColActions]}>
                        {config!.updatePath ? (
                          <Pressable hitSlop={10} onPress={() => navigation.navigate("ResourceForm", { resourceId: config!.id, itemId: rowId(config!, item) })}>
                            <Feather name="edit-2" size={18} color={colors.inkSoft} />
                          </Pressable>
                        ) : null}
                        {config!.deletePath ? (
                          <Pressable hitSlop={10} onPress={() => actions(item)}>
                            <Feather name="trash-2" size={18} color={colors.danger} />
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  );
                }}
              />
            </DataState>
          </View>
        </Screen>
      </PermissionGate>
    );
  }

  function actions(row: Row) {
    const id = rowId(config!, row);
    const options: Array<{ text: string; style?: "cancel" | "destructive"; onPress?: () => void }> = [{ text: "Cancel", style: "cancel" }];
    if (config!.updatePath && hasPermission(permissions, config!.module, config!.updateAction ?? "update")) options.push({ text: "Edit", onPress: () => navigation.navigate("ResourceForm", { resourceId: config!.id, itemId: id }) });
    if (config!.deletePath && hasPermission(permissions, config!.module, config!.deleteAction ?? "delete")) options.push({ text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete item?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await deleteResource(config!, id); load(); } catch (err) { Alert.alert("Delete failed", getErrorMessage(err)); } } }]) });
    for (const action of config!.rowActions ?? []) if (action.visible?.(row) !== false) options.push({ text: action.label, style: action.destructive ? "destructive" : undefined, onPress: async () => { try { await runRowAction(action, id); load(); } catch (err) { Alert.alert("Action failed", getErrorMessage(err)); } } });
    Alert.alert(value(row, config!.titleKey ?? "name") || config!.title, undefined, options);
  }

  return <PermissionGate module={config.module} action={config.readAction ?? "read"}><Screen scroll={false} topInset={false}><View style={styles.container}><DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? `No ${config.title.toLowerCase()} found.` : null}><FlatList data={items} keyExtractor={(item, index) => rowId(config!, item) || String(index)} contentContainerStyle={styles.list} renderItem={({ item }) => <ListRow title={value(item, config!.titleKey ?? "name") || config!.title} subtitle={(config!.subtitleKeys ?? []).map((key) => value(item, key)).filter(Boolean).join(" · ") || undefined} meta={value(item, "status") || undefined} chevron={Boolean(config!.updatePath)} onPress={config!.updatePath ? () => navigation.navigate("ResourceForm", { resourceId: config!.id, itemId: rowId(config!, item) }) : undefined} onLongPress={() => actions(item)} />} /></DataState></View></Screen></PermissionGate>;
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  list: { gap: 8, paddingBottom: 12 },
  workingContainer: { flex: 1, padding: 16, gap: 16 },
  workingHeader: { gap: 14 },
  workingHeaderText: { gap: 5 },
  workingTitle: { fontSize: 22, fontWeight: "700", color: colors.ink },
  workingDescription: { fontSize: 14, lineHeight: 20, color: colors.inkFaint },
  workingList: { gap: 12, paddingBottom: 20 },
  workingCard: { gap: 0 },
  workingCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  workingCardTitle: { fontSize: 16, fontWeight: "600", color: colors.ink, flex: 1 },
  workingCardActions: { flexDirection: "row", gap: 16 },
  workingInfoGrid: { gap: 0 },
  workingInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  workingInfoLabel: { fontSize: 14, color: colors.inkSoft },
  workingInfoValue: { fontSize: 14, fontWeight: "500", color: colors.ink, textAlign: "right", flex: 1, marginLeft: 12 },
  subjectsHeader: { gap: 14 },
  subjectsHeaderText: { gap: 5 },
  subjectsTitle: { fontSize: 22, fontWeight: "700", color: colors.ink },
  subjectsDescription: { fontSize: 14, lineHeight: 20, color: colors.inkFaint },
  subjectsList: { paddingBottom: 12 },
  tableHeader: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  tableHeaderCell: { fontSize: 11, fontWeight: "700", color: colors.inkGhost, letterSpacing: 0.5, textTransform: "uppercase" },
  tableColSubject: { flex: 2.5 },
  tableColClass: { flex: 1.2 },
  tableColSection: { flex: 1.2 },
  tableColTeacher: { flex: 2 },
  tableColActions: { flex: 1, textAlign: "right" },
  subjectRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, gap: 8, marginBottom: 8 },
  subjectCell: { fontSize: 14, color: colors.ink },
  subjectActions: { flexDirection: "row", gap: 18, justifyContent: "flex-end" },
  desigColName: { flex: 3 },
  desigColYear: { flex: 2 },
});

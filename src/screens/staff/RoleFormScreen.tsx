import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { getPermissionCatalog, getRoleById, createRole, updateRole } from "../../api/role.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { PermissionCatalogEntry } from "../../types/role";

type Props = NativeStackScreenProps<MoreStackParamList, "RoleForm">;

const ACTIONS = ["create", "read", "update", "delete"] as const;

// Port of admin-portal's features/roles/RoleFormDialog — a module×action
// checkbox matrix driven by a Set of "module:action" keys, with an "All"
// toggle per module. The assignable grid comes from the live backend
// catalog (/tenant/getpermissioncatalog), not from rbac.ts.
export function RoleFormScreen({ navigation, route }: Props) {
  const roleId = route.params?.roleId;
  const isEdit = Boolean(roleId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? "Edit role" : "Create role",
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [navigation, isEdit]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSystemDefault, setIsSystemDefault] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [catalog, setCatalog] = useState<PermissionCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [catalogData, detail] = await Promise.all([
        getPermissionCatalog(),
        roleId ? getRoleById(roleId) : Promise.resolve(null),
      ]);
      setCatalog(catalogData);
      if (detail) {
        setName(detail.name);
        setDescription(detail.description ?? "");
        setIsSystemDefault(Boolean(detail.is_system_default));
        const initial = new Set<string>();
        detail.permissions.forEach((p) => {
          p.actions.forEach((a) => initial.add(`${p.module}:${a}`));
        });
        setSelected(initial);
      }
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(moduleName: string, action: string) {
    const key = `${moduleName}:${action}`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAllForModule(moduleName: string, actions: readonly string[]) {
    const allSet = actions.every((a) => selected.has(`${moduleName}:${a}`));
    setSelected((prev) => {
      const next = new Set(prev);
      actions.forEach((a) => {
        const key = `${moduleName}:${a}`;
        if (allSet) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  }

  const builtPermissions = useMemo(() => {
    const byModule = new Map<string, string[]>();
    selected.forEach((key) => {
      const [moduleName, action] = key.split(":");
      if (!byModule.has(moduleName)) byModule.set(moduleName, []);
      byModule.get(moduleName)!.push(action);
    });
    return Array.from(byModule.entries()).map(([moduleName, actions]) => ({ module: moduleName, actions }));
  }, [selected]);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Missing info", "Role name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const values = { name: name.trim(), description: description.trim() || undefined, permissions: builtPermissions };
      if (roleId) {
        await updateRole(roleId, values);
        Alert.alert("Role updated", undefined, [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else {
        await createRole(values);
        Alert.alert("Role created", undefined, [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      Alert.alert("Save failed", getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.brand600} size="large" />
          </View>
        ) : loadError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Button variant="secondary" title="Retry" onPress={load} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Input label="Role name" value={name} onChangeText={setName} placeholder="e.g. Class Coordinator" />
            <Input
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="What is this role for?"
            />

            <Text style={styles.sectionLabel}>Module permissions</Text>
            <View style={styles.matrix}>
              <View style={styles.matrixHead}>
                <Text style={[styles.headCell, styles.headModule]}>MODULE</Text>
                <Text style={styles.headCell}>ACTIONS</Text>
                <Text style={styles.headCell}>ALL</Text>
              </View>
              {catalog.map((entry) => {
                const grantedActions = ACTIONS.filter((a) => entry.actions.includes(a));
                const allSelected =
                  grantedActions.length > 0 && grantedActions.every((a) => selected.has(`${entry.module}:${a}`));
                return (
                  <View key={entry.module} style={styles.moduleRow}>
                    <View style={styles.moduleInfo}>
                      <Text style={styles.moduleName}>{entry.module}</Text>
                      <View style={styles.chipRow}>
                        {grantedActions.map((action) => (
                          <ActionChip
                            key={action}
                            label={action}
                            selected={selected.has(`${entry.module}:${action}`)}
                            onPress={() => toggle(entry.module, action)}
                          />
                        ))}
                        {grantedActions.length === 0 ? (
                          <Text style={styles.noActions}>No actions in catalog</Text>
                        ) : null}
                      </View>
                    </View>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: allSelected }}
                      disabled={grantedActions.length === 0}
                      onPress={() => toggleAllForModule(entry.module, grantedActions)}
                      style={({ pressed }) => [
                        styles.allBox,
                        allSelected && styles.allBoxOn,
                        (pressed || grantedActions.length === 0) && styles.allBoxDim,
                      ]}
                    >
                      {allSelected ? <Text style={styles.allCheck}>✓</Text> : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Button
                title={isEdit ? "Save changes" : "Create role"}
                onPress={handleSubmit}
                isLoading={isSubmitting}
              />
            </View>
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function ActionChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected ? styles.chipOn : styles.chipOff, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextOn : styles.chipTextOff]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  form: {
    gap: 14,
    paddingBottom: 32,
  },
  center: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 48,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkSoft,
  },
  matrix: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  matrixHead: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.inkGhost,
  },
  headModule: {
    flex: 2.4,
  },
  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  moduleInfo: {
    flex: 2.4,
    gap: 6,
    paddingRight: 8,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  chipOn: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  chipOff: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.line,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  chipTextOn: {
    color: colors.white,
  },
  chipTextOff: {
    color: colors.inkSoft,
  },
  pressed: {
    opacity: 0.7,
  },
  noActions: {
    fontSize: 12,
    color: colors.inkGhost,
  },
  allBox: {
    flex: 1,
    height: 28,
    maxWidth: 64,
    marginLeft: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  allBoxOn: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  allBoxDim: {
    opacity: 0.5,
  },
  allCheck: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  footer: {
    marginTop: 4,
  },
});

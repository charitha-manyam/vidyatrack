import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { deleteRole, getRoles } from "../../api/role.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { TenantRole } from "../../types/role";

type Props = NativeStackScreenProps<MoreStackParamList, "Roles">;

// Port of the admin portal's roles page; role actions are permission-gated.
// Roles:create / Roles:delete. Rows mirror the web table: name (+ Default
// badge), description, permission count, staff-assigned count.
export function RolesScreen({ navigation }: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.ROLES, "create");
  const canDelete = hasPermission(permissions, MODULES.ROLES, "delete");

  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRoles(await getRoles());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmDelete = (role: TenantRole) => {
    Alert.alert(
      `Delete role "${role.name}"?`,
      "Blocked if this is a default role, or if any staff are still assigned to it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRole(role.id);
              load();
            } catch (err) {
              Alert.alert("Delete failed", getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const rowActions = (role: TenantRole) => {
    const options: Array<{ text: string; style?: "cancel" | "destructive"; onPress?: () => void }> = [
      { text: "Cancel", style: "cancel" },
      {
        text: "Edit",
        onPress: () => navigation.navigate("RoleForm", { roleId: role.id }),
      },
    ];
    if (canDelete) options.push({ text: "Delete", style: "destructive", onPress: () => confirmDelete(role) });
    Alert.alert(role.name, undefined, options);
  };

  return (
    <PermissionGate module={MODULES.ROLES} action="read">
      <Screen scroll={false}>
        <View style={styles.container}>
          <PageHeader
            title="Roles & Permissions"
            description="Control what each staff role can see and do."
            actions={
              canWrite ? (
                <Button title="+ Create role" onPress={() => navigation.navigate("RoleForm", undefined)} />
              ) : null
            }
          />
          <DataState loading={loading} error={error} retry={load} empty={roles.length === 0 ? "No roles yet." : null}>
            <FlatList
              contentContainerStyle={styles.listContent}
              data={roles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  onPress={() => navigation.navigate("RoleForm", { roleId: item.id })}
                  onLongPress={() => rowActions(item)}
                >
                  <View style={styles.textWrap}>
                    <View style={styles.nameLine}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.is_system_default ? <Badge tone="brand">Default</Badge> : null}
                    </View>
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {item.description ?? "-"}
                    </Text>
                    <Text style={styles.counts}>
                      {item.permissionCount ?? 0} permissions - {item.staffCount ?? 0} staff assigned
                    </Text>
                  </View>
                  {canDelete ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() => confirmDelete(item)}
                      style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
                    >
                      <Feather name="trash-2" size={18} color={colors.danger} />
                    </Pressable>
                  ) : null}
                  <Feather name="chevron-right" size={18} color={colors.inkGhost} />
                </Pressable>
              )}
            />
          </DataState>
        </View>
      </Screen>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  pressed: {
    backgroundColor: colors.surfaceHover,
  },
  rowAction: {
    padding: 2,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  counts: {
    fontSize: 12,
    color: colors.inkGhost,
  },
});

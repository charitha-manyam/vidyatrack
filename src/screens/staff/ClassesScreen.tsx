import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { PageHeader } from "../../components/ui/PageHeader";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { Button } from "../../components/Button";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { deleteClass, getClasses } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { ClassesStackParamList } from "../../navigation/types";
import type { SchoolClass } from "../../types/school";

type Props = NativeStackScreenProps<ClassesStackParamList, "ClassesList">;

export function ClassesScreen({ navigation }: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  // Same gating rules as the admin-portal Classes page.
  const canCreate = hasPermission(permissions, MODULES.CLASSES, "create");
  const canUpdate = hasPermission(permissions, MODULES.CLASSES, "update");
  const canDelete = hasPermission(permissions, MODULES.CLASSES, "delete");

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClasses(await getClasses());
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

  const confirmDelete = (item: SchoolClass) => {
    Alert.alert(`Delete ${item.class_name}?`, "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteClass(item.id);
            load();
          } catch (err) {
            Alert.alert("Delete failed", getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const rowActions = (item: SchoolClass) => {
    const options: Array<{ text: string; style?: "cancel" | "destructive"; onPress?: () => void }> = [
      { text: "Cancel", style: "cancel" },
    ];
    if (canUpdate) {
      options.push({
        text: "Edit",
        onPress: () => navigation.navigate("ClassForm", { classId: item.id, className: item.class_name }),
      });
    }
    if (canDelete) {
      options.push({ text: "Delete", style: "destructive", onPress: () => confirmDelete(item) });
    }
    Alert.alert(item.class_name, undefined, options);
  };

  return (
    <PermissionGate module={MODULES.CLASSES} action="read">
      <Screen scroll={false}>
        <View style={styles.container}>
          <PageHeader
            title="Classes"
            description={`${classes.length} total`}
            actions={
              canCreate ? (
                <Button title="+ Add class" onPress={() => navigation.navigate("ClassForm", undefined)} />
              ) : null
            }
          />
        <DataState loading={loading} error={error} retry={load} empty={classes.length === 0 ? "No classes yet." : null}>
          <FlatList
            contentContainerStyle={styles.listContent}
            data={classes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ListRow
                title={item.class_name}
                subtitle={`${item.sections_count ?? 0} section(s)`}
                meta={`${item.class_strength ?? item.total_strength ?? 0} students`}
                tone="brand"
                chevron
                onPress={() => navigation.navigate("ClassDetail", { classId: item.id, className: item.class_name })}
                onLongPress={canUpdate || canDelete ? () => rowActions(item) : undefined}
              />
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
  header: {
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkFaint,
  },
});

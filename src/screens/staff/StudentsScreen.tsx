import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { PageHeader } from "../../components/ui/PageHeader";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { SearchBar } from "../../components/SearchBar";
import { Button } from "../../components/Button";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { deleteStudent, getStudents } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { StudentsStackParamList } from "../../navigation/types";
import type { Student } from "../../types/school";

type Props = NativeStackScreenProps<StudentsStackParamList, "StudentsList">;

export function StudentsScreen({ navigation }: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  // Same element-level gating as the admin-portal Students page: create
  // shows the add button; update/delete drive the per-row actions.
  const canCreate = hasPermission(permissions, MODULES.STUDENTS, "create");
  const canUpdate = hasPermission(permissions, MODULES.STUDENTS, "update");
  const canDelete = hasPermission(permissions, MODULES.STUDENTS, "delete");

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStudents(await getStudents());
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

  const confirmDelete = (item: Student) => {
    Alert.alert(`Delete ${item.first_name} ${item.last_name ?? ""}?`.trimEnd(), "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStudent(item.id);
            load();
          } catch (err) {
            Alert.alert("Delete failed", getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const rowActions = (item: Student) => {
    const options: Array<{ text: string; style?: "cancel" | "destructive"; onPress?: () => void }> = [
      { text: "Cancel", style: "cancel" },
    ];
    if (canUpdate) {
      options.push({ text: "Edit", onPress: () => navigation.navigate("StudentForm", { studentId: item.id }) });
    }
    if (canDelete) {
      options.push({ text: "Delete", style: "destructive", onPress: () => confirmDelete(item) });
    }
    Alert.alert(`${item.first_name} ${item.last_name ?? ""}`.trim(), undefined, options);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [`${s.first_name} ${s.last_name ?? ""}`, s.roll_number, s.admission_number ?? "", s.className ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [students, search]);

  return (
    <PermissionGate module={MODULES.STUDENTS} action="read">
      <Screen scroll={false}>
        <View style={styles.container}>
          <PageHeader
            title="Students"
            description={`${students.length} total`}
            actions={
              canCreate ? (
                <Button title="+ Add student" onPress={() => navigation.navigate("StudentForm", undefined)} />
              ) : null
            }
          />
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, roll no, classâ€¦" />
        <DataState loading={loading} error={error} retry={load} empty={filtered.length === 0 ? "No students found." : null}>
          <FlatList
            contentContainerStyle={styles.listContent}
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ListRow
                title={`${item.first_name} ${item.last_name ?? ""}`.trim()}
                subtitle={`Roll ${item.roll_number}${item.className ? ` Â· ${item.className}${item.sectionName ? `-${item.sectionName}` : ""}` : ""}`}
                meta={item.status}
                tone={item.status === "active" ? "success" : "neutral"}
                chevron
                onPress={() => navigation.navigate("StudentDetail", { studentId: item.id })}
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

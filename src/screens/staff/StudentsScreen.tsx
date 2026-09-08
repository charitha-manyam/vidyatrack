import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { PageHeader } from "../../components/ui/PageHeader";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { Button } from "../../components/Button";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { deleteStudent, getClasses, getStudents, type StudentListParams } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { StudentsStackParamList } from "../../navigation/types";
import type { Student } from "../../types/school";

type Props = NativeStackScreenProps<StudentsStackParamList, "StudentsList">;

const ALL_CLASSES: SelectOption = { value: "", label: "All Classes" };

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
  const [classFilter, setClassFilter] = useState("");
  const [classes, setClasses] = useState<SelectOption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: StudentListParams = {};
      if (classFilter) params.class_id = classFilter;
      setStudents(await getStudents(params));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [classFilter]);

  useEffect(() => {
    if (classes.length) return;
    getClasses()
      .then((rows) => setClasses(rows.map((c) => ({ value: c.id, label: c.class_name }))))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <InlineSelect
          label="Filter by class"
          value={classFilter}
          options={[ALL_CLASSES, ...classes]}
          onSelect={setClassFilter}
          placeholder="All Classes"
        />
        <DataState loading={loading} error={error} retry={load} empty={students.length === 0 ? "No students found." : null}>
          <FlatList
            contentContainerStyle={styles.listContent}
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{`${item.first_name} ${item.last_name ?? ""}`.trim()}</Text>
                  <Text style={styles.cardSubtitle}>
                    Roll {item.roll_number}
                    {item.className ? ` - ${item.className}${item.sectionName ? `-${item.sectionName}` : ""}` : ""}
                  </Text>
                  <Text style={[styles.cardStatus, { color: item.status === "active" ? colors.success : colors.inkFaint }]}>
                    {item.status}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  {canUpdate ? (
                    <Pressable hitSlop={10} onPress={() => navigation.navigate("StudentForm", { studentId: item.id })}>
                      <Feather name="edit-2" size={18} color={colors.inkSoft} />
                    </Pressable>
                  ) : null}
                  {canDelete ? (
                    <Pressable hitSlop={10} onPress={() => confirmDelete(item)}>
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
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  cardStatus: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
  },
});

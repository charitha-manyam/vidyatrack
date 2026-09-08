import { useCallback, useLayoutEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { Button } from "../../components/Button";
import { Badge } from "../../components/ui/Badge";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { deleteHomework, getHomeworks, publishHomework } from "../../api/homework.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { Homework } from "../../types/homework";

type Props = NativeStackScreenProps<MoreStackParamList, "Homeworks">;

// Port of admin-portal's features/homework/HomeworksPage — rows mirror the web
// table (class/section/subject/teacher/due + Published/Draft badge) with the
// same permission-gated actions: view submissions, publish (draft only), edit,
// delete. Rendered as cards since there's no table primitive on native.
export function HomeworksScreen({ navigation }: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.HOMEWORK, "create");
  const canDelete = hasPermission(permissions, MODULES.HOMEWORK, "delete");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        canWrite ? <Button title="+ Assign homework" onPress={() => navigation.navigate("HomeworkForm", undefined)} /> : null,
    });
  }, [navigation, canWrite]);

  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getHomeworks());
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

  function displayClass(item: Homework): string {
    return item.class?.name ?? item.class?.class_name ?? "—";
  }

  function displaySection(item: Homework): string {
    return item.section?.name ?? item.section?.sectionName ?? "All";
  }

  function displaySubject(item: Homework): string {
    return item.subject?.name ?? item.subject?.subject_name ?? "—";
  }

  function displayTeacher(item: Homework): string {
    return item.teacher?.name ?? "—";
  }

  function confirmDelete(item: Homework) {
    Alert.alert(
      `Delete "${item.title}"?`,
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteHomework(item.id);
              load();
            } catch (err) {
              Alert.alert("Delete failed", getErrorMessage(err));
            }
          },
        },
      ]
    );
  }

  async function handlePublish(item: Homework) {
    try {
      await publishHomework(item.id);
      load();
    } catch (err) {
      Alert.alert("Publish failed", getErrorMessage(err));
    }
  }

  const renderItem = ({ item }: { item: Homework }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Badge tone={item.is_published ? "green" : "gray"}>{item.is_published ? "Published" : "Draft"}</Badge>
      </View>
      <Text style={styles.metaLine}>
        {displayClass(item)} · {displaySection(item)} · {displaySubject(item)}
      </Text>
      <Text style={styles.metaLine}>Teacher: {displayTeacher(item)}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.due}>Due: {item.submission_date}</Text>
        <View style={styles.actions}>
          <Pressable
            hitSlop={8}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            onPress={() => navigation.navigate("HomeworkSubmissions", { homeworkId: item.id, title: item.title })}
          >
            <Feather name="clipboard" size={18} color={colors.inkSoft} />
          </Pressable>
          {canWrite && !item.is_published ? (
            <Pressable hitSlop={8} style={({ pressed }) => [styles.action, pressed && styles.pressed]} onPress={() => handlePublish(item)}>
              <Feather name="send" size={18} color={colors.brand600} />
            </Pressable>
          ) : null}
          {canWrite ? (
            <Pressable
              hitSlop={8}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              onPress={() => navigation.navigate("HomeworkForm", { homeworkId: item.id, title: item.title })}
            >
              <Feather name="edit-2" size={18} color={colors.inkSoft} />
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable hitSlop={8} style={({ pressed }) => [styles.action, pressed && styles.pressed]} onPress={() => confirmDelete(item)}>
              <Feather name="trash-2" size={18} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <PermissionGate module={MODULES.HOMEWORK} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? "No homework assigned yet." : null}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={renderItem}
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
    gap: 10,
    paddingBottom: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  metaLine: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },
  due: {
    flex: 1,
    fontSize: 12,
    color: colors.inkGhost,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  action: {
    padding: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
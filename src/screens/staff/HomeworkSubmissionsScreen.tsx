import { useCallback, useLayoutEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { Button } from "../../components/Button";
import { Badge } from "../../components/ui/Badge";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { getSubmissionsByHomework, updateHomeworkSubmission } from "../../api/homework.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { HomeworkSubmissionRosterEntry } from "../../types/homework";

type Props = NativeStackScreenProps<MoreStackParamList, "HomeworkSubmissions">;

// Port of admin-portal's features/homework/HomeworkSubmissionsPage — one row
// per student in the homework's class/section: roll no., name, submitted/
// not-submitted badge, submitted-on date, an editable Remarks field and a
// "Mark reviewed" action when the homework:update permission is present.
export function HomeworkSubmissionsScreen({ navigation, route }: Props) {
  const { homeworkId, title } = route.params;
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.HOMEWORK, "update");

  useLayoutEffect(() => {
    navigation.setOptions({
      title: title ? `Submissions — ${title}` : "Homework submissions",
    });
  }, [navigation, title]);

  const [roster, setRoster] = useState<HomeworkSubmissionRosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remarksDraft, setRemarksDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSubmissionsByHomework(homeworkId);
      setRoster(res.data);
      const draft: Record<string, string> = {};
      res.data.forEach((entry) => {
        draft[entry.student_id] = entry.remarks ?? "";
      });
      setRemarksDraft(draft);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [homeworkId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleReview(entry: HomeworkSubmissionRosterEntry) {
    if (!entry.submission_id) return;
    try {
      await updateHomeworkSubmission(entry.submission_id, {
        remarks: (remarksDraft[entry.student_id] ?? entry.remarks ?? "").trim(),
        status: "reviewed",
      });
      load();
    } catch (err) {
      Alert.alert("Review failed", getErrorMessage(err));
    }
  }

  const renderItem = ({ item }: { item: HomeworkSubmissionRosterEntry }) => {
    const submitted = item.status === "submitted";
    const canEdit = canWrite && Boolean(item.submission_id);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.nameWrap}>
            <Text style={styles.name} numberOfLines={1}>
              {item.student_name ?? "—"}
            </Text>
            <Text style={styles.roll}>Roll no. {item.roll_number ?? "—"}</Text>
          </View>
          <Badge tone={submitted ? "green" : "gray"}>{item.status}</Badge>
        </View>
        <Text style={styles.meta}>Submitted on: {item.submission_date ?? "Not submitted"}</Text>
        <View style={styles.remarksRow}>
          <TextInput
            style={[styles.remarksInput, !canEdit && styles.remarksDisabled]}
            placeholder="Add remarks when reviewing"
            placeholderTextColor={colors.inkFaint}
            value={remarksDraft[item.student_id] ?? item.remarks ?? ""}
            onChangeText={(text) => setRemarksDraft((prev) => ({ ...prev, [item.student_id]: text }))}
            editable={canEdit}
          />
          {canEdit ? (
            <Button variant="secondary" title="Mark reviewed" onPress={() => handleReview(item)} />
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <PermissionGate module={MODULES.HOMEWORK} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={roster.length === 0 ? "No students found for this homework's class/section." : null}
          >
            <FlatList
              data={roster}
              keyExtractor={(item) => item.student_id}
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
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nameWrap: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  roll: {
    fontSize: 12,
    color: colors.inkGhost,
  },
  meta: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  remarksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  remarksInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  remarksDisabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.7,
  },
});
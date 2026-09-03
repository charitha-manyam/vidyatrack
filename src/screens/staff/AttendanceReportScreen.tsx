import { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { PageHeader } from "../../components/ui/PageHeader";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { getAbsentMoreThan5Days } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { AbsenteeItem } from "../../types/school";

type Props = NativeStackScreenProps<MoreStackParamList, "AttendanceReport">;

export function AttendanceReportScreen({ }: Props) {
  const [items, setItems] = useState<AbsenteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getAbsentMoreThan5Days());
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

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <PageHeader title="Attendance alerts" description="Students absent more than 5 days" />
        <DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? "No chronic absentees - nice." : null}>
          <FlatList
            contentContainerStyle={styles.listContent}
            data={items}
            keyExtractor={(item) => item.student_id}
            renderItem={({ item }) => (
              <ListRow
                title={item.student_name}
                subtitle={`Student ID: ${item.student_id}`}
                meta={`${item.absent_count} absences`}
                tone={item.absent_count > 10 ? "danger" : "warning"}
              />
            )}
          />
        </DataState>
      </View>
    </Screen>
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

import { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { PageHeader } from "../../components/ui/PageHeader";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { StatTile } from "../../components/StatTile";
import { PermissionGate } from "../../components/PermissionGate";
import { MODULES } from "../../config/rbac";
import { getPendingFeeSummary } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { StaffTabParamList } from "../../navigation/types";
import type { PendingFeeSummaryItem } from "../../types/school";

type Props = BottomTabScreenProps<StaffTabParamList, "Fees">;

function formatCurrency(value: number) {
  return `Rs ${new Intl.NumberFormat("en-IN").format(value)}`;
}

export function FeesScreen({ navigation }: Props) {
  const [items, setItems] = useState<PendingFeeSummaryItem[]>([]);
  const [totals, setTotals] = useState<{ amount: number; students: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingFeeSummary();
      setItems(res.items);
      setTotals({ amount: res.totalPendingAmount, students: res.totalStudentsWithPendingFees });
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
    <PermissionGate module={MODULES.FEES} action="read">
      <Screen scroll={false}>
        <View style={styles.container}>
          <PageHeader title="Pending fees" description="Assignment-level dues across the school" />

          {totals && (
            <View style={styles.grid}>
              <StatTile label="Total pending" value={formatCurrency(totals.amount)} tone={totals.amount > 0 ? "danger" : "success"} />
              <StatTile label="Students" value={totals.students} tone="warning" />
            </View>
          )}

          <DataState loading={loading} error={error} retry={load} empty={items.length === 0 ? "No pending fees - all clear." : null}>
            <FlatList
              contentContainerStyle={styles.listContent}
              data={items}
              keyExtractor={(item) => item.studentId}
              renderItem={({ item }) => (
                <ListRow
                  title={item.studentName}
                  subtitle={`${item.className ?? "No class"}${item.sectionName ? `-${item.sectionName}` : ""}`}
                  meta={formatCurrency(item.pendingAmount)}
                  tone="danger"
                  chevron
                  onPress={() =>
                    navigation.navigate("Students", {
                      screen: "StudentDetail",
                      params: { studentId: item.studentId },
                    })
                  }
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
  grid: {
    flexDirection: "row",
    gap: 12,
  },
});

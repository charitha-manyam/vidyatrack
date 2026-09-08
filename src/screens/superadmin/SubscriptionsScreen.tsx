import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatTile } from "../../components/StatTile";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { getSchoolsByStatus, getSubscriptionSummary } from "../../api/superadminSchool.api";
import type { SchoolSubscriptionStatusRow, SubscriptionStatus } from "../../types/schoolAdmin";
import type { SubscriptionSummary } from "../../types/subscription";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

type RowTone = "neutral" | "success" | "warning" | "danger" | "brand";

const FILTERS: { label: string; value?: SubscriptionStatus }[] = [
  { label: "All statuses" },
  { label: "Trial", value: "TRIAL" },
  { label: "Paid", value: "PAID" },
  { label: "Due", value: "DUE" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const statusTone: Record<SubscriptionStatus, RowTone> = {
  TRIAL: "brand",
  PENDING: "neutral",
  PAID: "success",
  DUE: "warning",
  OVERDUE: "danger",
  SUSPENDED: "danger",
  CANCELLED: "danger",
};

export function SubscriptionsScreen() {
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [rows, setRows] = useState<SchoolSubscriptionStatusRow[]>([]);
  const [filter, setFilter] = useState<SubscriptionStatus | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([getSubscriptionSummary(), getSchoolsByStatus(filter)])
      .then(([s, r]) => {
        setSummary(s);
        setRows(r);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [filter]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <Screen scroll={false}>
      <PageHeader title="Subscriptions" description="Subscription status by school." />

      {summary ? (
        <View style={styles.tiles}>
          <StatTile label="Schools" value={summary.totalSchools ?? 0} />
          <StatTile label="Active" value={summary.active ?? 0} tone="success" />
          <StatTile label="Trial" value={summary.trial ?? 0} />
          <StatTile label="Overdue" value={summary.expired ?? 0} tone="danger" />
          <StatTile label="Locked" value={summary.locked ?? 0} tone="warning" />
          <StatTile label="Monthly revenue" value={`₹${(summary.monthlyRevenue ?? 0).toLocaleString("en-IN")}`} tone="brand" />
        </View>
      ) : null}

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = f.value === filter || (f.value === undefined && filter === undefined);
          return (
            <Pressable
              key={f.label}
              onPress={() => setFilter(f.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <DataState loading={isLoading} error={error} retry={reload} empty={isLoading ? null : "No subscriptions match this filter."}>
        <FlatList
          data={rows}
          keyExtractor={(item) => item.schoolId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListRow
              title={item.schoolName}
              subtitle={`${item.planName ?? "—"} · ${item.nextDueDate ?? "no due date"}`}
              meta={item.subscriptionStatus}
              tone={statusTone[item.subscriptionStatus as SubscriptionStatus] ?? "neutral"}
              chevron={false}
            />
          )}
        />
      </DataState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.brand100,
    borderColor: colors.brand600,
  },
  chipText: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  chipTextActive: {
    color: colors.brand700,
    fontWeight: "600",
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
});
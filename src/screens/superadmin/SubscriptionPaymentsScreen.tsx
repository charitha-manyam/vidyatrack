import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Screen } from "../../components/Screen";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { getAllSubscriptionPayments } from "../../api/superadminPayment.api";
import type { SubscriptionPayment } from "../../types/subscriptionPayment";
import { getErrorMessage } from "../../lib/errors";

export function SubscriptionPaymentsScreen() {
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getAllSubscriptionPayments()
      .then(setPayments)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <Screen scroll={false}>
      <PageHeader title="Subscription payments" description="Razorpay & manual payment ledger." />

      <DataState loading={isLoading} error={error} retry={reload} empty={isLoading ? null : "No payments recorded yet."}>
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListRow
              title={item.school?.school_name ?? `School ${item.schoolId}`}
              subtitle={`${item.paymentMode} · ${item.paymentDate ?? "no date"}${item.renewed ? " · renewed" : ""}`}
              meta={`₹${item.amount}`}
              tone="brand"
            />
          )}
        />
      </DataState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 24,
  },
});
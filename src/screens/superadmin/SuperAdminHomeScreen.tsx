import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { StatTile } from "../../components/StatTile";
import { useAuth } from "../../context/AuthContext";
import { getSubscriptionSummary } from "../../api/superadmin.api";
import type { SubscriptionSummary } from "../../types/subscription";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

export function SuperAdminHomeScreen() {
  const { session } = useAuth();
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSubscriptionSummary()
      .then(setSummary)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  if (!session || session.type !== "superadmin") return null;

  return (
    <Screen scroll={!isLoading}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand600} />
        </View>
      ) : (
        <>
          <Text style={styles.title}>Platform overview</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          {summary && (
            <View style={styles.tiles}>
              <StatTile label="Schools" value={summary.totalSchools} tone="brand" />
              <StatTile label="Active" value={summary.active} tone="success" />
              <StatTile label="Trial" value={summary.trial} />
              <StatTile label="Overdue" value={summary.expired} tone="danger" />
              <StatTile label="Locked" value={summary.locked} tone="warning" />
              <StatTile label="Monthly revenue" value={`₹${summary.monthlyRevenue.toLocaleString("en-IN")}`} tone="brand" />
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});

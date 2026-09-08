import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Screen } from "../../components/Screen";
import { StatTile } from "../../components/StatTile";
import { PageHeader } from "../../components/ui/PageHeader";
import { ListRow } from "../../components/ListRow";
import { useAuth } from "../../context/AuthContext";
import { getSubscriptionSummary } from "../../api/superadminSchool.api";
import type { SubscriptionSummary } from "../../types/subscription";
import type { SuperAdminTabParamList } from "../../navigation/types";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

type Props = BottomTabScreenProps<SuperAdminTabParamList, "Dashboard">;

export function SuperAdminHomeScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setIsLoading(true);
    setError(null);
    getSubscriptionSummary()
      .then(setSummary)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  if (!session || session.type !== "superadmin") return null;

  const tile = summary ? Math.max(2, Math.floor(width / 140)) : 2;

  return (
    <Screen scroll={!isLoading}>
      <PageHeader title="Platform overview" description="Schools and subscriptions at a glance." />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand600} />
        </View>
      ) : (
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          {summary && (
            <View style={styles.tiles}>
              {[
                { label: "Schools", value: String(summary.totalSchools ?? 0) },
                { label: "Active", value: String(summary.active ?? 0) },
                { label: "Trial", value: String(summary.trial ?? 0) },
                { label: "Overdue", value: String(summary.expired ?? 0) },
                { label: "Locked", value: String(summary.locked ?? 0) },
                { label: "Monthly revenue", value: `₹${(summary.monthlyRevenue ?? 0).toLocaleString("en-IN")}` },
              ].map((s) => (
                <View key={s.label} style={{ width: `${100 / tile}%`, paddingHorizontal: 4 }}>
                  <StatTile label={s.label} value={s.value} tone="brand" />
                </View>
              ))}
            </View>
          )}

          <View style={styles.links}>
            <ListRow title="Schools" subtitle="Manage schools and lock/unlock" onPress={() => navigation.navigate("More", { screen: "Schools" })} chevron />
            <ListRow title="Subscriptions" subtitle="Subscription status by school" onPress={() => navigation.navigate("More", { screen: "Subscriptions" })} chevron />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: 48,
    alignItems: "center",
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
    marginHorizontal: -4,
    rowGap: 12,
  },
  links: {
    gap: 10,
  },
});
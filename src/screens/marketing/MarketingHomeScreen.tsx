import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { StatTile } from "../../components/StatTile";
import { Card } from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import { getMarketingDashboard } from "../../api/marketing.api";
import type { MarketingDashboard } from "../../types/marketing";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

export function MarketingHomeScreen() {
  const { session } = useAuth();
  const [dashboard, setDashboard] = useState<MarketingDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.type !== "marketing") return;
    getMarketingDashboard(session.executive.id)
      .then(setDashboard)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [session]);

  if (!session || session.type !== "marketing") return null;

  return (
    <Screen scroll={!isLoading}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand600} />
        </View>
      ) : (
        <>
          <Text style={styles.greeting}>Hi, {session.executive.name.split(" ")[0]}</Text>
          <Text style={styles.subtitle}>This month's target vs. achieved</Text>
          {error && <Text style={styles.error}>{error}</Text>}

          {dashboard && (
            <View style={styles.grid}>
              {(["visits", "leads", "admissions", "revenue"] as const).map((key) => {
                const achieved = dashboard.achieved[key];
                const target = dashboard.target[key];
                const label = key.charAt(0).toUpperCase() + key.slice(1);
                const value = key === "revenue" ? `₹${achieved.toLocaleString("en-IN")}` : achieved;
                return (
                  <Card key={key} style={styles.card}>
                    <Text style={styles.cardLabel}>{label}</Text>
                    <Text style={styles.cardValue}>
                      {value} <Text style={styles.cardTarget}>/ {key === "revenue" ? `₹${target.toLocaleString("en-IN")}` : target}</Text>
                    </Text>
                    <Text style={styles.cardCompletion}>{dashboard.completion[key]} of target</Text>
                  </Card>
                );
              })}
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
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: 2,
    marginBottom: 4,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.inkFaint,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 4,
  },
  cardTarget: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.inkFaint,
  },
  cardCompletion: {
    fontSize: 12,
    color: colors.brand600,
    marginTop: 4,
  },
});

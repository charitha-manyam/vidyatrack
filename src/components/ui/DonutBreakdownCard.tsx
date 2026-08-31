import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

export interface SliceDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutBreakdownCardProps {
  title: string;
  description?: string;
  data: SliceDatum[];
}

// Web uses a recharts donut (PieChartCard). Without an SVG renderer on
// native this renders the same data as a proportional segmented bar with
// the same legend — same card chrome, same colors.
export function DonutBreakdownCard({ title, description, data }: DonutBreakdownCardProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {total === 0 ? (
        <Text style={styles.empty}>No data yet</Text>
      ) : (
        <>
          <View style={styles.track}>
            {data.map((d) =>
              d.value > 0 ? (
                <View key={d.label} style={{ flex: d.value / total, backgroundColor: d.color, height: 12 }} />
              ) : null
            )}
          </View>
          <View style={styles.legend}>
            {data.map((d) => (
              <View key={d.label} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: d.color }]} />
                <Text style={styles.legendText}>
                  {d.label} · {d.value}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  description: {
    marginTop: 2,
    fontSize: 11,
    color: colors.inkGhost,
  },
  empty: {
    marginTop: 16,
    fontSize: 13,
    color: colors.inkGhost,
    textAlign: "center",
  },
  track: {
    flexDirection: "row",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 16,
    gap: 2,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.chartAxis,
  },
});

import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartCardProps {
  title: string;
  description?: string;
  data: BarDatum[];
  color?: string;
  height?: number;
}

// Pure-View stand-in for the web's recharts BarChartCard — same card chrome,
// same vertical bars with rounded tops and dashed gridline feel.
export function BarChartCard({ title, description, data, color = colors.brand600, height = 200 }: BarChartCardProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={[styles.chart, { height }]}>
        {[0.25, 0.5, 0.75].map((f) => (
          <View key={f} style={[styles.gridLine, { bottom: `${f * 100}%` }]} />
        ))}
        {data.map((d) => (
          <View key={d.label} style={styles.col}>
            <Text style={styles.valueLabel}>{d.value}</Text>
            <View
              style={[
                styles.bar,
                { height: `${Math.max(2, (d.value / max) * 78)}%`, backgroundColor: d.value > 0 ? color : colors.line },
              ]}
            />
            <Text style={styles.label} numberOfLines={2}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>
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
  chart: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderTopColor: colors.chartGrid,
  },
  col: {
    alignItems: "center",
    justifyContent: "flex-end",
    width: 64,
    height: "100%",
  },
  bar: {
    width: 36,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.inkSoft,
    marginBottom: 4,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    color: colors.chartAxis,
    textAlign: "center",
  },
});

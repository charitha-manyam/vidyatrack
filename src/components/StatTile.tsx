import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface StatTileProps {
  label: string;
  value: string | number;
  tone?: "brand" | "success" | "warning" | "danger" | "neutral";
}

const toneColor: Record<NonNullable<StatTileProps["tone"]>, string> = {
  brand: colors.brand600,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  neutral: colors.ink,
};

export function StatTile({ label, value, tone = "neutral" }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, { color: toneColor[tone] }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    flexBasis: 0,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
  },
  label: {
    fontSize: 12,
    color: colors.inkFaint,
  },
});

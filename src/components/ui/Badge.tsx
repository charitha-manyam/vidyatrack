import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

export type BadgeTone = "gray" | "green" | "amber" | "red" | "brand";

const TONE_BG: Record<BadgeTone, string> = {
  gray: colors.surfaceMuted,
  green: "#dcfce7",
  amber: "#fef3c7",
  red: "#fee2e2",
  brand: colors.brand100,
};

const TONE_FG: Record<BadgeTone, string> = {
  gray: colors.inkSoft,
  green: "#15803d",
  amber: "#b45309",
  red: "#b91c1c",
  brand: colors.brand700,
};

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <View style={[styles.badge, { backgroundColor: TONE_BG[tone] }]}>
      <Text style={[styles.text, { color: TONE_FG[tone] }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: "500",
  },
});

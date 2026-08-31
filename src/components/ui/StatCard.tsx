import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

export type StatTone = "brand" | "green" | "amber" | "red" | "gray";

const TONE_BG: Record<StatTone, string> = {
  brand: colors.brand50,
  green: "#f0fdf4",
  amber: "#fffbeb",
  red: "#fef2f2",
  gray: colors.surfaceMuted,
};

const TONE_FG: Record<StatTone, string> = {
  brand: colors.brand600,
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
  gray: colors.inkFaint,
};

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: keyof typeof Feather.glyphMap;
  tone?: StatTone;
  onPress?: () => void;
}

export function StatCard({ label, value, sublabel, icon, tone = "gray", onPress }: StatCardProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      {...(onPress ? { onPress: onPress as () => void } : null)}
      style={({ pressed }) => [styles.card, onPress && pressed && styles.pressed]}
    >
      <View style={[styles.iconBox, { backgroundColor: TONE_BG[tone] }]}>
        <Feather name={icon} size={20} color={TONE_FG[tone]} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={styles.sublabel} numberOfLines={1}>
            {sublabel}
          </Text>
        ) : null}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexBasis: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
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
  pressed: {
    opacity: 0.85,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flexShrink: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.ink,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.inkSoft,
  },
  sublabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.inkGhost,
  },
});

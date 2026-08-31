import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Badge, type BadgeTone } from "./ui/Badge";
import { colors } from "../theme/colors";

interface ListRowProps {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
  onPress?: () => void;
  onLongPress?: () => void;
  chevron?: boolean;
}

const toneToBadge: Record<NonNullable<ListRowProps["tone"]>, BadgeTone> = {
  neutral: "gray",
  success: "green",
  warning: "amber",
  danger: "red",
  brand: "brand",
};

export function ListRow({ title, subtitle, meta, tone = "neutral", onPress, onLongPress, chevron }: ListRowProps) {
  const Wrapper = onPress || onLongPress ? Pressable : View;
  return (
    <Wrapper
      {...(onPress ? { onPress: onPress as () => void } : null)}
      {...(onLongPress ? { onLongPress: onLongPress as () => void } : null)}
      style={({ pressed }) => [styles.row, (onPress || onLongPress) && pressed && styles.pressed]}
    >
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {meta ? <Badge tone={toneToBadge[tone]}>{meta}</Badge> : null}
      {chevron && onPress ? <Feather name="chevron-right" size={18} color={colors.inkGhost} /> : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  pressed: {
    backgroundColor: colors.surfaceHover,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkFaint,
  },
});

import { StyleSheet, Text, Pressable, UIManager, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator } from "react-native";
import { colors } from "../theme/colors";

// expo-linear-gradient is a native module — if the installed app binary was
// built before it was added, rendering <LinearGradient> would warn ("Unable
// to get the view config…") and render nothing. Detect the native view and
// fall back to a solid brand fill until the next native rebuild.
const hasNativeGradient = Boolean(
  typeof UIManager.getViewManagerConfig === "function"
    ? UIManager.getViewManagerConfig("ExpoLinearGradient")
    : (UIManager as unknown as { ExpoLinearGradient?: unknown }).ExpoLinearGradient
);

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

// Mirrors admin-portal's ui/Button: primary = the 103.9deg brand gradient,
// secondary = white with gray border, plus danger/ghost variants.
export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  isLoading,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const primaryContent = (
    <>
      {isLoading ? <ActivityIndicator color={colors.white} size="small" /> : null}
      <Text style={[styles.text, styles.textPrimary, textStyle]}>{title}</Text>
    </>
  );

  if (variant === "primary") {
    const fill = hasNativeGradient ? (
      <LinearGradient
        style={styles.gradient}
        start={{ x: 0, y: 0.15 }}
        end={{ x: 1, y: 0.85 }}
        colors={[colors.gradientStart, colors.gradientEnd]}
      >
        {primaryContent}
      </LinearGradient>
    ) : (
      <View style={[styles.gradient, styles.gradientFallback]}>{primaryContent}</View>
    );

    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [styles.base, pressed && !isDisabled && styles.pressed, style]}>
        {fill}
      </Pressable>
    );
  }

  const variantStyle =
    variant === "secondary"
      ? styles.secondary
      : variant === "danger"
        ? styles.danger
        : styles.ghost;

  const variantText =
    variant === "secondary"
      ? styles.textSecondary
      : variant === "danger"
        ? styles.textDanger
        : styles.textGhost;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        (pressed || isDisabled) && styles.pressed,
        style,
      ]}
    >
      {isLoading ? <ActivityIndicator color={colors.inkSoft} size="small" /> : null}
      <Text style={[styles.text, variantText, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    overflow: "hidden",
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  gradientFallback: {
    backgroundColor: colors.gradientStart,
  },
  pressed: {
    opacity: 0.85,
  },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  danger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.danger,
  },
  ghost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
  },
  textPrimary: {
    color: colors.white,
  },
  textSecondary: {
    color: colors.ink,
  },
  textDanger: {
    color: colors.white,
  },
  textGhost: {
    color: colors.inkSoft,
  },
});

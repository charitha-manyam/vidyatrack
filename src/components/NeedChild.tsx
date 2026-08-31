import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

// Empty-state shown by child-scoped parent screens when no child has been
// selected yet (mirrors the web parent-portal's "select a child" guard).
export function NeedChild() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>No child selected</Text>
      <Text style={styles.body}>Add or select a child from the home screen to see their records.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  body: {
    fontSize: 13,
    color: colors.inkFaint,
    textAlign: "center",
  },
});

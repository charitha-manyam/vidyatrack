import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useActiveChild } from "../../context/ChildContext";
import { colors } from "../../theme/colors";

// Mirrors the web parent-portal's ChildSwitcher: a pill row shown at the top
// of every parent screen, but ONLY when the parent has 2+ children linked.
// Tapping a pill switches the active child everywhere at once (the active
// child lives in ChildContext shared across all tabs).
export function ParentChildSwitcher() {
  const { children, activeChild, setActiveChildId } = useActiveChild();
  if (children.length < 2) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.wrap}
    >
      {children.map((child) => {
        const active = child.id === activeChild?.id;
        return (
          <Pressable
            key={child.id}
            onPress={() => setActiveChildId(child.id)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Feather name="user" size={13} color={active ? colors.brand700 : colors.inkSoft} />
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {child.name.split(" ")[0]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 0,
  },
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillActive: {
    borderColor: colors.brand200,
    backgroundColor: colors.brand50,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.inkSoft,
  },
  pillTextActive: {
    color: colors.brand700,
  },
});
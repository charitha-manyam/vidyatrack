import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { PermissionGate } from "../../components/PermissionGate";
import { MODULES } from "../../config/rbac";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<FeesStackParamList, "FeesMenu">;

// Mirrors the admin-portal Fees sidebar — the Fees tab becomes a hub of the
// eight fee sub-modules instead of dropping straight into Pending fees.
const MENU: { route: keyof FeesStackParamList; title: string; subtitle: string; icon: string }[] = [
  { route: "FeeHeads", title: "Fee Heads", subtitle: "Define fee types", icon: "tag" },
  { route: "FeeStructures", title: "Fee Structures", subtitle: "Amount, due date & billing cycle", icon: "layers" },
  { route: "FeeAssignments", title: "Student Fee Assignments", subtitle: "Assign structures to students", icon: "users" },
  { route: "Concessions", title: "Concessions", subtitle: "Discounts & waivers", icon: "percent" },
  { route: "FeePayments", title: "Fee Payments", subtitle: "Record and track payments", icon: "credit-card" },
  { route: "FeePaymentLinks", title: "Fee Payment Links", subtitle: "Generate shareable payment links", icon: "link" },
  { route: "StudentFeeSummary", title: "Student Fee Summary", subtitle: "Outstanding balance per student", icon: "bar-chart-2" },
  { route: "PendingFees", title: "Pending Fees", subtitle: "Review dues across the school", icon: "alert-circle" },
];

export function FeesMenuScreen({ navigation }: Props) {
  return (
    <PermissionGate module={MODULES.FEES} action="read">
      <Screen>
        <View style={styles.container}>
          <Text style={styles.title}>Fees</Text>
          <Text style={styles.subtitle}>Manage fee heads, structures, payments and student dues.</Text>

          <View style={styles.list}>
            {MENU.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => navigation.navigate(item.route as never)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Card style={styles.menuCard}>
                  <View style={styles.iconWrap}>
                    <Feather name={item.icon as never} size={18} color={colors.brand700} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.inkGhost} />
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      </Screen>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink },
  subtitle: { fontSize: 13, lineHeight: 19, color: colors.inkFaint },
  list: { gap: 10 },
  pressed: { opacity: 0.8 },
  menuCard: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { flex: 1, gap: 2 },
  menuTitle: { fontSize: 15, fontWeight: "600", color: colors.ink },
  menuSubtitle: { fontSize: 12, color: colors.inkFaint },
});
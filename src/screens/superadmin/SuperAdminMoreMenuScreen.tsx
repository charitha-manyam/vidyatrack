import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { ListRow } from "../../components/ListRow";
import { PageHeader } from "../../components/ui/PageHeader";
import type { SuperAdminMoreStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<SuperAdminMoreStackParamList, "SuperAdminMoreMenu">;

export function SuperAdminMoreMenuScreen({ navigation }: Props) {
  return (
    <Screen>
      <PageHeader title="Platform controls" description="Schools, subscriptions, and billing." />
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Platform</Text>
        <ListRow title="Schools" subtitle="Manage schools and lock/unlock" chevron onPress={() => navigation.navigate("Schools")} />
        <ListRow title="Subscriptions" subtitle="Subscription status by school" chevron onPress={() => navigation.navigate("Subscriptions")} />
      </View>
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Billing</Text>
        <ListRow title="Billing plans" subtitle="Manual billing records" chevron onPress={() => navigation.navigate("BillingPlans")} />
        <ListRow title="Subscription payments" subtitle="Razorpay & manual payment ledger" chevron onPress={() => navigation.navigate("SubscriptionPayments")} />
        <ListRow title="Promo codes" subtitle="Discount codes" chevron onPress={() => navigation.navigate("PromoCodes")} />
        <ListRow title="Pricing plans" subtitle="Fixed seeded plans" chevron onPress={() => navigation.navigate("PricingPlans")} />
      </View>
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Account</Text>
        <ListRow title="Profile" subtitle="Account and sign out" chevron onPress={() => navigation.navigate("Profile")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.inkFaint,
    marginBottom: 2,
  },
});
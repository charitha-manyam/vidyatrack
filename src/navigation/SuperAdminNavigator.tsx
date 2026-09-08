import { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { SuperAdminMoreStackParamList, SuperAdminTabParamList } from "./types";
import { SuperAdminHomeScreen } from "../screens/superadmin/SuperAdminHomeScreen";
import { SuperAdminMoreMenuScreen } from "../screens/superadmin/SuperAdminMoreMenuScreen";
import { SchoolsScreen } from "../screens/superadmin/SchoolsScreen";
import { SubscriptionsScreen } from "../screens/superadmin/SubscriptionsScreen";
import { BillingPlansScreen } from "../screens/superadmin/BillingPlansScreen";
import { SubscriptionPaymentsScreen } from "../screens/superadmin/SubscriptionPaymentsScreen";
import { PromoCodesScreen } from "../screens/superadmin/PromoCodesScreen";
import { PricingPlansScreen } from "../screens/superadmin/PricingPlansScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator<SuperAdminTabParamList>();
const Stack = createNativeStackNavigator<SuperAdminMoreStackParamList>();

function SuperAdminMoreStack() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      const state = navigation.getState();
      const moreRoute = state?.routes.find((r) => r.name === "More");
      const nested = moreRoute?.state;
      if (nested && nested.type === "stack" && typeof nested.index === "number" && nested.index > 0) {
        navigation.dispatch({
          ...CommonActions.reset({ index: 0, routes: [{ name: "SuperAdminMoreMenu" }] }),
          target: nested.key,
        });
      }
    });
    return unsub;
  }, [navigation]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SuperAdminMoreMenu">
      <Stack.Screen name="SuperAdminMoreMenu" component={SuperAdminMoreMenuScreen} />
      <Stack.Screen name="Schools" component={SchoolsScreen} options={{ headerShown: true, title: "Schools" }} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} options={{ headerShown: true, title: "Subscriptions" }} />
      <Stack.Screen name="BillingPlans" component={BillingPlansScreen} options={{ headerShown: true, title: "Billing plans" }} />
      <Stack.Screen name="SubscriptionPayments" component={SubscriptionPaymentsScreen} options={{ headerShown: true, title: "Payments" }} />
      <Stack.Screen name="PromoCodes" component={PromoCodesScreen} options={{ headerShown: true, title: "Promo codes" }} />
      <Stack.Screen name="PricingPlans" component={PricingPlansScreen} options={{ headerShown: true, title: "Pricing plans" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: "Profile" }} />
    </Stack.Navigator>
  );
}

// Mirrors the web super-admin portal: Dashboard + a grouped "More" menu
// (Schools, Subscriptions, Billing, ...), instead of the old 2-tab
// Home/Profile split.
export function SuperAdminNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.brand600 }}>
      <Tab.Screen
        name="Dashboard"
        component={SuperAdminHomeScreen}
        options={{ tabBarLabel: "Dashboard", tabBarIcon: ({ color, size }) => <Feather name="grid" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="More"
        component={SuperAdminMoreStack}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="menu" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
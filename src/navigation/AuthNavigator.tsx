import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";
import { RoleSelectScreen } from "../screens/auth/RoleSelectScreen";
import { SchoolLoginScreen } from "../screens/auth/SchoolLoginScreen";
import { SchoolOtpScreen } from "../screens/auth/SchoolOtpScreen";
import { MarketingLoginScreen } from "../screens/auth/MarketingLoginScreen";
import { SuperAdminLoginScreen } from "../screens/auth/SuperAdminLoginScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="SchoolLogin" component={SchoolLoginScreen} options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="SchoolOtp" component={SchoolOtpScreen} options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="MarketingLogin" component={MarketingLoginScreen} options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="SuperAdminLogin" component={SuperAdminLoginScreen} options={{ headerShown: true, title: "" }} />
    </Stack.Navigator>
  );
}

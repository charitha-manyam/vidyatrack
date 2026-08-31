import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { AuthNavigator } from "./AuthNavigator";
import { StaffNavigator } from "./StaffNavigator";
import { ParentNavigator } from "./ParentNavigator";
import { MarketingNavigator } from "./MarketingNavigator";
import { SuperAdminNavigator } from "./SuperAdminNavigator";
import { colors } from "../theme/colors";

// The whole point of this app: one login, and everything past it branches
// on session.type. No separate app per usertype — just a separate stack.
export function RootNavigator() {
  const { session, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.brand600} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session ? (
        <AuthNavigator />
      ) : session.type === "staff" ? (
        <StaffNavigator />
      ) : session.type === "parent" ? (
        <ParentNavigator />
      ) : session.type === "marketing" ? (
        <MarketingNavigator />
      ) : (
        <SuperAdminNavigator />
      )}
    </NavigationContainer>
  );
}

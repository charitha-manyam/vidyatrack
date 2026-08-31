import { StyleSheet, Text, View, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "RoleSelect">;

const ROLES: { title: string; subtitle: string; screen: keyof AuthStackParamList }[] = [
  { title: "School", subtitle: "Staff or parent sign-in", screen: "SchoolLogin" },
  { title: "Marketing rep", subtitle: "Field sales sign-in", screen: "MarketingLogin" },
  { title: "Platform", subtitle: "Super admin sign-in", screen: "SuperAdminLogin" },
];

// The single entry point every user type shares — "based on the login,
// after usertype" starts here: pick how you sign in, and everything past
// this point (the actual login form, then the home screen and tabs) is
// chosen by what the backend says you are.
export function RoleSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>V</Text>
      </View>
      <Text style={styles.title}>VidyaTrack</Text>
      <Text style={styles.subtitle}>One record. Three rooms. Every school day.</Text>

      <View style={styles.roles}>
        {ROLES.map((role) => (
          <Pressable
            key={role.screen}
            style={({ pressed }) => [styles.roleCard, pressed && styles.roleCardPressed]}
            onPress={() => navigation.navigate(role.screen as any)}
          >
            <Text style={styles.roleTitle}>{role.title}</Text>
            <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.brand600,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  brandMarkText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "800",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 14,
    color: colors.inkFaint,
    marginBottom: 24,
    textAlign: "center",
  },
  roles: {
    width: "100%",
    gap: 12,
  },
  roleCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 18,
  },
  roleCardPressed: {
    backgroundColor: colors.paperRaised,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  roleSubtitle: {
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: 2,
  },
});

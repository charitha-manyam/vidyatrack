import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "RoleSelect">;

// One sign-in for everyone: the same school-code + OTP flow serves staff,
// parents, and school admins. The backend resolves which portal the user
// belongs to (RBAC) after the code is verified — no role pickers at login.
export function RoleSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Image source={require("../../../assets/android-icon-foreground.png")} style={styles.brandLogo} resizeMode="contain" />
        </View>
        <Text style={styles.appName}>VidyaTrack</Text>
        <Text style={styles.tagline}>Every school day, one record.</Text>
        <View style={styles.chips}>
          {["Staff", "Parents", "School admins"].map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.loginCard, pressed && styles.loginCardPressed]}
        onPress={() => navigation.navigate("SchoolLogin")}
      >
        <View style={styles.loginIcon}>
          <Feather name="log-in" size={20} color={colors.brand600} />
        </View>
        <View style={styles.loginText}>
          <Text style={styles.loginTitle}>School sign-in</Text>
          <Text style={styles.loginSubtitle}>School code · email or phone</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.inkGhost} />
      </Pressable>

      <Text style={styles.hint}>One-time code sent by email or SMS.</Text>
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
  },
  brand: {
    alignItems: "center",
    marginBottom: 40,
  },
  brandMark: {
    width: 76,
    height: 76,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 14,
  },
  brandLogo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "transparent",
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 14,
    color: colors.inkFaint,
    marginTop: 4,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.inkSoft,
  },
  loginCard: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  loginCardPressed: {
    backgroundColor: colors.paperRaised,
  },
  loginIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.brand100,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    flex: 1,
  },
  loginTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  loginSubtitle: {
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: 2,
  },
  hint: {
    marginTop: 18,
    fontSize: 12,
    color: colors.inkFaint,
    textAlign: "center",
  },
});
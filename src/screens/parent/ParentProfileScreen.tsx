import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { useActiveChild } from "../../context/ChildContext";
import { colors } from "../../theme/colors";

// Parent-only profile, mirroring the web parent-portal's ProfilePage: avatar
// + identity card with phone/email, then the linked children list, then
// logout. Rendered from the More stack (inside ChildProvider), so it never
// needs the shared ProfileScreen's session-type branching.
export function ParentProfileScreen() {
  const { session, logout } = useAuth();
  const { children } = useActiveChild();
  const navigation = useNavigation();
  const hasNativeHeader = navigation.canGoBack();
  if (!session || session.type !== "parent") return null;

  const parent = session.parent;
  const name = session.name ?? parent?.father_name ?? "Parent";
  const phone = parent?.father_phone ?? parent?.mother_phone ?? null;
  const email = parent?.father_email ?? parent?.mother_email ?? null;

  return (
    <Screen topInset={!hasNativeHeader}>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Feather name="user" size={22} color={colors.brand600} />
          </View>
          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>Parent</Text>
          </View>
        </View>
        <View style={styles.contact}>
          {phone ? (
            <View style={styles.contactRow}>
              <Feather name="phone" size={14} color={colors.inkGhost} />
              <Text style={styles.contactText}>{phone}</Text>
            </View>
          ) : null}
          {email ? (
            <View style={styles.contactRow}>
              <Feather name="mail" size={14} color={colors.inkGhost} />
              <Text style={styles.contactText}>{email}</Text>
            </View>
          ) : null}
          <View style={styles.contactRow}>
            <Feather name="grid" size={14} color={colors.inkGhost} />
            <Text style={styles.contactText}>School code: {session.schoolcode}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Linked children</Text>
        {children.length === 0 ? (
          <Text style={styles.empty}>No children linked to your account.</Text>
        ) : (
          children.map((c) => (
            <Text key={c.id} style={styles.childRow}>
              {c.name}
              {c.className ? `  ·  ${c.className}${c.sectionName ? ` ${c.sectionName}` : ""}` : ""}
            </Text>
          ))
        )}
      </Card>

      <Button title="Log out" variant="secondary" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
  },
  card: {
    gap: 10,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand50,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  role: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  contact: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    flex: 1,
    fontSize: 13,
    color: colors.inkSoft,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  empty: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  childRow: {
    fontSize: 13,
    color: colors.inkSoft,
  },
});
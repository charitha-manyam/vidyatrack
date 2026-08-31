import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

// One Profile screen shared by every usertype's tab navigator — the actual
// identity fields shown just branch on session.type, same pattern as
// everywhere else in this app.
export function ProfileScreen() {
  const { session, logout } = useAuth();
  if (!session) return null;

  const rows: { label: string; value: string }[] = (() => {
    switch (session.type) {
      case "staff":
        return [
          { label: "Name", value: session.name ?? "—" },
          { label: "Role", value: session.role?.name ?? session.userType },
          { label: "School code", value: session.schoolcode },
        ];
      case "parent":
        return [
          { label: "Name", value: session.name ?? "—" },
          { label: "School code", value: session.schoolcode },
        ];
      case "marketing":
        return [
          { label: "Name", value: session.executive.name },
          { label: "Phone", value: session.executive.phone },
          { label: "Role", value: session.executive.role ?? "Marketing" },
        ];
      case "superadmin":
        return [
          { label: "Email", value: session.email },
          { label: "Role", value: session.role },
        ];
    }
  })();

  return (
    <Screen>
      <Text style={styles.title}>Profile</Text>
      <Card style={styles.card}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
});

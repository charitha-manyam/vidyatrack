import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { hasPermission, type Action } from "../config/rbac";
import type { Permission, Session } from "../types/auth";
import { colors } from "../theme/colors";

// Staff sessions carry the tenant permission array; other session types have
// no tenant RBAC and are never rendered inside the staff area.
export function staffPermissions(session: Session | null): Permission[] {
  return session && session.type === "staff" ? session.permissions : [];
}

interface RequireProps {
  module: string | string[];
  action: Action;
  children: React.ReactNode;
}

// Element-level RBAC gate — mirrors admin-portal's RequirePermission route
// guard. An array means "allowed if the user has this action on ANY of these
// modules". Renders the access-denied panel instead of the children.
export function PermissionGate({ module, action, children }: RequireProps) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const modules = Array.isArray(module) ? module : [module];
  const allowed = modules.some((m) => hasPermission(permissions, m, action));

  if (!allowed) {
    return <AccessDeniedContent />;
  }
  return <>{children}</>;
}

export function AccessDeniedContent() {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconChip}>
        <Feather name="lock" size={22} color={colors.brand600} />
      </View>
      <Text style={styles.title}>Access denied</Text>
      <Text style={styles.body}>
        You don&apos;t have permission to view this page. Ask your school admin to grant you access from Roles &amp;
        Permissions.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand50,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkFaint,
    textAlign: "center",
  },
});

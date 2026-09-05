import { StyleSheet, Text, View } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { ListRow } from "../../components/ListRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { getVisibleNavGroups, resolveMobileDestination, type NavItem } from "../../config/rbac";
import { colors } from "../../theme/colors";
import type { MoreStackParamList, StaffTabParamList } from "../../navigation/types";

type Props = CompositeScreenProps<
  NativeStackScreenProps<MoreStackParamList, "MoreMenu">,
  BottomTabScreenProps<StaffTabParamList>
>;

// The admin-portal sidebar, rebuilt for mobile: every nav group filtered by
// the session's tenant permissions (getVisibleNavGroups), rendered as
// sections of tappable rows. Same modules, same grouping, same gating.
export function MoreMenuScreen({ navigation }: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const staffSession = session?.type === "staff" ? session : null;
  const groups = getVisibleNavGroups(permissions);

  function openItem(item: NavItem) {
    const dest = resolveMobileDestination(item.path);
    switch (dest.kind) {
      case "studentsList":
        navigation.navigate("Students", { screen: "StudentsList" });
        break;
      case "classesList":
        navigation.navigate("Classes", { screen: "ClassesList" });
        break;
      case "fees":
        navigation.navigate("Fees", { screen: dest.screen });
        break;
      case "more":
        if (dest.screen === "ModulePlaceholder") {
          navigation.navigate("ModulePlaceholder", { title: item.label });
        } else {
          navigation.navigate(dest.screen);
        }
        break;
      case "resource":
        navigation.navigate("ResourceList", { resourceId: dest.resourceId });
        break;
      case "placeholder":
        navigation.navigate("ModulePlaceholder", { title: item.label });
        break;
    }
  }

  return (
    <Screen>
      <PageHeader
        title="Admin modules"
        description="Everything in your school, filtered by your role."
        actions={staffSession?.role?.name ? <Badge tone="brand">{staffSession.role.name}</Badge> : null}
      />

      {groups.map((group) => (
        <View key={group.slug} style={styles.group}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          <View style={styles.rows}>
            {group.items.map((item) => (
              <ListRow key={item.path} title={item.label} chevron onPress={() => openItem(item)} />
            ))}
          </View>
        </View>
      ))}

      {groups.length === 0 ? (
        <Text style={styles.empty}>No modules have been enabled for your role.</Text>
      ) : null}

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Account</Text>
        <View style={styles.rows}>
          <ListRow title="Profile" subtitle="Your account & logout" chevron onPress={() => navigation.navigate("Profile")} />
        </View>
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
    fontWeight: "700",
    color: colors.inkGhost,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  rows: {
    gap: 8,
  },
  empty: {
    fontSize: 14,
    color: colors.inkFaint,
    textAlign: "center",
    paddingVertical: 24,
  },
});

import { useCallback, useLayoutEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { DataState } from "../../components/DataState";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { getVehicleAssignments, removeVehicleAssignment } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { VehicleAssignment } from "../../types/transport";

type Props = NativeStackScreenProps<MoreStackParamList, "VehicleAssignments">;

export function VehicleAssignmentsScreen({ navigation }: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canDelete = hasPermission(permissions, MODULES.TRANSPORT, "delete");

  const [items, setItems] = useState<VehicleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getVehicleAssignments());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useLayoutEffect(() => {
    if (hasPermission(permissions, MODULES.TRANSPORT, "create")) {
      navigation.setOptions({
        headerRight: () => (
          <Button title="Assign" variant="secondary" onPress={() => navigation.navigate("VehicleAssignmentForm", undefined)} style={styles.headerBtn} />
        ),
      });
    }
  }, [permissions, navigation]);

  function confirmRemove(item: VehicleAssignment) {
    Alert.alert("Remove assignment?", `${item.vehicle?.vehicle_number ?? "Vehicle"} will be unassigned from ${item.route?.name ?? "its route"}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeVehicleAssignment(item.vehicleId);
            load();
          } catch (err) {
            Alert.alert("Remove failed", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  return (
    <PermissionGate module={MODULES.TRANSPORT} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <Text style={styles.pageTitle}>Vehicle Assignments</Text>
          <Text style={styles.description}>Assign a vehicle and its driver to a route — one vehicle per route.</Text>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={items.length === 0 ? "No assignments yet — tap Assign." : null}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.vehicle?.vehicle_number ?? "Vehicle"}
                    </Text>
                    {canDelete ? (
                      <Button title="Remove" variant="danger" onPress={() => confirmRemove(item)} style={styles.smallBtn} />
                    ) : null}
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Route</Text>
                    <Text style={styles.infoValue}>{item.route?.name ?? "—"}</Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Driver</Text>
                    <Text style={styles.infoValue}>{item.driver?.name ?? "—"}</Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Driver phone</Text>
                    <Text style={styles.infoValue}>{item.driver?.phone ?? "—"}</Text>
                  </View>
                </Card>
              ))}
            </View>
          </DataState>
        </View>
      </Screen>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: colors.ink, marginBottom: 4 },
  description: { fontSize: 13, lineHeight: 19, color: colors.inkFaint, marginBottom: 12 },
  headerBtn: { marginRight: 8 },
  list: { gap: 10 },
  card: { padding: 14, gap: 6 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: "600", color: colors.ink, flex: 1 },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  infoLabel: { fontSize: 13, color: colors.inkSoft },
  infoValue: { fontSize: 13, fontWeight: "600", color: colors.ink },
  smallBtn: { paddingVertical: 4, paddingHorizontal: 12 },
});
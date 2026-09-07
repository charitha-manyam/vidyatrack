import { useCallback, useLayoutEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { deleteVehicle, getVehicles } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { Vehicle, VehicleStatus } from "../../types/transport";

type Props = NativeStackScreenProps<MoreStackParamList, "Vehicles">;

function statusTone(status: VehicleStatus): BadgeTone {
  if (status === "active") return "green";
  if (status === "maintenance") return "amber";
  return "gray";
}

export function VehiclesScreen({ navigation }: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.TRANSPORT, "update");
  const canDelete = hasPermission(permissions, MODULES.TRANSPORT, "delete");

  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getVehicles());
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
    if (canWrite) {
      navigation.setOptions({
        headerRight: () => (
          <Button title="+ Add" variant="secondary" onPress={() => navigation.navigate("VehicleForm", undefined)} style={styles.headerBtn} />
        ),
      });
    }
  }, [canWrite, navigation]);

  function confirmDelete(item: Vehicle) {
    Alert.alert("Delete vehicle?", `${item.vehicle_number} will be removed. It cannot be deleted while assigned to a route.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteVehicle(item.id);
            load();
          } catch (err) {
            Alert.alert("Delete failed", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  return (
    <PermissionGate module={MODULES.TRANSPORT} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <Text style={styles.pageTitle}>Vehicles</Text>
          <Text style={styles.description}>The fleet of buses/vans available to assign to routes and drivers.</Text>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={items.length === 0 ? "No vehicles yet — tap Add." : null}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.vehicle_number}
                    </Text>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Type</Text>
                    <Text style={styles.infoValue}>{item.vehicle_type || "—"}</Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Capacity</Text>
                    <Text style={styles.infoValue}>{item.capacity != null ? `${item.capacity} seats` : "—"}</Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Route</Text>
                    <Text style={styles.infoValue}>{item.assignment?.route?.name ?? "Unassigned"}</Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Driver</Text>
                    <Text style={styles.infoValue}>{item.assignment?.driver?.name ?? "—"}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Button
                      title="Edit"
                      variant="secondary"
                      onPress={() => navigation.navigate("VehicleForm", { vehicleId: item.id })}
                      style={styles.smallBtn}
                    />
                    {canDelete ? (
                      <Button title="Delete" variant="danger" onPress={() => confirmDelete(item)} style={styles.smallBtn} />
                    ) : null}
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.ink, flex: 1 },
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
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  smallBtn: { flexGrow: 1, paddingVertical: 6 },
});
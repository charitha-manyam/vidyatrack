import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PermissionGate } from "../../components/PermissionGate";
import { MODULES } from "../../config/rbac";
import { getAllVehicleLocations } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { FleetVehicleLocation } from "../../types/transport";

type Props = NativeStackScreenProps<MoreStackParamList, "LiveTracking">;

// Backend uses polling, not sockets — the admin portal refreshes every 15s,
// matching the school-bus use case. Port the same cadence here.
const POLL_MS = 15000;

function timeAgo(iso?: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (!isFinite(ms)) return "never";
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

function statusTone(item: FleetVehicleLocation): BadgeTone {
  return item.is_trip_active ? "green" : "gray";
}

export function LiveTrackingScreen(_: Props) {
  const [items, setItems] = useState<FleetVehicleLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await getAllVehicleLocations());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const onTrip = items.filter((i) => i.is_trip_active).length;

  return (
    <PermissionGate module={MODULES.TRANSPORT} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <Text style={styles.pageTitle}>Live Tracking</Text>
          {!loading && !error ? (
            <View style={styles.badgeRow}>
              <Badge tone={onTrip > 0 ? "green" : "gray"}>{onTrip} on a trip now</Badge>
              <Text style={styles.refreshNote}>Auto-refreshes every 15s</Text>
            </View>
          ) : null}
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={items.length === 0 ? "No vehicle locations yet — drivers broadcast when a trip starts." : null}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.vehicleId} style={styles.card}>
                  <View style={styles.header}>
                    <Text style={styles.vehicleNumber} numberOfLines={1}>
                      {item.vehicle_number}
                    </Text>
                    <Badge tone={statusTone(item)}>
                      {item.is_trip_active ? `Live · ${timeAgo(item.recorded_at)}` : item.recorded_at ? `Last seen ${timeAgo(item.recorded_at)}` : "No location yet"}
                    </Badge>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Route</Text>
                    <Text style={styles.infoValue}>{item.routeName ?? "—"}</Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Driver</Text>
                    <Text style={styles.infoValue}>{item.driverName ?? "—"}</Text>
                  </View>
                  {item.latitude != null && item.longitude != null ? (
                    <Text style={styles.coords}>
                      {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                    </Text>
                  ) : null}
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
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  refreshNote: { fontSize: 12, color: colors.inkFaint },
  list: { gap: 10 },
  card: { padding: 14, gap: 6 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  vehicleNumber: { fontSize: 15, fontWeight: "600", color: colors.ink, flex: 1 },
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
  coords: { fontSize: 12, color: colors.inkFaint },
});
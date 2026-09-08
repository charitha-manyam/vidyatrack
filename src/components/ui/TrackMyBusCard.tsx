import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LiveBusMap } from "./LiveBusMap";
import { Badge } from "./Badge";
import { useActiveChild } from "../../context/ChildContext";
import { getChildVehicleLocation } from "../../api/parent.api";
import { colors } from "../../theme/colors";
import type { ChildVehicleLocation } from "../../types/parent";

type Props = {
  onPress: () => void;
};

// Compact live-bus summary for the parent dashboard. Polls the same
// vehicle-location endpoint as the full Track the bus screen (15s cadence
// matches the web portal's TrackingPage). The map only renders while the
// trip is actually live.
export function TrackMyBusCard({ onPress }: Props) {
  const { activeChild } = useActiveChild();
  const [data, setData] = useState<ChildVehicleLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(true);

  const load = useCallback(
    async (silent = false) => {
      if (!activeChild) {
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const res = await getChildVehicleLocation(activeChild.id);
        if (activeRef.current) setData(res);
      } catch {
        // Keep whatever we last had — the dashboard card shouldn't hard-fail.
      } finally {
        if (activeRef.current) setLoading(false);
      }
    },
    [activeChild]
  );

  useFocusEffect(
    useCallback(() => {
      activeRef.current = true;
      load();
      timerRef.current = setInterval(() => {
        load(true);
      }, 15000);
      return () => {
        activeRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [load])
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const active =
    !!data?.hasTransportAssignment &&
    !!data.is_trip_active &&
    data.latitude != null &&
    data.longitude != null;

  const childLabel = activeChild
    ? `${activeChild.name}${
        activeChild.className ? ` · ${activeChild.className}${activeChild.sectionName ? ` ${activeChild.sectionName}` : ""}` : ""
      }`
    : "";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={styles.iconWrap}>
            <Feather name="map-pin" size={13} color="#3525cd" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Track my bus</Text>
            {childLabel ? <Text style={styles.childSub}>{childLabel}</Text> : null}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <Text style={styles.autoNote}>Updates automatically every 15 seconds.</Text>

      {loading && !data ? (
        <Text style={styles.muted}>Checking bus location…</Text>
      ) : !data || !data.hasTransportAssignment ? (
        <Text style={styles.muted}>{data?.message ?? "No bus assigned yet."}</Text>
      ) : active ? (
        <>
          <View style={styles.mapWrap}>
            <LiveBusMap
              latitude={data.latitude!}
              longitude={data.longitude!}
              title={data.vehicle_number}
              description={data.routeName ?? undefined}
            />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.vehicle}>{data.vehicle_number}</Text>
            <Badge tone="green">On the way</Badge>
          </View>
        </>
      ) : (
        <>
          <View style={styles.metaRow}>
            <Text style={styles.vehicle}>{data.vehicle_number ?? "No vehicle"}</Text>
            <Badge tone="gray">Trip not active right now</Badge>
          </View>
          {data.routeName ? <Text style={styles.meta}>Route: {data.routeName}</Text> : null}
          {data.driverName ? <Text style={styles.meta}>Driver: {data.driverName}</Text> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  childSub: {
    fontSize: 12,
    color: "#6b7280",
  },
  autoNote: {
    fontSize: 12,
    color: "#9ca3af",
  },
  chevron: {
    fontSize: 22,
    color: "#9ca3af",
    fontWeight: "300",
  },
  muted: {
    fontSize: 13,
    color: "#9ca3af",
  },
  mapWrap: {
    height: 140,
    borderRadius: 8,
    overflow: "hidden",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  vehicle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  meta: {
    fontSize: 13,
    color: "#6b7280",
  },
});
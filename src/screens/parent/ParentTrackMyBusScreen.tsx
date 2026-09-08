import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { Badge } from "../../components/ui/Badge";
import { LiveBusMap } from "../../components/ui/LiveBusMap";
import { NeedChild } from "../../components/NeedChild";
import { useActiveChild } from "../../context/ChildContext";
import { getChildVehicleLocation } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { ChildVehicleLocation } from "../../types/parent";

function timeAgo(iso: string | null | undefined) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Polled every 15s (no WebSocket layer on the backend) — same cadence as the
// admin-portal's fleet map and the web parent portal's TrackingPage, so both
// sides see a driver's ping within one interval of each other.
export function ParentTrackMyBusScreen() {
  const { activeChild } = useActiveChild();
  const [data, setData] = useState<ChildVehicleLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(true);

  const load = useCallback(
    async (silent = false) => {
      if (!activeChild) {
        setLoading(false);
        return;
      }
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await getChildVehicleLocation(activeChild.id);
        if (activeRef.current) setData(res);
      } catch (err) {
        if (activeRef.current && !silent) setError(getErrorMessage(err));
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

  if (!activeChild) return <NeedChild />;

  const childLabel = `${activeChild.name}${
    activeChild.className ? ` · ${activeChild.className}${activeChild.sectionName ? ` ${activeChild.sectionName}` : ""}` : ""
  }`;

  const active =
    data?.hasTransportAssignment &&
    data.is_trip_active != null &&
    data.latitude != null &&
    data.longitude != null;

  function handleCallDriver() {
    if (!data?.driverPhone) return;
    Linking.openURL(`tel:${data.driverPhone}`).catch(() =>
      Alert.alert("Could not place call", "Dial your driver directly.")
    );
  }

  return (
    <Screen topInset={false} scroll={false}>
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text style={styles.childLabel}>{childLabel}</Text>
          <Text style={styles.autoNote}>Updates automatically every 15 seconds.</Text>
        </View>
        <DataState
          loading={loading}
          error={error}
          retry={() => load()}
          empty={data?.hasTransportAssignment === false && loading === false ? null : undefined}
        >
          {data && !data.hasTransportAssignment ? (
            <View style={styles.emptyWrap}>
              <Feather name="map-pin" size={32} color={colors.inkGhost} />
              <Text style={styles.emptyTitle}>No bus assigned</Text>
              <Text style={styles.emptyBody}>{data.message ?? "This student isn't on a transport route."}</Text>
            </View>
          ) : data && !active ? (
            <View style={styles.infoCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.vehicle}>{data.vehicle_number ?? "No vehicle"}</Text>
                <Badge tone="gray">Trip not active right now</Badge>
              </View>
              {data.routeName ? <Text style={styles.meta}>Route: {data.routeName}</Text> : null}
              {data.driverName ? <Text style={styles.meta}>Driver: {data.driverName}</Text> : null}
            </View>
          ) : (
            data && active ? (
              <View style={styles.container}>
                <LiveBusMap
                  style={styles.map}
                  latitude={data.latitude!}
                  longitude={data.longitude!}
                  title={data.vehicle_number}
                  description={data.routeName ?? undefined}
                />
                <View style={styles.infoRow}>
                  <View style={styles.textCol}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.vehicle}>{data.vehicle_number}</Text>
                      <Badge tone="green">On the way</Badge>
                    </View>
                    <Text style={styles.meta}>
                      {data.routeName ?? "—"} · Driver {data.driverName ?? "—"}
                      {data.recorded_at ? ` · ${timeAgo(data.recorded_at)}` : ""}
                    </Text>
                  </View>
                  {data.driverPhone ? (
                    <Pressable onPress={handleCallDriver} style={({ pressed }) => [styles.callBtn, pressed && styles.pressed]}>
                      <Feather name="phone" size={18} color={colors.inkSoft} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null
          )}
        </DataState>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  titleBlock: {
    marginBottom: 2,
  },
  childLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  autoNote: {
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: 2,
  },
  emptyWrap: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.inkFaint,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 16,
    gap: 6,
  },
  container: {
    flex: 1,
    gap: 12,
  },
  map: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    minHeight: 320,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 16,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  vehicle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  meta: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
});

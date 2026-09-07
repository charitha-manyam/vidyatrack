import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { getStudentsByRoute, getTransportRoutes, removeStudentTransport } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { RouteStudent, TransportRoute } from "../../types/transport";

type Props = NativeStackScreenProps<MoreStackParamList, "StudentTransport">;

export function StudentTransportScreen({ navigation }: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canDelete = hasPermission(permissions, MODULES.TRANSPORT, "delete");

  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [studentsByRoute, setStudentsByRoute] = useState<Record<string, RouteStudent[]>>({});
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const fetchStudents = useCallback(async (routeId: string) => {
    setLoadingRoute(routeId);
    setRouteError(null);
    try {
      const students = await getStudentsByRoute(routeId);
      setStudentsByRoute((prev) => ({ ...prev, [routeId]: students }));
    } catch (err) {
      setRouteError(getErrorMessage(err));
    } finally {
      setLoadingRoute(null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const routeList = await getTransportRoutes();
      setRoutes(routeList);
      setStudentsByRoute((prev) => {
        const next: Record<string, RouteStudent[]> = {};
        for (const r of routeList) if (prev[r.id]) next[r.id] = prev[r.id];
        return next;
      });
      setRouteError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whatever route is open after coming back from adding/removing a
  // student so the accordion reflects the assignment immediately.
  useEffect(() => {
    if (expandedId) {
      fetchStudents(expandedId).catch(() => {});
    }
  }, [expandedId, fetchStudents]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useLayoutEffect(() => {
    if (hasPermission(permissions, MODULES.TRANSPORT, "create")) {
      navigation.setOptions({
        headerRight: () => (
          <Button title="Assign" variant="secondary" onPress={() => navigation.navigate("StudentAssignForm", undefined)} style={styles.headerBtn} />
        ),
      });
    }
  }, [permissions, navigation]);

  async function toggleRoute(route: TransportRoute) {
    if (expandedId === route.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(route.id);
  }

  async function confirmRemove(studentId: string, studentName: string, routeId: string) {
    Alert.alert("Remove from route?", `${studentName} will no longer be assigned to this route.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeStudentTransport(studentId);
            setStudentsByRoute((prev) => ({
              ...prev,
              [routeId]: (prev[routeId] ?? []).filter((s) => s.studentId !== studentId),
            }));
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
          <Text style={styles.pageTitle}>Student Transport</Text>
          <Text style={styles.description}>Assign students to routes. A student can only have one route — assigning again replaces it.</Text>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={routes.length === 0 ? "No transport routes yet — add one first." : null}
          >
            <View style={styles.list}>
              {routes.map((route) => {
                const students = studentsByRoute[route.id] ?? [];
                const expanded = expandedId === route.id;
                return (
                  <Card key={route.id} style={styles.card}>
                    <Pressable style={styles.routeHeader} onPress={() => toggleRoute(route)}>
                      <View style={styles.routeInfo}>
                        <Text style={styles.routeName} numberOfLines={1}>
                          {route.name}
                        </Text>
                        <Badge tone="brand">{route.assignedStudentCount ?? students.length} students</Badge>
                      </View>
                      <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.inkGhost} />
                    </Pressable>

                    {expanded ? (
                      <View style={styles.students}>
                        {loadingRoute === route.id ? <DataState loading /> : null}
                        {routeError && loadingRoute !== route.id ? <Text style={styles.error}>{routeError}</Text> : null}
                        {!loadingRoute && !routeError && students.length === 0 ? (
                          <Text style={styles.smallHint}>No students assigned to this route.</Text>
                        ) : null}
                        {students.map((s) => (
                          <View key={s.studentTransportId ?? s.studentId} style={styles.studentRow}>
                            <Text style={styles.studentName} numberOfLines={1}>
                              {s.studentName ?? "Student"}
                              {s.rollNumber ? `  ·  ${s.rollNumber}` : ""}
                            </Text>
                            {canDelete ? (
                              <Pressable hitSlop={10} onPress={() => confirmRemove(s.studentId, s.studentName ?? "Student", route.id)}>
                                <Feather name="user-x" size={16} color={colors.danger} />
                              </Pressable>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </Card>
                );
              })}
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
  card: { padding: 12, gap: 8 },
  routeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  routeInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  routeName: { fontSize: 15, fontWeight: "600", color: colors.ink, flexShrink: 1 },
  students: { gap: 6 },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  studentName: { fontSize: 13, color: colors.ink, flex: 1 },
  smallHint: { fontSize: 12, color: colors.inkFaint },
  error: { fontSize: 13, color: colors.danger },
});
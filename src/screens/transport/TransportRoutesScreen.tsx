import { useCallback, useLayoutEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { deleteTransportRoute, getTransportRoutes } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { TransportRoute } from "../../types/transport";

type Props = NativeStackScreenProps<MoreStackParamList, "TransportRoutes">;

function feeValue(v?: number | null): string {
  if (v == null) return "—";
  return `Rs ${Number(v).toLocaleString("en-IN")}`;
}

export function TransportRoutesScreen({ navigation }: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.TRANSPORT, "update");
  const canDelete = hasPermission(permissions, MODULES.TRANSPORT, "delete");

  const [items, setItems] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getTransportRoutes());
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
          <Button title="+ Add" variant="secondary" onPress={() => navigation.navigate("TransportRouteForm", undefined)} style={styles.headerBtn} />
        ),
      });
    }
  }, [canWrite, navigation]);

  function confirmDelete(item: TransportRoute) {
    Alert.alert("Delete route?", `"${item.name}" will be removed. Students still assigned to it block deletion.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTransportRoute(item.id);
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
          <Text style={styles.pageTitle}>Transport Routes</Text>
          <Text style={styles.description}>Routes/slabs students can be assigned to, each with a fixed monthly or annual fee.</Text>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={items.length === 0 ? "No transport routes yet — tap Add." : null}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.assignedStudentCount != null && item.assignedStudentCount > 0 ? (
                      <Badge tone="brand">
                        {item.assignedStudentCount} assigned
                      </Badge>
                    ) : null}
                  </View>
                  {item.fromkm != null || item.tokm != null ? (
                    <Text style={styles.cardSubtitle}>
                      Distance: {item.fromkm != null ? `${item.fromkm} km` : "?"} – {item.tokm != null ? `${item.tokm} km` : "?"}
                    </Text>
                  ) : null}
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Monthly fee</Text>
                    <Text style={styles.feeValue}>{feeValue(item.monthlyfee)}</Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Annual fee</Text>
                    <Text style={styles.feeValue}>{feeValue(item.annuallyfee)}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Button
                      title="Edit"
                      variant="secondary"
                      onPress={() => navigation.navigate("TransportRouteForm", { routeId: item.id })}
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
  cardSubtitle: { fontSize: 13, color: colors.inkFaint, lineHeight: 18 },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  feeLabel: { fontSize: 13, color: colors.inkSoft },
  feeValue: { fontSize: 13, fontWeight: "600", color: colors.ink },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  smallBtn: { flexGrow: 1, paddingVertical: 6 },
});
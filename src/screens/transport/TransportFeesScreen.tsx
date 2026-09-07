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
import { deleteTransportFee, getTransportFees } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { TransportFee } from "../../types/transport";

type Props = NativeStackScreenProps<MoreStackParamList, "TransportFees">;

function feeValue(v?: number | null): string {
  if (v == null) return "—";
  return `Rs ${Number(v).toLocaleString("en-IN")}`;
}

export function TransportFeesScreen({ navigation }: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.TRANSPORT_FEES, "update");
  const canDelete = hasPermission(permissions, MODULES.TRANSPORT_FEES, "delete");
  const academicYearId = session?.type === "staff" ? session.academicYear?.id : undefined;

  const [items, setItems] = useState<TransportFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getTransportFees(academicYearId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [academicYearId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useLayoutEffect(() => {
    if (canWrite) {
      navigation.setOptions({
        headerRight: () => (
          <Button title="+ Add" variant="secondary" onPress={() => navigation.navigate("TransportFeeForm", undefined)} style={styles.headerBtn} />
        ),
      });
    }
  }, [canWrite, navigation]);

  function confirmDelete(item: TransportFee) {
    Alert.alert("Delete transport fee?", `For ${item.studentName ?? "student"} — ${item.feeHeadName ?? "transport fee"}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTransportFee(item.id);
            load();
          } catch (err) {
            Alert.alert("Delete failed", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  return (
    <PermissionGate module={MODULES.TRANSPORT_FEES} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <Text style={styles.pageTitle}>Transport Fees</Text>
          <Text style={styles.description}>Per-student transport fee records, normally derived from the student's assigned route.</Text>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={items.length === 0 ? "No transport fee records yet — tap Add." : null}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.studentName ?? "Student"}
                    </Text>
                    <Text style={styles.classLine}>
                      {[item.className, item.sectionName].filter(Boolean).join(" · ") || "—"}
                    </Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Fee head</Text>
                    <Text style={styles.infoValue}>{item.feeHeadName ?? "Transport"}</Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Route</Text>
                    <Text style={styles.infoValue}>{item.slab_name || "—"}</Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Monthly fee</Text>
                    <Text style={styles.infoValue}>{feeValue(item.monthly_fee)}</Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={styles.infoLabel}>Annual fee</Text>
                    <Text style={styles.infoValue}>{feeValue(item.annual_fee)}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Button
                      title="Edit"
                      variant="secondary"
                      onPress={() => navigation.navigate("TransportFeeForm", { transportFeeId: item.id })}
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  title: { fontSize: 15, fontWeight: "600", color: colors.ink, flex: 1 },
  classLine: { fontSize: 13, color: colors.inkSoft },
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
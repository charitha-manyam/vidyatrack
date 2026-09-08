import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { Badge } from "../../components/ui/Badge";
import { NeedChild } from "../../components/NeedChild";
import { useActiveChild } from "../../context/ChildContext";
import { downloadPaymentReceipt, getChildPayments } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { PaymentHistoryItem } from "../../types/parent";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function ParentPaymentHistoryScreen() {
  const { activeChild } = useActiveChild();
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeChild) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPayments(await getChildPayments(activeChild.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeChild]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!activeChild) return <NeedChild />;

  async function handleDownload(payment: PaymentHistoryItem) {
    setDownloadingId(payment.id);
    try {
      await downloadPaymentReceipt(payment);
    } catch (err) {
      Alert.alert("Download failed", getErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Screen topInset={false} scroll={false}>
      <DataState
        loading={loading}
        error={error}
        retry={load}
        empty={payments.length === 0 ? "No payments recorded yet." : null}
      >
        <FlatList
          data={payments}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.row}>
                <View style={styles.textCol}>
                  <View style={styles.titleRow}>
                    <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                    <Badge tone={item.type === "online" ? "green" : "gray"}>
                      {item.type === "online" ? "Online" : "At school"}
                    </Badge>
                  </View>
                  <Text style={styles.meta}>
                    {item.payment_mode} · Receipt {item.receipt_no} · {item.payment_date}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDownload(item)}
                  disabled={downloadingId === item.id}
                  style={({ pressed }) => [styles.download, (pressed || downloadingId === item.id) && styles.downloadPressed]}
                >
                  <Feather
                    name={downloadingId === item.id ? "loader" : "download"}
                    size={18}
                    color={downloadingId === item.id ? colors.inkGhost : colors.inkSoft}
                  />
                </Pressable>
              </View>
            </View>
          )}
        />
      </DataState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
    gap: 10,
  },
  item: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  meta: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  download: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadPressed: {
    opacity: 0.6,
  },
});

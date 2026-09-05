import { useCallback, useLayoutEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { DateInput } from "../../components/DateInput";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { InlineSelect } from "../../components/InlineSelect";
import { StudentPicker } from "../../components/StudentPicker";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { useSelectOptions } from "../../hooks/useSelectOptions";
import {
  createFeePayment,
  deleteFeePayment,
  getFeePayments,
  updateFeePayment,
} from "../../api/fees.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";
import type { FeePayment } from "../../types/fees";
import { PAYMENT_MODE_OPTIONS } from "../../types/fees";

// ---------------- List ----------------
type ListProps = NativeStackScreenProps<FeesStackParamList, "FeePayments">;

export function FeePaymentsScreen({ navigation }: ListProps) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");

  const [items, setItems] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getFeePayments());
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
          <Button
            title="+ Add"
            variant="secondary"
            onPress={() => navigation.navigate("FeePaymentForm", undefined)}
            style={styles.headerBtn}
          />
        ),
      });
    }
  }, [canWrite, navigation]);

  function confirmDelete(item: FeePayment) {
    Alert.alert("Delete payment record?", `Rs ${item.amount} from ${item.studentName ?? ""} will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFeePayment(item.id);
            load();
          } catch (err) {
            Alert.alert("Delete failed", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  return (
    <PermissionGate module={MODULES.FEES} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <Text style={styles.pageTitle}>Fee Payments</Text>
          <Text style={styles.description}>Recorded collections against student fees.</Text>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={items.length === 0 ? "No payment records yet — tap Add." : null}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.studentName ?? "Student"}
                    </Text>
                    <Badge tone="brand">{item.payment_mode ?? "counter"}</Badge>
                  </View>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {[item.className, item.sectionName].filter(Boolean).join(" - ") || "Class —"}
                    {" · "}
                    {item.payment_date ?? item.createdAt?.slice(0, 10) ?? "—"}
                  </Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Paid</Text>
                    <Text style={styles.infoValue}>Rs {Number(item.amount || 0).toLocaleString("en-IN")}</Text>
                  </View>
                  {item.receipt_no ? (
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      Receipt {item.receipt_no}
                      {item.transaction_id ? ` · Txn ${item.transaction_id}` : ""}
                    </Text>
                  ) : null}
                  <View style={styles.cardActions}>
                    <Button
                      title="Edit"
                      variant="secondary"
                      onPress={() => navigation.navigate("FeePaymentForm", { paymentId: item.id })}
                      style={styles.smallBtn}
                    />
                    {canWrite ? (
                      <Button
                        title="Delete"
                        variant="danger"
                        onPress={() => confirmDelete(item)}
                        style={styles.smallBtn}
                      />
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

// ---------------- Form ----------------
type FormProps = NativeStackScreenProps<FeesStackParamList, "FeePaymentForm">;

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FeePaymentFormScreen({ navigation, route }: FormProps) {
  const editing = Boolean(route.params?.paymentId);
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");
  const { options } = useSelectOptions(["classes", "sections", "students"]);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [paymentMode, setPaymentMode] = useState("counter");
  const [amount, setAmount] = useState("");
  const [topay, setTopay] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [loadingEdit, setLoadingEdit] = useState(editing);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!route.params?.paymentId) return;
    try {
      const all = await getFeePayments();
      const p = all.find((x) => x.id === route.params!.paymentId);
      if (p) {
        setClassId(p.class_id ?? "");
        setSectionId(p.section_id ?? "");
        setStudentId(p.studentId ?? p.student_id ?? "");
        setPaymentMode(p.payment_mode || "counter");
        setAmount(p.amount != null ? String(p.amount) : "");
        setTopay(p.topay != null ? String(p.topay) : "");
        setReceiptNo(p.receipt_no ?? "");
        setTransactionId(p.transaction_id ?? "");
        setPaymentDate((p.payment_date ?? "").slice(0, 10) || todayISO());
      }
    } catch (err) {
      Alert.alert("Could not load payment", getErrorMessage(err));
    } finally {
      setLoadingEdit(false);
    }
  }, [route.params?.paymentId]);

  useFocusEffect(
    useCallback(() => {
      if (editing) loadExisting();
    }, [editing, loadExisting])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editing ? "Edit payment" : "Record payment",
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [editing, navigation]);

  async function handleSubmit() {
    if (!studentId) return setFieldError("Select a student.");
    const amt = Number(amount || 0);
    if (!isFinite(amt) || amt <= 0) return setFieldError("Amount must be greater than 0.");
    if (!classId || !sectionId) return setFieldError("Select the class and section.");
    setFieldError(null);
    setIsSubmitting(true);
    const values = {
      class_id: classId,
      section_id: sectionId,
      student_id: studentId,
      payment_mode: paymentMode,
      amount: amt,
      topay: Number(topay || 0),
      receipt_no: receiptNo.trim() || undefined,
      transaction_id: transactionId.trim() || undefined,
      payment_date: paymentDate,
    };
    try {
      if (editing) {
        await updateFeePayment(route.params!.paymentId!, values);
      } else {
        await createFeePayment(values);
      }
      Alert.alert(editing ? "Payment updated" : "Payment recorded", undefined, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Save failed", getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingEdit) return <DataState loading />;

  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <StudentPicker
            options={options}
            classId={classId}
            onClassChange={setClassId}
            sectionId={sectionId}
            onSectionChange={setSectionId}
            studentId={studentId}
            onStudentChange={setStudentId}
          />
          <InlineSelect
            label="Payment mode"
            value={paymentMode}
            options={PAYMENT_MODE_OPTIONS}
            onSelect={setPaymentMode}
          />
          <Input label="Amount (Rs)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          <Input label="To pay (Rs, instalment)" value={topay} onChangeText={setTopay} keyboardType="numeric" />
          <Input label="Receipt no." value={receiptNo} onChangeText={setReceiptNo} />
          <Input label="Transaction ID" value={transactionId} onChangeText={setTransactionId} />
          <DateInput label="Payment date" value={paymentDate} onChangeDate={setPaymentDate} />
          {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}
          <View style={styles.footer}>
            <Button
              title={editing ? "Save changes" : "Record payment"}
              onPress={handleSubmit}
              isLoading={isSubmitting}
              disabled={!canWrite}
            />
          </View>
        </ScrollView>
      </View>
    </Screen>
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  infoLabel: { fontSize: 13, color: colors.inkSoft },
  infoValue: { fontSize: 13, fontWeight: "600", color: colors.ink },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  smallBtn: { flexGrow: 1, paddingVertical: 6 },
  form: { gap: 14, paddingBottom: 32 },
  error: { fontSize: 13, color: colors.danger },
  footer: { marginTop: 4 },
});
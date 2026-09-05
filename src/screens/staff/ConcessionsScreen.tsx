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
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { useSelectOptions } from "../../hooks/useSelectOptions";
import {
  createConcession,
  deleteConcession,
  getConcessions,
  getFeeStructures,
  updateConcession,
} from "../../api/fees.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";
import type { Concession, FeeStructure } from "../../types/fees";
import { CONCESSION_TYPE_OPTIONS, DISCOUNT_TYPE_OPTIONS } from "../../types/fees";

// ---------------- List ----------------
type ListProps = NativeStackScreenProps<FeesStackParamList, "Concessions">;

export function ConcessionsScreen({ navigation }: ListProps) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");

  const [items, setItems] = useState<Concession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getConcessions());
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
            onPress={() => navigation.navigate("ConcessionForm", undefined)}
            style={styles.headerBtn}
          />
        ),
      });
    }
  }, [canWrite, navigation]);

  function confirmDelete(item: Concession) {
    Alert.alert("Delete concession?", `Rs ${item.discountAmount} off ${item.feeHeadName ?? ""} for ${item.studentName ?? ""} will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteConcession(item.id);
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
          <Text style={styles.pageTitle}>Concessions</Text>
          <Text style={styles.description}>Discounts and waivers applied to student fees.</Text>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={items.length === 0 ? "No concessions yet — tap Add." : null}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.studentName ?? "Student"}
                    </Text>
                    <Badge tone="amber">- Rs {Number(item.discountAmount || 0).toLocaleString("en-IN")}</Badge>
                  </View>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {item.feeHeadName ?? "Fee"}
                    {" · "}
                    {item.concessionType ?? item.discountType ?? "Concession"}
                  </Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                      Original Rs {Number(item.totalAmount || 0).toLocaleString("en-IN")}
                    </Text>
                    <Text style={styles.infoValue}>Pay Rs {Number(item.finalAmount || 0).toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Button
                      title="Edit"
                      variant="secondary"
                      onPress={() => navigation.navigate("ConcessionForm", { concessionId: item.id })}
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
type FormProps = NativeStackScreenProps<FeesStackParamList, "ConcessionForm">;

export function ConcessionFormScreen({ navigation, route }: FormProps) {
  const editing = Boolean(route.params?.concessionId);
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");
  const { options } = useSelectOptions(["students"]);

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [editingMeta, setEditingMeta] = useState<{ studentName?: string; feeHeadName?: string } | null>(null);
  const structureOptions: SelectOption[] = structures.map((s) => ({
    value: s.id,
    label: `${s.feeName ?? "Fee"}${s.className ? ` - ${s.className}${s.sectionName ? `-${s.sectionName}` : ""}` : ""} (Rs ${s.amount})`,
  }));

  const [studentId, setStudentId] = useState("");
  const [feeStructureId, setFeeStructureId] = useState("");
  const [concessionType, setConcessionType] = useState("PERCENTAGE_OF_FEE");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [reason, setReason] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(editing);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStructures = useCallback(async () => {
    try {
      setStructures(await getFeeStructures());
    } catch {
      setStructures([]);
    }
  }, []);

  const loadExisting = useCallback(async () => {
    if (!route.params?.concessionId) return;
    try {
      const all = await getConcessions();
      const c = all.find((x) => x.id === route.params!.concessionId);
      if (c) {
        setStudentId(c.studentId ?? "");
        setFeeStructureId(c.feeStructureId ?? "");
        setConcessionType(c.concessionType || "PERCENTAGE_OF_FEE");
        setDiscountType(c.discountType || "PERCENTAGE");
        setDiscountValue(c.discountValue != null ? String(c.discountValue) : "");
        setReason(c.reason ?? "");
        setEffectiveFrom((c.effectiveFrom ?? "").slice(0, 10));
        setEffectiveUntil((c.effectiveUntil ?? "").slice(0, 10));
        setEditingMeta({ studentName: c.studentName, feeHeadName: c.feeHeadName });
      }
    } catch (err) {
      Alert.alert("Could not load concession", getErrorMessage(err));
    } finally {
      setLoadingEdit(false);
    }
  }, [route.params?.concessionId]);

  useFocusEffect(
    useCallback(() => {
      loadStructures();
    }, [loadStructures])
  );

  useFocusEffect(
    useCallback(() => {
      if (editing) loadExisting();
    }, [editing, loadExisting])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editing ? "Edit concession" : "Add concession",
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [editing, navigation]);

  async function handleSubmit() {
    if (!editing && !studentId) return setFieldError("Select a student.");
    if (!feeStructureId) return setFieldError("Select a fee structure.");
    const value = Number(discountValue || 0);
    if (!isFinite(value) || value <= 0) return setFieldError("Discount value must be greater than 0.");
    setFieldError(null);
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateConcession(route.params!.concessionId!, {
          discountType,
          discountValue: value,
          reason: reason.trim() || undefined,
          effectiveFrom,
          effectiveUntil,
        });
      } else {
        await createConcession({
          feeStructureId,
          concessionType,
          discountType,
          discountValue: value,
          reason: reason.trim() || undefined,
          effectiveFrom,
          effectiveUntil,
        });
      }
      Alert.alert(editing ? "Concession updated" : "Concession created", undefined, [
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
          {editing ? (
            <View style={styles.metaCard}>
              <Text style={styles.metaTitle} numberOfLines={1}>
                {editingMeta?.studentName ?? "Student"}
              </Text>
              <Text style={styles.metaSubtitle} numberOfLines={1}>
                {editingMeta?.feeHeadName ?? "Fee"} · {concessionType.replace(/_/g, " ").toLowerCase()}
              </Text>
              <Text style={styles.smallHint}>
                Student, fee and type are locked on edit; adjust the discount value instead.
              </Text>
            </View>
          ) : (
            <>
              <InlineSelect
                label="Student"
                value={studentId}
                options={(options.students ?? []) as SelectOption[]}
                onSelect={setStudentId}
                placeholder="Select student"
              />
              <InlineSelect
                label="Fee structure"
                value={feeStructureId}
                options={structureOptions}
                onSelect={setFeeStructureId}
                placeholder="Select fee structure"
              />
              <InlineSelect
                label="Concession type"
                value={concessionType}
                options={CONCESSION_TYPE_OPTIONS}
                onSelect={setConcessionType}
              />
            </>
          )}
          <InlineSelect
            label="Discount type"
            value={discountType}
            options={DISCOUNT_TYPE_OPTIONS}
            onSelect={setDiscountType}
          />
          <Input
            label={discountType === "PERCENTAGE" ? "Discount (%)" : "Discount amount (Rs)"}
            value={discountValue}
            onChangeText={setDiscountValue}
            keyboardType="numeric"
          />
          <Input label="Reason" placeholder="Optional" value={reason} onChangeText={setReason} multiline />
          <DateInput label="Effective from" value={effectiveFrom} onChangeDate={setEffectiveFrom} />
          <DateInput label="Effective until" value={effectiveUntil} onChangeDate={setEffectiveUntil} />
          {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}
          <View style={styles.footer}>
            <Button
              title={editing ? "Save changes" : "Create concession"}
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
  infoLabel: { fontSize: 12, color: colors.inkSoft },
  infoValue: { fontSize: 13, fontWeight: "600", color: colors.ink },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  smallBtn: { flexGrow: 1, paddingVertical: 6 },
  form: { gap: 14, paddingBottom: 32 },
  metaCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  metaTitle: { fontSize: 15, fontWeight: "600", color: colors.ink },
  metaSubtitle: { fontSize: 13, color: colors.inkSoft },
  smallHint: { fontSize: 12, color: colors.inkFaint, lineHeight: 17 },
  error: { fontSize: 13, color: colors.danger },
  footer: { marginTop: 4 },
});
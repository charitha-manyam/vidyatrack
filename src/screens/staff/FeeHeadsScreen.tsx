import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { createFeeHead, deleteFeeHead, getFeeHeads, getFeeHeadById, updateFeeHead } from "../../api/fees.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";
import type { FeeHead } from "../../types/fees";

// ---------------- List ----------------
type ListProps = NativeStackScreenProps<FeesStackParamList, "FeeHeads">;

export function FeeHeadsScreen({ navigation }: ListProps) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");

  const [items, setItems] = useState<FeeHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getFeeHeads());
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
            onPress={() => navigation.navigate("FeeHeadForm", undefined)}
            style={styles.headerBtn}
          />
        ),
      });
    }
  }, [canWrite, navigation]);

  function confirmDelete(item: FeeHead) {
    Alert.alert("Delete fee head?", `"${item.feeName}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFeeHead(item.id);
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
          <Text style={styles.pageTitle}>Fee Heads</Text>
          <Text style={styles.description}>Fee types charged to students, e.g. tuition, transport.</Text>
          <DataState
            loading={loading}
            error={error}
            retry={load}
            empty={items.length === 0 ? "No fee heads yet — tap Add." : null}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.feeName}
                    </Text>
                    <Badge tone={item.status === "ACTIVE" ? "green" : "gray"}>
                      {item.status ?? "ACTIVE"}
                    </Badge>
                  </View>
                  {item.description ? (
                    <Text style={styles.cardSubtitle} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <View style={styles.cardActions}>
                    <Button
                      title="Edit"
                      variant="secondary"
                      onPress={() => navigation.navigate("FeeHeadForm", { feeHeadId: item.id })}
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
type FormProps = NativeStackScreenProps<FeesStackParamList, "FeeHeadForm">;

export function FeeHeadFormScreen({ navigation, route }: FormProps) {
  const editing = Boolean(route.params?.feeHeadId);
  const [feeName, setFeeName] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [description, setDescription] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(editing);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!route.params?.feeHeadId) return;
    try {
      const head = await getFeeHeadById(route.params.feeHeadId);
      if (head) {
        setFeeName(head.feeName ?? "");
        setDisplayOrder(head.displayOrder != null ? String(head.displayOrder) : "");
        setDescription(head.description ?? "");
      }
    } catch (err) {
      Alert.alert("Could not load fee head", getErrorMessage(err));
    } finally {
      setLoadingEdit(false);
    }
  }, [route.params?.feeHeadId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editing ? "Edit fee head" : "Add fee head",
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [editing, navigation]);

  useEffect(() => {
    if (editing) loadExisting();
  }, [editing, loadExisting]);

  async function handleSubmit() {
    if (!feeName.trim()) {
      setFieldError("Fee head name is required.");
      return;
    }
    setFieldError(null);
    setIsSubmitting(true);
    const values = {
      feeName: feeName.trim(),
      displayOrder: displayOrder.trim() || undefined,
      description: description.trim() || undefined,
    };
    try {
      if (editing) {
        await updateFeeHead(route.params!.feeHeadId!, values);
      } else {
        await createFeeHead(values);
      }
      Alert.alert(editing ? "Fee head updated" : "Fee head created", undefined, [
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
          <Input label="Fee head name" placeholder="e.g. Tuition fee" value={feeName} onChangeText={setFeeName} />
          <Input
            label="Display order"
            placeholder="Lower shows first"
            value={displayOrder}
            onChangeText={setDisplayOrder}
            keyboardType="numeric"
          />
          <Input
            label="Description"
            placeholder="Optional"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}
          <View style={styles.footer}>
            <Button title={editing ? "Save changes" : "Create fee head"} onPress={handleSubmit} isLoading={isSubmitting} disabled={!feeName.trim()} />
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
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  smallBtn: { flexGrow: 1, paddingVertical: 6 },
  form: { gap: 14, paddingBottom: 32 },
  error: { fontSize: 13, color: colors.danger },
  footer: { marginTop: 4 },
});
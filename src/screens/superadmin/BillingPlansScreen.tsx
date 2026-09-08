import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import {
  createBillingPlan,
  deleteBillingPlan,
  getAllBillingPlans,
  updateBillingPlan,
} from "../../api/superadminBilling.api";
import type { BillingPlan } from "../../types/billingPlan";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

type Draft = {
  School: string;
  Amount: string;
  PaymentDate: string;
  PaymentMode: string;
  Description?: string;
};

const EMPTY: Draft = { School: "", Amount: "", PaymentDate: "", PaymentMode: "", Description: "" };

export function BillingPlansScreen() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BillingPlan | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getAllBillingPlans()
      .then(setPlans)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY);
    setFormOpen(true);
  }

  function openEdit(plan: BillingPlan) {
    setEditing(plan);
    setDraft({
      School: plan.School,
      Amount: plan.Amount,
      PaymentDate: plan.PaymentDate,
      PaymentMode: plan.PaymentMode,
      Description: plan.Description ?? "",
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!draft.School.trim() || !draft.Amount.trim() || !draft.PaymentMode.trim()) {
      Alert.alert("Incomplete", "School, amount, and payment mode are required.");
      return;
    }
    setIsSaving(true);
    try {
      if (editing) {
        await updateBillingPlan(editing.id, draft);
      } else {
        await createBillingPlan(draft);
      }
      setFormOpen(false);
      reload();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(plan: BillingPlan) {
    Alert.alert("Delete record", `Delete the ${plan.School} payment of ₹${plan.Amount}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBillingPlan(plan.id)
            .then(reload)
            .catch((err) => Alert.alert("Error", getErrorMessage(err)));
        },
      },
    ]);
  }

  return (
    <Screen scroll={false}>
      <PageHeader
        title="Billing records"
        description="Manual billing log."
        actions={
          <Button title="Add" onPress={openCreate} />
        }
      />

      <DataState loading={isLoading} error={error} retry={reload} empty={isLoading ? null : "No billing records yet."}>
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListRow
              title={item.School}
              subtitle={`₹${item.Amount} · ${item.PaymentMode} · ${item.PaymentDate}`}
              meta={item.PaymentMode}
              tone="brand"
              onPress={() => openEdit(item)}
              onLongPress={() => confirmDelete(item)}
              chevron
            />
          )}
        />
      </DataState>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{editing ? "Edit billing record" : "Add billing record"}</Text>
            <Input label="School" value={draft.School} onChangeText={(t) => setDraft((d) => ({ ...d, School: t }))} />
            <Input label="Amount" value={draft.Amount} onChangeText={(t) => setDraft((d) => ({ ...d, Amount: t }))} />
            <Input label="Payment date" placeholder="YYYY-MM-DD" value={draft.PaymentDate} onChangeText={(t) => setDraft((d) => ({ ...d, PaymentDate: t }))} />
            <Input label="Payment mode" placeholder="UPI / NEFT / Cash ..." value={draft.PaymentMode} onChangeText={(t) => setDraft((d) => ({ ...d, PaymentMode: t }))} />
            <Input label="Description" value={draft.Description ?? ""} onChangeText={(t) => setDraft((d) => ({ ...d, Description: t }))} />
            <View style={styles.sheetActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setFormOpen(false)} />
              <Button title={editing ? "Save" : "Add"} onPress={handleSave} isLoading={isSaving} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 12,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
});
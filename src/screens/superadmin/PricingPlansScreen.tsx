import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { getPricingPlans, updatePricingPlan } from "../../api/superadminPricing.api";
import type { PricingPlan } from "../../types/pricingPlan";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

export function PricingPlansScreen() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PricingPlan | null>(null);
  const [draft, setDraft] = useState({ basePrice: "", discountPercent: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getPricingPlans()
      .then(setPlans)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function openEdit(plan: PricingPlan) {
    setEditing(plan);
    setDraft({ basePrice: String(plan.basePrice), discountPercent: String(plan.discountPercent) });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!editing) return;
    setIsSaving(true);
    try {
      await updatePricingPlan(editing.id, {
        basePrice: Number(draft.basePrice),
        discountPercent: Number(draft.discountPercent),
        isActive: editing.isActive,
      });
      setFormOpen(false);
      reload();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen scroll={false}>
      <PageHeader title="Pricing plans" description="Fixed, seeded plans — edit price, discount, or active state." />

      <DataState loading={isLoading} error={error} retry={reload} empty={isLoading ? null : "No pricing plans."}>
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`₹${(item.price ?? 0).toLocaleString("en-IN")} for ${item.durationMonths} month(s)`}
              meta={item.isActive ? "Active" : "Inactive"}
              tone={item.isActive ? "success" : "neutral"}
              onPress={() => openEdit(item)}
              chevron
            />
          )}
        />
      </DataState>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Edit {editing?.name}</Text>
            <Input label="Base price (₹)" keyboardType="numeric" value={draft.basePrice} onChangeText={(t) => setDraft((d) => ({ ...d, basePrice: t }))} />
            <Input label="Discount percent" keyboardType="numeric" value={draft.discountPercent} onChangeText={(t) => setDraft((d) => ({ ...d, discountPercent: t }))} />
            <View style={styles.sheetActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setFormOpen(false)} />
              <Button title="Save" onPress={handleSave} isLoading={isSaving} />
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
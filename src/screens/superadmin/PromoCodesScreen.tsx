import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { createPromoCode, deletePromoCode, getPromoCodes, updatePromoCode } from "../../api/superadminPromoCode.api";
import type { PromoCode, PromoCodeDiscountType } from "../../types/promoCode";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

type Draft = {
  code: string;
  description?: string;
  discountType: PromoCodeDiscountType;
  discountValue: string;
  maxRedemptions?: string;
  validUntil?: string;
};

const EMPTY: Draft = { code: "", description: "", discountType: "PERCENT", discountValue: "", maxRedemptions: "", validUntil: "" };

export function PromoCodesScreen() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getPromoCodes()
      .then(setCodes)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function toggleType() {
    setDraft((d) => ({ ...d, discountType: d.discountType === "PERCENT" ? "FLAT" : "PERCENT" }));
  }

  function openEdit(code: PromoCode) {
    setEditing(code);
    setDraft({
      code: code.code,
      description: code.description ?? "",
      discountType: code.discountType,
      discountValue: String(code.discountValue),
      maxRedemptions: code.maxRedemptions != null ? String(code.maxRedemptions) : "",
      validUntil: code.validUntil ?? "",
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!draft.code.trim() || !draft.discountValue) {
      Alert.alert("Incomplete", "Code and discount value are required.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        code: draft.code.trim(),
        description: draft.description || undefined,
        discountType: draft.discountType,
        discountValue: Number(draft.discountValue),
        maxRedemptions: draft.maxRedemptions ? Number(draft.maxRedemptions) : undefined,
        validUntil: draft.validUntil || undefined,
        isActive: true,
      };
      if (editing) {
        const { code: _code, ...rest } = payload;
        await updatePromoCode(editing.id, rest);
      } else {
        await createPromoCode(payload);
      }
      setFormOpen(false);
      reload();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(code: PromoCode) {
    Alert.alert("Delete code", `Delete ${code.code}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePromoCode(code.id)
            .then(reload)
            .catch((err) => Alert.alert("Error", getErrorMessage(err)));
        },
      },
    ]);
  }

  return (
    <Screen scroll={false}>
      <PageHeader
        title="Promo codes"
        description="Discount codes for school subscriptions."
        actions={<Button title="Add" onPress={() => { setEditing(null); setDraft(EMPTY); setFormOpen(true); }} />}
      />

      <DataState loading={isLoading} error={error} retry={reload} empty={isLoading ? null : "No promo codes yet."}>
        <FlatList
          data={codes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListRow
              title={item.code}
              subtitle={`${item.discountType === "PERCENT" ? `${item.discountValue}%` : `₹${item.discountValue}`} · ${item.redemptionsUsed}/${item.maxRedemptions ?? "∞"} used`}
              meta={item.isActive ? "Active" : "Inactive"}
              tone={item.isActive ? "success" : "neutral"}
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
            <Text style={styles.sheetTitle}>{editing ? "Edit promo code" : "Add promo code"}</Text>
            <Input label="Code" autoCapitalize="characters" value={draft.code} onChangeText={(t) => setDraft((d) => ({ ...d, code: t }))} />
            <Input label="Description" value={draft.description ?? ""} onChangeText={(t) => setDraft((d) => ({ ...d, description: t }))} />
            <Button
              title={`Type: ${draft.discountType === "PERCENT" ? "Percentage" : "Flat amount"} — tap to switch`}
              variant="secondary"
              onPress={toggleType}
            />
            <Input label={`Discount ${draft.discountType === "PERCENT" ? "(%)" : "(₹)"}`} keyboardType="numeric" value={draft.discountValue} onChangeText={(t) => setDraft((d) => ({ ...d, discountValue: t }))} />
            <Input label="Max redemptions" keyboardType="numeric" value={draft.maxRedemptions ?? ""} onChangeText={(t) => setDraft((d) => ({ ...d, maxRedemptions: t }))} />
            <Input label="Valid until" placeholder="YYYY-MM-DD" value={draft.validUntil ?? ""} onChangeText={(t) => setDraft((d) => ({ ...d, validUntil: t }))} />
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
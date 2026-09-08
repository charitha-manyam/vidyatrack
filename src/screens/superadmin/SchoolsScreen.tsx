import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { getAllSchoolDetails, deleteSchool, updateSchool } from "../../api/superadminSchool.api";
import type { School, SubscriptionStatus } from "../../types/schoolAdmin";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

type RowTone = "neutral" | "success" | "warning" | "danger" | "brand";

const statusTone: Record<SubscriptionStatus, RowTone> = {
  TRIAL: "brand",
  PENDING: "neutral",
  PAID: "success",
  DUE: "warning",
  OVERDUE: "danger",
  SUSPENDED: "danger",
  CANCELLED: "danger",
};

export function SchoolsScreen() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locking, setLocking] = useState<School | null>(null);
  const [reason, setReason] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getAllSchoolDetails()
      .then(setSchools)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function openLock(school: School) {
    setReason("");
    setLocking(school);
  }

  async function confirmLock() {
    if (!locking) return;
    setIsWorking(true);
    try {
      await updateSchool(locking.id, { is_active: false, locked_reason: reason.trim() || "Locked from app" });
      setLocking(null);
      reload();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setIsWorking(false);
    }
  }

  async function confirmUnlock(school: School) {
    setIsWorking(true);
    try {
      await updateSchool(school.id, { is_active: true, locked_reason: "" });
      reload();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setIsWorking(false);
    }
  }

  function confirmDelete(school: School) {
    Alert.alert("Delete school", `Delete ${school.school_name}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSchool(school.id)
            .then(reload)
            .catch((err) => Alert.alert("Error", getErrorMessage(err)));
        },
      },
    ]);
  }

  return (
    <Screen scroll={false}>
      <PageHeader title="Schools" description="Register, lock, and manage schools." />
      <DataState loading={isLoading} error={error} retry={reload} empty={isLoading ? null : "No schools yet."}>
        <FlatList
          data={schools}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.wrap}>
              <ListRow
                title={item.school_name}
                subtitle={`${item.school_code} · ${item.email}`}
                meta={item.subscription_status}
                tone={statusTone[item.subscription_status]}
                onPress={() => (item.is_active ? openLock(item) : confirmUnlock(item))}
                onLongPress={() => confirmDelete(item)}
                chevron={false}
              />
              {!item.is_active ? <Text style={styles.locked}>Locked — long-press row to delete</Text> : null}
            </View>
          )}
        />
      </DataState>

      <Modal visible={Boolean(locking)} transparent animationType="slide" onRequestClose={() => setLocking(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Lock {locking?.school_name}</Text>
            <Text style={styles.help}>Reason shown to the school on their login screen.</Text>
            <Input label="Lock reason" placeholder="e.g. Subscription overdue" value={reason} onChangeText={setReason} />
            <View style={styles.sheetActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setLocking(null)} />
              <Button title="Lock school" variant="danger" onPress={confirmLock} isLoading={isWorking} />
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
  wrap: {},
  locked: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
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
  },
  help: {
    fontSize: 13,
    color: colors.inkFaint,
    marginBottom: 12,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
});
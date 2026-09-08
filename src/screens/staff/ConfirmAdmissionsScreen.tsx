import { useCallback, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { DateInput } from "../../components/DateInput";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PageHeader } from "../../components/ui/PageHeader";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import {
  createConfirmAdmission,
  deleteConfirmAdmission,
  getConfirmAdmissions,
  updateConfirmAdmission,
} from "../../api/admission.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { ConfirmAdmission, ConfirmAdmissionFormValues } from "../../types/admission";
import type { MoreStackParamList, StaffTabParamList } from "../../navigation/types";

type Props = CompositeScreenProps<
  NativeStackScreenProps<MoreStackParamList, "ConfirmAdmissions">,
  BottomTabScreenProps<StaffTabParamList>
>;

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatFee(value?: number | null): string {
  if (value == null) return "—";
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const EMPTY_FORM: ConfirmAdmissionFormValues = {
  student_name: "",
  parent: "",
  class: "",
  adm_no: "",
  annual_fee: undefined,
  enquire_date: "",
  section: "",
  roll_no: "",
  first_day_of_school: "",
  notes: "",
  school_code: "",
};

export function ConfirmAdmissionsScreen({ navigation }: Props) {
  const { session } = useAuth();
  const staffSession = session && session.type === "staff" ? session : null;
  const permissions = staffPermissions(session);
  const canWrite =
    hasPermission(permissions, MODULES.STUDENTS, "create") ||
    hasPermission(permissions, MODULES.STUDENTS, "update") ||
    hasPermission(permissions, MODULES.STUDENTS, "delete");

  const [items, setItems] = useState<ConfirmAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConfirmAdmission | null>(null);
  const [form, setForm] = useState<ConfirmAdmissionFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getConfirmAdmissions());
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

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, school_code: staffSession?.schoolcode ?? "" });
    setModalOpen(true);
  }

  function openEdit(item: ConfirmAdmission) {
    setEditing(item);
    setForm({
      student_name: item.student_name ?? "",
      parent: item.parent ?? "",
      class: item.class ?? "",
      adm_no: item.adm_no ?? "",
      annual_fee: item.annual_fee ?? undefined,
      enquire_date: item.enquire_date ?? "",
      section: item.section ?? "",
      roll_no: item.roll_no ?? "",
      first_day_of_school: item.first_day_of_school ?? "",
      notes: item.notes ?? "",
      school_code: item.school_code ?? staffSession?.schoolcode ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.student_name.trim() || !form.class.trim()) {
      Alert.alert("Missing info", "Student name and class are required.");
      return;
    }
    setSaving(true);
    try {
      const payload: ConfirmAdmissionFormValues = {
        ...form,
        annual_fee: form.annual_fee || undefined,
        school_code: form.school_code || (staffSession?.schoolcode ?? ""),
      };
      if (editing) {
        await updateConfirmAdmission(editing.id, payload);
        Alert.alert("Record updated", "Your changes were saved.");
      } else {
        await createConfirmAdmission(payload);
        Alert.alert("Record added", "The confirmed admission was recorded.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item: ConfirmAdmission) {
    Alert.alert("Delete record", `Delete the record for ${item.student_name}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteConfirmAdmission(item.id);
            Alert.alert("Deleted", "The confirmed admission record was removed.");
            load();
          } catch (err) {
            Alert.alert("Could not delete", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  return (
    <PermissionGate module={MODULES.STUDENTS} action="read">
      <Screen topInset={false}>
        <PageHeader
          title="Confirmed admissions"
          description="Enrollment details for confirmed students."
          actions={
            canWrite ? (
              <Button title="+ New record" variant="secondary" onPress={openNew} />
            ) : null
          }
        />

        <View style={styles.note}>
          <Text style={styles.noteText}>
            These records do not create Student accounts. Use "Enroll as Student" to create the student manually
            in the Students module.
          </Text>
        </View>

        <DataState
          loading={loading}
          error={error}
          retry={load}
          empty="No confirmed admission records yet."
        >
          <FlatList
            scrollEnabled={false}
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle}>{item.student_name}</Text>
                    <Text style={styles.cardClass}>
                      {item.class}
                      {item.section ? ` · ${item.section}` : ""}
                    </Text>
                  </View>
                  <View style={styles.cardTopActions}>
                    {item.adm_no ? <Badge>{item.adm_no}</Badge> : null}
                    {canWrite ? (
                      <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                        <Feather name="edit-2" size={16} color={colors.inkSoft} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                <View style={styles.detailGrid}>
                  {item.parent ? <Text style={styles.detail}>Parent: {item.parent}</Text> : null}
                  {item.roll_no ? <Text style={styles.detail}>Roll: {item.roll_no}</Text> : null}
                  {item.annual_fee != null ? <Text style={styles.detail}>Annual fee: {formatFee(item.annual_fee)}</Text> : null}
                  {item.enquire_date ? <Text style={styles.detail}>Enquiry date: {formatDate(item.enquire_date)}</Text> : null}
                  {item.first_day_of_school ? (
                    <Text style={styles.detail}>First day of school: {formatDate(item.first_day_of_school)}</Text>
                  ) : null}
                </View>

                {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

                {canWrite ? (
                  <View style={styles.actions}>
                    <Button
                      title="Enroll as Student"
                      variant="secondary"
                      onPress={() => navigation.navigate("Students", { screen: "StudentsList" })}
                      style={styles.actionBtn}
                    />
                    <Button
                      title="Delete"
                      variant="danger"
                      onPress={() => confirmDelete(item)}
                      style={styles.actionBtn}
                    />
                  </View>
                ) : null}
              </Card>
            )}
          />
        </DataState>
      </Screen>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalOpen(false)} />
          <View style={styles.modalPanel}>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{editing ? "Edit confirmed admission" : "Add confirmed admission"}</Text>

              <Input label="Student name" value={form.student_name} onChangeText={(v) => setForm((f) => ({ ...f, student_name: v }))} />
              <Input label="Parent" value={form.parent} onChangeText={(v) => setForm((f) => ({ ...f, parent: v }))} />
              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Input label="Class" value={form.class} onChangeText={(v) => setForm((f) => ({ ...f, class: v }))} placeholder="e.g. Class 4" />
                </View>
                <View style={styles.inputCol}>
                  <Input label="Section" value={form.section} onChangeText={(v) => setForm((f) => ({ ...f, section: v }))} />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Input label="Admission number" value={form.adm_no} onChangeText={(v) => setForm((f) => ({ ...f, adm_no: v }))} />
                </View>
                <View style={styles.inputCol}>
                  <Input label="Roll number" value={form.roll_no} onChangeText={(v) => setForm((f) => ({ ...f, roll_no: v }))} />
                </View>
              </View>
              <Input
                label="Annual fee"
                value={form.annual_fee == null ? "" : String(form.annual_fee)}
                onChangeText={(v) => setForm((f) => ({ ...f, annual_fee: v === "" ? undefined : Number(v) }))}
                keyboardType="numeric"
              />
              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <DateInput label="Enquiry date" value={form.enquire_date ?? ""} onChangeDate={(d) => setForm((f) => ({ ...f, enquire_date: d }))} placeholder="Optional" />
                </View>
                <View style={styles.inputCol}>
                  <DateInput label="First day of school" value={form.first_day_of_school ?? ""} onChangeDate={(d) => setForm((f) => ({ ...f, first_day_of_school: d }))} placeholder="Optional" />
                </View>
              </View>
              <Input label="Notes" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} multiline style={styles.multiline} />

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} style={styles.modalBtn} />
                <Button
                  title={saving ? "Saving..." : editing ? "Save changes" : "Add record"}
                  onPress={handleSave}
                  isLoading={saving}
                  style={styles.modalBtn}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    gap: 8,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitleWrap: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  cardClass: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  cardTopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  note: {
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
    borderRadius: 12,
    padding: 14,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  detailGrid: {
    gap: 4,
  },
  detail: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  notes: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 10,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputCol: {
    flex: 1,
  },
  multiline: {
    height: 72,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 18,
  },
  modalPanel: {
    backgroundColor: colors.white,
    borderRadius: 18,
    maxHeight: "88%",
  },
  modalContent: {
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
  },
});
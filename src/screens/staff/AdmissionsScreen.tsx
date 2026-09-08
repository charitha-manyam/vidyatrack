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
  confirmAdmissionStage,
  createAdmission,
  declineAdmission,
  deleteAdmission,
  getAdmissionsByStage,
  shortlistToDocs,
  shortlistToInterview,
  updateAdmission,
} from "../../api/admission.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import { ADMISSION_STAGES } from "../../types/admission";
import type { Admission, AdmissionFormValues, AdmissionStage, AdmissionStageCounts } from "../../types/admission";
import type { MoreStackParamList, StaffTabParamList } from "../../navigation/types";

type Props = CompositeScreenProps<
  NativeStackScreenProps<MoreStackParamList, "Admissions">,
  BottomTabScreenProps<StaffTabParamList>
>;

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const TONE_BY_STAGE: Record<AdmissionStage, "brand" | "amber" | "gray" | "green" | "red"> = {
  enquiry: "brand",
  interview: "amber",
  docs_verification: "gray",
  confirmed: "green",
  declined: "red",
};

export function AdmissionsScreen({ navigation }: Props) {
  const { session } = useAuth();
  const staffSession = session && session.type === "staff" ? session : null;
  const permissions = staffPermissions(session);
  const canWrite =
    hasPermission(permissions, MODULES.STUDENTS, "create") ||
    hasPermission(permissions, MODULES.STUDENTS, "update") ||
    hasPermission(permissions, MODULES.STUDENTS, "delete");

  const [stage, setStage] = useState<AdmissionStage>("enquiry");
  const [items, setItems] = useState<Admission[]>([]);
  const [counts, setCounts] = useState<AdmissionStageCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Admission | null>(null);
  const [form, setForm] = useState<AdmissionFormValues>({
    student_name: "",
    class: "",
    phone: "",
    parent_name: "",
    email: "",
    enquire_date: "",
    enquire_source: "",
    referred_by: "",
    date_of_birth: "",
    notes: "",
    school_code: "",
  });
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdmissionsByStage(stage, staffSession?.schoolcode);
      setItems(result.data);
      setCounts(result.counts ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [stage, staffSession?.schoolcode]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openNew() {
    setEditing(null);
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      student_name: "",
      class: "",
      phone: "",
      parent_name: "",
      email: "",
      enquire_date: today,
      enquire_source: "",
      referred_by: "",
      date_of_birth: "",
      notes: "",
      school_code: staffSession?.schoolcode ?? "",
    });
    setModalOpen(true);
  }

  function openEdit(item: Admission) {
    setEditing(item);
    setForm({
      student_name: item.student_name ?? "",
      class: item.class ?? "",
      phone: item.phone ?? "",
      parent_name: item.parent_name ?? "",
      email: item.email ?? "",
      enquire_date: item.enquire_date ?? "",
      enquire_source: item.enquire_source ?? "",
      referred_by: item.referred_by ?? "",
      date_of_birth: item.date_of_birth ?? "",
      notes: item.notes ?? "",
      school_code: item.school_code ?? staffSession?.schoolcode ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.student_name.trim() || !form.class.trim() || !form.phone.trim()) {
      Alert.alert("Missing info", "Student name, class and phone are required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateAdmission(editing.id, form);
        Alert.alert("Admission updated", "Your changes were saved.");
      } else {
        await createAdmission(form);
        Alert.alert("Enquiry added", "The admission enquiry was recorded.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function runTransition(label: string, fn: () => Promise<unknown>, item: Admission) {
    setTransitioning(item.id);
    try {
      await fn();
      Alert.alert("Stage updated", `${item.student_name} was ${label}.`);
      load();
    } catch (err) {
      Alert.alert("Could not update", getErrorMessage(err));
    } finally {
      setTransitioning(null);
    }
  }

  function confirmDelete(item: Admission) {
    Alert.alert("Delete admission", `Delete ${item.student_name} from the pipeline? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdmission(item.id);
            Alert.alert("Deleted", "The admission record was removed.");
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
          title="Admissions pipeline"
          description="Enquiries and admissions by stage."
          actions={
            canWrite ? (
              <Button title="+ New enquiry" variant="secondary" onPress={openNew} />
            ) : null
          }
        />

        <View style={styles.tabs}>
          {ADMISSION_STAGES.map((s) => {
            const active = s.value === stage;
            const count = counts?.[s.value] ?? 0;
            return (
              <Pressable
                key={s.value}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setStage(s.value)}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{s.label}</Text>
                <Badge tone={active ? "brand" : "gray"}>{count}</Badge>
              </Pressable>
            );
          })}
        </View>

        {stage === "confirmed" ? (
          <View style={styles.confirmedNote}>
            <Text style={styles.confirmedNoteText}>
              Confirming an admission only updates its status here — it does not create a Student record. Use
              "Go to Students to enroll" to add the student manually.
            </Text>
            <Button
              title="Go to Students to enroll"
              onPress={() => navigation.navigate("Students", { screen: "StudentsList" })}
            />
          </View>
        ) : null}

        <DataState
          loading={loading}
          error={error}
          retry={load}
          empty={items.length === 0 ? `No ${ADMISSION_STAGES.find((s) => s.value === stage)?.label.toLowerCase() ?? "records"} in this stage.` : null}
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
                    <Text style={styles.cardClass}>{item.class}</Text>
                  </View>
                  <View style={styles.cardTopActions}>
                    <Badge tone={TONE_BY_STAGE[item.status] ?? "gray"}>{item.status.replace("_", " ")}</Badge>
                    {canWrite ? (
                      <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                        <Feather name="edit-2" size={16} color={colors.inkSoft} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                <View style={styles.detailGrid}>
                  {item.parent_name ? (
                    <Text style={styles.detail}>Parent: {item.parent_name}</Text>
                  ) : null}
                  <Text style={styles.detail}>Phone: {item.phone}</Text>
                  {item.email ? <Text style={styles.detail}>Email: {item.email}</Text> : null}
                  {item.enquire_source ? <Text style={styles.detail}>Source: {item.enquire_source}</Text> : null}
                  {item.enquire_date ? <Text style={styles.detail}>Enquiry date: {formatDate(item.enquire_date)}</Text> : null}
                  {item.referred_by ? <Text style={styles.detail}>Referred by: {item.referred_by}</Text> : null}
                </View>

                {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

                {canWrite ? (
                  <View style={styles.actions}>
                    {item.status === "enquiry" ? (
                      <Button
                        title={transitioning === item.id ? "Moving..." : "Shortlist to interview"}
                        variant="secondary"
                        onPress={() => runTransition("shortlisted to interview", () => shortlistToInterview(item.id), item)}
                        isLoading={transitioning === item.id}
                        style={styles.actionBtn}
                      />
                    ) : null}
                    {item.status === "interview" ? (
                      <Button
                        title={transitioning === item.id ? "Moving..." : "Shortlist to docs"}
                        variant="secondary"
                        onPress={() => runTransition("moved to docs verification", () => shortlistToDocs(item.id), item)}
                        isLoading={transitioning === item.id}
                        style={styles.actionBtn}
                      />
                    ) : null}
                    {item.status === "docs_verification" ? (
                      <>
                        <Button
                          title={transitioning === item.id ? "..." : "Decline"}
                          variant="secondary"
                          onPress={() => runTransition("declined", () => declineAdmission(item.id), item)}
                          isLoading={transitioning === item.id}
                          style={styles.actionBtn}
                        />
                        <Button
                          title={transitioning === item.id ? "..." : "Confirm"}
                          onPress={() => runTransition("confirmed", () => confirmAdmissionStage(item.id), item)}
                          isLoading={transitioning === item.id}
                          style={styles.actionBtn}
                        />
                      </>
                    ) : null}
                    {item.status === "confirmed" || item.status === "declined" ? (
                      <Button
                        title="Delete"
                        variant="danger"
                        onPress={() => confirmDelete(item)}
                        style={styles.actionBtn}
                      />
                    ) : null}
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
              <Text style={styles.modalTitle}>{editing ? "Edit admission" : "New admission enquiry"}</Text>

              <Input label="Student name" value={form.student_name} onChangeText={(v) => setForm((f) => ({ ...f, student_name: v }))} placeholder="Full name" />
              <Input label="Desired class" value={form.class} onChangeText={(v) => setForm((f) => ({ ...f, class: v }))} placeholder="e.g. Class 4" />
              <Input label="Phone" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" placeholder="Contact number" />
              <Input label="Parent name" value={form.parent_name} onChangeText={(v) => setForm((f) => ({ ...f, parent_name: v }))} />
              <Input label="Email" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <DateInput label="Enquiry date" value={form.enquire_date ?? ""} onChangeDate={(d) => setForm((f) => ({ ...f, enquire_date: d }))} />
                </View>
                <View style={styles.dateCol}>
                  <DateInput label="Date of birth" value={form.date_of_birth ?? ""} onChangeDate={(d) => setForm((f) => ({ ...f, date_of_birth: d }))} placeholder="Optional" />
                </View>
              </View>
              <Input label="Enquiry source" value={form.enquire_source} onChangeText={(v) => setForm((f) => ({ ...f, enquire_source: v }))} placeholder="Walk-in, referral, website..." />
              <Input label="Referred by (optional)" value={form.referred_by} onChangeText={(v) => setForm((f) => ({ ...f, referred_by: v }))} />
              <Input label="Notes" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} multiline style={styles.multiline} />

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} style={styles.modalBtn} />
                <Button
                  title={saving ? "Saving..." : editing ? "Save changes" : "Add enquiry"}
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
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  tabActive: {
    borderColor: colors.brand600,
    backgroundColor: colors.brand50,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.inkSoft,
  },
  tabLabelActive: {
    color: colors.brand700,
    fontWeight: "600",
  },
  confirmedNote: {
    gap: 10,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
    borderRadius: 12,
    padding: 14,
  },
  confirmedNoteText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  list: {
    gap: 12,
    paddingBottom: 20,
    paddingTop: 4,
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
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateCol: {
    flex: 1,
  },
  multiline: {
    height: 80,
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
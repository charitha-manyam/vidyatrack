import { useCallback, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { InlineSelect } from "../../components/InlineSelect";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PageHeader } from "../../components/ui/PageHeader";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { MODULES } from "../../config/rbac";
import { hasPermission } from "../../config/rbac";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import { createComplaint, getComplaints, rejectComplaint, resolveComplaint } from "../../api/complaint.api";
import { COMPLAINT_STATUS_OPTIONS } from "../../types/complaint";
import type { Complaint, ComplaintFormValues, ComplaintStatus } from "../../types/complaint";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "Complaints">;

const CATEGORY_OPTIONS = [
  { value: "Academic", label: "Academic" },
  { value: "Behavioral", label: "Behavioral" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Transport", label: "Transport" },
  { value: "Fees", label: "Fees" },
  { value: "Other", label: "Other" },
];

const REGARDING_TYPE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "staff", label: "Staff" },
  { value: "parent", label: "Parent" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

function statusTone(status: ComplaintStatus): "amber" | "green" | "red" {
  if (status === "resolved") return "green";
  if (status === "rejected") return "red";
  return "amber";
}

const EMPTY_FORM: ComplaintFormValues = {
  subject: "",
  category: "",
  description: "",
  regarding_id: "",
  regarding_type: "",
  school_code: "",
};

export function ComplaintsScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite =
    hasPermission(permissions, MODULES.SUPPORT_TICKETS, "create") ||
    hasPermission(permissions, MODULES.SUPPORT_TICKETS, "update") ||
    hasPermission(permissions, MODULES.SUPPORT_TICKETS, "delete");

  const [status, setStatus] = useState<"all" | ComplaintStatus>("all");
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState<ComplaintFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [actionModal, setActionModal] = useState(false);
  const [action, setAction] = useState<"resolve" | "reject">("resolve");
  const [target, setTarget] = useState<Complaint | null>(null);
  const [note, setNote] = useState("");

  const setField = (key: keyof ComplaintFormValues) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getComplaints(status === "all" ? undefined : { status }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openNew() {
    setForm({
      ...EMPTY_FORM,
      school_code: session?.type === "staff" ? session.schoolcode : "",
    });
    setCreateModal(true);
  }

  async function handleCreate() {
    if (!form.subject.trim() || !form.category || !form.description.trim() || !form.regarding_type || !form.regarding_id.trim() || !form.school_code.trim()) {
      Alert.alert("Missing info", "Fill in all required fields to log a complaint.");
      return;
    }
    setSaving(true);
    try {
      await createComplaint({
        ...form,
        subject: form.subject.trim(),
        description: form.description.trim(),
        regarding_id: form.regarding_id.trim(),
        school_code: form.school_code.trim(),
      });
      Alert.alert("Complaint logged", "The complaint has been submitted.");
      setCreateModal(false);
      load();
    } catch (err) {
      Alert.alert("Could not log complaint", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openAction(kind: "resolve" | "reject", item: Complaint) {
    setAction(kind);
    setTarget(item);
    setNote("");
    setActionModal(true);
  }

  async function handleSubmit() {
    if (!target) return;
    if (action === "resolve" && !note.trim()) {
      Alert.alert("Missing info", "Add a resolution note.");
      return;
    }
    setSaving(true);
    try {
      if (action === "resolve") {
        await resolveComplaint(target.id, note.trim());
        Alert.alert("Complaint resolved", "The status has been marked as resolved.");
      } else {
        await rejectComplaint(target.id, note.trim() || undefined);
        Alert.alert("Complaint rejected", "The status has been marked as rejected.");
      }
      setActionModal(false);
      load();
    } catch (err) {
      Alert.alert("Could not update", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PermissionGate module={MODULES.SUPPORT_TICKETS} action="read">
    <Screen topInset={false}>
      <PageHeader
        title="Complaints"
        description="Track and resolve complaints."
        actions={canWrite ? <Button title="+ Log complaint" variant="secondary" onPress={openNew} /> : null}
      />

      <InlineSelect
        label="Status"
        value={status}
        options={COMPLAINT_STATUS_OPTIONS}
        onSelect={(v) => setStatus(v as "all" | ComplaintStatus)}
      />

      <DataState
        loading={loading}
        error={error}
        retry={load}
        empty={items.length === 0 ? (status === "all" ? "No complaints yet." : `No ${status} complaints.`) : null}
      >
        <FlatList
          scrollEnabled={false}
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.subject}
                </Text>
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
              </View>
              <Text style={styles.cardMeta}>
                {item.category}
                {item.regarding_type ? ` · Regarding: ${item.regarding_type}` : ""}
              </Text>
              <Text style={styles.cardBody}>{item.description}</Text>

              {item.status === "resolved" && item.resolution ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Resolution</Text>
                  <Text style={styles.noteText}>{item.resolution}</Text>
                </View>
              ) : null}
              {item.status === "rejected" && item.resolution ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Remarks</Text>
                  <Text style={styles.noteText}>{item.resolution}</Text>
                </View>
              ) : null}

              {item.status === "pending" ? (
                <View style={styles.actions}>
                  <Button title="Reject" variant="secondary" onPress={() => openAction("reject", item)} style={styles.actionBtn} />
                  <Button title="Resolve" onPress={() => openAction("resolve", item)} style={styles.actionBtn} />
                </View>
              ) : null}
            </Card>
          )}
        />
      </DataState>

      <Modal visible={actionModal} transparent animationType="fade" onRequestClose={() => setActionModal(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActionModal(false)} />
          <View style={styles.modalPanel}>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{action === "resolve" ? "Resolve complaint" : "Reject complaint"}</Text>
              <Text style={styles.modalHint}>
                {action === "resolve"
                  ? "Describe how this complaint was resolved."
                  : "Optionally add a note explaining why this complaint was rejected."}
              </Text>
              <Input
                label={action === "resolve" ? "Resolution" : "Remarks (optional)"}
                value={note}
                onChangeText={setNote}
                multiline
                placeholder={action === "resolve" ? "How was it resolved?" : "Reason for rejection"}
                style={styles.multiline}
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setActionModal(false)} style={styles.modalBtn} />
                <Button
                  title={saving ? "Saving..." : action === "resolve" ? "Mark resolved" : "Mark rejected"}
                  onPress={handleSubmit}
                  isLoading={saving}
                  style={styles.modalBtn}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={createModal} transparent animationType="fade" onRequestClose={() => setCreateModal(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCreateModal(false)} />
          <View style={styles.modalPanel}>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Log a complaint</Text>
              <Text style={styles.modalHint}>Describe the issue so it can be addressed.</Text>
              <Input label="Subject" value={form.subject} onChangeText={setField("subject")} placeholder="What is this about?" />
              <Input
                label="Description"
                value={form.description}
                onChangeText={setField("description")}
                multiline
                placeholder="Details of the complaint"
                style={styles.multiline}
              />
              <InlineSelect label="Category" value={form.category} options={CATEGORY_OPTIONS} onSelect={setField("category")} />
              <InlineSelect label="Regarding" value={form.regarding_type} options={REGARDING_TYPE_OPTIONS} onSelect={setField("regarding_type")} />
              <Input
                label="Regarding ID"
                value={form.regarding_id}
                onChangeText={setField("regarding_id")}
                placeholder="Student/staff/parent ID"
              />
              <Input label="School code" value={form.school_code} onChangeText={setField("school_code")} placeholder="Your school code" />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setCreateModal(false)} style={styles.modalBtn} />
                <Button title={saving ? "Submitting..." : "Submit complaint"} onPress={handleCreate} isLoading={saving} style={styles.modalBtn} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  </PermissionGate>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    gap: 6,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  noteBox: {
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    padding: 10,
    gap: 2,
  },
  noteTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkGhost,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
  },
  multiline: {
    height: 88,
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
  modalHint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkFaint,
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
import { useCallback, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { DateInput } from "../../components/DateInput";
import { InlineSelect } from "../../components/InlineSelect";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PageHeader } from "../../components/ui/PageHeader";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { sectionsFor, useSelectOptions, type SelectOption } from "../../hooks/useSelectOptions";
import {
  createStudyMaterial,
  deleteStudyMaterial,
  getStudyMaterials,
  updateStudyMaterial,
  type StudyMaterialPdfFile,
} from "../../api/studyMaterial.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { StudyMaterial, StudyMaterialFormValues } from "../../types/studyMaterial";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "StudyMaterials">;

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FormState {
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string;
  upload_date: string;
  upload_type: string;
}

const EMPTY_FORM: FormState = {
  class_id: "",
  section_id: "",
  subject_id: "",
  teacher_id: "",
  title: "",
  description: "",
  upload_date: new Date().toISOString().slice(0, 10),
  upload_type: "",
};

function toValues(form: FormState): StudyMaterialFormValues {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    class_id: form.class_id,
    section_id: form.section_id || undefined,
    subject_id: form.subject_id || undefined,
    teacher_id: form.teacher_id || undefined,
    upload_date: form.upload_date || undefined,
    upload_type: form.upload_type.trim() || undefined,
  };
}

export function StudyMaterialsScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite =
    hasPermission(permissions, MODULES.STUDY_MATERIALS, "create") ||
    hasPermission(permissions, MODULES.STUDY_MATERIALS, "update") ||
    hasPermission(permissions, MODULES.STUDY_MATERIALS, "delete");

  const [classFilter, setClassFilter] = useState("");
  const [items, setItems] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StudyMaterialPdfFile | null>(null);
  const [hasExistingFile, setHasExistingFile] = useState(false);

  const { options } = useSelectOptions(["classes", "sections", "subjects", "staff"]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getStudyMaterials(classFilter ? { class_id: classFilter } : undefined));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [classFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, upload_date: new Date().toISOString().slice(0, 10) });
    setSelectedFile(null);
    setHasExistingFile(false);
    setModalOpen(true);
  }

  function openEdit(item: StudyMaterial) {
    setEditing(item);
    setForm({
      class_id: item.class?.id ?? "",
      section_id: item.section?.id ?? "",
      subject_id: item.subject?.id ?? "",
      teacher_id: item.teacher?.id ?? "",
      title: item.title ?? "",
      description: item.description ?? "",
      upload_date: item.upload_date ?? "",
      upload_type: item.upload_type ?? "",
    });
    setSelectedFile(null);
    setHasExistingFile(Boolean(item.pdf));
    setModalOpen(true);
  }

  async function pickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
        file: asset.file ?? undefined,
      });
      setHasExistingFile(false);
    } catch {
      Alert.alert("Could not pick file", "No file was selected.");
    }
  }

  async function handleSave() {
    if (!form.title.trim() || !form.class_id) {
      Alert.alert("Missing info", "Title and class are required.");
      return;
    }
    setSaving(true);
    try {
      const values = toValues(form);
      if (editing) {
        await updateStudyMaterial(editing.id, values, selectedFile ?? undefined);
        Alert.alert("Study material updated", "Your changes were saved.");
      } else {
        await createStudyMaterial(values, selectedFile ?? undefined);
        Alert.alert("Study material added", "It is now available to the selected class.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item: StudyMaterial) {
    Alert.alert("Delete study material", `Delete "${item.title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStudyMaterial(item.id);
            Alert.alert("Deleted", "The study material was removed.");
            load();
          } catch (err) {
            Alert.alert("Could not delete", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  const sectionOptions = sectionsFor(options, form.class_id);
  const classOptions: SelectOption[] = [{ value: "", label: "All classes" }, ...(options.classes ?? [])];

  return (
    <PermissionGate module={MODULES.STUDY_MATERIALS} action="read">
      <Screen topInset={false}>
        <PageHeader
          title="Study Materials"
          description="Share study materials with students by class and subject."
          actions={
            canWrite ? (
              <Button title="+ New material" variant="secondary" onPress={openNew} />
            ) : null
          }
        />

        <InlineSelect
          label="Class filter"
          value={classFilter}
          options={classOptions}
          onSelect={(v) => setClassFilter(v)}
          placeholder="All classes"
        />

        <DataState
          loading={loading}
          error={error}
          retry={load}
          empty={items.length === 0 ? (classFilter ? "No study materials for this class yet." : "No study materials yet.") : null}
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
                    {item.title}
                  </Text>
                  <View style={styles.cardTopActions}>
                    {item.upload_type ? <Badge tone="brand">{item.upload_type}</Badge> : null}
                    {canWrite ? (
                      <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                        <Feather name="edit-2" size={16} color={colors.inkSoft} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.meta}>
                    {item.class?.name ?? "—"}
                    {item.section ? ` · ${item.section.name}` : " · All sections"}
                  </Text>
                  {item.subject ? <Text style={styles.meta}>Subject: {item.subject.name}</Text> : null}
                  {item.teacher ? <Text style={styles.meta}>Teacher: {item.teacher.name}</Text> : null}
                </View>

                {item.description ? <Text style={styles.body}>{item.description}</Text> : null}

                <View style={styles.cardFoot}>
                  <Text style={styles.footMeta}>{item.upload_date ? `Uploaded ${formatDate(item.upload_date)}` : ""}</Text>
                  {item.pdf ? (
                    <View style={styles.fileTag}>
                      <Feather name="file-text" size={13} color={colors.brand700} />
                      <Text style={styles.fileTagText}>File attached</Text>
                    </View>
                  ) : null}
                  {canWrite ? (
                    <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                      <Feather name="trash-2" size={16} color={colors.danger} />
                    </Pressable>
                  ) : null}
                </View>
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
              <Text style={styles.modalTitle}>{editing ? "Edit study material" : "New study material"}</Text>

              <Input label="Title" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="e.g. Chapter 4 worksheets" />
              <Input
                label="Description"
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
                placeholder="What this material covers..."
                style={styles.multiline}
              />
              <InlineSelect
                label="Class"
                value={form.class_id}
                options={options.classes ?? []}
                onSelect={(v) => setForm((f) => ({ ...f, class_id: v, section_id: "" }))}
                placeholder="Select class"
              />
              <InlineSelect
                label="Section (optional)"
                value={form.section_id}
                options={sectionOptions}
                onSelect={(v) => setForm((f) => ({ ...f, section_id: v }))}
                placeholder="All sections"
              />
              <InlineSelect
                label="Subject (optional)"
                value={form.subject_id}
                options={options.subjects ?? []}
                onSelect={(v) => setForm((f) => ({ ...f, subject_id: v }))}
                placeholder="None"
              />
              <InlineSelect
                label="Teacher (optional)"
                value={form.teacher_id}
                options={options.staff ?? []}
                onSelect={(v) => setForm((f) => ({ ...f, teacher_id: v }))}
                placeholder="None"
              />
              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <DateInput label="Upload date" value={form.upload_date} onChangeDate={(d) => setForm((f) => ({ ...f, upload_date: d }))} />
                </View>
              </View>
              <Input label="Type (optional)" value={form.upload_type} onChangeText={(v) => setForm((f) => ({ ...f, upload_type: v }))} placeholder="Worksheet, notes, question bank..." />

              <View style={styles.fileSection}>
                <Text style={styles.fileLabel}>File {editing ? "(replaces the current one)" : "(optional)"}</Text>
                <Button
                  title="Choose a file"
                  variant="secondary"
                  onPress={pickDocument}
                  style={styles.fileBtn}
                />
                {selectedFile ? (
                  <View style={styles.fileChip}>
                    <Feather name="paperclip" size={14} color={colors.brand700} />
                    <Text style={styles.fileChipText} numberOfLines={1}>
                      {selectedFile.name}
                      {selectedFile.size ? ` · ${formatSize(selectedFile.size)}` : ""}
                    </Text>
                    <Pressable onPress={() => setSelectedFile(null)} hitSlop={8}>
                      <Feather name="x" size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                ) : hasExistingFile ? (
                  <View style={styles.fileChip}>
                    <Feather name="check-circle" size={14} color={colors.success} />
                    <Text style={styles.fileChipText} numberOfLines={1}>
                      A file is already attached. Pick a new one only to replace it.
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} style={styles.modalBtn} />
                <Button
                  title={saving ? "Saving..." : editing ? "Save changes" : "Add material"}
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
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  cardTopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaRow: {
    gap: 3,
  },
  meta: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  cardFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  footMeta: {
    fontSize: 12,
    color: colors.inkGhost,
  },
  fileTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  fileTagText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.brand700,
  },
  multiline: {
    height: 88,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateCol: {
    flex: 1,
  },
  fileSection: {
    gap: 8,
  },
  fileLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.ink,
  },
  fileBtn: {
    alignSelf: "flex-start",
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fileChipText: {
    flex: 1,
    fontSize: 13,
    color: colors.inkSoft,
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
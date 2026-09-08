import { useCallback, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
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
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementsByType,
  updateAnnouncement,
} from "../../api/announcement.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import { ANNOUNCEMENT_AUDIENCE_OPTIONS } from "../../types/announcement";
import type { Announcement, AnnouncementAudienceType } from "../../types/announcement";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "Announcements">;

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function AnnouncementsScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite =
    hasPermission(permissions, MODULES.ANNOUNCEMENTS, "create") ||
    hasPermission(permissions, MODULES.ANNOUNCEMENTS, "update") ||
    hasPermission(permissions, MODULES.ANNOUNCEMENTS, "delete");

  const [audience, setAudience] = useState<AnnouncementAudienceType>("parent");
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audienceForm, setAudienceForm] = useState<AnnouncementAudienceType>("parent");
  const [visibleUntil, setVisibleUntil] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getAnnouncementsByType(audience));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openNew() {
    setEditing(null);
    setTitle("");
    setMessage("");
    setAudienceForm(audience);
    setVisibleUntil("");
    setModalOpen(true);
  }

  function openEdit(item: Announcement) {
    setEditing(item);
    setTitle(item.title ?? "");
    setMessage(item.message ?? "");
    const scopeType = item.visibility_scope?.type;
    const currentAudience = (["parent", "teacher", "student", "accountant"] as const).find((a) => a === scopeType);
    setAudienceForm(currentAudience ?? audience);
    setVisibleUntil(item.visible_until ?? "");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Missing info", "Title and message are required.");
      return;
    }
    setSaving(true);
    try {
      const values = {
        title: title.trim(),
        message: message.trim(),
        audience: audienceForm,
        visible_until: visibleUntil || undefined,
      };
      if (editing) {
        await updateAnnouncement(editing.id, values);
        Alert.alert("Announcement updated", "Your changes were saved.");
      } else {
        await createAnnouncement(values);
        Alert.alert("Announcement created", "It is now visible to the selected audience.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item: Announcement) {
    Alert.alert("Delete announcement", `Delete "${item.title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAnnouncement(item.id);
            Alert.alert("Deleted", "The announcement was removed.");
            load();
          } catch (err) {
            Alert.alert("Could not delete", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  return (
    <PermissionGate module={MODULES.ANNOUNCEMENTS} action="read">
      <Screen topInset={false}>
        <PageHeader
          title="Announcements"
          description="Share updates with a specific audience."
          actions={
            canWrite ? (
              <Button title="+ New" variant="secondary" onPress={openNew} />
            ) : null
          }
        />

        <InlineSelect
          label="Audience"
          value={audience}
          options={ANNOUNCEMENT_AUDIENCE_OPTIONS}
          onSelect={(v) => setAudience(v as AnnouncementAudienceType)}
        />

        <DataState
          loading={loading}
          error={error}
          retry={load}
          empty={items.length === 0 ? `No announcements for ${ANNOUNCEMENT_AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label.toLowerCase() ?? "this audience"} yet.` : null}
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
                  {item.visible_until ? <Badge tone="amber">Until {formatDate(item.visible_until)}</Badge> : null}
                </View>
                <Text style={styles.cardBody}>{item.message}</Text>
                <View style={styles.cardFoot}>
                  <Text style={styles.cardMeta}>{item.created_at ? formatDate(item.created_at) : ""}</Text>
                  {canWrite ? (
                    <View style={styles.cardActions}>
                      <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                        <Feather name="edit-2" size={16} color={colors.inkSoft} />
                      </Pressable>
                      <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                        <Feather name="trash-2" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
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
              <Text style={styles.modalTitle}>{editing ? "Edit announcement" : "New announcement"}</Text>

              <Input label="Title" value={title} onChangeText={setTitle} placeholder="Half-yearly parent meeting" />
              <Input label="Message" value={message} onChangeText={setMessage} multiline placeholder="Details of the update..." style={styles.multiline} />
              <InlineSelect
                label="Audience"
                value={audienceForm}
                options={ANNOUNCEMENT_AUDIENCE_OPTIONS}
                onSelect={(v) => setAudienceForm(v as AnnouncementAudienceType)}
              />
              <DateInput label="Visible until (optional)" value={visibleUntil} onChangeDate={setVisibleUntil} placeholder="No expiry" />

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} style={styles.modalBtn} />
                <Button
                  title={saving ? "Saving..." : editing ? "Save changes" : "Publish"}
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
  cardBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  cardFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMeta: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  multiline: {
    height: 96,
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
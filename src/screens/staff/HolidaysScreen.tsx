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
import { staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { createHoliday, deleteHoliday, getHolidays, updateHoliday, bulkAddHolidays, downloadHolidaysPdf } from "../../api/holiday.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import { HOLIDAY_TYPE_OPTIONS } from "../../types/holiday";
import type { BulkHolidayRow, Holiday, HolidayFormValues, HolidayType } from "../../types/holiday";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "Holidays">;

const TYPE_FILTER_OPTIONS = [{ value: "", label: "All types" }, ...HOLIDAY_TYPE_OPTIONS];

function typeTone(type: HolidayType): "brand" | "amber" | "red" {
  if (type === "public") return "brand";
  if (type === "restricted") return "red";
  return "amber";
}

function formatDate(value: string): string {
  const d = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const EMPTY_FORM: HolidayFormValues = {
  holidayname: "",
  date: "",
  from_date: "",
  to_date: "",
  type: "public",
  note: "",
  school_code: "",
};

const EMPTY_BULK_ROW: BulkHolidayRow = {
  holidayname: "",
  date: "",
  type: "public",
  note: "",
  school_code: "",
};

export function HolidaysScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.CLASSES, "create");
  const canDelete = hasPermission(permissions, MODULES.CLASSES, "delete");

  const [typeFilter, setTypeFilter] = useState("");
  const [items, setItems] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState<HolidayFormValues>(EMPTY_FORM);
  const [isRange, setIsRange] = useState(false);
  const [saving, setSaving] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkHolidayRow[]>([{ ...EMPTY_BULK_ROW, school_code: session?.type === "staff" ? session.schoolcode : "" }]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const setField = (key: keyof HolidayFormValues) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = typeFilter ? { type: typeFilter } : undefined;
      setItems(await getHolidays(params));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openNew() {
    setEditing(null);
    setIsRange(false);
    setForm({
      ...EMPTY_FORM,
      school_code: session?.type === "staff" ? session.schoolcode : "",
    });
    setModalOpen(true);
  }

  function openEdit(item: Holiday) {
    setEditing(item);
    setIsRange(false);
    setForm({
      holidayname: item.holidayname ?? "",
      date: item.date ?? "",
      from_date: "",
      to_date: "",
      type: item.type,
      note: item.note ?? "",
      school_code: item.school_code ?? (session?.type === "staff" ? session.schoolcode : ""),
      academicYearId: item.academicYearId ?? undefined,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const hasDate = Boolean(form.date);
    const hasRange = Boolean(form.from_date) && Boolean(form.to_date);
    if (!form.holidayname.trim()) {
      Alert.alert("Missing info", "Holiday name is required.");
      return;
    }
    if (!hasDate && !hasRange) {
      Alert.alert("Missing info", "Provide either a single date or both a start and end date.");
      return;
    }
    if (form.from_date && form.to_date && form.from_date > form.to_date) {
      Alert.alert("Invalid range", "The start date must be on or before the end date.");
      return;
    }
    setSaving(true);
    try {
      const payload: HolidayFormValues = {
        holidayname: form.holidayname.trim(),
        type: form.type,
        note: form.note?.trim() || undefined,
        school_code: form.school_code.trim(),
        date: hasDate ? form.date : undefined,
        from_date: hasRange ? form.from_date : undefined,
        to_date: hasRange ? form.to_date : undefined,
      };
      if (editing) {
        await updateHoliday(editing.id, {
          holidayname: payload.holidayname,
          type: payload.type,
          note: payload.note,
          school_code: payload.school_code,
          date: payload.date,
        });
        Alert.alert("Holiday updated", "Your changes were saved.");
      } else {
        const res = await createHoliday(payload);
        Alert.alert("Holiday added", res.message ?? "The holiday was added.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item: Holiday) {
    Alert.alert("Delete holiday", `Delete "${item.holidayname}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteHoliday(item.id);
            Alert.alert("Deleted", "The holiday was removed.");
            load();
          } catch (err) {
            Alert.alert("Could not delete", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  function openBulk() {
    setBulkRows([{ ...EMPTY_BULK_ROW, school_code: session?.type === "staff" ? session.schoolcode : "" }]);
    setBulkOpen(true);
  }

  function updateBulkRow(index: number, patch: Partial<BulkHolidayRow>) {
    setBulkRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function handleBulkSave() {
    const completed = bulkRows.filter((r) => r.holidayname.trim() && r.date && r.school_code.trim());
    if (!completed.length) {
      Alert.alert("Missing info", "Fill in at least one complete holiday row.");
      return;
    }
    setBulkSaving(true);
    try {
      const res = await bulkAddHolidays(completed.map((r) => ({ ...r, holidayname: r.holidayname.trim(), school_code: r.school_code.trim() })));
      Alert.alert("Holidays added", res.message ?? `${completed.length} holiday(s) added.`);
      setBulkOpen(false);
      load();
    } catch (err) {
      Alert.alert("Could not add holidays", getErrorMessage(err));
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadHolidaysPdf(typeFilter ? { type: typeFilter as HolidayType } : undefined);
    } catch (err) {
      Alert.alert("Download failed", getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Screen topInset={false}>
      <PageHeader
        title="Holidays"
        description="School holiday calendar."
        actions={
          canWrite ? (
            <View style={styles.headerActions}>
              <Button title="PDF" variant="secondary" onPress={handleDownload} isLoading={downloading} />
              <Button title="Bulk add" variant="secondary" onPress={openBulk} />
              <Button title="+ Add" onPress={openNew} />
            </View>
          ) : (
            <Button title="PDF" variant="secondary" onPress={handleDownload} isLoading={downloading} />
          )
        }
      />

      <InlineSelect
        label="Type"
        value={typeFilter}
        options={TYPE_FILTER_OPTIONS}
        onSelect={(v) => setTypeFilter(v)}
      />

      <DataState
        loading={loading}
        error={error}
        retry={load}
        empty={items.length === 0 ? (typeFilter ? `No ${typeFilter} holidays.` : "No holidays yet.") : null}
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
                  {item.holidayname}
                </Text>
                <Badge tone={typeTone(item.type)}>{item.type}</Badge>
              </View>
              <Text style={styles.cardMeta}>{formatDate(item.date)}</Text>
              {item.note ? <Text style={styles.cardBody}>{item.note}</Text> : null}
              <View style={styles.cardFoot}>
                <Text style={styles.cardCode}>{item.school_code}</Text>
                {canWrite || canDelete ? (
                  <View style={styles.cardActions}>
                    {canWrite ? (
                      <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                        <Feather name="edit-2" size={16} color={colors.inkSoft} />
                      </Pressable>
                    ) : null}
                    {canDelete ? (
                      <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                        <Feather name="trash-2" size={16} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </Card>
          )}
        />
      </DataState>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalOpen(false)} />
          <View style={styles.modalPanel}>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{editing ? "Edit holiday" : "Add holiday"}</Text>
              <Input
                label="Holiday name"
                value={form.holidayname}
                onChangeText={setField("holidayname")}
                placeholder="e.g. Diwali"
              />
              {!editing ? (
                <InlineSelect
                  label="Date type"
                  value={isRange ? "range" : "single"}
                  options={[
                    { value: "single", label: "Single date" },
                    { value: "range", label: "Date range" },
                  ]}
                  onSelect={(v) => setIsRange(v === "range")}
                />
              ) : null}
              {isRange && !editing ? (
                <View style={styles.dateRow}>
                  <DateInput label="From date" value={form.from_date ?? ""} onChangeDate={setField("from_date")} style={styles.dateInput} />
                  <DateInput label="To date" value={form.to_date ?? ""} onChangeDate={setField("to_date")} style={styles.dateInput} />
                </View>
              ) : (
                <DateInput label="Date" value={form.date ?? ""} onChangeDate={setField("date")} />
              )}
              <InlineSelect label="Type" value={form.type} options={HOLIDAY_TYPE_OPTIONS} onSelect={setField("type")} />
              <Input label="School code" value={form.school_code} onChangeText={setField("school_code")} placeholder="Your school code" />
              <Input label="Note (optional)" value={form.note ?? ""} onChangeText={setField("note")} placeholder="Reason for the holiday" />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} style={styles.modalBtn} />
                <Button title={saving ? "Saving..." : editing ? "Save changes" : "Add holiday"} onPress={handleSave} isLoading={saving} style={styles.modalBtn} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={bulkOpen} transparent animationType="fade" onRequestClose={() => setBulkOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setBulkOpen(false)} />
          <View style={styles.modalPanel}>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Bulk add holidays</Text>
              <Text style={styles.modalHint}>Add several distinct holidays in one go. Each row needs a name and a date.</Text>
              {bulkRows.map((row, index) => (
                <View key={index} style={styles.bulkRow}>
                  <View style={styles.bulkRowHead}>
                    <Text style={styles.bulkRowLabel}>Holiday {index + 1}</Text>
                    {bulkRows.length > 1 ? (
                      <Pressable onPress={() => setBulkRows((rows) => rows.filter((_, i) => i !== index))} hitSlop={8}>
                        <Feather name="trash-2" size={16} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                  <Input
                    label="Holiday name"
                    value={row.holidayname}
                    onChangeText={(v) => updateBulkRow(index, { holidayname: v })}
                    placeholder="e.g. Diwali"
                  />
                  <DateInput label="Date" value={row.date ?? ""} onChangeDate={(v) => updateBulkRow(index, { date: v })} />
                  <InlineSelect
                    label="Type"
                    value={row.type}
                    options={HOLIDAY_TYPE_OPTIONS}
                    onSelect={(v) => updateBulkRow(index, { type: v as HolidayType })}
                  />
                  <Input label="School code" value={row.school_code} onChangeText={(v) => updateBulkRow(index, { school_code: v })} placeholder="Your school code" />
                  <Input label="Note (optional)" value={row.note ?? ""} onChangeText={(v) => updateBulkRow(index, { note: v })} />
                </View>
              ))}
              <Button
                title="+ Add another holiday"
                variant="secondary"
                onPress={() => setBulkRows((rows) => [...rows, { ...EMPTY_BULK_ROW, school_code: rows[0]?.school_code ?? "" }])}
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setBulkOpen(false)} style={styles.modalBtn} />
                <Button title={bulkSaving ? "Adding..." : "Add holidays"} onPress={handleBulkSave} isLoading={bulkSaving} style={styles.modalBtn} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    fontSize: 13,
    color: colors.inkSoft,
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
    gap: 10,
    marginTop: 2,
  },
  cardCode: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInput: {
    flex: 1,
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
  bulkRow: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  bulkRowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bulkRowLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkGhost,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
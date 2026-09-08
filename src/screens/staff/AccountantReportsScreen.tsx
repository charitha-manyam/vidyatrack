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
import { useSelectOptions } from "../../hooks/useSelectOptions";
import {
  deleteAccountantReport,
  generateAccountantReport,
  getAccountantReports,
} from "../../api/report.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import {
  ACCOUNTANT_REPORT_FORMATS,
  ACCOUNTANT_REPORT_MIN_OVERDUE_OPTIONS,
  ACCOUNTANT_REPORT_TYPE_OPTIONS,
} from "../../types/report";
import type { AccountantReport, AccountantReportFormat, AccountantReportMinOverdue, AccountantReportType } from "../../types/report";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "AccountantReports">;

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const ALL_TYPES = [{ value: "", label: "All types" }, ...ACCOUNTANT_REPORT_TYPE_OPTIONS];
const ALL_FORMATS = [{ value: "", label: "All formats" }, ...ACCOUNTANT_REPORT_FORMATS.map((f) => ({ value: f, label: f }))];

export function AccountantReportsScreen(_: Props) {
  const { session } = useAuth();
  const staffSession = session && session.type === "staff" ? session : null;
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.ACCOUNTANTS, "create");

  const { options: optionSets } = useSelectOptions(["classes", "years"]);
  const classOptions = (optionSets.classes ?? []) as { value: string; label: string }[];
  const yearOptions = (optionSets.years ?? []) as { value: string; label: string }[];
  const allClasses = [{ value: "", label: "All classes" }, ...classOptions];

  const [reportType, setReportType] = useState("");
  const [format, setFormat] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [items, setItems] = useState<AccountantReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    reportType: "" as AccountantReportType | "",
    asOfDate: todayISO(),
    classFilter: "",
    minOverdue: "" as AccountantReportMinOverdue | "",
    includeColumns: "",
    format: "PDF" as AccountantReportFormat,
    sendTo: "",
    academicYearId: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(
        await getAccountantReports({
          reportType: reportType || undefined,
          format: format || undefined,
          classFilter: classFilter || undefined,
        })
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [reportType, format, classFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openModal() {
    setForm({
      reportType: "",
      asOfDate: todayISO(),
      classFilter: "",
      minOverdue: "",
      includeColumns: "",
      format: "PDF",
      sendTo: "",
      academicYearId: "",
    });
    setModalOpen(true);
  }

  async function handleGenerate() {
    if (!form.reportType || !form.asOfDate || !form.format) {
      Alert.alert("Missing info", "Report type, as-of date and format are required.");
      return;
    }
    setSaving(true);
    try {
      await generateAccountantReport({
        reportType: form.reportType,
        asOfDate: form.asOfDate,
        format: form.format,
        classFilter: form.classFilter || undefined,
        minOverdue: form.minOverdue || undefined,
        includeColumns: form.includeColumns ? splitTags(form.includeColumns) : undefined,
        sendTo: form.sendTo ? splitTags(form.sendTo) : undefined,
        academicYearId: form.academicYearId || undefined,
        school_code: staffSession?.schoolcode ?? "",
      });
      Alert.alert("Report logged", "The accountant report request has been recorded.");
      setModalOpen(false);
      load();
    } catch (err) {
      Alert.alert("Could not generate", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item: AccountantReport) {
    Alert.alert("Delete report", `Delete the ${item.reportType} report?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAccountantReport(item.id);
            load();
          } catch (err) {
            Alert.alert("Could not delete", getErrorMessage(err));
          }
        },
      },
    ]);
  }

  return (
    <PermissionGate module={MODULES.ACCOUNTANTS} action="read">
      <Screen topInset={false}>
        <PageHeader
          title="Accountant Reports"
          description="Log fee, defaulter and reconciliation report requests."
          actions={
            canWrite ? (
              <Button title="+ New report" variant="secondary" onPress={openModal} />
            ) : null
          }
        />

        <View style={styles.filtersRow}>
          <View style={styles.filter}>
            <InlineSelect label="Type" value={reportType} options={ALL_TYPES} onSelect={setReportType} />
          </View>
          <View style={styles.filter}>
            <InlineSelect label="Format" value={format} options={ALL_FORMATS} onSelect={setFormat} />
          </View>
        </View>
        <InlineSelect label="Class" value={classFilter} options={allClasses} onSelect={setClassFilter} />

        <DataState
          loading={loading}
          error={error}
          retry={load}
          empty={items.length === 0 ? "No accountant reports yet." : null}
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
                    <Text style={styles.cardTitle}>{item.reportType}</Text>
                    <Text style={styles.cardMeta}>As of {formatDate(item.asOfDate)}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Badge tone="brand">{item.format}</Badge>
                    <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                      <Feather name="trash-2" size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
                {item.classFilter ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Class</Text>
                    <Text style={styles.infoValue}>{item.classFilter}</Text>
                  </View>
                ) : null}
                {item.minOverdue ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Minimum overdue</Text>
                    <Text style={styles.infoValue}>{item.minOverdue}</Text>
                  </View>
                ) : null}
                {item.includeColumns?.length ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Columns</Text>
                    <Text style={styles.infoValue}>{item.includeColumns.join(", ")}</Text>
                  </View>
                ) : null}
                {item.sendTo?.length ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Send to</Text>
                    <Text style={styles.infoValue}>{item.sendTo.join(", ")}</Text>
                  </View>
                ) : null}
                <Text style={styles.cardMeta}>Requested {formatDate(item.createdAt)}</Text>
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
              <Text style={styles.modalTitle}>Log accountant report</Text>
              <Text style={styles.modalHint}>
                This records the report parameters — the generated file is prepared separately by the
                accounts team.
              </Text>

              <InlineSelect
                label="Report type"
                value={form.reportType}
                options={ACCOUNTANT_REPORT_TYPE_OPTIONS}
                onSelect={(v) => setForm((f) => ({ ...f, reportType: v as AccountantReportType }))}
                placeholder="Select report type"
              />
              <DateInput label="As of date" value={form.asOfDate} onChangeDate={(d) => setForm((f) => ({ ...f, asOfDate: d }))} />
              <InlineSelect
                label="Class (optional)"
                value={form.classFilter}
                options={allClasses}
                onSelect={(v) => setForm((f) => ({ ...f, classFilter: v }))}
              />
              <InlineSelect
                label="Minimum overdue (optional)"
                value={form.minOverdue}
                options={ACCOUNTANT_REPORT_MIN_OVERDUE_OPTIONS.map((m) => ({ value: m, label: m }))}
                onSelect={(v) => setForm((f) => ({ ...f, minOverdue: v as AccountantReportMinOverdue }))}
              />
              <Input
                label="Include columns (comma separated)"
                value={form.includeColumns}
                onChangeText={(v) => setForm((f) => ({ ...f, includeColumns: v }))}
                placeholder="student_name, roll_number, class..."
              />
              <InlineSelect
                label="Format"
                value={form.format}
                options={ACCOUNTANT_REPORT_FORMATS.map((fmt) => ({ value: fmt, label: fmt }))}
                onSelect={(v) => setForm((f) => ({ ...f, format: v as AccountantReportFormat }))}
              />
              <Input
                label="Send to (comma separated emails)"
                value={form.sendTo}
                onChangeText={(v) => setForm((f) => ({ ...f, sendTo: v }))}
                placeholder="accounts@school.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <InlineSelect
                label="Academic year (optional)"
                value={form.academicYearId}
                options={yearOptions}
                onSelect={(v) => setForm((f) => ({ ...f, academicYearId: v }))}
              />

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} style={styles.modalBtn} />
                <Button
                  title={saving ? "Saving..." : "Log report"}
                  onPress={handleGenerate}
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
  filtersRow: {
    flexDirection: "row",
    gap: 10,
  },
  filter: {
    flex: 1,
  },
  list: {
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    gap: 4,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
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
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.ink,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
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
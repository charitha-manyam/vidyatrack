import { useCallback, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { Button } from "../../components/Button";
import { InlineSelect } from "../../components/InlineSelect";
import { DateInput } from "../../components/DateInput";
import { PermissionGate } from "../../components/PermissionGate";
import { MODULES } from "../../config/rbac";
import { getPendingFeesBreakdown } from "../../api/fees.api";
import { getErrorMessage } from "../../lib/errors";
import { useSelectOptions, sectionsFor } from "../../hooks/useSelectOptions";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";
import type { PendingFeeBreakdownItem } from "../../types/fees";

type Props = NativeStackScreenProps<FeesStackParamList, "PendingFees">;

function formatINR(value: number) {
  return `Rs ${new Intl.NumberFormat("en-IN").format(Math.round(value || 0))}`;
}

function statusTone(status?: string): BadgeTone {
  const s = String(status ?? "").toUpperCase();
  if (s === "PAID") return "green";
  if (s === "PARTIAL") return "amber";
  return "red";
}

export function PendingFeesScreen(_: Props) {
  const { options } = useSelectOptions(["classes", "sections"]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [items, setItems] = useState<PendingFeeBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<PendingFeeBreakdownItem[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingFeesBreakdown();
      setItems(res.items);
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

  const sections = sectionsFor(options, classId);
  const classLabel = (options.classes ?? []).find((o) => o.value === classId)?.label;
  const sectionLabel = sections.find((o) => o.value === sectionId)?.label;

  const inDateRange = (d: string | undefined) => {
    if (!dueFrom && !dueTo) return true;
    if (!d) return false;
    return (!dueFrom || d >= dueFrom) && (!dueTo || d <= dueTo);
  };

  const studentRows = useMemo(() => {
    const map = new Map<string, PendingFeeBreakdownItem[]>();
    for (const item of items) {
      if (classLabel && item.className !== classLabel) continue;
      if (sectionLabel && item.sectionName !== sectionLabel) continue;
      if (!inDateRange(item.dueDate)) continue;
      const key = item.studentId;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([studentId, entries]) => ({
      studentId,
      studentName: entries[0].studentName,
      className: entries[0].className,
      sectionName: entries[0].sectionName,
      assigned: entries.reduce((sum, e) => sum + (e.originalAmount || 0), 0),
      paid: entries.reduce((sum, e) => sum + (e.paidAmount || 0), 0),
      balance: entries.reduce((sum, e) => sum + (e.balanceAmount || 0), 0),
      entries,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, classLabel, sectionLabel, dueFrom, dueTo]);

  const totalPending = studentRows.reduce((sum, r) => sum + r.balance, 0);

  return (
    <PermissionGate module={MODULES.FEES} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.pageTitle}>Pending Fees</Text>
            <Text style={styles.description}>
              Every student with a pending balance across their assigned fees and transport fees.
            </Text>

            <View style={styles.filtersRow}>
              <View style={styles.filter}>
                <InlineSelect
                  label="Class"
                  value={classId}
                  options={(options.classes ?? []) as { value: string; label: string }[]}
                  onSelect={(v) => {
                    setClassId(v);
                    setSectionId("");
                  }}
                  placeholder="All classes"
                />
              </View>
              <View style={styles.filter}>
                <InlineSelect
                  label="Section"
                  value={sectionId}
                  options={sections}
                  onSelect={setSectionId}
                  placeholder="All sections"
                />
              </View>
            </View>
            <View style={styles.filtersRow}>
              <View style={styles.filter}>
                <DateInput label="Due from" value={dueFrom} onChangeDate={setDueFrom} />
              </View>
              <View style={styles.filter}>
                <DateInput label="Due to" value={dueTo} onChangeDate={setDueTo} />
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryCount}>
                {studentRows.length} student{studentRows.length === 1 ? "" : "s"} with pending fees
              </Text>
              <Text style={styles.summaryTotal}>Total pending: {formatINR(totalPending)}</Text>
            </View>

            <DataState
              loading={loading}
              error={error}
              retry={load}
              empty={studentRows.length === 0 ? "No pending fees — all clear." : null}
            >
              <FlatList
                data={studentRows}
                keyExtractor={(r) => r.studentId}
                contentContainerStyle={styles.list}
                scrollEnabled={false}
                removeClippedSubviews={false}
                renderItem={({ item }) => (
                  <Pressable style={styles.studentRow} onPress={() => setSelectedStudent(item.entries)}>
                    <View style={styles.studentHeader}>
                      <View style={styles.studentIdWrap}>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {item.studentName ?? "Student"}
                        </Text>
                        <Text style={styles.studentClass} numberOfLines={1}>
                          {item.className ?? ""}
                          {item.className && item.sectionName ? " - " : ""}
                          {item.sectionName ?? ""}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={colors.inkGhost} />
                    </View>
                    <View style={styles.studentTable}>
                      <View style={styles.studentCell}>
                        <Text style={styles.studentLabel}>Assigned</Text>
                        <Text style={styles.studentValue}>{formatINR(item.assigned)}</Text>
                      </View>
                      <View style={styles.studentCell}>
                        <Text style={styles.studentLabel}>Paid</Text>
                        <Text style={styles.studentValue}>{formatINR(item.paid)}</Text>
                      </View>
                      <View style={styles.studentCell}>
                        <Text style={styles.studentLabel}>Pending</Text>
                        <Text style={[styles.studentValue, { color: colors.danger }]}>{formatINR(item.balance)}</Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            </DataState>
          </ScrollView>
        </View>
      </Screen>

      <Modal
        visible={!!selectedStudent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedStudent(null)} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedStudent?.[0]?.studentName ?? "Student"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedStudent?.[0]?.className ?? ""}
                {selectedStudent?.[0]?.className && selectedStudent?.[0]?.sectionName ? " - " : ""}
                {selectedStudent?.[0]?.sectionName ?? ""}
              </Text>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              {selectedStudent?.map((entry) => (
                <Card key={`${entry.studentId}-${entry.feeStructureId}-${entry.feeHeadName}`} style={styles.feeCard}>
                  <View style={styles.feeHeader}>
                    <Text style={styles.feeName} numberOfLines={1}>
                      {entry.feeHeadName || "Fee"}
                    </Text>
                    <Badge tone={statusTone(entry.status)}>{(entry.status ?? "PENDING").toUpperCase()}</Badge>
                  </View>
                  <Text style={styles.feeMeta} numberOfLines={1}>
                    Fee{entry.dueDate ? ` · Due ${entry.dueDate}` : ""}
                  </Text>
                  <View style={styles.feeBody}>
                    <Text style={styles.feeDue}>Rs {Number(entry.balanceAmount || 0).toLocaleString("en-IN")} due</Text>
                    <Text style={styles.feeOf}>of Rs {Number(entry.originalAmount || 0).toLocaleString("en-IN")}</Text>
                  </View>
                </Card>
              ))}
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button title="Close" variant="secondary" onPress={() => setSelectedStudent(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1 },
  content: { padding: 14, gap: 12, paddingBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: colors.ink },
  description: { fontSize: 13, lineHeight: 19, color: colors.inkFaint },
  filtersRow: { flexDirection: "row", gap: 10 },
  filter: { flex: 1 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 12,
  },
  summaryCount: { fontSize: 13, color: colors.inkSoft },
  summaryTotal: { fontSize: 13, fontWeight: "700", color: colors.ink },
  list: { gap: 8 },
  studentRow: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  studentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  studentIdWrap: { flex: 1, gap: 2 },
  studentName: { fontSize: 15, fontWeight: "600", color: colors.ink },
  studentClass: { fontSize: 13, color: colors.inkFaint },
  studentTable: { flexDirection: "row", gap: 8, paddingTop: 2 },
  studentCell: { flex: 1, gap: 2 },
  studentLabel: { fontSize: 11, color: colors.inkFaint },
  studentValue: { fontSize: 13, fontWeight: "600", color: colors.ink },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 18,
  },
  modalPanel: {
    backgroundColor: colors.white,
    borderRadius: 18,
    maxHeight: "85%",
  },
  modalHeader: { padding: 18, paddingBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  modalSubtitle: { fontSize: 13, color: colors.inkFaint, marginTop: 2 },
  modalContent: { padding: 18, gap: 10 },
  feeCard: { padding: 12, gap: 4 },
  feeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  feeName: { fontSize: 14, fontWeight: "600", color: colors.ink, flex: 1, marginRight: 8 },
  feeMeta: { fontSize: 12, color: colors.inkFaint },
  feeBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  feeDue: { fontSize: 14, fontWeight: "700", color: colors.danger },
  feeOf: { fontSize: 13, color: colors.inkSoft },
  modalFooter: { padding: 18, paddingTop: 6 },
});
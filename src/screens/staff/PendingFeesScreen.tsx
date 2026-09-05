import { useCallback, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { ListRow } from "../../components/ListRow";
import { StatTile } from "../../components/StatTile";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { Button } from "../../components/Button";
import { InlineSelect } from "../../components/InlineSelect";
import { PermissionGate } from "../../components/PermissionGate";
import { MODULES } from "../../config/rbac";
import { getPendingFeesBreakdown } from "../../api/fees.api";
import { getErrorMessage } from "../../lib/errors";
import { useSelectOptions, sectionsFor } from "../../hooks/useSelectOptions";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";
import type { PendingFeeBreakdownItem, PendingFeeTotals } from "../../types/fees";

type Props = NativeStackScreenProps<FeesStackParamList, "PendingFees">;

function formatINR(value: number) {
  return `Rs ${new Intl.NumberFormat("en-IN").format(Math.round(value || 0))}`;
}

export function PendingFeesScreen(_: Props) {
  const { options } = useSelectOptions(["classes", "sections"]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [items, setItems] = useState<PendingFeeBreakdownItem[]>([]);
  const [totals, setTotals] = useState<PendingFeeTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<PendingFeeBreakdownItem[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingFeesBreakdown();
      setItems(res.items);
      setTotals(res.totals);
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

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (!classId || !classLabel || i.className === classLabel) &&
          (!sectionId || !sectionLabel || i.sectionName === sectionLabel)
      ),
    [items, classId, classLabel, sectionId, sectionLabel]
  );

  const studentRows = useMemo(() => {
    const map = new Map<string, PendingFeeBreakdownItem[]>();
    for (const item of filtered) {
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
      balance: entries.reduce((sum, e) => sum + (e.balanceAmount || 0), 0),
      entries,
    }));
  }, [filtered]);

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
            <Text style={styles.description}>Assignment-level dues across the school.</Text>

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

            {totals ? (
              <View style={styles.grid}>
                <StatTile label="Total pending" value={formatINR(totals.totalPendingAmount)} tone="danger" />
                <StatTile label="Students" value={totals.totalStudents} tone="warning" />
              </View>
            ) : null}

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
                  <ListRow
                    title={item.studentName}
                    subtitle={`${item.className ?? ""}${item.className && item.sectionName ? " - " : ""}${item.sectionName ?? ""} · ${item.entries.length} fee${item.entries.length > 1 ? "s" : ""}`}
                    meta={formatINR(item.balance)}
                    tone="danger"
                    chevron
                    onPress={() => setSelectedStudent(item.entries)}
                  />
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
                    <Text style={styles.feeName}>{entry.feeHeadName || "Fee"}</Text>
                    {entry.dueDate ? <Badge tone="gray">Due {entry.dueDate}</Badge> : null}
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Original</Text>
                    <Text style={styles.infoValue}>{formatINR(entry.originalAmount)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Paid</Text>
                    <Text style={styles.infoValue}>{formatINR(entry.paidAmount)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Balance</Text>
                    <Text style={[styles.infoValue, { color: colors.danger }]}>{formatINR(entry.balanceAmount)}</Text>
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
  grid: { flexDirection: "row", gap: 12 },
  list: { gap: 8 },
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
  feeCard: { padding: 12, gap: 0 },
  feeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  feeName: { fontSize: 14, fontWeight: "600", color: colors.ink, flex: 1, marginRight: 8 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  infoLabel: { fontSize: 13, color: colors.inkSoft },
  infoValue: { fontSize: 13, fontWeight: "500", color: colors.ink },
  modalFooter: { padding: 18, paddingTop: 6 },
});
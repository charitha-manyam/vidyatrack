import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { StatTile } from "../../components/StatTile";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { StudentPicker } from "../../components/StudentPicker";
import { PermissionGate } from "../../components/PermissionGate";
import { MODULES } from "../../config/rbac";
import { useSelectOptions } from "../../hooks/useSelectOptions";
import { getStudentFeeSummary } from "../../api/fees.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";
import type { StudentFeeSummary } from "../../types/fees";

type Props = NativeStackScreenProps<FeesStackParamList, "StudentFeeSummary">;

function detailTone(status?: string): BadgeTone {
  const s = String(status ?? "").toUpperCase();
  if (s === "PAID") return "green";
  if (s === "PARTIAL") return "amber";
  if (s === "PENDING") return "red";
  return "gray";
}

export function StudentFeeSummaryScreen(_: Props) {
  const { options } = useSelectOptions(["classes", "sections", "students"]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [summary, setSummary] = useState<StudentFeeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (student: string) => {
    if (!student) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      setSummary((await getStudentFeeSummary(student)) ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (studentId) load(studentId);
    else setSummary(null);
  }, [studentId, load]);

  const details = summary?.details ?? [];

  return (
    <PermissionGate module={MODULES.FEES} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.pageTitle}>Student Fee Summary</Text>
            <Text style={styles.description}>
              Outstanding balance for one student. Pick a student to load their summary.
            </Text>

            <StudentPicker
              options={options}
              classId={classId}
              onClassChange={setClassId}
              sectionId={sectionId}
              onSectionChange={setSectionId}
              studentId={studentId}
              onStudentChange={setStudentId}
              studentPlaceholder="Select a student"
            />

            {studentId && loading ? <DataState loading /> : null}
            {studentId && !loading && error ? (
              <DataState error={error} retry={() => load(studentId)} />
            ) : null}

            {summary ? (
              <>
                <Text style={styles.studentName} numberOfLines={1}>
                  {summary.student_name ?? "Student"}
                </Text>
                <Text style={styles.studentClass} numberOfLines={1}>
                  {[summary.class_name, summary.section_name].filter(Boolean).join(" - ")}
                </Text>

                <View style={styles.grid}>
                  <StatTile label="Billed" value={`Rs ${Number(summary.totalOriginalAmount || 0).toLocaleString("en-IN")}`} tone="neutral" />
                  <StatTile label="Discount" value={`Rs ${Number(summary.totalDiscountAmount || 0).toLocaleString("en-IN")}`} tone="success" />
                  <StatTile label="Paid" value={`Rs ${Number(summary.totalPaidAmount || 0).toLocaleString("en-IN")}`} tone="brand" />
                  <StatTile label="Balance" value={`Rs ${Number(summary.totalBalanceAmount || 0).toLocaleString("en-IN")}`} tone={Number(summary.totalBalanceAmount || 0) > 0 ? "danger" : "success"} />
                </View>

                <Text style={styles.sectionTitle}>Fee details</Text>
                {details.length === 0 ? (
                  <Text style={styles.smallHint}>No fee details on record.</Text>
                ) : (
                  <View style={styles.list}>
                    {details.map((d, i) => (
                      <Card key={`${d.fee_structure}-${i}`} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            {d.fee_name ?? d.fee_structure ?? "Fee"}
                          </Text>
                          <Badge tone={detailTone(d.status)}>{d.status ?? "PENDING"}</Badge>
                        </View>
                        {d.billingCycle || d.dueDate ? (
                          <Text style={styles.cardSubtitle} numberOfLines={1}>
                            {[d.billingCycle ? d.billingCycle.replace("_", " ") : "", d.dueDate ? `due ${d.dueDate}` : ""]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                        ) : null}
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Original</Text>
                          <Text style={styles.infoValue}>{`Rs ${Number(d.originalAmount || 0).toLocaleString("en-IN")}`}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Discount</Text>
                          <Text style={styles.infoValue}>{`Rs ${Number(d.discountAmount || 0).toLocaleString("en-IN")}`}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Balance</Text>
                          <Text style={[styles.infoValue, Number(d.dueAmount || 0) > 0 && { color: colors.danger }]}>
                            {`Rs ${Number(d.dueAmount || 0).toLocaleString("en-IN")}`}
                          </Text>
                        </View>
                      </Card>
                    ))}
                  </View>
                )}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Screen>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, gap: 12, paddingBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: colors.ink },
  description: { fontSize: 13, lineHeight: 19, color: colors.inkFaint },
  studentName: { fontSize: 17, fontWeight: "700", color: colors.ink },
  studentClass: { fontSize: 13, color: colors.inkFaint },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: colors.ink, marginTop: 4 },
  smallHint: { fontSize: 12, color: colors.inkFaint, lineHeight: 17 },
  list: { gap: 10 },
  card: { padding: 14, gap: 6 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.ink, flex: 1 },
  cardSubtitle: { fontSize: 12, color: colors.inkFaint, lineHeight: 17 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  infoLabel: { fontSize: 13, color: colors.inkSoft },
  infoValue: { fontSize: 13, fontWeight: "600", color: colors.ink },
});
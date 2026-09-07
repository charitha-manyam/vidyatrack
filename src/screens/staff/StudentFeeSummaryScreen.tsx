import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { StatTile } from "../../components/StatTile";
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

function detailToneColor(status?: string): string {
  const s = String(status ?? "").toUpperCase();
  if (s === "PAID") return "#15803d";
  if (s === "PARTIAL") return "#b45309";
  if (s === "PENDING") return colors.danger;
  return colors.inkSoft;
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
  const totalOriginal = Number(summary?.totalOriginalAmount || 0);
  const totalDiscount = Number(summary?.totalDiscountAmount || 0);
  const totalPaid = Number(summary?.totalPaidAmount || 0);
  const totalDue = Number(summary?.totalBalanceAmount || 0);
  const totalFinal = totalPaid + totalDue;

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

                <View style={styles.statRow}>
                  <View style={styles.statCol}>
                    <StatTile label="Original" value={`Rs ${totalOriginal.toLocaleString("en-IN")}`} tone="neutral" />
                  </View>
                  <View style={styles.statCol}>
                    <StatTile label="Discount" value={`Rs ${totalDiscount.toLocaleString("en-IN")}`} tone="success" />
                  </View>
                  <View style={styles.statCol}>
                    <StatTile label="Final" value={`Rs ${totalFinal.toLocaleString("en-IN")}`} tone="brand" />
                  </View>
                </View>
                <View style={styles.statRow}>
                  <View style={styles.statCol}>
                    <StatTile label="Paid" value={`Rs ${totalPaid.toLocaleString("en-IN")}`} tone="warning" />
                  </View>
                  <View style={styles.statCol}>
                    <StatTile label="Due" value={`Rs ${totalDue.toLocaleString("en-IN")}`} tone={totalDue > 0 ? "danger" : "success"} />
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Fee details</Text>
                {details.length === 0 ? (
                  <Text style={styles.smallHint}>No fee details on record.</Text>
                ) : (
                  <View style={styles.detailList}>
                    {details.map((d, i) => (
                      <Card key={`${d.fee_structure}-${i}`} style={styles.detailCard}>
                        <View style={styles.detailHeader}>
                          <Text style={styles.detailTitle} numberOfLines={1}>
                            {d.fee_name ?? d.fee_structure ?? "Fee"}
                          </Text>
                          <Text style={[styles.detailStatus, { color: detailToneColor(d.status) }]}>
                            {d.status ?? "PENDING"}
                          </Text>
                        </View>
                        <View style={styles.detailBlock}>
                          <View style={styles.detailCell}>
                            <Text style={styles.detailLabel}>Original</Text>
                            <Text style={styles.detailValue}>
                              {Number(d.originalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </Text>
                          </View>
                          <View style={styles.detailCell}>
                            <Text style={styles.detailLabel}>Discount</Text>
                            <Text style={styles.detailValue}>
                              {Number(d.discountAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </Text>
                          </View>
                          <View style={styles.detailCell}>
                            <Text style={styles.detailLabel}>Final</Text>
                            <Text style={styles.detailValue}>
                              {Number(d.finalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.detailBlock}>
                          <View style={styles.detailCell}>
                            <Text style={styles.detailLabel}>Paid</Text>
                            <Text style={styles.detailValue}>
                              {Number(d.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </Text>
                          </View>
                          <View style={styles.detailCell}>
                            <Text style={styles.detailLabel}>Due</Text>
                            <Text style={[styles.detailValue, Number(d.dueAmount || 0) > 0 && { color: colors.danger }]}>
                              {Number(d.dueAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </Text>
                          </View>
                          <View style={styles.detailCell}>
                            <Text style={styles.detailLabel}>Due date</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>
                              {d.dueDate ?? "—"}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.detailMeta}>
                          Type: {(d.type ?? d.billingCycle ?? "—").replace("_", " ")}
                        </Text>
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
  statRow: { flexDirection: "row", gap: 8 },
  statCol: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: colors.ink, marginTop: 4 },
  smallHint: { fontSize: 12, color: colors.inkFaint, lineHeight: 17 },
  detailList: { gap: 10 },
  detailCard: { padding: 14, gap: 10 },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  detailTitle: { fontSize: 15, fontWeight: "700", color: colors.ink, flex: 1 },
  detailStatus: { fontSize: 12, fontWeight: "600" },
  detailBlock: { flexDirection: "row", gap: 8 },
  detailCell: { flex: 1, gap: 2 },
  detailLabel: { fontSize: 11, color: colors.inkFaint },
  detailValue: { fontSize: 13, fontWeight: "600", color: colors.ink },
  detailMeta: { fontSize: 12, color: colors.inkSoft, lineHeight: 17 },
});
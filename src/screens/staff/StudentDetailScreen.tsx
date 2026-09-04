import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { DataState } from "../../components/DataState";
import { StatTile } from "../../components/StatTile";
import {
  getMonthlyAttendance,
  getPendingFeeSummary,
  getStudentById,
} from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { StudentsStackParamList } from "../../navigation/types";
import type { PendingFeeSummaryItem, Student } from "../../types/school";

type Props = NativeStackScreenProps<StudentsStackParamList, "StudentDetail">;

function formatCurrency(value: number) {
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

export function StudentDetailScreen({ route }: Props) {
  const { studentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<PendingFeeSummaryItem | null>(null);
  const [attendance, setAttendance] = useState<{ present: number; absent: number; total: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);
      Promise.all([
        getStudentById(studentId),
        getPendingFeeSummary()
          .then((res) => res.items.find((i) => i.studentId === studentId) ?? null)
          .catch(() => null),
        getMonthlyAttendance(studentId, new Date().getMonth() + 1, new Date().getFullYear()).catch(() => null),
      ])
        .then(([s, f, a]) => {
          if (!active) return;
          setStudent(s ?? null);
          setFees(f);
          setAttendance(a ? a.summary : null);
        })
        .catch((err) => {
          if (active) setError(getErrorMessage(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [studentId])
  );

  return (
    <Screen>
      <DataState loading={loading} error={error}>
        {student && (
          <View style={styles.content}>
            <Card>
              <Text style={styles.name}>{`${student.first_name} ${student.last_name ?? ""}`.trim()}</Text>
              <Text style={styles.sub}>
                {student.className ?? "No class"}
                {student.sectionName ? ` · Section ${student.sectionName}` : ""} · Roll {student.roll_number}
              </Text>
              <Text style={[styles.badge, { color: student.status === "active" ? colors.success : colors.inkFaint }]}>
                {(student.status ?? "active").toUpperCase()}
              </Text>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Profile</Text>
              <View style={styles.infoGrid}>
                <InfoRow label="Admission no" value={student.admission_number ?? "—"} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Date of birth" value={student.date_of_birth ?? "—"} />
                <InfoRow label="Blood group" value={student.blood_group ?? "—"} />
                <InfoRow label="Address" value={student.address ?? "—"} />
              </View>
            </Card>

            {attendance && (
              <View>
                <Text style={styles.sectionTitle}>Attendance this month</Text>
                <View style={styles.grid}>
                  <StatTile label="Present" value={attendance.present} tone="success" />
                  <StatTile label="Absent" value={attendance.absent} tone={attendance.absent > 0 ? "danger" : "neutral"} />
                </View>
              </View>
            )}

            <View>
              <Text style={styles.sectionTitle}>Fees</Text>
              {fees ? (
                <Card>
                  <View style={styles.grid}>
                    <StatTile label="Assigned" value={formatCurrency(fees.totalAssignedAmount)} />
                    <StatTile label="Paid" value={formatCurrency(fees.totalPaidAmount)} tone="success" />
                  </View>
                  <View style={styles.grid}>
                    <StatTile
                      label="Pending"
                      value={formatCurrency(fees.pendingAmount)}
                      tone={fees.pendingAmount > 0 ? "danger" : "success"}
                    />
                    <StatTile label="Status" value={fees.pendingAmount > 0 ? "DUE" : "CLEAR"} tone={fees.pendingAmount > 0 ? "warning" : "success"} />
                  </View>
                  {fees.feeBreakdown.length > 0 && (
                    <View style={styles.breakdown}>
                      {fees.feeBreakdown.map((line, idx) => (
                        <View key={`${line.feeHeadName ?? line.type}-${idx}`} style={styles.breakdownRow}>
                          <Text style={styles.breakdownName} numberOfLines={1}>
                            {line.feeHeadName ?? (line.type === "transport" ? "Transport fee" : "Fee")}
                          </Text>
                          <Text style={[styles.breakdownDue, { color: line.dueAmount > 0 ? colors.danger : colors.success }]}>
                            {formatCurrency(line.dueAmount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              ) : (
                <Card>
                  <Text style={styles.empty}>No pending fees — all clear.</Text>
                </Card>
              )}
            </View>
          </View>
        )}
      </DataState>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
  },
  sub: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkFaint,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  infoGrid: {
    gap: 8,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    flexShrink: 1,
    textAlign: "right",
  },
  breakdown: {
    marginTop: 12,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  breakdownName: {
    flex: 1,
    fontSize: 13,
    color: colors.inkSoft,
  },
  breakdownDue: {
    fontSize: 13,
    fontWeight: "700",
  },
  empty: {
    fontSize: 14,
    color: colors.success,
  },
});

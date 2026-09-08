import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
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
import { sectionsFor, useSelectOptions } from "../../hooks/useSelectOptions";
import {
  deleteReport,
  generateAttendanceReport,
  generateMonthlyFeeCollectionReport,
  generateStaffReport,
  generateStudentReport,
  getRecentlyGeneratedReports,
} from "../../api/report.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import {
  MONTHLY_FEE_COLLECTION_REPORT_SECTIONS,
  REPORT_RANGE_OPTIONS,
  STAFF_REPORT_SECTIONS,
  STUDENT_REPORT_SECTIONS,
} from "../../types/report";
import type {
  MonthlyFeeCollectionReportSections,
  RecentReport,
  ReportFormat,
  ReportGenerationResult,
  ReportRange,
  StaffReportSections,
  StudentReportSections,
} from "../../types/report";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "Reports">;

type ReportKind = "attendance" | "student" | "staff" | "monthly_fee";

const REPORT_KINDS: { value: ReportKind; label: string }[] = [
  { value: "attendance", label: "Attendance" },
  { value: "student", label: "Student" },
  { value: "staff", label: "Staff" },
  { value: "monthly_fee", label: "Monthly fee collection" },
];

const FORMAT_OPTIONS: { value: ReportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "json", label: "Preview (JSON)" },
];

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatPeriod(p: RecentReport["report_period"]): string {
  const f = p?.from ?? "";
  const t = p?.to ?? "";
  if (f && t) return `${f} → ${t}`;
  return f || t || "—";
}

function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable style={styles.checkRow} onPress={onToggle}>
      <Feather
        name={checked ? "check-square" : "square"}
        size={18}
        color={checked ? colors.brand600 : colors.inkGhost}
      />
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export function ReportsScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.ACCOUNTANTS, "create");

  const { options: optionSets } = useSelectOptions(["years", "classes", "sections", "students", "staff"]);
  const yearOptions = (optionSets.years ?? []) as { value: string; label: string }[];
  const classOptions = (optionSets.classes ?? []) as { value: string; label: string }[];
  const studentOptions = (optionSets.students ?? []) as { value: string; label: string }[];
  const staffOptions = (optionSets.staff ?? []) as { value: string; label: string }[];

  const [kind, setKind] = useState<ReportKind>("attendance");
  const [reportRange, setReportRange] = useState<ReportRange>("this_month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [email, setEmail] = useState("");

  const [studentSections, setStudentSections] = useState<StudentReportSections>({
    student_list: true,
    admission_report: false,
    transfer_report: false,
    class_strength: true,
    student_attendance: true,
    student_attendance_by_id: false,
  });
  const [staffSections, setStaffSections] = useState<StaffReportSections>({
    staff_list: true,
    staff_attendance: true,
    leave_utilization: false,
    payroll_report: false,
    staff_attendance_by_id: false,
  });
  const [feeSections, setFeeSections] = useState<MonthlyFeeCollectionReportSections>({
    monthly_collection_summary: true,
    student_overdue_list: true,
    fee_breakdown: false,
    partial_payments: false,
    late_fee_report: false,
  });

  const [recent, setRecent] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ReportGenerationResult | null>(null);

  const sectionOptions = sectionsFor(optionSets, classId);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      setRecent(await getRecentlyGeneratedReports({ limit: 50 }));
    } catch (err) {
      setListError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
    }, [loadRecent])
  );

  function toggleStudent(key: keyof StudentReportSections) {
    setStudentSections((s) => ({ ...s, [key]: !s[key] }));
  }
  function toggleStaff(key: keyof StaffReportSections) {
    setStaffSections((s) => ({ ...s, [key]: !s[key] }));
  }
  function toggleFee(key: keyof MonthlyFeeCollectionReportSections) {
    setFeeSections((s) => ({ ...s, [key]: !s[key] }));
  }

  async function generate() {
    setFormError(null);
    setResult(null);
    if (!academicYearId) {
      setFormError("Select an academic year.");
      return;
    }
    if (reportRange === "custom" && (!fromDate || !toDate)) {
      setFormError("Select a from and to date.");
      return;
    }
    if (kind === "attendance" && (!classId || !sectionId)) {
      setFormError("Select a class and section.");
      return;
    }

    setGenerating(true);
    const range = {
      report_range: reportRange,
      from_date: reportRange === "custom" ? fromDate : undefined,
      to_date: reportRange === "custom" ? toDate : undefined,
    };
    try {
      let res: ReportGenerationResult;
      switch (kind) {
        case "attendance":
          res = await generateAttendanceReport({
            ...range,
            class_id: classId,
            section_id: sectionId,
            academic_year_id: academicYearId,
            format,
            emailreport: email.trim().length > 0,
            email: email.trim() || undefined,
          });
          break;
        case "student":
          res = await generateStudentReport({
            ...range,
            academic_year_id: academicYearId,
            class_id: classId || undefined,
            section_id: sectionId || undefined,
            student_id: studentId || undefined,
            include_sections: studentSections,
          });
          break;
        case "staff":
          res = await generateStaffReport({
            ...range,
            academic_year_id: academicYearId,
            staff_id: staffId || undefined,
            include_sections: staffSections,
          });
          break;
        default:
          res = await generateMonthlyFeeCollectionReport({
            ...range,
            academic_year_id: academicYearId,
            class_id: classId || undefined,
            section_id: sectionId || undefined,
            student_id: studentId || undefined,
            include_sections: feeSections,
          });
      }
      setResult(res);
      Alert.alert("Report generated", res.message ?? "The report request was processed.");
      loadRecent();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  function confirmDelete(item: RecentReport) {
    Alert.alert(
      "Delete report",
      `Delete the ${item.report_type ?? "report"} from ${formatDate(item.generated_on)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReport(item.report_id);
              loadRecent();
            } catch (err) {
              Alert.alert("Could not delete", getErrorMessage(err));
            }
          },
        },
      ]
    );
  }

  return (
    <PermissionGate module={MODULES.ACCOUNTANTS} action="read">
      <Screen topInset={false}>
        <PageHeader title="Reports" description="Generate and track reports for your school." />

        <Card>
          <Text style={styles.cardTitle}>Generate report</Text>

          <InlineSelect label="Report type" value={kind} options={REPORT_KINDS} onSelect={(v) => setKind(v as ReportKind)} placeholder="Select report type" />
          <InlineSelect label="Academic year" value={academicYearId} options={yearOptions} onSelect={setAcademicYearId} placeholder="Select academic year" />
          <InlineSelect label="Period" value={reportRange} options={REPORT_RANGE_OPTIONS} onSelect={(v) => setReportRange(v as ReportRange)} />

          {reportRange === "custom" ? (
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <DateInput label="From" value={fromDate} onChangeDate={setFromDate} />
              </View>
              <View style={styles.dateCol}>
                <DateInput label="To" value={toDate} onChangeDate={setToDate} />
              </View>
            </View>
          ) : null}

          {kind === "attendance" ? (
            <>
              <InlineSelect label="Format" value={format} options={FORMAT_OPTIONS} onSelect={(v) => setFormat(v as ReportFormat)} />
              <InlineSelect label="Class" value={classId} options={classOptions} onSelect={setClassId} placeholder="Select class" />
              <InlineSelect label="Section" value={sectionId} options={sectionOptions} onSelect={setSectionId} placeholder="Select section" />
              <Input label="Email report to (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="reports@school.com" autoCapitalize="none" />
            </>
          ) : null}

          {kind === "student" ? (
            <>
              <InlineSelect label="Class (optional)" value={classId} options={classOptions} onSelect={setClassId} placeholder="All classes" />
              <InlineSelect label="Section (optional)" value={sectionId} options={sectionOptions} onSelect={setSectionId} placeholder="All sections" />
              <InlineSelect label="Student (optional)" value={studentId} options={studentOptions} onSelect={setStudentId} placeholder="All students" />
              <Text style={styles.toggleTitle}>Include sections</Text>
              {STUDENT_REPORT_SECTIONS.map((s) => (
                <CheckRow key={s.key} label={s.label} checked={Boolean(studentSections[s.key])} onToggle={() => toggleStudent(s.key)} />
              ))}
            </>
          ) : null}

          {kind === "staff" ? (
            <>
              <InlineSelect label="Staff member (optional)" value={staffId} options={staffOptions} onSelect={setStaffId} placeholder="All staff" />
              <Text style={styles.toggleTitle}>Include sections</Text>
              {STAFF_REPORT_SECTIONS.map((s) => (
                <CheckRow key={s.key} label={s.label} checked={Boolean(staffSections[s.key])} onToggle={() => toggleStaff(s.key)} />
              ))}
            </>
          ) : null}

          {kind === "monthly_fee" ? (
            <>
              <InlineSelect label="Class (optional)" value={classId} options={classOptions} onSelect={setClassId} placeholder="All classes" />
              <InlineSelect label="Section (optional)" value={sectionId} options={sectionOptions} onSelect={setSectionId} placeholder="All sections" />
              <InlineSelect label="Student (optional)" value={studentId} options={studentOptions} onSelect={setStudentId} placeholder="All students" />
              <Text style={styles.toggleTitle}>Include sections</Text>
              {MONTHLY_FEE_COLLECTION_REPORT_SECTIONS.map((s) => (
                <CheckRow key={s.key} label={s.label} checked={Boolean(feeSections[s.key])} onToggle={() => toggleFee(s.key)} />
              ))}
            </>
          ) : null}

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          {canWrite ? (
            <Button title={generating ? "Generating..." : "Generate report"} onPress={generate} isLoading={generating} />
          ) : null}

          {result ? (
            <View style={styles.result}>
              <View style={styles.resultHead}>
                <Feather name="check-circle" size={18} color={colors.success} />
                <Text style={styles.resultTitle}>{result.message || "Report generated"}</Text>
              </View>
              {result.report_id ? <Text style={styles.resultLine}>Report ID: {result.report_id}</Text> : null}
              {result.report_type ? <Text style={styles.resultLine}>Type: {result.report_type}</Text> : null}
              {result.report_period?.from || result.report_period?.to ? (
                <Text style={styles.resultLine}>Period: {formatPeriod(result.report_period)}</Text>
              ) : null}
              {result.email_sent !== undefined ? (
                <Text style={styles.resultLine}>Emailed: {result.email_sent ? "Yes" : "No"}</Text>
              ) : null}
            </View>
          ) : null}
        </Card>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recently generated</Text>
        </View>
        <DataState
          loading={loading}
          error={listError}
          retry={loadRecent}
          empty={recent.length === 0 ? "No reports generated yet." : null}
        >
          <FlatList
            scrollEnabled={false}
            data={recent}
            keyExtractor={(item) => item.report_id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Card style={styles.reportCard}>
                <View style={styles.reportHead}>
                  <View style={styles.reportTitleWrap}>
                    <Text style={styles.reportTitle} numberOfLines={1}>
                      {item.report_type || "Report"}
                    </Text>
                    <Text style={styles.reportMeta}>
                      {formatPeriod(item.report_period)} · {formatDate(item.generated_on)}
                    </Text>
                  </View>
                  <View style={styles.reportActions}>
                    {item.format ? <Badge>{item.format}</Badge> : null}
                    <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                      <Feather name="trash-2" size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            )}
          />
        </DataState>
      </Screen>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateCol: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkSoft,
    marginTop: 2,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checkLabel: {
    fontSize: 14,
    color: colors.ink,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  result: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    backgroundColor: colors.successBg,
    padding: 12,
    gap: 4,
  },
  resultHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    flex: 1,
  },
  resultLine: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  sectionHead: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkGhost,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  list: {
    gap: 10,
    paddingBottom: 20,
  },
  reportCard: {
    gap: 8,
  },
  reportHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  reportTitleWrap: {
    flex: 1,
    gap: 2,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  reportMeta: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  reportActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { StudentPicker } from "../../components/StudentPicker";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { useSelectOptions } from "../../hooks/useSelectOptions";
import {
  cancelPaymentLink,
  createPaymentLink,
  getAssignmentsByStudent,
  getPaymentLinksByStudent,
} from "../../api/fees.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";
import type { FeePaymentLink, StudentFeeAssignment } from "../../types/fees";

type Props = NativeStackScreenProps<FeesStackParamList, "FeePaymentLinks">;

function linkTone(status?: string): BadgeTone {
  if (status === "PAID") return "green";
  if (status === "PENDING") return "amber";
  if (status === "CANCELLED") return "red";
  return "gray";
}

export function FeePaymentLinksScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");
  const { options } = useSelectOptions(["classes", "sections", "students"]);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [links, setLinks] = useState<FeePaymentLink[]>([]);
  const [assignments, setAssignments] = useState<StudentFeeAssignment[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [feeStructureId, setFeeStructureId] = useState("");
  const [expiresInHours, setExpiresInHours] = useState("24");
  const [generatedLink, setGeneratedLink] = useState<FeePaymentLink | null>(null);
  const [generating, setGenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadStudentData = useCallback(async (student: string) => {
    if (!student) return;
    setLoadingStudent(true);
    setError(null);
    setGeneratedLink(null);
    setFeeStructureId("");
    try {
      const [spin, linkList] = await Promise.all([
        getAssignmentsByStudent(student),
        getPaymentLinksByStudent(student),
      ]);
      setAssignments(spin);
      setLinks(linkList);
    } catch (err) {
      setError(getErrorMessage(err));
      setAssignments([]);
      setLinks([]);
    } finally {
      setLoadingStudent(false);
    }
  }, []);

  useEffect(() => {
    if (studentId) loadStudentData(studentId);
    else {
      setAssignments([]);
      setLinks([]);
      setFeeStructureId("");
      setGeneratedLink(null);
    }
  }, [studentId, loadStudentData]);

  const eligible: SelectOption[] = assignments
    .filter((a) => a.status !== "PAID")
    .map((a) => ({
      value: a.feeStructureId,
      label: `${a.feeHeadName ?? "Fee"} — Rs ${Number(a.dueAmount || a.finalAmount || 0).toLocaleString("en-IN")}`,
    }));

  async function handleGenerate() {
    if (!studentId || !feeStructureId) return;
    setGenerating(true);
    try {
      const hours = Number(expiresInHours || 24);
      const res = await createPaymentLink({
        studentId,
        fee_type_id: feeStructureId,
        expiresInHours: isFinite(hours) && hours > 0 ? hours : 24,
      });
      setGeneratedLink(res ?? null);
      Alert.alert("Link generated", "Share the payment link with the student.");
      loadStudentData(studentId);
    } catch (err) {
      Alert.alert("Could not generate link", getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleCancel(link: FeePaymentLink) {
    const id = link.id ?? link.link_id;
    if (!id) return;
    if (link.status === "PAID") {
      Alert.alert("Cannot cancel", "This link has already been paid.");
      return;
    }
    setCancelling(true);
    try {
      await cancelPaymentLink(id);
      loadStudentData(studentId);
    } catch (err) {
      Alert.alert("Could not cancel", getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <PermissionGate module={MODULES.FEES} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.pageTitle}>Fee Payment Links</Text>
            <Text style={styles.description}>
              Generate shareable payment links a student can pay against.
            </Text>

            <StudentPicker
              options={options}
              classId={classId}
              onClassChange={setClassId}
              sectionId={sectionId}
              onSectionChange={setSectionId}
              studentId={studentId}
              onStudentChange={setStudentId}
            />

            {studentId && !loadingStudent && !error ? (
              <>
                {eligible.length > 0 ? (
                  <View style={styles.panel}>
                    <InlineSelect
                      label="Fee to collect"
                      value={feeStructureId}
                      options={eligible}
                      onSelect={setFeeStructureId}
                      placeholder="Select a due fee"
                    />
                    <Input
                      label="Expires in (hours)"
                      value={expiresInHours}
                      onChangeText={setExpiresInHours}
                      keyboardType="numeric"
                    />
                    <Button
                      title={generating ? "Generating…" : "Generate payment link"}
                      variant="secondary"
                      onPress={handleGenerate}
                      isLoading={generating}
                      disabled={!feeStructureId || generating || !canWrite}
                      style={[styles.generateBtn, canWrite && styles.primaryBtn]}
                      textStyle={canWrite ? styles.primaryBtnText : undefined}
                    />
                  </View>
                ) : (
                  <Text style={styles.smallHint}>No outstanding fees for this student.</Text>
                )}

                {generatedLink?.url ? (
                  <Card style={styles.linkCard}>
                    <Text style={styles.linkLabel}>Payment link (tap to copy/send)</Text>
                    <Text style={styles.linkUrl} selectable numberOfLines={3}>
                      {generatedLink.url}
                    </Text>
                    <Text style={styles.smallHint}>
                      Expires in {generatedLink.expiresInHours ?? expiresInHours} hours ·{" "}
                      {generatedLink.originalAmount != null
                        ? `Rs ${Number(generatedLink.originalAmount).toLocaleString("en-IN")}`
                        : ""}
                    </Text>
                  </Card>
                ) : null}

                <Text style={styles.sectionTitle}>Links for this student</Text>
                {links.length === 0 ? (
                  <Text style={styles.smallHint}>No links yet.</Text>
                ) : (
                  <View style={styles.list}>
                    {links.map((link) => {
                      const id = link.id ?? link.link_id;
                      return (
                        <Card key={id ?? link.url ?? Math.random().toString()} style={styles.card}>
                          <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle} numberOfLines={1}>
                              {link.feeHeadName ?? "Fee"}
                            </Text>
                            <Badge tone={linkTone(link.status)}>{link.status ?? "PENDING"}</Badge>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Amount</Text>
                            <Text style={styles.infoValue}>
                              Rs {Number(link.finalAmount ?? link.originalAmount ?? 0).toLocaleString("en-IN")}
                            </Text>
                          </View>
                          {link.expires_at ? (
                            <Text style={styles.smallHint} numberOfLines={1}>
                              Expires {link.expires_at.slice(0, 10)}
                            </Text>
                          ) : null}
                          {canWrite && link.status !== "PAID" && link.status !== "CANCELLED" ? (
                            <Button
                              title={cancelling ? "Cancelling…" : "Cancel link"}
                              variant="danger"
                              onPress={() => handleCancel(link)}
                              isLoading={cancelling}
                              style={styles.smallBtn}
                            />
                          ) : null}
                        </Card>
                      );
                    })}
                  </View>
                )}
              </>
            ) : null}

            {studentId && loadingStudent ? <DataState loading /> : null}
            {studentId && !loadingStudent && error ? (
              <DataState error={error} retry={() => loadStudentData(studentId)} />
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
  panel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  generateBtn: { marginTop: 2 },
  primaryBtn: { backgroundColor: colors.gradientStart, borderColor: colors.gradientStart },
  primaryBtnText: { color: colors.white },
  linkCard: { gap: 4 },
  linkLabel: { fontSize: 12, color: colors.inkSoft },
  linkUrl: { fontSize: 13, fontWeight: "600", color: colors.brand800, lineHeight: 19 },
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
  smallBtn: { marginTop: 4 },
});
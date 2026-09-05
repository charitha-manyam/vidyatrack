import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { useSelectOptions } from "../../hooks/useSelectOptions";
import {
  generateBulkPayslips,
  generatePayslip,
  getMonthlyPayrollSummary,
  getPayslips,
} from "../../api/payslip.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import { MONTH_OPTIONS } from "../../types/payslip";
import type { MonthlyPayrollSummary, Payslip } from "../../types/payslip";

type Props = NativeStackScreenProps<MoreStackParamList, "Payslips">;

function currentMonth() {
  return new Date().getMonth() + 1;
}
function currentYear() {
  return new Date().getFullYear();
}

function yearOptions() {
  const now = currentYear();
  return Array.from({ length: 5 }, (_, i) => String(now - i));
}

function formatAmount(value?: number) {
  return Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function InlineSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = options.find((o) => o.value === value);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={[styles.select, open && styles.selectOpen]} onPress={() => setOpen((c) => !c)}>
        <Text style={display && display.value ? styles.selectText : styles.placeholder}>
          {display ? display.label : placeholder}
        </Text>
        <View style={[styles.chevron, open && styles.chevronOpen]}>
          <Feather
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={open ? colors.white : colors.inkFaint}
          />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.options}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.option, value === option.value && styles.optionActive]}
              onPress={() => {
                onSelect(option.value);
                setOpen(false);
              }}
            >
              <Text style={[styles.optionText, value === option.value && styles.optionTextActive]}>
                {option.label}
              </Text>
              {value === option.value ? <Feather name="check" size={16} color={colors.brand700} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const TILES: { key: keyof MonthlyPayrollSummary; label: string }[] = [
  { key: "total_staff", label: "Staff" },
  { key: "total_gross_salary", label: "Gross" },
  { key: "total_deductions", label: "Deductions" },
  { key: "total_paid", label: "Paid" },
  { key: "total_pending", label: "Pending" },
];

export function PayslipsScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.ACCOUNTANTS, "update");

  const { options: optionSets } = useSelectOptions(["staff"]);
  const staffOptions = (optionSets.staff ?? []) as { value: string; label: string }[];

  const [month, setMonth] = useState(String(currentMonth()));
  const [year, setYear] = useState(String(currentYear()));
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [summary, setSummary] = useState<MonthlyPayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [genStaffId, setGenStaffId] = useState("");
  const [genMonth, setGenMonth] = useState(String(currentMonth()));
  const [genYear, setGenYear] = useState(String(currentYear()));
  const [bonus, setBonus] = useState("0");
  const [overtime, setOvertime] = useState("0");
  const [extraClass, setExtraClass] = useState("0");
  const [generating, setGenerating] = useState(false);

  const load = useCallback(
    async (m: number, y: number) => {
      setLoading(true);
      setError(null);
      try {
        const [payslipResult, summaryResult] = await Promise.all([
          getPayslips({ month: m, year: y, limit: 100 }),
          getMonthlyPayrollSummary(m, y),
        ]);
        setPayslips(payslipResult.data);
        setSummary(summaryResult);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      load(Number(month), Number(year));
    }, [load, month, year])
  );

  function openModal() {
    setGenStaffId("");
    setGenMonth(String(currentMonth()));
    setGenYear(String(currentYear()));
    setBonus("0");
    setOvertime("0");
    setExtraClass("0");
    setModalOpen(true);
  }

  async function handleGenerate() {
    if (!genStaffId) return;
    setGenerating(true);
    try {
      await generatePayslip({
        staff_id: genStaffId,
        month: Number(genMonth),
        year: Number(genYear),
        bonus: Number(bonus || 0),
        overtime: Number(overtime || 0),
        extra_class_payment: Number(extraClass || 0),
      });
      Alert.alert("Payslip generated", "Payslip generated successfully.");
      setModalOpen(false);
      load(Number(month), Number(year));
    } catch (err) {
      Alert.alert("Could not generate", getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleBulk() {
    setBulkLoading(true);
    try {
      const result = await generateBulkPayslips(Number(month), Number(year));
      Alert.alert("Generated", `Generated ${result.data?.generated_count ?? 0} payslip(s).`);
      load(Number(month), Number(year));
    } catch (err) {
      Alert.alert("Could not generate", getErrorMessage(err));
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <PermissionGate module={MODULES.ACCOUNTANTS} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.outer}>
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.pageTitle}>Payslips</Text>
            <Text style={styles.description}>Generate and track monthly payslips per staff member.</Text>

            <View style={styles.filtersRow}>
              <View style={styles.filter}>
                <InlineSelect label="Month" value={month} options={MONTH_OPTIONS} onSelect={setMonth} />
              </View>
              <View style={styles.filter}>
                <InlineSelect
                  label="Year"
                  value={year}
                  options={yearOptions().map((y) => ({ value: y, label: y }))}
                  onSelect={setYear}
                />
              </View>
            </View>

            {canWrite ? (
              <View style={styles.actions}>
                <Button
                  title={bulkLoading ? "Generating..." : "Generate all for month"}
                  variant="secondary"
                  onPress={handleBulk}
                  isLoading={bulkLoading}
                  disabled={bulkLoading}
                  style={styles.actionBtn}
                />
                <Button
                  title="+ Generate payslip"
                  variant="secondary"
                  onPress={openModal}
                  style={[styles.actionBtn, styles.primaryBtn]}
                  textStyle={styles.primaryBtnText}
                />
              </View>
            ) : null}

            {summary ? (
              <View style={styles.tiles}>
                {TILES.map((tile) => (
                  <View key={tile.key} style={styles.tile}>
                    <Text style={styles.tileLabel}>{tile.label}</Text>
                    <Text style={styles.tileValue}>{formatAmount(summary[tile.key])}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <DataState
              loading={loading}
              error={error}
              retry={() => load(Number(month), Number(year))}
              empty={payslips.length === 0 ? "No payslips for this month" : null}
            >
              <FlatList
                data={payslips}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                scrollEnabled={false}
                removeClippedSubviews={false}
                renderItem={({ item }) => (
                  <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.staff_name || "Staff"}
                      </Text>
                      <Badge tone={item.payment_status === "Paid" ? "green" : "amber"}>
                        {item.payment_status}
                      </Badge>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Gross</Text>
                      <Text style={styles.infoValue}>₹ {formatAmount(item.gross_salary)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Deductions</Text>
                      <Text style={styles.infoValue}>₹ {formatAmount(item.total_deductions)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Net</Text>
                      <Text style={styles.infoValue}>₹ {formatAmount(item.net_salary)}</Text>
                    </View>
                  </Card>
                )}
              />
            </DataState>
          </ScrollView>
        </View>
      </Screen>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalOpen(false)} />
          <View style={styles.modalPanel}>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Generate payslip</Text>
              <Text style={styles.modalHint}>
                Staff Attendance must already be marked for the selected staff member and month — this fails
                otherwise.
              </Text>

              <InlineSelect
                label="Staff member"
                value={genStaffId}
                options={staffOptions}
                onSelect={setGenStaffId}
                placeholder="Select staff"
              />

              <View style={styles.filtersRow}>
                <View style={styles.filter}>
                  <InlineSelect label="Month" value={genMonth} options={MONTH_OPTIONS} onSelect={setGenMonth} />
                </View>
                <View style={styles.filter}>
                  <InlineSelect
                    label="Year"
                    value={genYear}
                    options={yearOptions().map((y) => ({ value: y, label: y }))}
                    onSelect={setGenYear}
                  />
                </View>
              </View>

              <View style={styles.inputsRow}>
                <View style={styles.inputCol}>
                  <Input label="Bonus" value={bonus} onChangeText={setBonus} keyboardType="numeric" />
                </View>
                <View style={styles.inputCol}>
                  <Input label="Overtime" value={overtime} onChangeText={setOvertime} keyboardType="numeric" />
                </View>
              </View>
              <Input
                label="Extra class pay"
                value={extraClass}
                onChangeText={setExtraClass}
                keyboardType="numeric"
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setModalOpen(false)}
                  style={styles.modalBtn}
                />
                <Button
                  title={generating ? "Generating..." : "Generate"}
                  variant="secondary"
                  onPress={handleGenerate}
                  isLoading={generating}
                  disabled={!genStaffId || generating}
                  style={[styles.modalBtn, styles.primaryBtn]}
                  textStyle={styles.primaryBtnText}
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
  outer: { flex: 1 },
  screen: { flex: 1 },
  container: { padding: 14, gap: 12, paddingBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: colors.ink },
  description: { fontSize: 13, lineHeight: 19, color: colors.inkFaint },
  filtersRow: { flexDirection: "row", gap: 10 },
  filter: { flex: 1 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: colors.ink },
  select: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
  },
  selectOpen: { borderColor: colors.brand500 },
  selectText: { flex: 1, fontSize: 15, color: colors.ink },
  placeholder: { flex: 1, fontSize: 15, color: colors.inkFaint },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronOpen: { backgroundColor: colors.brand600 },
  options: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionActive: { backgroundColor: colors.brand50 },
  optionText: { fontSize: 14, color: colors.ink },
  optionTextActive: { color: colors.brand700, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1 },
  primaryBtn: { backgroundColor: colors.gradientStart, borderColor: colors.gradientStart },
  primaryBtnText: { color: colors.white },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    flexBasis: "30%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tileLabel: { fontSize: 11, fontWeight: "600", color: colors.inkGhost, textTransform: "uppercase" },
  tileValue: { fontSize: 17, fontWeight: "700", color: colors.ink, marginTop: 2 },
  list: { gap: 12, paddingBottom: 20 },
  card: { gap: 0 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.ink, flex: 1 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  infoLabel: { fontSize: 13, color: colors.inkSoft },
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
  modalContent: { padding: 18, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  modalHint: { fontSize: 12, lineHeight: 17, color: colors.inkFaint },
  inputsRow: { flexDirection: "row", gap: 10 },
  inputCol: { flex: 1 },
  modalActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  modalBtn: { flex: 1 },
});
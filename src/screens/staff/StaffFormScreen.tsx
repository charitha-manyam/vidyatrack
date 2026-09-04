import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { DateInput } from "../../components/DateInput";
import { useSelectOptions } from "../../hooks/useSelectOptions";
import { getStaffById } from "../../api/school.api";
import { apiClient } from "../../lib/apiClient";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "StaffForm">;

type FormState = Record<string, string>;

const roleOptions: Array<string | { label: string; value: string }> = [
  "Default (Staff)",
  "Admin",
  "Teacher",
  "Staff",
];

type SelectItem = string | { label: string; value: string };

function InlineSelect({
  label,
  value,
  placeholder,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: SelectItem[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  function labelOf(item: SelectItem): string {
    return typeof item === "string" ? item : item.label;
  }
  function valOf(item: SelectItem): string {
    return typeof item === "string" ? item : item.value;
  }

  const displayLabel = options.find((o) => valOf(o) === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.select, open && styles.selectOpen]}
        onPress={() => setOpen((current) => !current)}
      >
        <Text style={value ? styles.selectText : styles.placeholder}>
          {displayLabel ? labelOf(displayLabel) : placeholder}
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
          {options.map((option) => {
            const v = valOf(option);
            const l = labelOf(option);
            return (
              <Pressable
                key={v}
                style={[styles.option, value === v && styles.optionActive]}
                onPress={() => {
                  onSelect(v);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    value === v && styles.optionTextActive,
                  ]}
                >
                  {l}
                </Text>
                {value === v ? (
                  <Feather name="check" size={16} color={colors.brand700} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function StaffFormScreen({ navigation, route }: Props) {
  const staffId = route.params?.staffId;
  const isEdit = Boolean(staffId);
  const [form, setForm] = useState<FormState>({
    role: "Default (Staff)",
    department_id: "",
  });
  const [driver, setDriver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const setValue = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const { options } = useSelectOptions(["departments"]);
  const departmentOptions: SelectItem[] = useMemo(() => {
    const depts = options.departments ?? [];
    return [{ label: "None", value: "" }, ...depts];
  }, [options.departments]);

  useFocusEffect(
    useCallback(() => {
      if (!staffId) return;
      let alive = true;
      (async () => {
        try {
          setLoading(true);
          const staff = await getStaffById(staffId);
          if (!alive || !staff) return;
          setForm({
            name: staff.name ?? "",
            phone: staff.phone ?? "",
            email: staff.email ?? "",
            emp_number: staff.emp_number ?? "",
            school_code: "",
            role: staff.role ?? "Staff",
            department_id: staff.department?.id ?? "",
            qualification: staff.qualification ?? "",
            date_of_birth: staff.date_of_birth ?? "",
            date_of_join: staff.date_of_join ?? "",
            account_holder_name: staff.bank_account_name ?? "",
            account_number: staff.bank_account_number ?? "",
            ifsc_code: staff.ifsc_code ?? "",
          });
          setDriver(Boolean(staff.is_driver));
        } catch (err) {
          if (alive) setError(getErrorMessage(err));
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [staffId])
  );

  async function save() {
    if (
      !form.name?.trim() ||
      !form.phone?.trim() ||
      !form.school_code?.trim()
    ) {
      setError("Name, phone, and school code are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        can_be_driver: driver,
        role:
          form.role === "Default (Staff)" ? "staff" : form.role.toLowerCase(),
      };
      if (isEdit && staffId) {
        await apiClient.put(`/tenant/updatestaffById/${staffId}`, payload);
      } else {
        if (!form.email?.trim()) {
          setError("Email is required.");
          setSaving(false);
          return;
        }
        await apiClient.post("/tenant/staff", payload);
      }
      Alert.alert(
        isEdit ? "Staff member updated" : "Staff member added",
        undefined,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false} topInset={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.brand600} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} topInset={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {isEdit ? "Edit staff member" : "Add staff member"}
        </Text>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Name"
              value={form.name ?? ""}
              onChangeText={(v) => setValue("name", v)}
            />
          </View>
          <View style={styles.half}>
            <Input
              label="Phone"
              value={form.phone ?? ""}
              onChangeText={(v) => setValue("phone", v)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Email"
              value={form.email ?? ""}
              onChangeText={(v) => setValue("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.half}>
            <Input
              label="Employee number"
              value={form.emp_number ?? ""}
              onChangeText={(v) => setValue("emp_number", v)}
            />
          </View>
        </View>

        <Input
          label="School code"
          value={form.school_code ?? ""}
          onChangeText={(v) => setValue("school_code", v)}
          autoCapitalize="none"
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <InlineSelect
              label="Role"
              value={form.role ?? ""}
              placeholder="Select role"
              options={roleOptions}
              onSelect={(v) => setValue("role", v)}
            />
          </View>
          <View style={styles.half}>
            <InlineSelect
              label="Department"
              value={form.department_id ?? ""}
              placeholder="Select department"
              options={departmentOptions}
              onSelect={(v) => setValue("department_id", v)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Qualification"
              value={form.qualification ?? ""}
              onChangeText={(v) => setValue("qualification", v)}
            />
          </View>
          <View style={styles.half}>
            <DateInput
              label="Date of birth"
              value={form.date_of_birth ?? ""}
              onChangeDate={(v) => setValue("date_of_birth", v)}
              placeholder="mm/dd/yyyy"
            />
          </View>
        </View>

        <DateInput
          label="Date of joining"
          value={form.date_of_join ?? ""}
          onChangeDate={(v) => setValue("date_of_join", v)}
          placeholder="mm/dd/yyyy"
        />

        <Text style={styles.sectionTitle}>BANK DETAILS (OPTIONAL)</Text>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Account holder name"
              value={form.account_holder_name ?? ""}
              onChangeText={(v) => setValue("account_holder_name", v)}
            />
          </View>
          <View style={styles.half}>
            <Input
              label="Account number"
              value={form.account_number ?? ""}
              onChangeText={(v) => setValue("account_number", v)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Input
          label="IFSC code"
          value={form.ifsc_code ?? ""}
          onChangeText={(v) => setValue("ifsc_code", v)}
          autoCapitalize="characters"
        />

        <Pressable
          style={styles.driverRow}
          onPress={() => setDriver((current) => !current)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: driver }}
        >
          <View
            style={[styles.checkbox, driver && styles.checkboxChecked]}
          >
            {driver ? (
              <Feather name="check" size={13} color={colors.white} />
            ) : null}
          </View>
          <Text style={styles.driverText}>Can be assigned as a driver</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <Button
            variant="secondary"
            title="Cancel"
            onPress={() => navigation.goBack()}
          />
          <Button
            title={isEdit ? "Save changes" : "Add staff member"}
            onPress={save}
            isLoading={saving}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 2,
  },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  field: { gap: 6, flex: 1 },
  label: { fontSize: 13, fontWeight: "500", color: colors.ink },
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkGhost,
    letterSpacing: 0.5,
    marginTop: 6,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  driverText: { fontSize: 14, color: colors.inkSoft },
  error: { fontSize: 13, color: colors.danger },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
});

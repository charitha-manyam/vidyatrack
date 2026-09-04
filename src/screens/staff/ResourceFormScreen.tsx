import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { DateInput } from "../../components/DateInput";
import { TimeInput } from "../../components/TimeInput";
import { getResource } from "../../config/resources";
import { listResource, createResource, updateResource } from "../../api/resource.api";
import { sectionsFor, useSelectOptions } from "../../hooks/useSelectOptions";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "ResourceForm">;

function SubjectSelect({ label, placeholder, value, options, onSelect }: { label: string; placeholder: string; value: string; options: { label: string; value: string }[]; onSelect: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View style={styles.subjectField}>
      <Text style={styles.subjectLabel}>{label}</Text>
      <Pressable
        style={[styles.subjectSelect, open && styles.subjectSelectOpen]}
        onPress={() => setOpen((current) => !current)}
      >
        <Text style={selected ? styles.subjectSelectText : styles.subjectPlaceholder}>{selected?.label ?? placeholder}</Text>
        <View style={[styles.subjectChevron, open && styles.subjectChevronOpen]}>
          <Feather name={open ? "chevron-up" : "chevron-down"} size={17} color={open ? colors.white : colors.inkFaint} />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.subjectOptions}>
          {options.length === 0 ? <Text style={styles.noOptions}>{label === "Academic year" ? "Create an academic year first." : "No records are available yet."}</Text> : options.map((option) => (
            <Pressable key={option.value} style={[styles.subjectOption, option.value === value && styles.subjectOptionActive]} onPress={() => { onSelect(option.value); setOpen(false); }}>
              <Text style={[styles.subjectOptionText, option.value === value && styles.subjectOptionTextActive]}>{option.label}</Text>
              {option.value === value ? <Feather name="check" size={16} color={colors.brand700} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ResourceFormScreen({ navigation, route }: Props) {
  const config = getResource(route.params.resourceId);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(Boolean(route.params.itemId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (config?.id === "school-working-days" && !route.params.itemId) {
      setForm({ no_of_periods: "8", duration_of_period: "40" });
    }
  }, [config?.id, route.params.itemId]);
  const configuredSources = (config?.fields ?? []).map((field) => field.source).filter(Boolean);
  const sources = Array.from(new Set(config?.id === "subjects" ? [...configuredSources, "years"] : configuredSources)) as Parameters<typeof useSelectOptions>[0];
  const { options } = useSelectOptions(sources);
  const isSubjectForm = config?.id === "subjects";
  const [academicYear, setAcademicYear] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  useEffect(() => {
    if (isSubjectForm && !academicYear && options.years?.length) setAcademicYear(options.years[0].value);
  }, [academicYear, isSubjectForm, options.years]);
  const load = useCallback(async () => {
    if (!config || !route.params.itemId) { setLoading(false); return; }
    setLoading(true); setError(null);
    try { const item = (await listResource(config)).find((row) => String(row[config.mutationIdKey ?? "id"] ?? "") === route.params.itemId); if (item) setForm(Object.fromEntries(config.fields.map((field) => [field.key, String(item[field.key] ?? "")]))); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  }, [config, route.params.itemId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useLayoutEffect(() => {
    navigation.setOptions({ title: route.params.itemId ? `Edit ${config?.title ?? "item"}` : `Add ${config?.title ?? "item"}` });
  }, [navigation, config, route.params.itemId]);
  if (!config) return <Screen topInset={false}><Text>This module is not configured.</Text></Screen>;
  async function save() {
    const missing = config!.fields.find((field) => field.required && !String(form[field.key] ?? "").trim());
    if (missing) { setError(`${missing.label} is required.`); return; }
    setSaving(true); setError(null);
    try {
      if (config!.id === "school-working-days") {
        const to24 = (t: string) => {
          const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
          if (!m) return t;
          let h = Number(m[1]);
          const min = m[2];
          const ap = m[3].toUpperCase();
          if (ap === "PM" && h < 12) h += 12;
          if (ap === "AM" && h === 12) h = 0;
          return `${String(h).padStart(2, "0")}:${min}`;
        };
        const values = {
          selected_days: selectedDays,
          start_time: to24(form.start_time ?? ""),
          end_time: to24(form.end_time ?? ""),
          no_of_periods: Number(form.no_of_periods) || 8,
          duration_of_period: Number(form.duration_of_period) || 40,
          academicYearId: form.academicYearId ?? "",
        };
        if (route.params.itemId && config!.updatePath) await updateResource(config!, route.params.itemId, values); else if (config!.createPath) await createResource(config!, values); else { setError("This module does not support create or update."); return; }
      } else {
        const values = Object.fromEntries(config!.fields.map((field) => [field.key, field.type === "number" ? Number(form[field.key]) : form[field.key] ?? ""]));
        if (route.params.itemId && config!.updatePath) await updateResource(config!, route.params.itemId, values); else if (config!.createPath) await createResource(config!, values); else { setError("This module does not support create or update."); return; }
      }
      navigation.goBack();
    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  }
  if (isSubjectForm) {
    const classOptions = options.classes ?? [];
    const sectionOptions = sectionsFor(options, form.class_id ?? "");
    const staffOptions = options.staff ?? [];
    return (
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.subjectForm} keyboardShouldPersistTaps="handled">
            <SubjectSelect label="Academic year" placeholder="Select year" value={academicYear} options={options.years ?? []} onSelect={setAcademicYear} />
            <Text style={styles.subjectTitle}>{route.params.itemId ? "Edit subject" : "Add subject"}</Text>
            {loading ? <Text>Loading...</Text> : (
              <>
                <Input label="Subject name" placeholder="e.g. Mathematics" value={form.subject_name ?? ""} onChangeText={(value) => setForm((current) => ({ ...current, subject_name: value }))} />
                <View style={styles.subjectRow}>
                  <View style={styles.subjectHalf}><SubjectSelect label="Class" placeholder="Select class" value={form.class_id ?? ""} options={classOptions} onSelect={(value) => setForm((current) => ({ ...current, class_id: value, sectionid: "" }))} /></View>
                  <View style={styles.subjectHalf}><SubjectSelect label="Section" placeholder="Select section" value={form.sectionid ?? ""} options={sectionOptions} onSelect={(value) => setForm((current) => ({ ...current, sectionid: value }))} /></View>
                </View>
                <SubjectSelect label="Teacher" placeholder="Select teacher" value={form.teacher_id ?? ""} options={staffOptions} onSelect={(value) => setForm((current) => ({ ...current, teacher_id: value }))} />
              </>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.subjectFooter}>
              <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />
              <Button title={route.params.itemId ? "Save changes" : "Create subject"} onPress={save} isLoading={saving} />
            </View>
          </ScrollView>
        </View>
      </Screen>
    );
  }
  if (config.id === "school-working-days") {
    const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return (
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.workingForm} keyboardShouldPersistTaps="handled">
            <Text style={styles.workingTitle}>{route.params.itemId ? "Edit school working days" : "Set up school working days"}</Text>
            <Text style={styles.workingDescription}>Timetable and exam scheduling both validate against this. Set it up before building either.</Text>
            <SubjectSelect label="Academic year" placeholder="Select year" value={form.academicYearId ?? ""} options={options.years ?? []} onSelect={(value) => setForm((current) => ({ ...current, academicYearId: value }))} />
            <View style={styles.workingSection}>
              <Text style={styles.workingLabel}>Working days</Text>
              <View style={styles.dayGrid}>
                {dayOptions.map((day) => {
                  const checked = selectedDays.includes(day);
                  return <Pressable key={day} style={styles.dayOption} onPress={() => setSelectedDays((current) => checked ? current.filter((item) => item !== day) : [...current, day])} accessibilityRole="checkbox" accessibilityState={{ checked }}>
                    <View style={[styles.workingCheckbox, checked && styles.workingCheckboxChecked]}>{checked ? <Feather name="check" size={13} color={colors.white} /> : null}</View>
                    <Text style={styles.dayText}>{day}</Text>
                  </Pressable>;
                })}
              </View>
            </View>
            <View style={styles.workingRow}>
              <View style={styles.workingHalf}><TimeInput label="Start time" placeholder="09:00 AM" value={form.start_time ?? ""} onChangeTime={(value) => setForm((current) => ({ ...current, start_time: value }))} /></View>
              <View style={styles.workingHalf}><TimeInput label="End time" placeholder="04:00 PM" value={form.end_time ?? ""} onChangeTime={(value) => setForm((current) => ({ ...current, end_time: value }))} /></View>
            </View>
            <View style={styles.workingRow}>
              <View style={styles.workingHalf}><Input label="Number of periods" placeholder="8" value={form.no_of_periods ?? "8"} onChangeText={(value) => setForm((current) => ({ ...current, no_of_periods: value }))} keyboardType="numeric" /></View>
              <View style={styles.workingHalf}><Input label="Period duration (minutes)" placeholder="40" value={form.duration_of_period ?? "40"} onChangeText={(value) => setForm((current) => ({ ...current, duration_of_period: value }))} keyboardType="numeric" /></View>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.workingFooter}><Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} /><Button title={route.params.itemId ? "Save changes" : "Create"} onPress={save} isLoading={saving} /></View>
          </ScrollView>
        </View>
      </Screen>
    );
  }
  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            config.fields.map((field) =>
              field.type === "select" ? (
                <SubjectSelect
                  key={field.key}
                  label={field.label}
                  placeholder={`Select ${field.label.toLowerCase()}`}
                  value={form[field.key] ?? ""}
                  options={field.options ?? (field.source ? options[field.source] : []) ?? []}
                  onSelect={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                />
              ) : field.type === "date" ? (
                <DateInput
                  key={field.key}
                  label={field.label}
                  value={form[field.key] ?? ""}
                  onChangeDate={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                />
              ) : field.type === "time" ? (
                <TimeInput
                  key={field.key}
                  label={field.label}
                  value={form[field.key] ?? ""}
                  onChangeTime={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                />
              ) : (
                <Input
                  key={field.key}
                  label={field.label}
                  value={form[field.key] ?? ""}
                  onChangeText={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                  keyboardType={field.type === "number" ? "numeric" : "default"}
                  multiline={field.type === "textarea"}
                />
              )
            )
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title={route.params.itemId ? "Save changes" : "Create"} onPress={save} isLoading={saving} />
        </ScrollView>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  form: { gap: 14, paddingBottom: 32 },
  subjectForm: { gap: 16, paddingBottom: 32 },
  subjectTitle: { fontSize: 22, fontWeight: "700", color: colors.ink, marginTop: 4 },
  subjectRow: { flexDirection: "row", gap: 12 },
  subjectHalf: { flex: 1 },
  subjectField: { gap: 7 },
  subjectLabel: { fontSize: 13, fontWeight: "500", color: colors.ink, marginBottom: 6 },
  subjectSelect: { minHeight: 48, height: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white },
  subjectSelectOpen: { borderColor: colors.brand500 },
  subjectSelectText: { flex: 1, fontSize: 15, color: colors.ink },
  subjectPlaceholder: { flex: 1, fontSize: 15, color: colors.inkFaint },
  subjectChevron: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  subjectChevronOpen: { backgroundColor: colors.brand600 },
  subjectOptions: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white, marginTop: 6, overflow: "hidden", elevation: 4, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, zIndex: 10 },
  subjectOption: { minHeight: 46, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.line },
  subjectOptionActive: { backgroundColor: colors.brand50 },
  subjectOptionText: { fontSize: 15, color: colors.ink },
  subjectOptionTextActive: { color: colors.brand700, fontWeight: "600" },
  noOptions: { padding: 14, fontSize: 14, color: colors.inkFaint },
  subjectFooter: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 2 },
  workingForm: { gap: 14, paddingBottom: 32 },
  workingTitle: { fontSize: 22, fontWeight: "700", color: colors.ink, marginTop: 4 },
  workingDescription: { fontSize: 14, lineHeight: 20, color: colors.inkFaint, marginTop: -6 },
  workingSection: { gap: 8, marginTop: 4 },
  workingLabel: { fontSize: 14, fontWeight: "600", color: colors.ink },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dayOption: { flexDirection: "row", alignItems: "center", gap: 7, minWidth: 92 },
  workingCheckbox: { width: 18, height: 18, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 3, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  workingCheckboxChecked: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  dayText: { fontSize: 14, color: colors.inkSoft },
  workingRow: { flexDirection: "row", gap: 12 },
  workingHalf: { flex: 1 },
  workingFooter: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 2 },
  error: { color: colors.danger, fontSize: 13 },
});

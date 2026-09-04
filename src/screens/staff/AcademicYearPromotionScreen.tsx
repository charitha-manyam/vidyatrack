import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "AcademicYearPromotion">;

type PromotionKind = "students" | "staff";

function SelectField({ label, value, placeholder, onPress }: { label: string; value?: string; placeholder: string; onPress: () => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.select} onPress={onPress} accessibilityRole="button">
        <Text style={value ? styles.selectText : styles.placeholder}>{value || placeholder}</Text>
        <Feather name="chevron-down" size={18} color={colors.inkFaint} />
      </Pressable>
    </View>
  );
}

export function AcademicYearPromotionScreen({ navigation, route }: Props) {
  const kind: PromotionKind = route.params.kind;
  const isStudentFlow = kind === "students";
  const [targetYear, setTargetYear] = useState("");
  const [sourceClass, setSourceClass] = useState("");
  const [section, setSection] = useState("");
  const [role, setRole] = useState("");

  function choose(setValue: (value: string) => void, options: string[]) {
    Alert.alert("Choose an option", undefined, [
      ...options.map((option) => ({ text: option, onPress: () => setValue(option) })),
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <Screen scroll={false} topInset={false}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <SelectField label="Target academic year" value={targetYear} placeholder="Select year" onPress={() => choose(setTargetYear, ["2026-27", "2027-28"])} />
          {isStudentFlow ? (
            <>
              <SelectField label="Class (in the source year)" value={sourceClass} placeholder="Pick a target year first" onPress={() => choose(setSourceClass, ["Class 1", "Class 2", "Class 3"])} />
              <SelectField label="Section (optional)" value={section} placeholder="All sections" onPress={() => choose(setSection, ["All sections", "A", "B"])} />
            </>
          ) : <Input label="Filter by role (optional)" placeholder="e.g. teacher" value={role} onChangeText={setRole} autoCapitalize="none" />}
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Feather name="users" size={24} color={colors.inkGhost} /></View>
          <Text style={styles.emptyTitle}>{isStudentFlow ? "No students to review" : "No staff to review"}</Text>
          <Text style={styles.emptyText}>Choose a target year to load people and record an explicit decision for each one.</Text>
        </View>
        <View style={styles.footer}>
          <Button variant="secondary" title="Close" onPress={() => navigation.goBack()} />
          <Button title="Submit decisions" disabled={!targetYear} onPress={() => Alert.alert("No decisions yet", "Select people and record a decision before submitting.")} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18, paddingBottom: 32 },
  form: { gap: 14 },
  field: { gap: 7 },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink },
  select: { minHeight: 52, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white },
  selectText: { fontSize: 15, color: colors.ink },
  placeholder: { fontSize: 15, color: colors.inkFaint },
  emptyState: { alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderColor: colors.lineStrong, borderRadius: 14, padding: 30, backgroundColor: colors.white, minHeight: 190, justifyContent: "center" },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  emptyText: { maxWidth: 290, marginTop: 6, textAlign: "center", lineHeight: 19, fontSize: 13, color: colors.inkFaint },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
});

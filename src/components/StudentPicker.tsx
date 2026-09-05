import { StyleSheet, View } from "react-native";
import { InlineSelect } from "./InlineSelect";
import { sectionsFor, studentsFor, type OptionSource, type SelectOption } from "../hooks/useSelectOptions";
import { colors } from "../theme/colors";

type Options = Partial<Record<OptionSource, SelectOption[]>>;

// Class → Section → Student cascade used by the fee forms and pickers.
// The parent owns the selected ids (so pre-fills on edit work) and supplies
// the option sets via useSelectOptions(["classes","sections","students"]).
export function StudentPicker({
  options,
  classId,
  onClassChange,
  sectionId,
  onSectionChange,
  studentId,
  onStudentChange,
  studentPlaceholder = "Select student",
}: {
  options: Options;
  classId: string;
  onClassChange: (v: string) => void;
  sectionId: string;
  onSectionChange: (v: string) => void;
  studentId: string;
  onStudentChange: (v: string) => void;
  studentPlaceholder?: string;
}) {
  const sections = sectionsFor(options, classId);
  const students = studentsFor(options, classId, sectionId);
  return (
    <View style={styles.cascade}>
      <InlineSelect
        label="Class"
        value={classId}
        options={(options.classes ?? []) as SelectOption[]}
        onSelect={(v) => {
          onClassChange(v);
          onSectionChange("");
          onStudentChange("");
        }}
        placeholder="Select class"
      />
      <InlineSelect
        label="Section"
        value={sectionId}
        options={sections}
        onSelect={(v) => {
          onSectionChange(v);
          onStudentChange("");
        }}
        placeholder="Select section"
      />
      <InlineSelect
        label="Student"
        value={studentId}
        options={students}
        onSelect={onStudentChange}
        placeholder={studentPlaceholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cascade: { gap: 10, backgroundColor: colors.surfaceMuted, padding: 12, borderRadius: 12 },
});
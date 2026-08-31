import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { Button } from "../../components/Button";
import { deleteSection, getSectionsByClass, getStudents, getSubjects } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { ClassesStackParamList } from "../../navigation/types";
import type { Section, Student, Subject } from "../../types/school";

type Props = NativeStackScreenProps<ClassesStackParamList, "ClassDetail">;

export function ClassDetailScreen({ route, navigation }: Props) {
  const { classId, className } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);
      Promise.all([
        getSectionsByClass(classId).catch(() => [] as Section[]),
        getSubjects({ class_id: classId }).catch(() => [] as Subject[]),
        getStudents({ class_id: classId }).catch(() => [] as Student[]),
      ])
        .then(([s, sub, st]) => {
          if (!active) return;
          setSections(s);
          setSubjects(sub);
          setStudents(st);
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
    }, [classId])
  );

  const confirmDeleteSection = (section: Section) => {
    Alert.alert(`Delete section ${section.sectionName}?`, "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSection(section.id);
            setLoading(true);
          } catch (err) {
            Alert.alert("Delete failed", getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const sectionActions = (section: Section) => {
    if (section.isDefault) {
      Alert.alert(section.sectionName, "The default section can't be edited — add a real section instead.");
      return;
    }
    Alert.alert(`Section ${section.sectionName}`, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Edit",
        onPress: () =>
          navigation.navigate("SectionForm", {
            classId,
            className,
            sectionId: section.id,
            sectionName: section.sectionName,
            totalStrength: section.totalStrength,
          }),
      },
      { text: "Delete", style: "destructive", onPress: () => confirmDeleteSection(section) },
    ]);
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{className ?? "Class"}</Text>
        <Button
          title="Edit class"
          variant="secondary"
          onPress={() => navigation.navigate("ClassForm", { classId, className })}
        />
      </View>
      <DataState loading={loading} error={error}>
        <View style={styles.content}>
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Sections ({sections.length})</Text>
              <Button
                title="+ Add section"
                onPress={() => navigation.navigate("SectionForm", { classId, className })}
              />
            </View>
            {sections.length === 0 ? (
              <Card>
                <Text style={styles.empty}>No sections created for this class.</Text>
              </Card>
            ) : (
              sections.map((section) => (
                <ListRow
                  key={section.id}
                  title={section.isDefault ? `${section.sectionName} (default)` : section.sectionName}
                  subtitle={section.classTeacherName ? `Class teacher: ${section.classTeacherName}` : "No class teacher"}
                  meta={`${section.currentStrength ?? section.totalStrength}/${section.totalStrength}`}
                  tone={section.isDefault ? "warning" : "brand"}
                  onLongPress={() => sectionActions(section)}
                />
              ))
            )}
          </View>

          <View>
            <Text style={styles.sectionTitle}>Subjects ({subjects.length})</Text>
            {subjects.length === 0 ? (
              <Card>
                <Text style={styles.empty}>No subjects assigned yet.</Text>
              </Card>
            ) : (
              subjects.map((subject) => (
                <ListRow
                  key={subject.id}
                  title={subject.subject_name ?? subject.name ?? "Subject"}
                  subtitle={subject.teacher_name ? `Teacher: ${subject.teacher_name}` : null}
                />
              ))
            )}
          </View>

          <View>
            <Text style={styles.sectionTitle}>Students ({students.length})</Text>
            {students.length === 0 ? (
              <Card>
                <Text style={styles.empty}>No students in this class.</Text>
              </Card>
            ) : (
              students.map((student) => (
                <ListRow
                  key={student.id}
                  title={`${student.first_name} ${student.last_name ?? ""}`.trim()}
                  subtitle={`Roll ${student.roll_number}${student.sectionName ? ` · Sec ${student.sectionName}` : ""}`}
                  meta={student.status}
                  tone={student.status === "active" ? "success" : "neutral"}
                />
              ))
            )}
          </View>
        </View>
      </DataState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.ink,
    flexShrink: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  content: {
    gap: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkFaint,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  empty: {
    fontSize: 14,
    color: colors.inkFaint,
  },
});

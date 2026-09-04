import { useLayoutEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { createSection, deleteSection, updateSection } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import type { ClassesStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<ClassesStackParamList, "SectionForm">;

export function SectionFormScreen({ route, navigation }: Props) {
  const { classId, className, sectionId, sectionName, totalStrength } = route.params;
  const editing = sectionId ? { id: sectionId, sectionName: sectionName ?? "" } : null;

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? "Edit section" : "Add section" });
  }, [navigation, editing]);
  const [name, setName] = useState(editing?.sectionName ?? "");
  const [strength, setStrength] = useState(String(totalStrength ?? 40));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      setError("Section name is required");
      return;
    }
    const parsedStrength = Number.parseInt(strength, 10);
    if (!Number.isFinite(parsedStrength) || parsedStrength < 1) {
      setError("Total strength must be at least 1");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (editing) {
        await updateSection(editing.id, { sectionName: name.trim(), totalStrength: parsedStrength });
      } else {
        await createSection({ classId, sectionName: name.trim(), totalStrength: parsedStrength });
      }
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert(`Delete section ${editing.sectionName || ""}?`.trimEnd(), "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteSection(editing.id);
            navigation.goBack();
          } catch (err) {
            setError(getErrorMessage(err));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen topInset={false}>
      <View style={styles.form}>
        <Input label="Section name" placeholder="e.g. A" value={name} onChangeText={setName} error={error ?? undefined} />
        <Input
          label="Total strength (seats)"
          keyboardType="number-pad"
          value={strength}
          onChangeText={setStrength}
        />
        <Button title={editing ? "Save changes" : "Create section"} onPress={save} isLoading={saving} />
        {editing ? (
          <Button title="Delete section" variant="danger" onPress={confirmDelete} isLoading={deleting} />
        ) : null}
        <Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
    maxWidth: 480,
  },
});

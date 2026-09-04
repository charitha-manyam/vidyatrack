import { useLayoutEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { createClass, deleteClass, updateClass } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import type { ClassesStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<ClassesStackParamList, "ClassForm">;

export function ClassFormScreen({ route, navigation }: Props) {
  const editing = route.params?.classId
    ? { id: route.params.classId, className: route.params.className ?? "" }
    : null;

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? "Edit class" : "Add class" });
  }, [navigation, editing]);
  const [name, setName] = useState(editing?.className ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      setError("Class name is required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (editing) {
        await updateClass(editing.id, { class_name: name.trim() });
      } else {
        await createClass({ class_name: name.trim() });
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
    Alert.alert(`Delete ${editing.className || "this class"}?`, "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteClass(editing.id);
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
        <Input label="Class name" placeholder="e.g. Grade 5" value={name} onChangeText={setName} error={error ?? undefined} />
        <Button title={editing ? "Save changes" : "Create class"} onPress={save} isLoading={saving} />
        {editing ? (
          <Button title="Delete class" variant="danger" onPress={confirmDelete} isLoading={deleting} />
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

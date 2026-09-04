import { useLayoutEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { DateInput } from "../../components/DateInput";
import { createAcademicYear, updateAcademicYear } from "../../api/academicYear.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "AcademicYearForm">;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Port of admin-portal's AcademicYearFormDialog — year name + start/end
// dates ("YYYY-MM-DD", same values the web date inputs submit), with the
// same end-after-start validation.
export function AcademicYearFormScreen({ navigation, route }: Props) {
  const editing = Boolean(route.params?.yearId);
  const [yearName, setYearName] = useState(route.params?.yearName ?? "");
  const [startDate, setStartDate] = useState((route.params?.startDate ?? "").slice(0, 10));
  const [endDate, setEndDate] = useState((route.params?.endDate ?? "").slice(0, 10));
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [navigation]);

  async function handleSubmit() {
    if (!yearName.trim()) {
      setFieldError("Year name is required.");
      return;
    }
    if (!DATE_RE.test(startDate.trim()) || !DATE_RE.test(endDate.trim())) {
      setFieldError("Enter both dates as YYYY-MM-DD (e.g. 2026-04-01).");
      return;
    }
    if (new Date(endDate.trim()) <= new Date(startDate.trim())) {
      setFieldError("End date must be after start date.");
      return;
    }
    setFieldError(null);
    setIsSubmitting(true);
    try {
      const values = {
        yearName: yearName.trim(),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      };
      if (editing) {
        await updateAcademicYear(route.params!.yearId!, values);
        Alert.alert("Academic year updated", undefined, [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else {
        await createAcademicYear(values);
        Alert.alert("Academic year created", undefined, [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      Alert.alert("Save failed", getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Input label="Year name" placeholder="e.g. 2026-27" value={yearName} onChangeText={setYearName} />
          <DateInput label="Start date" value={startDate} onChangeDate={setStartDate} />
          <DateInput label="End date" value={endDate} onChangeDate={setEndDate} />
          {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}
          <View style={styles.footer}>
            <Button title={editing ? "Save changes" : "Create academic year"} onPress={handleSubmit} isLoading={isSubmitting} />
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  form: {
    gap: 14,
    paddingBottom: 32,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  footer: {
    marginTop: 4,
  },
});

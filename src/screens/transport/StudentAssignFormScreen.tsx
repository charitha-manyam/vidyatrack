import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { DataState } from "../../components/DataState";
import { getStudents } from "../../api/school.api";
import { assignStudentTransport, getTransportRoutes } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { Student } from "../../types/school";
import type { TransportRoute } from "../../types/transport";

type Props = NativeStackScreenProps<MoreStackParamList, "StudentAssignForm">;

export function StudentAssignFormScreen({ navigation }: Props) {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [routeId, setRouteId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [routeList, studentList] = await Promise.all([
          getTransportRoutes(),
          getStudents({ status: "active" }),
        ]);
        if (!alive) return;
        setRoutes(routeList);
        setStudents(studentList);
      } catch (err) {
        if (alive) setError(getErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const routeOptions: SelectOption[] = routes.map((r) => ({ value: r.id, label: r.name }));
  const studentOptions: SelectOption[] = students.map((s) => ({
    value: s.id,
    label: `${[s.first_name, s.last_name].filter(Boolean).join(" ")}${s.roll_number ? ` (${s.roll_number})` : ""}`,
  }));

  async function handleSubmit() {
    if (!studentId || !routeId) return;
    setSubmitting(true);
    try {
      await assignStudentTransport(studentId, routeId);
      Alert.alert("Assigned", "Student assigned to the route. Assigning again would replace a previous route.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Could not assign", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <DataState loading={loading} error={error} retry={() => navigation.goBack()}>
            <InlineSelect
              label="Route"
              value={routeId}
              options={routeOptions}
              onSelect={setRouteId}
              placeholder="Select a route"
            />
            <InlineSelect
              label="Student"
              value={studentId}
              options={studentOptions}
              onSelect={setStudentId}
              placeholder="Select a student"
            />
            <Text style={styles.hint}>
              A student can have only one route — assigning replaces any previous assignment.
            </Text>
            <Button
              title={submitting ? "Assigning…" : "Assign student"}
              onPress={handleSubmit}
              isLoading={submitting}
              disabled={!studentId || !routeId}
            />
          </DataState>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  content: { gap: 14, paddingBottom: 32 },
  hint: { fontSize: 12, lineHeight: 17, color: colors.inkFaint },
});
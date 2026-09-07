import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { DataState } from "../../components/DataState";
import { createTransportRoute, getTransportRouteById, updateTransportRoute } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "TransportRouteForm">;

function numOrUndef(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return isFinite(n) ? n : null;
}

export function TransportRouteFormScreen({ navigation, route }: Props) {
  const editing = Boolean(route.params?.routeId);
  const [name, setName] = useState("");
  const [fromkm, setFromkm] = useState("");
  const [tokm, setTokm] = useState("");
  const [monthlyfee, setMonthlyfee] = useState("");
  const [annuallyfee, setAnnuallyfee] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(editing);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!route.params?.routeId) return;
    try {
      const r = await getTransportRouteById(route.params.routeId);
      if (r) {
        setName(r.name ?? "");
        setFromkm(r.fromkm != null ? String(r.fromkm) : "");
        setTokm(r.tokm != null ? String(r.tokm) : "");
        setMonthlyfee(r.monthlyfee != null ? String(r.monthlyfee) : "");
        setAnnuallyfee(r.annuallyfee != null ? String(r.annuallyfee) : "");
      }
    } catch (err) {
      Alert.alert("Could not load route", getErrorMessage(err));
    } finally {
      setLoadingEdit(false);
    }
  }, [route.params?.routeId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editing ? "Edit route" : "Add route",
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [editing, navigation]);

  useEffect(() => {
    if (editing) loadExisting();
  }, [editing, loadExisting]);

  async function handleSubmit() {
    const mn = numOrUndef(monthlyfee);
    const an = numOrUndef(annuallyfee);
    if (!name.trim()) {
      setFieldError("Route name is required.");
      return;
    }
    if (mn == null && an == null) {
      setFieldError("Set at least one of monthly or annual fee.");
      return;
    }
    setFieldError(null);
    setIsSubmitting(true);
    const values = {
      name: name.trim(),
      fromkm: numOrUndef(fromkm),
      tokm: numOrUndef(tokm),
      monthlyfee: mn,
      annuallyfee: an,
    };
    try {
      if (editing) {
        await updateTransportRoute(route.params!.routeId!, values);
      } else {
        await createTransportRoute(values);
      }
      Alert.alert(editing ? "Route updated" : "Route created", undefined, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Save failed", getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingEdit) return <DataState loading />;

  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Input label="Route name" placeholder="e.g. Downtown to School" value={name} onChangeText={setName} />
          <View style={styles.row}>
            <Input label="From (km)" placeholder="0" value={fromkm} onChangeText={setFromkm} keyboardType="numeric" style={styles.half} />
            <Input label="To (km)" placeholder="10" value={tokm} onChangeText={setTokm} keyboardType="numeric" style={styles.half} />
          </View>
          <Input label="Monthly fee (Rs)" placeholder="2500" value={monthlyfee} onChangeText={setMonthlyfee} keyboardType="numeric" />
          <Input label="Annual fee (Rs)" placeholder="25000" value={annuallyfee} onChangeText={setAnnuallyfee} keyboardType="numeric" />
          {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}
          <View style={styles.footer}>
            <Button title={editing ? "Save changes" : "Create route"} onPress={handleSubmit} isLoading={isSubmitting} disabled={!name.trim()} />
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  form: { gap: 14, paddingBottom: 32 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  error: { fontSize: 13, color: colors.danger },
  footer: { marginTop: 4 },
});
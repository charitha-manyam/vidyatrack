import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { DataState } from "../../components/DataState";
import { useAuth } from "../../context/AuthContext";
import { createVehicle, getVehicleById, updateVehicle } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import { VEHICLE_STATUSES, type VehicleStatus } from "../../types/transport";

type Props = NativeStackScreenProps<MoreStackParamList, "VehicleForm">;

const STATUS_OPTIONS: SelectOption[] = VEHICLE_STATUSES.map((s) => ({ value: s, label: s }));

export function VehicleFormScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const editing = Boolean(route.params?.vehicleId);
  const schoolCode = session?.type === "staff" ? session.schoolcode : "";

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [model, setModel] = useState("");
  const [status, setStatus] = useState<VehicleStatus>("active");
  const [schoolCodeField, setSchoolCodeField] = useState(editing ? "" : schoolCode);
  const [loadingEdit, setLoadingEdit] = useState(editing);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!route.params?.vehicleId) return;
    try {
      const v = await getVehicleById(route.params.vehicleId);
      if (v) {
        setVehicleNumber(v.vehicle_number ?? "");
        setVehicleType(v.vehicle_type ?? "");
        setCapacity(v.capacity != null ? String(v.capacity) : "");
        setModel(v.model ?? "");
        setStatus(v.status ?? "active");
      }
    } catch (err) {
      Alert.alert("Could not load vehicle", getErrorMessage(err));
    } finally {
      setLoadingEdit(false);
    }
  }, [route.params?.vehicleId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editing ? "Edit vehicle" : "Add vehicle",
      headerRight: () => <Button variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [editing, navigation]);

  useEffect(() => {
    if (editing) loadExisting();
  }, [editing, loadExisting]);

  async function handleSubmit() {
    if (!vehicleNumber.trim()) {
      setFieldError("Vehicle number is required.");
      return;
    }
    if (!editing && !schoolCodeField.trim()) {
      setFieldError("School code is required.");
      return;
    }
    setFieldError(null);
    setIsSubmitting(true);
    const cap = Number(capacity);
    const common = {
      vehicle_number: vehicleNumber.trim(),
      vehicle_type: vehicleType || undefined,
      capacity: capacity.trim() && isFinite(cap) ? cap : undefined,
      model: model.trim() || undefined,
    };
    try {
      if (editing) {
        await updateVehicle(route.params!.vehicleId!, {
          ...common,
          status: status || "active",
        });
      } else {
        await createVehicle({
          ...common,
          status: status || "active",
          school_code: schoolCodeField.trim(),
        });
      }
      Alert.alert(editing ? "Vehicle updated" : "Vehicle created", undefined, [
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
          <Input label="Vehicle number" placeholder="TS09AB1234" value={vehicleNumber} onChangeText={setVehicleNumber} autoCapitalize="characters" />
          <Input label="Type" placeholder="e.g. Bus, Van" value={vehicleType} onChangeText={setVehicleType} />
          <Input label="Capacity" placeholder="Seats" value={capacity} onChangeText={setCapacity} keyboardType="numeric" />
          <Input label="Model" placeholder="e.g. Tata Starbus" value={model} onChangeText={setModel} />
          {editing ? (
            <InlineSelect
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onSelect={(v) => setStatus(v as VehicleStatus)}
            />
          ) : (
            <Input label="School code" placeholder="Your school code" value={schoolCodeField} onChangeText={setSchoolCodeField} />
          )}
          {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}
          <View style={styles.footer}>
            <Button title={editing ? "Save changes" : "Create vehicle"} onPress={handleSubmit} isLoading={isSubmitting} disabled={!vehicleNumber.trim()} />
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  form: { gap: 14, paddingBottom: 32 },
  error: { fontSize: 13, color: colors.danger },
  footer: { marginTop: 4 },
});
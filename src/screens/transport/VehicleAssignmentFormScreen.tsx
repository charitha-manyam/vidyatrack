import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { InlineSelect, type SelectOption } from "../../components/InlineSelect";
import { DataState } from "../../components/DataState";
import { useAuth } from "../../context/AuthContext";
import { getStaff } from "../../api/school.api";
import { assignVehicle, getTransportRoutes, getVehicles } from "../../api/transport.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { StaffMember } from "../../types/school";
import type { TransportRoute, Vehicle } from "../../types/transport";

type Props = NativeStackScreenProps<MoreStackParamList, "VehicleAssignmentForm">;

export function VehicleAssignmentFormScreen({ navigation }: Props) {
  const { session } = useAuth();
  const schoolCode = session?.type === "staff" ? session.schoolcode : "";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [drivers, setDrivers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vehicleId, setVehicleId] = useState("");
  const [slabId, setSlabId] = useState("");
  const [driverStaffId, setDriverStaffId] = useState("");
  const [schoolCodeField, setSchoolCodeField] = useState(schoolCode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [vehicleList, routeList, staffList] = await Promise.all([
          getVehicles(),
          getTransportRoutes(),
          getStaff(),
        ]);
        if (!alive) return;
        setVehicles(vehicleList);
        setRoutes(routeList);
        setDrivers(staffList.filter((s) => s.is_driver === true));
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

  const vehicleOptions: SelectOption[] = vehicles.map((v) => ({ value: v.id, label: v.vehicle_number }));
  const routeOptions: SelectOption[] = routes.map((r) => ({ value: r.id, label: r.name }));
  const driverOptions: SelectOption[] = drivers.map((d) => ({
    value: d.id,
    label: `${d.name}${d.phone ? ` (${d.phone})` : ""}`,
  }));

  async function handleSubmit() {
    if (!vehicleId || !slabId || !driverStaffId || !schoolCodeField.trim()) return;
    setSubmitting(true);
    try {
      await assignVehicle({
        vehicleId,
        slabId,
        driverStaffId,
        schoolCode: schoolCodeField.trim(),
      });
      Alert.alert("Assigned", "Vehicle and driver assigned to the route.", [
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
              label="Vehicle"
              value={vehicleId}
              options={vehicleOptions}
              onSelect={setVehicleId}
              placeholder="Select a vehicle"
            />
            <InlineSelect
              label="Route"
              value={slabId}
              options={routeOptions}
              onSelect={setSlabId}
              placeholder="Select a route"
            />
            {drivers.length === 0 ? (
              <Text style={styles.noDriverWarning}>
                No staff are marked as drivers yet — open a staff member's profile and enable "Can be assigned as a
                driver" first.
              </Text>
            ) : (
              <InlineSelect
                label="Driver"
                value={driverStaffId}
                options={driverOptions}
                onSelect={setDriverStaffId}
                placeholder="Select a driver"
              />
            )}
            <Input label="School code" value={schoolCodeField} onChangeText={setSchoolCodeField} />
            <Text style={styles.hint}>
              One vehicle serves one route at a time — assigning a vehicle or route that's already paired elsewhere moves
              it here.
            </Text>
            <Button
              title={submitting ? "Assigning…" : "Assign vehicle"}
              onPress={handleSubmit}
              isLoading={submitting}
              disabled={!vehicleId || !slabId || !driverStaffId || !schoolCodeField.trim()}
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
  noDriverWarning: { fontSize: 13, lineHeight: 18, color: colors.danger },
});
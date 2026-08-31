import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import {
  deleteAcademicYear,
  getAcademicYears,
  selectAcademicYear,
} from "../../api/academicYear.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { AcademicYearFull } from "../../types/academicYear";

type Props = NativeStackScreenProps<MoreStackParamList, "AcademicYears">;

function formatDate(value: string | undefined) {
  if (!value) return "â€”";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Port of admin-portal's features/academicYears/AcademicYearsPage â€” list
// years with the Active badge, set the active year, create/edit/delete.
// Same nav gating as the web sidebar: visible only with Classes:create.
export function AcademicYearsScreen({ navigation }: Props) {
  const { session, setSession } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.CLASSES, "create");

  const [years, setYears] = useState<AcademicYearFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setYears(await getAcademicYears());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSelect(year: AcademicYearFull) {
    setSelectingId(year.id);
    try {
      await selectAcademicYear(year.id);
      // Keep the session's academic-year badge in sync, same as the web
      // portal's authStore.setAcademicYear.
      if (session && session.type === "staff") {
        setSession({ ...session, academicYear: { id: year.id, yearName: year.yearName } });
      }
      load();
    } catch (err) {
      Alert.alert("Couldn't set active year", getErrorMessage(err));
    } finally {
      setSelectingId(null);
    }
  }

  const confirmDelete = (year: AcademicYearFull) => {
    Alert.alert(
      `Delete ${year.yearName}?`,
      "This can't be undone and may affect any records still linked to this year.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAcademicYear(year.id);
              load();
            } catch (err) {
              Alert.alert("Delete failed", getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const rowActions = (year: AcademicYearFull) => {
    const options: Array<{ text: string; style?: "cancel" | "destructive"; onPress?: () => void }> = [
      { text: "Cancel", style: "cancel" },
    ];
    if (!year.isActive) options.push({ text: "Set as active", onPress: () => handleSelect(year) });
    options.push({
      text: "Edit",
      onPress: () =>
        navigation.navigate("AcademicYearForm", {
          yearId: year.id,
          yearName: year.yearName,
          startDate: year.startDate,
          endDate: year.endDate,
        }),
    });
    options.push({ text: "Delete", style: "destructive", onPress: () => confirmDelete(year) });
    Alert.alert(year.yearName, undefined, options);
  };

  return (
    <PermissionGate module={MODULES.CLASSES} action="create">
      <Screen scroll={false}>
        <View style={styles.container}>
          <PageHeader
            title="Academic Years"
            description="Manage academic years and pick the active one."
            actions={
              canWrite ? (
                <Button title="+ Add year" onPress={() => navigation.navigate("AcademicYearForm", undefined)} />
              ) : null
            }
          />
          <DataState loading={loading} error={error} retry={load} empty={years.length === 0 ? "No academic years yet." : null}>
            <FlatList
              contentContainerStyle={styles.listContent}
              data={years}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  disabled={!canWrite}
                  onPress={() =>
                    navigation.navigate("AcademicYearForm", {
                      yearId: item.id,
                      yearName: item.yearName,
                      startDate: item.startDate,
                      endDate: item.endDate,
                    })
                  }
                  onLongPress={canWrite ? () => rowActions(item) : undefined}
                >
                  <View style={styles.textWrap}>
                    <View style={styles.nameLine}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.yearName}
                      </Text>
                      {item.isActive ? <Badge tone="green">Active</Badge> : null}
                    </View>
                    <Text style={styles.subtitle}>
                      {formatDate(item.startDate)} â€“ {formatDate(item.endDate)}
                    </Text>
                  </View>
                  {!item.isActive && canWrite ? (
                    <Pressable
                      hitSlop={8}
                      disabled={selectingId === item.id}
                      onPress={() => handleSelect(item)}
                      style={({ pressed }) => [styles.selectBtn, (pressed || selectingId === item.id) && styles.pressed]}
                    >
                      <Feather name="check-circle" size={20} color={colors.success} />
                    </Pressable>
                  ) : null}
                  {canWrite ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() => confirmDelete(item)}
                      style={({ pressed }) => [styles.selectBtn, pressed && styles.pressed]}
                    >
                      <Feather name="trash-2" size={18} color={colors.danger} />
                    </Pressable>
                  ) : null}
                  <Feather name="chevron-right" size={18} color={colors.inkGhost} />
                </Pressable>
              )}
            />
          </DataState>
        </View>
      </Screen>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  pressed: {
    backgroundColor: colors.surfaceHover,
  },
  selectBtn: {
    padding: 2,
    opacity: 0.9,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkFaint,
  },
});

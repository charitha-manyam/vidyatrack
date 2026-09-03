import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { PageHeader } from "../../components/ui/PageHeader";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { SearchBar } from "../../components/SearchBar";
import { StatTile } from "../../components/StatTile";
import { getStaff, getStaffStats } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import type { StaffMember, StaffStats } from "../../types/school";

type Props = NativeStackScreenProps<MoreStackParamList, "StaffDirectory">;

export function StaffDirectoryScreen({ }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([getStaff(), getStaffStats().catch(() => null)]);
      setStaff(list);
      setStats(s);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((m) =>
      [m.name, m.phone, m.emp_number, m.role, m.email ?? ""].join(" ").toLowerCase().includes(q)
    );
  }, [staff, search]);

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <PageHeader title="Staff directory" />

        {stats && (
          <View style={styles.grid}>
            <StatTile label="Total" value={stats.totalStaff} tone="brand" />
            <StatTile label="Teaching" value={stats.teacherCount} />
            <StatTile label="Non-teaching" value={stats.nonTeachingCount} />
          </View>
        )}

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, phone, or employee number" />
        <DataState loading={loading} error={error} retry={load} empty={filtered.length === 0 ? "No staff found." : null}>
          <FlatList
            contentContainerStyle={styles.listContent}
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ListRow
                title={item.name}
                subtitle={`${item.role}${item.department?.departmentName ? ` - ${item.department.departmentName}` : ""} - ${item.phone}`}
                meta={item.status}
                tone={item.status === "active" ? "success" : "neutral"}
              />
            )}
          />
        </DataState>
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
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
});

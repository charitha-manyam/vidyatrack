import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { SearchBar } from "../../components/SearchBar";
import { StatTile } from "../../components/StatTile";
import { getStaff, getStaffStats } from "../../api/school.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import type { StaffMember, StaffStats } from "../../types/school";
import { Feather } from "@expo/vector-icons";

type Props = NativeStackScreenProps<MoreStackParamList, "StaffDirectory">;

export function StaffDirectoryScreen({ navigation }: Props) {
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
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Staff</Text>
            <Text style={styles.description}>Teaching and non-teaching staff for this school.</Text>
          </View>
          <Button title="Add staff" onPress={() => navigation.navigate("StaffForm", undefined)} />
        </View>
        {stats && (
          <View style={styles.grid}>
            <StatTile label="Total staff" value={stats.totalStaff} tone="brand" />
            <StatTile label="Teachers" value={stats.teacherCount} />
            <StatTile label="Non-teaching" value={stats.nonTeachingCount} />
            <StatTile label="Pending leaves" value={stats.pendingLeaves} />
          </View>
        )}

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, phone, or employee number" />
        <DataState loading={loading} error={error} retry={load} empty={filtered.length === 0 ? "No staff found." : null}>
          <FlatList
            contentContainerStyle={styles.listContent}
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.staffCard}>
                <View style={styles.staffCell}><Text style={styles.columnLabel}>NAME</Text><Text style={styles.cellValue}>{item.name}</Text></View>
                <View style={styles.staffCell}><Text style={styles.columnLabel}>ROLE</Text><Text style={styles.cellValue}>{item.role}</Text></View>
                <View style={styles.staffCell}><Text style={styles.columnLabel}>PHONE</Text><Text style={styles.cellValue}>{item.phone || "-"}</Text></View>
                <View style={styles.staffCell}><Text style={styles.columnLabel}>DEPARTMENT</Text><Text style={styles.cellValue}>{item.department?.departmentName || "-"}</Text></View>
                <View style={styles.staffCell}><Text style={styles.columnLabel}>STATUS</Text><View style={[styles.status, item.status === "active" && styles.activeStatus]}><Text style={[styles.statusText, item.status === "active" && styles.activeStatusText]}>{item.status}</Text></View></View>
                <View style={styles.staffCell}><Text style={styles.columnLabel}>LEAVE BALANCE</Text><Text style={styles.cellValue}>{item.leavesBalance ?? item.leave_balance ?? "-"}</Text></View>
                <View style={styles.staffActions}><Pressable hitSlop={10} onPress={() => navigation.navigate("StaffForm", { staffId: item.id })}><Feather name="edit-2" size={18} color={colors.inkSoft} /></Pressable><Pressable hitSlop={10}><Feather name="user-x" size={18} color={colors.danger} /></Pressable></View>
              </View>
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
  description: { fontSize: 14, color: colors.inkFaint, marginTop: 4 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  staffCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 14, gap: 13 },
  staffCell: { gap: 4 },
  columnLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: colors.inkGhost },
  cellValue: { fontSize: 15, color: colors.ink },
  status: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: colors.surfaceMuted },
  activeStatus: { backgroundColor: colors.successBg },
  statusText: { fontSize: 12, color: colors.inkSoft, textTransform: "capitalize" },
  activeStatusText: { color: colors.success },
  staffActions: { flexDirection: "row", justifyContent: "flex-end", gap: 20, paddingTop: 2 },
});

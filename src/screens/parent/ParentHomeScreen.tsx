import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { useAuth } from "../../context/AuthContext";
import { useActiveChild } from "../../context/ChildContext";
import {
  getChildFeeSummary,
  getChildHomework,
  getChildMonthlyAttendance,
  getHolidays,
  getParentAnnouncements,
} from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import type { ParentTabParamList } from "../../navigation/types";
import type { ChildHomeworkItem, FeeSummaryWithDetails, Holiday, MonthlyAttendanceResponse, ParentAnnouncement } from "../../types/parent";

type Props = BottomTabScreenProps<ParentTabParamList, "Home">;

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

export function ParentHomeScreen({ navigation }: Props) {
  const { session } = useAuth();
  const parentSession = session && session.type === "parent" ? session : null;
  const { activeChild, children, loading: childLoading, error: childError, reload } = useActiveChild();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fees, setFees] = useState<FeeSummaryWithDetails | null>(null);
  const [attendance, setAttendance] = useState<MonthlyAttendanceResponse | null>(null);
  const [homework, setHomework] = useState<ChildHomeworkItem[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [announcements, setAnnouncements] = useState<ParentAnnouncement[]>([]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!activeChild) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const [feeSummary, monthly, hw, hols, anns] = await Promise.all([
          getChildFeeSummary(activeChild.id),
          getChildMonthlyAttendance(activeChild.id, now.getMonth() + 1, now.getFullYear()).catch(() => null),
          getChildHomework(activeChild.id).catch(() => [] as ChildHomeworkItem[]),
          getHolidays().catch(() => [] as Holiday[]),
          getParentAnnouncements().catch(() => [] as ParentAnnouncement[]),
        ]);
        setFees(feeSummary ?? null);
        setAttendance(monthly);
        setHomework(hw);
        setHolidays(hols);
        setAnnouncements(anns);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeChild]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const attendancePct =
    attendance && attendance.summary.total > 0
      ? Math.round((attendance.summary.present / attendance.summary.total) * 100)
      : null;
  const homeworkDue = homework.filter((h) => h.submission_status === "not_submitted").length;
  const today = new Date().toISOString().slice(0, 10);
  const nextHoliday = holidays
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  if (!parentSession) return null;

  if (!childLoading && children.length === 0) {
    return (
      <Screen>
        <PageHeader title={`Hi${parentSession.name ? `, ${parentSession.name.split(" ")[0]}` : ""}`} description={todayLabel()} />
        <DataState loading={childLoading} error={childError ?? error} retry={reload}>
          <View />
        </DataState>
        <Text style={styles.emptyText}>
          No children linked to your account. If this looks wrong, contact your school's office.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#3525cd" />}
    >
      <PageHeader
        title={`Hi${activeChild ? `, ${activeChild.name.split(" ")[0]}'s family` : ""}`}
        description={todayLabel()}
        actions={
          activeChild ? (
            <Text style={styles.childChip} onPress={() => navigation.navigate("More", { screen: "Children" })}>
              {activeChild.name.split(" ")[0]} · switch
            </Text>
          ) : null
        }
      />

      <DataState loading={loading || childLoading} error={error ?? childError} retry={() => load()}>
        <View style={styles.content}>
          <View style={styles.grid}>
            <StatCard
              label="Pending fees"
              value={fees ? `₹${fees.summary.totalDue.toLocaleString("en-IN")}` : "—"}
              icon="credit-card"
              tone={fees && fees.summary.totalDue > 0 ? "red" : "green"}
              onPress={() => navigation.navigate("Fees")}
            />
            <StatCard
              label="Attendance this month"
              value={attendancePct != null ? `${attendancePct}%` : "—"}
              icon="check-circle"
              tone={attendancePct != null && attendancePct < 75 ? "amber" : "green"}
              onPress={() => navigation.navigate("Attendance")}
            />
          </View>
          <View style={styles.grid}>
            <StatCard
              label="Homework due"
              value={homeworkDue}
              icon="book-open"
              tone={homeworkDue > 0 ? "amber" : "green"}
              onPress={() => navigation.navigate("Homework")}
            />
            <StatCard
              label="Next holiday"
              value={nextHoliday ? nextHoliday.holidayname : "None"}
              sublabel={nextHoliday?.date}
              icon="gift"
              tone="gray"
              onPress={() => navigation.navigate("More", { screen: "Holidays" })}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Feather name="bell" size={14} color="#3525cd" />
                <Text style={styles.cardTitle}>Announcements</Text>
              </View>
              <Text style={styles.link} onPress={() => navigation.navigate("More", { screen: "Announcements" })}>
                View all
              </Text>
            </View>
            {announcements.length === 0 ? (
              <Text style={styles.muted}>No announcements yet.</Text>
            ) : (
              announcements.slice(0, 3).map((a) => (
                <View key={a.id} style={styles.announcementItem}>
                  <Text style={styles.announcementTitle}>{a.title}</Text>
                  <Text style={styles.announcementMessage} numberOfLines={1}>
                    {a.message}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.linksCard}>
            <ListRow title="Marks & Results" chevron onPress={() => navigation.navigate("More", { screen: "Marks" })} />
            <ListRow title="Timetable" chevron onPress={() => navigation.navigate("More", { screen: "Timetable" })} />
          </View>
        </View>
      </DataState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  link: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3525cd",
  },
  muted: {
    fontSize: 13,
    color: "#9ca3af",
  },
  announcementItem: {
    gap: 2,
  },
  announcementTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  announcementMessage: {
    fontSize: 13,
    color: "#6b7280",
  },
  linksCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 8,
    gap: 4,
  },
  childChip: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3525cd",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 12,
  },
});

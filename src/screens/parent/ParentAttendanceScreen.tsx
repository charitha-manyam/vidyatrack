import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { NeedChild } from "../../components/NeedChild";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { DonutBreakdownCard } from "../../components/ui/DonutBreakdownCard";
import { useActiveChild } from "../../context/ChildContext";
import { getChildMonthlyAttendance } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { ParentTabParamList } from "../../navigation/types";
import type { AttendanceStatus, MonthlyAttendanceResponse } from "../../types/parent";

type Props = BottomTabScreenProps<ParentTabParamList, "Attendance">;

const STATUS_TONE: Record<AttendanceStatus, BadgeTone> = {
  present: "green",
  absent: "red",
  late: "amber",
  "half-day": "amber",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ParentAttendanceScreen({ }: Props) {
  const { activeChild } = useActiveChild();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonthlyAttendanceResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!activeChild) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      getChildMonthlyAttendance(activeChild.id, month, year)
        .then((d) => {
          if (active) setData(d);
        })
        .catch((err) => {
          if (active) setError(getErrorMessage(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [activeChild, month, year])
  );

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  }

  if (!activeChild) return <NeedChild />;

  const pct =
    data && data.summary.total > 0
      ? Math.round((data.summary.present / data.summary.total) * 100)
      : null;

  return (
    <Screen>
      <PageHeader title="Attendance" description={activeChild.name} />

      <View style={styles.monthRow}>
        <Pressable style={styles.monthBtn} onPress={() => shiftMonth(-1)}>
          <Text style={styles.monthBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <Pressable style={styles.monthBtn} onPress={() => shiftMonth(1)}>
          <Text style={styles.monthBtnText}>›</Text>
        </Pressable>
      </View>

      <DataState loading={loading} error={error}>
        {!data || data.summary.total === 0 ? (
          <Text style={styles.empty}>No attendance recorded for this month yet.</Text>
        ) : (
          <View style={styles.content}>
            <DonutBreakdownCard
              title="This month"
              description={pct != null ? `${pct}% present` : undefined}
              data={[
                { label: "Present", value: data.summary.present, color: "#16a34a" },
                { label: "Absent", value: data.summary.absent, color: "#ef4444" },
              ]}
            />

            <View style={styles.table}>
              {data.records.map((r) => (
                <View key={r.id} style={styles.tableRow}>
                  <Text style={styles.date}>{r.date}</Text>
                  <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                </View>
              ))}
            </View>
          </View>
        )}
      </DataState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  monthBtn: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.white,
  },
  monthBtnText: {
    fontSize: 16,
    color: colors.ink,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.inkSoft,
    minWidth: 110,
    textAlign: "center",
  },
  table: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  date: {
    fontSize: 13,
    color: colors.ink,
  },
  empty: {
    fontSize: 14,
    color: colors.inkFaint,
    textAlign: "center",
    paddingVertical: 40,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
});

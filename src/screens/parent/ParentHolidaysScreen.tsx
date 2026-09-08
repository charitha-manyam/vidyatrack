import { useCallback, useMemo, useState } from "react";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { getHolidays } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { Holiday } from "../../types/parent";

const TYPE_TONE: Record<Holiday["type"], BadgeTone> = {
  public: "brand",
  optional: "amber",
  restricted: "gray",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ParentHolidaysScreen() {
  const [items, setItems] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getHolidays());
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

  const sections = useMemo(() => {
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
    const byMonth = new Map<string, Holiday[]>();
    for (const h of sorted) {
      const key = h.date.slice(0, 7);
      const list = byMonth.get(key) ?? [];
      list.push(h);
      byMonth.set(key, list);
    }
    return Array.from(byMonth.entries()).map(([key, data]) => {
      const [year, month] = key.split("-");
      const title = `${MONTH_NAMES[Number(month) - 1]} ${year}`;
      return { title, data };
    });
  }, [items]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Screen scroll={false} topInset={false}>
      <View style={styles.container}>
        <Text style={styles.description}>
          This is your school's holiday calendar — the same for every child, not tied to a specific one.
        </Text>
        <DataState
          loading={loading}
          error={error}
          retry={load}
          empty={items.length === 0 ? "No holidays published yet." : null}
        >
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderSectionHeader={({ section }) => (
              <Text style={styles.monthHeader}>{section.title}</Text>
            )}
            renderItem={({ item }) => {
              const isPast = item.date < today;
              return (
                <View style={[styles.holidayRow, isPast && styles.holidayPast]}>
                  <View style={styles.iconBox}>
                    <Feather name="gift" size={16} color={colors.brand600} />
                  </View>
                  <View style={styles.textCol}>
                    <Text style={styles.name}>{item.holidayname}</Text>
                    <Text style={styles.date}>{item.date}</Text>
                  </View>
                  <Badge tone={TYPE_TONE[item.type]}>{item.type}</Badge>
                </View>
              );
            }}
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
  description: {
    fontSize: 13,
    color: colors.inkFaint,
    lineHeight: 18,
  },
  list: {
    paddingBottom: 12,
  },
  monthHeader: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.inkGhost,
    marginTop: 8,
    marginBottom: 8,
  },
  holidayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  holidayPast: {
    opacity: 0.5,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand50,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.ink,
  },
  date: {
    fontSize: 12,
    color: colors.inkFaint,
  },
});
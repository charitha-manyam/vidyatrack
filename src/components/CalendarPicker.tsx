import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface CalendarPickerProps {
  visible: boolean;
  initialDate?: Date;
  maximumDate?: Date;
  minimumDate?: Date;
  onSelect: (date: Date) => void;
  onCancel: () => void;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function CalendarPicker({ visible, initialDate, maximumDate, minimumDate, onSelect, onCancel }: CalendarPickerProps) {
  const base = initialDate ? new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()) : today();
  const [viewMonth, setViewMonth] = useState(base.getMonth());
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [mode, setMode] = useState<"day" | "month" | "year">("day");
  const yearScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (mode === "year") {
      const maxYear = 1900 + yearList.length - 1;
      const row = Math.floor((maxYear - viewYear) / 4);
      const rowHeight = 48;
      yearScrollRef.current?.scrollTo({ y: row * rowHeight, animated: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const max = maximumDate ? new Date(maximumDate.getFullYear(), maximumDate.getMonth(), maximumDate.getDate()) : undefined;
  const min = minimumDate ? new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate()) : undefined;

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const offset = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [viewMonth, viewYear]);

  const yearList = useMemo(() => {
    const current = new Date().getFullYear();
    const lo = 1900;
    const hi = current + 20;
    const out: number[] = [];
    for (let y = lo; y <= hi; y++) out.push(y);
    return out.sort((a, b) => b - a);
  }, [viewYear]);

  const monthLabel = `${MONTHS[viewMonth]} ${viewYear}`;

  function selectDate(day: number) {
    onSelect(new Date(viewYear, viewMonth, day));
  }

  function canGoPrev() {
    if (!min) return true;
    return new Date(viewYear, viewMonth, 1) > new Date(min.getFullYear(), min.getMonth(), 1);
  }

  function canGoNext() {
    if (!max) return true;
    return new Date(viewYear, viewMonth + 1, 0) < new Date(max.getFullYear(), max.getMonth() + 1, 0);
  }

  function prev() {
    if (mode === "year") { setViewYear(viewYear - 12); return; }
    if (mode === "month") { setViewYear(viewYear - 1); return; }
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else { setViewMonth(viewMonth - 1); }
  }

  function next() {
    if (mode === "year") { setViewYear(viewYear + 12); return; }
    if (mode === "month") { setViewYear(viewYear + 1); return; }
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else { setViewMonth(viewMonth + 1); }
  }

  function isDisabled(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day);
    if (max && d > max) return true;
    if (min && d < min) return true;
    return false;
  }

  function isSelected(day: number): boolean {
    return base.getFullYear() === viewYear && base.getMonth() === viewMonth && base.getDate() === day;
  }

  const pickerHeight = 400;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.sheet, { height: pickerHeight }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                if (mode === "day") setMode("month");
                else if (mode === "month") setMode("year");
                else setMode("day");
              }}
              style={styles.monthTitleBtn}
            >
              <Text style={styles.monthTitle}>{mode === "year" ? viewYear : monthLabel}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.ink} />
            </Pressable>
            <View style={styles.navRow}>
              {mode === "day" && (
                <>
                  <Pressable onPress={prev} disabled={!canGoPrev()} style={[styles.navBtn, !canGoPrev() && styles.navBtnDisabled]}>
                    <Ionicons name="chevron-back" size={20} color={!canGoPrev() ? colors.inkGhost : colors.ink} />
                  </Pressable>
                  <Pressable onPress={next} disabled={!canGoNext()} style={[styles.navBtn, !canGoNext() && styles.navBtnDisabled]}>
                    <Ionicons name="chevron-forward" size={20} color={!canGoNext() ? colors.inkGhost : colors.ink} />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {mode === "day" && (
            <View style={styles.dayArea}>
              <View style={styles.weekRow}>
                {WEEKDAYS.map((w) => (
                  <Text key={w} style={styles.weekday}>{w}</Text>
                ))}
              </View>
              <View style={styles.grid}>
                {cells.map((day, i) =>
                  day === null ? (
                    <View key={i} style={styles.cell} />
                  ) : (
                    <Pressable
                      key={i}
                      disabled={isDisabled(day)}
                      onPress={() => selectDate(day)}
                      style={[styles.cell, isSelected(day) && styles.cellSelected, isDisabled(day) && styles.cellDisabled]}
                    >
                      <Text style={[styles.cellText, isSelected(day) && styles.cellTextSelected, isDisabled(day) && styles.cellTextDisabled]}>{day}</Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>
          )}

          {mode === "month" && (
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.monthGrid}>
              {MONTHS.map((m, idx) => {
                const selected = idx === viewMonth && mode === "month";
                return (
                  <Pressable key={m} style={[styles.monthCell, selected && styles.cellSelected]} onPress={() => { setViewMonth(idx); setMode("day"); }}>
                    <Text style={[styles.monthCellText, selected && styles.cellTextSelected]}>{m.slice(0, 3)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {mode === "year" && (
            <ScrollView ref={yearScrollRef} style={styles.scrollArea} contentContainerStyle={styles.yearGrid}>
              {yearList.map((y) => {
                const selected = y === viewYear;
                return (
                  <Pressable key={y} style={[styles.yearCell, selected && styles.cellSelected]} onPress={() => { setViewYear(y); setMode("month"); }}>
                    <Text style={[styles.yearCellText, selected && styles.cellTextSelected]}>{y}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Pressable onPress={onCancel} style={styles.footerBtn}>
              <Text style={styles.footerCancel}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={() => { if (mode !== "day") { setMode("day"); } else { onSelect(base); } }}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthTitleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
  },
  navRow: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    padding: 6,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayArea: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: colors.inkGhost,
    fontWeight: "600",
    paddingVertical: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellSelected: {
    backgroundColor: colors.brand600,
    borderRadius: 999,
  },
  cellDisabled: {
    opacity: 0.3,
  },
  cellText: {
    fontSize: 15,
    color: colors.ink,
  },
  cellTextSelected: {
    color: colors.white,
    fontWeight: "600",
  },
  cellTextDisabled: {
    color: colors.inkGhost,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 8,
  },
  monthCell: {
    width: `${100 / 3}%`,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  monthCellText: {
    fontSize: 16,
    color: colors.ink,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 8,
    paddingBottom: 8,
  },
  yearCell: {
    width: `${100 / 4}%`,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  yearCellText: {
    fontSize: 16,
    color: colors.ink,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerCancel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.inkFaint,
  },
  doneBtn: {
    backgroundColor: colors.brand600,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});

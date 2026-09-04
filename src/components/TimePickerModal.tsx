import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface TimePickerModalProps {
  visible: boolean;
  initialTime?: string;
  onSelect: (timeString: string) => void;
  onCancel: () => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"];

function parseTime(timeStr: string): { hour: number; minute: number; period: string } {
  const match = timeStr?.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hour = Number(match[1]);
    if (hour > 12) hour = 12;
    if (hour < 1) hour = 1;
    return { hour, minute: Number(match[2]), period: match[3].toUpperCase() };
  }
  return { hour: 9, minute: 0, period: "AM" };
}

function formatTime(hour: number, minute: number, period: string): string {
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

function NumberColumn({ items, selected, onSelect, width }: { items: number[]; selected: number; onSelect: (value: number) => void; width?: number }) {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.numColumn, width ? { width } : undefined]}
      showsVerticalScrollIndicator={false}
      snapToInterval={40}
      decelerationRate="fast"
    >
      <View style={styles.numPad} />
      {items.map((item) => {
        const isActive = item === selected;
        return (
          <Pressable key={item} style={[styles.numItem, isActive && styles.numItemActive]} onPress={() => onSelect(item)}>
            <Text style={[styles.numText, isActive && styles.numTextActive]}>{item}</Text>
          </Pressable>
        );
      })}
      <View style={styles.numPad} />
    </ScrollView>
  );
}

function PeriodColumn({ selected, onSelect }: { selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.periodCol}>
      {PERIODS.map((p) => {
        const isActive = p === selected;
        return (
          <Pressable key={p} style={[styles.periodItem, isActive && styles.periodItemActive]} onPress={() => onSelect(p)}>
            <Text style={[styles.periodText, isActive && styles.periodTextActive]}>{p}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TimePickerModal({ visible, initialTime, onSelect, onCancel }: TimePickerModalProps) {
  const parsed = parseTime(initialTime ?? "");
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Select time</Text>
          <View style={styles.colRow}>
            <View style={styles.col}>
              <Text style={styles.colLabel}>Hour</Text>
              <NumberColumn items={HOURS} selected={hour} onSelect={setHour} />
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.col}>
              <Text style={styles.colLabel}>Min</Text>
              <NumberColumn items={MINUTES} selected={minute} onSelect={setMinute} width={80} />
            </View>
            <View style={styles.col}>
              <Text style={styles.colLabel}>&nbsp;</Text>
              <PeriodColumn selected={period} onSelect={setPeriod} />
            </View>
          </View>
          <Text style={styles.preview}>{formatTime(hour, minute, period)}</Text>
          <View style={styles.footer}>
            <Pressable onPress={onCancel} style={styles.footerBtn}>
              <Text style={styles.footerCancel}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={() => { onSelect(formatTime(hour, minute, period)); setHour(parsed.hour); setMinute(parsed.minute); setPeriod(parsed.period); }}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ITEM_HEIGHT = 40;

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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
    textAlign: "center",
    marginBottom: 16,
  },
  colRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
    height: 200,
  },
  col: {
    alignItems: "center",
    flex: 1,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.inkGhost,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  numColumn: {
    height: 200,
  },
  numPad: {
    height: 80,
  },
  numItem: {
    height: ITEM_HEIGHT,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  numItemActive: {
    backgroundColor: colors.brand600,
    width: 56,
  },
  numText: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.ink,
  },
  numTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  colon: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.ink,
    paddingTop: 26,
  },
  periodCol: {
    gap: 10,
    paddingTop: 26,
  },
  periodItem: {
    height: 52,
    width: 60,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  periodItemActive: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  periodText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
  },
  periodTextActive: {
    color: colors.white,
  },
  preview: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: colors.brand600,
    marginTop: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
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

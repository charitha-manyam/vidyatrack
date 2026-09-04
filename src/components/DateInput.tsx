import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { CalendarPicker } from "./CalendarPicker";

interface DateInputProps {
  label: string;
  value: string;
  onChangeDate: (dateString: string) => void;
  error?: string;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  style?: object;
}

function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date();
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DateInput({ label, value, onChangeDate, error, placeholder, maximumDate, minimumDate, style }: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const hasValue = value !== undefined && value !== null && value.length > 0;

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setShowPicker(true)} style={[styles.inputContainer, Boolean(error) && styles.inputError]}>
        <Text style={[styles.inputText, !hasValue && styles.placeholder]} numberOfLines={1}>
          {hasValue ? value : placeholder ?? "YYYY-MM-DD"}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.inkFaint} style={styles.icon} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <CalendarPicker
        visible={showPicker}
        initialDate={parseDateString(value)}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onSelect={(date) => {
          onChangeDate(formatDateISO(date));
          setShowPicker(false);
        }}
        onCancel={() => setShowPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.ink,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
  },
  placeholder: {
    color: colors.inkFaint,
  },
  icon: {
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
});

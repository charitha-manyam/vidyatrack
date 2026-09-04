import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { TimePickerModal } from "./TimePickerModal";

interface TimeInputProps {
  label: string;
  value: string;
  onChangeTime: (timeString: string) => void;
  error?: string;
  placeholder?: string;
  style?: object;
}

export function TimeInput({ label, value, onChangeTime, error, placeholder, style }: TimeInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const hasValue = value !== undefined && value !== null && value.length > 0;

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setShowPicker(true)} style={[styles.inputContainer, Boolean(error) && styles.inputError]}>
        <Text style={[styles.inputText, !hasValue && styles.placeholder]} numberOfLines={1}>
          {hasValue ? value : placeholder ?? "HH:MM AM"}
        </Text>
        <Ionicons name="time-outline" size={20} color={colors.inkFaint} style={styles.icon} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TimePickerModal
        visible={showPicker}
        initialTime={value}
        onSelect={(timeString) => {
          onChangeTime(timeString);
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

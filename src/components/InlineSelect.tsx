import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export interface SelectOption {
  value: string;
  label: string;
}

export function InlineSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onSelect: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = options.find((o) => o.value === value);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={[styles.select, open && styles.selectOpen]} onPress={() => setOpen((c) => !c)}>
        <Text style={display && display.value ? styles.selectText : styles.placeholder}>
          {display ? display.label : placeholder}
        </Text>
        <View style={[styles.chevron, open && styles.chevronOpen]}>
          <Feather
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={open ? colors.white : colors.inkFaint}
          />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.options}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.option, value === option.value && styles.optionActive]}
              onPress={() => {
                onSelect(option.value);
                setOpen(false);
              }}
            >
              <Text style={[styles.optionText, value === option.value && styles.optionTextActive]}>
                {option.label}
              </Text>
              {value === option.value ? <Feather name="check" size={16} color={colors.brand700} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: colors.ink },
  select: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
  },
  selectOpen: { borderColor: colors.brand500 },
  selectText: { flex: 1, fontSize: 15, color: colors.ink },
  placeholder: { flex: 1, fontSize: 15, color: colors.inkFaint },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronOpen: { backgroundColor: colors.brand600 },
  options: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionActive: { backgroundColor: colors.brand50 },
  optionText: { fontSize: 14, color: colors.ink },
  optionTextActive: { color: colors.brand700, fontWeight: "600" },
});
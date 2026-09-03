import { useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "../theme/colors";

interface InputProps extends Omit<TextInputProps, "onFocus" | "onBlur"> {
  label?: string;
  error?: string;
  onFocus?: (event: any) => void;
  onBlur?: (event: any) => void;
}

export function Input({ label, error, style, value, onFocus, onBlur, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const showFloatingLabel = Boolean(label) && (isFocused || hasValue);

  const handleFocus: NonNullable<TextInputProps["onFocus"]> = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur: NonNullable<TextInputProps["onBlur"]> = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={styles.wrap}>
      {label && (
        <Text style={[styles.label, showFloatingLabel ? styles.labelActive : styles.labelInactive]}>{label}</Text>
      )}
      <TextInput
        value={value}
        style={[styles.input, Boolean(error) && styles.inputError, showFloatingLabel && styles.inputWithFloatingLabel, style]}
        placeholderTextColor={colors.inkFaint}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    marginBottom: 6,
  },
  label: {
    position: "absolute",
    left: 14,
    zIndex: 1,
    fontWeight: "500",
    color: colors.ink,
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    transform: [{ translateY: 0 }],
  },
  labelInactive: {
    opacity: 1,
    top: 15,
    fontSize: 15,
    color: colors.inkFaint,
    pointerEvents: "none",
  },
  labelActive: {
    opacity: 1,
    top: -8,
    fontSize: 12,
    color: colors.ink,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  inputWithFloatingLabel: {
    paddingTop: 18,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
});

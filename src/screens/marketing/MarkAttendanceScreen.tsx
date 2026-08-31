import { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { markMarketingAttendance, type MarkAttendancePayload } from "../../api/marketing.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

const STATUS_OPTIONS: MarkAttendancePayload["status"][] = ["present", "absent", "late", "half-day"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function MarkAttendanceScreen() {
  const { session } = useAuth();
  const [status, setStatus] = useState<MarkAttendancePayload["status"]>("present");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!session || session.type !== "marketing") return null;
  // Captured as plain values rather than referencing `session.executive.*`
  // inside handleSubmit below — TS's discriminated-union narrowing from the
  // guard above doesn't extend into a function declared later in this scope.
  const { id: marketingId, name: marketingName } = session.executive;

  async function handleSubmit() {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await markMarketingAttendance({
        marketing_id: marketingId,
        date: today(),
        status,
        marked_by: marketingName,
        remarks: remarks || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Mark today's attendance</Text>
      <Text style={styles.subtitle}>{today()}</Text>

      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setStatus(option)}
            style={[styles.statusChip, status === option && styles.statusChipActive]}
          >
            <Text style={[styles.statusChipText, status === option && styles.statusChipTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <Input label="Remarks (optional)" placeholder="Anything worth noting" value={remarks} onChangeText={setRemarks} />

      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>Attendance marked ✓</Text>}

      <Button title="Mark attendance" onPress={handleSubmit} isLoading={isSubmitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkFaint,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statusChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  statusChipActive: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  statusChipText: {
    fontSize: 13,
    color: colors.ink,
    textTransform: "capitalize",
  },
  statusChipTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  success: {
    fontSize: 13,
    color: colors.success,
  },
});

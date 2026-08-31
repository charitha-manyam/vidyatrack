import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { logMarketingVisit } from "../../api/marketing.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function LogVisitScreen() {
  const { session } = useAuth();
  const [schoolName, setSchoolName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!session || session.type !== "marketing") return null;
  const marketingId = session.executive.id;

  async function handleSubmit() {
    if (!schoolName.trim()) {
      setError("Enter the school you visited.");
      return;
    }
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await logMarketingVisit({
        marketing_id: marketingId,
        school_name: schoolName.trim(),
        visit_date: today(),
        contact_person: contactPerson || undefined,
        remarks: remarks || undefined,
      });
      setSuccess(true);
      setSchoolName("");
      setContactPerson("");
      setRemarks("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Log a school visit</Text>
      <Input label="School name" placeholder="e.g. Sunrise Public School" value={schoolName} onChangeText={setSchoolName} />
      <Input label="Contact person (optional)" placeholder="e.g. Principal Sharma" value={contactPerson} onChangeText={setContactPerson} />
      <Input label="Remarks (optional)" placeholder="How did it go?" value={remarks} onChangeText={setRemarks} />

      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>Visit logged ✓</Text>}

      <Button title="Log visit" onPress={handleSubmit} isLoading={isSubmitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
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

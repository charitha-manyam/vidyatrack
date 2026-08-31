import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { addMarketingLead } from "../../api/marketing.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

export function AddLeadScreen() {
  const { session } = useAuth();
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [interestedClass, setInterestedClass] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!session || session.type !== "marketing") return null;
  const marketingId = session.executive.id;

  async function handleSubmit() {
    if (!studentName.trim() || !parentName.trim() || !mobileNumber.trim()) {
      setError("Student name, parent name, and mobile number are required.");
      return;
    }
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await addMarketingLead({
        marketing_id: marketingId,
        student_name: studentName.trim(),
        parent_name: parentName.trim(),
        mobile_number: mobileNumber.trim(),
        interested_class: interestedClass || undefined,
        school_name: schoolName || undefined,
        source: "Field visit",
      });
      setSuccess(true);
      setStudentName("");
      setParentName("");
      setMobileNumber("");
      setInterestedClass("");
      setSchoolName("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Add a lead</Text>
      <Input label="Student name" value={studentName} onChangeText={setStudentName} />
      <Input label="Parent name" value={parentName} onChangeText={setParentName} />
      <Input label="Mobile number" keyboardType="phone-pad" value={mobileNumber} onChangeText={setMobileNumber} />
      <Input label="Interested class (optional)" placeholder="e.g. Grade 3" value={interestedClass} onChangeText={setInterestedClass} />
      <Input label="Currently at school (optional)" value={schoolName} onChangeText={setSchoolName} />

      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>Lead added ✓</Text>}

      <Button title="Add lead" onPress={handleSubmit} isLoading={isSubmitting} />
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

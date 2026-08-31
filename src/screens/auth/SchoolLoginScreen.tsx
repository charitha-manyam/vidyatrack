import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { requestSchoolOtp } from "../../api/auth.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "SchoolLogin">;

function isEmail(value: string) {
  return value.includes("@");
}

// One form serves both staff and parents — same POST /tenant/userlogin the
// web admin-portal and parent-portal both use; the backend tells us which
// kind of user this is once the OTP is verified on the next screen.
export function SchoolLoginScreen({ navigation }: Props) {
  const [schoolcode, setSchoolcode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!schoolcode.trim() || !identifier.trim()) {
      setError("Enter your school code and email or phone.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        schoolcode: schoolcode.trim(),
        ...(isEmail(identifier) ? { email: identifier.trim() } : { phonenumber: identifier.trim() }),
      };
      const result = await requestSchoolOtp(payload);
      navigation.navigate("SchoolOtp", { ...payload, userId: result.userId, otp: result.otp });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View>
        <Text style={styles.title}>School sign-in</Text>
        <Text style={styles.subtitle}>For staff and parents — we'll text or email you a one-time code.</Text>
      </View>

      <Input label="School code" placeholder="e.g. SCH1234" autoCapitalize="characters" value={schoolcode} onChangeText={setSchoolcode} />
      <Input
        label="Email or phone number"
        placeholder="you@example.com or 9876543210"
        autoCapitalize="none"
        keyboardType="email-address"
        value={identifier}
        onChangeText={setIdentifier}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="Send code" onPress={handleSubmit} isLoading={isSubmitting} />
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
    marginTop: 4,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
});

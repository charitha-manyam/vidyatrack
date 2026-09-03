import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { resendSchoolOtp, verifySchoolOtp } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { Session } from "../../types/auth";

type Props = NativeStackScreenProps<AuthStackParamList, "SchoolOtp">;

export function SchoolOtpScreen({ route, navigation }: Props) {
  const { schoolcode, email, phonenumber, userId } = route.params;
  const { setSession } = useAuth();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify() {
    if (!otp.trim()) {
      setError("Enter the code you were sent.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await verifySchoolOtp({ schoolcode, email, phonenumber, otp: otp.trim(), userId });

      // The backend only ever hands out a literal userType of "parent" for
      // parent logins — everything else (Admin, teacher, accountant, ...)
      // is a resolved staff role name, so "not parent" is the correct test.
      const session: Session =
        result.userType === "parent"
          ? {
              type: "parent",
              token: result.token,
              userId: String(result.userId),
              schoolcode,
              name: result.name,
              parent: result.parent,
            }
          : {
              type: "staff",
              token: result.token,
              userId: String(result.userId),
              schoolcode,
              name: result.name,
              userType: result.userType,
              role: result.role ?? null,
              permissions: result.permissions ?? [],
              academicYear: result.academicYear ?? null,
            };

      setSession(session);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    try {
      await resendSchoolOtp({ schoolcode, email, phonenumber });
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.subtitle}>Sent to {email ?? phonenumber}</Text>
      </View>

      <Input
        label="One-time code"
        placeholder="123456"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="Verify & sign in" onPress={handleVerify} isLoading={isSubmitting} />
      <Button title="Resend code" variant="ghost" onPress={handleResend} isLoading={isResending} />
      <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
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
  devOtp: {
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: -4,
    marginBottom: 8,
  },
});

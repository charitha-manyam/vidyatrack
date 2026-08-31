import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { marketingLogin } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "MarketingLogin">;

// Phone-only, no OTP — matches the backend exactly (app/controllers/
// marketingTarget.js#marketingLogin just checks phone + status: "active").
export function MarketingLoginScreen({ navigation }: Props) {
  const { setSession } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!phone.trim()) {
      setError("Enter your phone number.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await marketingLogin(phone.trim());
      setSession({ type: "marketing", token: result.data.token, executive: result.data.executive });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Marketing rep sign-in</Text>
        <Text style={styles.subtitle}>Just your registered phone number — no code needed.</Text>
      </View>

      <Input label="Phone number" placeholder="9876543210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="Sign in" onPress={handleSubmit} isLoading={isSubmitting} />
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
});

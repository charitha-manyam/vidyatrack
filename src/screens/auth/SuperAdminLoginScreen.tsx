import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { superAdminLogin } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "SuperAdminLogin">;

export function SuperAdminLoginScreen({ navigation }: Props) {
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await superAdminLogin(email.trim(), password);
      setSession({
        type: "superadmin",
        token: result.token,
        email: result.user.email,
        role: result.user.role,
        permissions: result.user.permissions,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Platform sign-in</Text>
        <Text style={styles.subtitle}>Super admin console access.</Text>
      </View>

      <Input label="Email" placeholder="admin@vidyatrack.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Input label="Password" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
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

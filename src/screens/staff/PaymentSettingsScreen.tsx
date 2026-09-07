import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Badge } from "../../components/ui/Badge";
import { DataState } from "../../components/DataState";
import { PermissionGate, staffPermissions } from "../../components/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { hasPermission, MODULES } from "../../config/rbac";
import { getErrorMessage } from "../../lib/errors";
import { getRazorpayConfigStatus, saveRazorpayConfig } from "../../api/paymentSettings.api";
import type { RazorpayConfigStatus } from "../../types/paymentSettings";
import { colors } from "../../theme/colors";
import type { FeesStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<FeesStackParamList, "PaymentSettings">;

export function PaymentSettingsScreen(_: Props) {
  const { session } = useAuth();
  const permissions = staffPermissions(session);
  const canWrite = hasPermission(permissions, MODULES.FEES, "update");

  const [status, setStatus] = useState<RazorpayConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [validation, setValidation] = useState<{ keyId?: string; keySecret?: string }>({});
  const [saving, setSaving] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await getRazorpayConfigStatus());
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status) {
      setKeyId(status.razorpayKeyId ?? "");
    }
  }, [status]);

  async function handleSave() {
    const errors: { keyId?: string; keySecret?: string } = {};
    if (!keyId.trim()) errors.keyId = "Key ID is required";
    if (!keySecret.trim()) errors.keySecret = "Key secret is required";
    setValidation(errors);
    if (errors.keyId || errors.keySecret) return;

    setSaving(true);
    try {
      await saveRazorpayConfig({
        razorpayKeyId: keyId.trim(),
        razorpayKeySecret: keySecret.trim(),
        razorpayWebhookSecret: webhookSecret.trim() || undefined,
      });
      setKeySecret("");
      setWebhookSecret("");
      Alert.alert("Saved", "Razorpay configuration saved.");
      loadStatus();
    } catch (err) {
      Alert.alert("Could not save", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PermissionGate module={MODULES.FEES} action="read">
      <Screen scroll={false} topInset={false}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.pageTitle}>Payment Settings</Text>
            <Text style={styles.description}>
              Connect your school's own Razorpay account so parents can pay fees online — money settles directly to you,
              not the platform.
            </Text>

            <DataState loading={loading} error={error} retry={loadStatus}>
              {status ? (
                <>
                  <View style={styles.badgeRow}>
                    <Badge tone={status.configured ? "green" : "amber"}>
                      {status.configured ? "Online payments enabled" : "Online payments not enabled yet"}
                    </Badge>
                    <Badge tone={status.webhookConfigured ? "green" : "gray"}>
                      {status.webhookConfigured ? "Webhook configured" : "Webhook not configured"}
                    </Badge>
                  </View>

                  <Card style={styles.formCard}>
                    <Input
                      label="Razorpay Key ID"
                      placeholder="rzp_live_xxxxxxxx"
                      value={keyId}
                      onChangeText={setKeyId}
                      autoCapitalize="none"
                      error={validation.keyId}
                    />
                    <Input
                      label="Razorpay Key Secret"
                      placeholder={
                        status.configured ? "Already saved — enter a new value to replace it" : "Your Razorpay key secret"
                      }
                      value={keySecret}
                      onChangeText={setKeySecret}
                      secureTextEntry
                      error={validation.keySecret}
                    />
                    <Input
                      label="Webhook secret (optional, recommended)"
                      placeholder="From your Razorpay webhook settings"
                      value={webhookSecret}
                      onChangeText={setWebhookSecret}
                      secureTextEntry
                    />
                    <Text style={styles.hint}>
                      Find these under your Razorpay dashboard → Settings → API Keys. The webhook secret comes from adding
                      a webhook pointed at this backend's /public/fee-payment/webhook endpoint — without it, a payment
                      that succeeds but whose confirmation call never reaches this server (e.g. the parent closes their
                      browser right after paying) won't be recorded here even though they were charged.
                    </Text>
                    <Button
                      title={saving ? "Saving…" : "Save"}
                      onPress={handleSave}
                      isLoading={saving}
                      disabled={!canWrite}
                    />
                    {!canWrite ? <Text style={styles.noWrite}>You need update permission to save changes.</Text> : null}
                  </Card>
                </>
              ) : null}
            </DataState>
          </ScrollView>
        </View>
      </Screen>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, gap: 12, paddingBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: colors.ink },
  description: { fontSize: 13, lineHeight: 19, color: colors.inkFaint },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  formCard: { padding: 14, gap: 4 },
  hint: { fontSize: 12, lineHeight: 17, color: colors.inkFaint, marginVertical: 4 },
  noWrite: { fontSize: 12, color: colors.inkFaint, textAlign: "center", marginTop: 2 },
});
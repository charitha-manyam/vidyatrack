import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { Card } from "./Card";
import { colors } from "../theme/colors";

interface DataStateProps {
  loading?: boolean;
  error?: string | null;
  retry?: () => void;
  empty?: string | null;
  children?: React.ReactNode;
}

export function DataState({ loading, error, retry, empty, children }: DataStateProps) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand600} size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <Card>
        <Text style={styles.error}>{error}</Text>
        {retry && <Button title="Retry" variant="secondary" onPress={retry} />}
      </Card>
    );
  }
  if (empty) {
    return (
      <Card>
        <Text style={styles.empty}>{empty}</Text>
      </Card>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: 48,
    alignItems: "center",
  },
  error: {
    fontSize: 14,
    color: colors.danger,
    marginBottom: 12,
  },
  empty: {
    fontSize: 14,
    color: colors.inkFaint,
    textAlign: "center",
  },
});

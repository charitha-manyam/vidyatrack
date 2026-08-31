import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { colors } from "../../theme/colors";
import type { MoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "ModulePlaceholder">;

// Landing pad for admin-portal modules that don't have a native mobile
// screen yet — keeps the module index in parity with the web sidebar
// without faking features that aren't built.
export function ModulePlaceholderScreen({ navigation, route }: Props) {
  const title = route.params?.title ?? "Module";
  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.iconChip}>
          <Feather name="grid" size={22} color={colors.brand600} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>
          This module isn&apos;t available on mobile yet — manage it from the VidyaTrack admin portal on the web.
        </Text>
        <Button variant="secondary" title="Go back" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand50,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkFaint,
    textAlign: "center",
    marginBottom: 8,
  },
});

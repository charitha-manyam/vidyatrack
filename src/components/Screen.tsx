import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, View, type RefreshControlProps } from "react-native";
import { colors } from "../theme/colors";

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  topInset?: boolean;
}

// Shared page shell — safe-area + consistent padding, matching the same
// "narrow, centered, app-like" feel established for parent-portal on web.
export function Screen({ children, scroll = true, refreshControl, topInset = true }: ScreenProps) {
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safe} edges={topInset ? ["top", "bottom"] : ["bottom"]}>
      <Wrapper
        style={styles.wrapper}
        contentContainerStyle={scroll ? [styles.content, !refreshControl && styles.grow] : undefined}
        {...(scroll ? { refreshControl } : {})}
      >
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  wrapper: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  grow: {
    flexGrow: 1,
  },
});

import { FlatList, StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { ListRow } from "../../components/ListRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveChild } from "../../context/ChildContext";
import type { ParentMoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<ParentMoreStackParamList, "Children">;

export function ParentChildrenScreen({ navigation }: Props) {
  const { children, activeChild, loading, error, setActiveChildId, reload } = useActiveChild();

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <PageHeader title="Children" description="Choose which child to view." />
        <DataState loading={loading} error={error} retry={reload} empty={children.length === 0 ? "No children linked yet." : null}>
          <FlatList
            data={children}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ListRow
                title={item.name}
                subtitle={`${item.className ?? "No class"}${item.sectionName ? ` · ${item.sectionName}` : ""}${item.rollNumber ? ` · Roll ${item.rollNumber}` : ""}`}
                meta={item.id === activeChild?.id ? "Selected" : item.status}
                tone={item.id === activeChild?.id ? "brand" : "neutral"}
                chevron
                onPress={() => {
                  setActiveChildId(item.id);
                  navigation.goBack();
                }}
              />
            )}
          />
        </DataState>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  list: { gap: 8, paddingBottom: 12 },
});

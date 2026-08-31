import { View, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { ListRow } from "../../components/ListRow";
import { PageHeader } from "../../components/ui/PageHeader";
import type { ParentMoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<ParentMoreStackParamList, "MoreMenu">;

export function ParentMoreMenuScreen({ navigation }: Props) {
  return (
    <Screen>
      <PageHeader title="More" description="School information and support." />
      <View style={styles.rows}>
        <ListRow title="Children" subtitle="Switch the child you are viewing" chevron onPress={() => navigation.navigate("Children")} />
        <ListRow title="Holidays" chevron onPress={() => navigation.navigate("Holidays")} />
        <ListRow title="Announcements" chevron onPress={() => navigation.navigate("Announcements")} />
        <ListRow title="Marks & Results" chevron onPress={() => navigation.navigate("Marks")} />
        <ListRow title="Timetable" chevron onPress={() => navigation.navigate("Timetable")} />
        <ListRow title="Complaints" subtitle="Contact the school office" chevron onPress={() => navigation.navigate("Complaints")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 8 } });

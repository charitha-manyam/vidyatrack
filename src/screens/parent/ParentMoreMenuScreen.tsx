import { View, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { ListRow } from "../../components/ListRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { ParentChildSwitcher } from "../../components/ui/ParentChildSwitcher";
import type { ParentMoreStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<ParentMoreStackParamList, "MoreMenu">;

export function ParentMoreMenuScreen({ navigation }: Props) {
  return (
    <Screen>
      <PageHeader title="More" description="School information and support." />
      <ParentChildSwitcher />
      <View style={styles.rows}>
        <ListRow title="Marks & Results" chevron onPress={() => navigation.navigate("Marks")} />
        <ListRow title="Timetable" chevron onPress={() => navigation.navigate("Timetable")} />
        <ListRow title="Payment History" chevron onPress={() => navigation.navigate("PaymentHistory")} />
        <ListRow title="Track the bus" subtitle="Live bus location" chevron onPress={() => navigation.navigate("TrackMyBus")} />
        <ListRow title="Announcements" chevron onPress={() => navigation.navigate("Announcements")} />
        <ListRow title="Holidays" chevron onPress={() => navigation.navigate("Holidays")} />
        <ListRow title="Complaints" subtitle="Contact the school office" chevron onPress={() => navigation.navigate("Complaints")} />
        <ListRow title="Profile" subtitle="Account and sign out" chevron onPress={() => navigation.navigate("Profile")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 8 } });

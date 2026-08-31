import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { NeedChild } from "../../components/NeedChild";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { useActiveChild } from "../../context/ChildContext";
import { getChildHomework } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { ParentTabParamList } from "../../navigation/types";
import type { ChildHomeworkItem, HomeworkSubmissionStatus } from "../../types/parent";

type Props = BottomTabScreenProps<ParentTabParamList, "Homework">;

const STATUS_TONE: Record<HomeworkSubmissionStatus, BadgeTone> = {
  not_submitted: "amber",
  submitted: "green",
  reviewed: "gray",
};

const STATUS_LABEL: Record<HomeworkSubmissionStatus, string> = {
  not_submitted: "Not submitted",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

export function ParentHomeworkScreen({ }: Props) {
  const { activeChild } = useActiveChild();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homework, setHomework] = useState<ChildHomeworkItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!activeChild) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      getChildHomework(activeChild.id)
        .then((list) => {
          if (active) setHomework(list);
        })
        .catch((err) => {
          if (active) setError(getErrorMessage(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [activeChild])
  );

  if (!activeChild) return <NeedChild />;

  return (
    <Screen>
      <PageHeader title="Homework" description={activeChild.name} />
      <DataState
        loading={loading}
        error={error}
        empty={homework.length === 0 ? "No homework assigned yet." : null}
      >
        <View style={styles.content}>
          {homework.map((h) => (
            <View key={h.id} style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>{h.title}</Text>
                <Badge tone={STATUS_TONE[h.submission_status]}>{STATUS_LABEL[h.submission_status]}</Badge>
              </View>
              <Text style={styles.description}>{h.description}</Text>
              <Text style={styles.meta}>
                {h.subject?.name ?? "General"}
                {h.teacher ? ` · ${h.teacher.name}` : ""} · Due {h.submission_date}
              </Text>
              {h.submission_remarks ? (
                <Text style={styles.remarks}>Teacher's remarks: {h.submission_remarks}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </DataState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 16,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
  },
  description: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  meta: {
    fontSize: 11,
    color: colors.inkGhost,
  },
  remarks: {
    fontSize: 11,
    color: colors.inkSoft,
    backgroundColor: colors.surfaceHover,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
});

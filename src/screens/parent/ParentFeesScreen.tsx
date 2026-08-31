import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Screen } from "../../components/Screen";
import { DataState } from "../../components/DataState";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { useActiveChild } from "../../context/ChildContext";
import { getChildFeeSummary } from "../../api/parent.api";
import { getErrorMessage } from "../../lib/errors";
import { colors } from "../../theme/colors";
import type { ParentTabParamList } from "../../navigation/types";
import type { FeeSummaryDetail, FeeSummaryWithDetails } from "../../types/parent";

type Props = BottomTabScreenProps<ParentTabParamList, "Fees">;

const STATUS_TONE: Record<FeeSummaryDetail["status"], BadgeTone> = {
  PAID: "green",
  PARTIAL: "amber",
  PENDING: "gray",
};

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function ParentFeesScreen({ }: Props) {
  const { activeChild } = useActiveChild();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FeeSummaryWithDetails | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!activeChild) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      getChildFeeSummary(activeChild.id)
        .then((d) => {
          if (active) setData(d ?? null);
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
      <PageHeader
        title={`${activeChild.name}'s fees`}
        description="Tuition and transport combined."
      />
      <DataState loading={loading} error={error} empty={data ? null : "Couldn't load fee details."}>
        {data && (
          <View style={styles.content}>
            <View style={styles.tiles}>
              <Tile label="Total" value={formatCurrency(data.summary.totalFinal)} />
              <Tile label="Paid" value={formatCurrency(data.summary.totalPaid)} tone="#15803d" />
              <Tile
                label="Due"
                value={formatCurrency(data.summary.totalDue)}
                tone={data.summary.totalDue > 0 ? "#b45309" : "#15803d"}
              />
              <Tile
                label="Status"
                value={data.summary.overallStatus}
                tone={
                  data.summary.overallStatus === "PAID"
                    ? "#15803d"
                    : data.summary.overallStatus === "PARTIAL"
                      ? "#b45309"
                      : colors.ink
                }
              />
            </View>

            {(data.details?.length ?? 0) === 0 ? (
              <Text style={styles.empty}>No fee items yet — nothing has been assigned for this student.</Text>
            ) : (
              data.details!.map((detail) => (
                <View key={`${detail.type}-${detail.id}`} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{detail.feeHeadName ?? "Fee"}</Text>
                    <Badge tone={STATUS_TONE[detail.status]}>{detail.status}</Badge>
                  </View>
                  <Text style={styles.itemMeta}>
                    {formatCurrency(detail.finalAmount)} total · {formatCurrency(detail.paidAmount)} paid
                    {detail.dueDate ? ` · due ${detail.dueDate}` : ""}
                  </Text>
                  {detail.dueAmount > 0 ? (
                    <Text style={styles.due}>Due: {formatCurrency(detail.dueAmount)}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
      </DataState>
    </Screen>
  );
}

function Tile({ label, value, tone = colors.ink }: { label: string; value: string; tone?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

export function NeedChild() {
  return (
    <Screen>
      <PageHeader title="Pick a child first" description="Select which child you want to view." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  tiles: {
    flexDirection: "row",
    gap: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  tileLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.inkGhost,
  },
  tileValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  item: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 16,
    gap: 6,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.inkFaint,
  },
  due: {
    fontSize: 13,
    fontWeight: "600",
    color: "#b45309",
  },
  empty: {
    fontSize: 14,
    color: colors.inkFaint,
    textAlign: "center",
    paddingVertical: 24,
  },
});

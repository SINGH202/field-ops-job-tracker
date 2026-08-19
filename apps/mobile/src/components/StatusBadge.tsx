import { StyleSheet, Text, View } from "react-native";
import { JobStatus } from "@field-ops/contracts";
import { STATUS_COLORS, STATUS_LABEL } from "../status";

export function StatusBadge({ status }: { status: JobStatus }) {
  const palette = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});

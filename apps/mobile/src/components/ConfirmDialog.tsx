import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { colors } from "../theme";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Cancel job",
  cancelLabel = "Keep job",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          disabled={busy}
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!busy) onCancel();
          }}
        />
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{description}</Text>
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="secondary" disabled={busy} onPress={onCancel} />
            <Button
              label={busy ? "Updating…" : confirmLabel}
              variant="danger"
              disabled={busy}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 25, 23, 0.4)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    zIndex: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  body: {
    color: colors.inkSecondary,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
  },
  actions: {
    gap: 10,
    marginTop: 20,
  },
});

import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Worker } from "@field-ops/contracts";
import { apiBaseUrl, isAbortError, listWorkers } from "../api";
import { Button } from "../components/Button";
import { Screen } from "../components/Screen";
import { colors } from "../theme";

export function SignInScreen({ onSelect }: { onSelect: (worker: Worker) => void }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const next = await listWorkers(signal);
      setWorkers(next);
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      setError("Could not load workers. Is the API running?");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <Screen>
      <Text style={styles.kicker}>Field Ops</Text>
      <Text style={styles.title}>Sign in as a worker</Text>
      <Text style={styles.subtitle}>
        There is no password. Pick a seeded worker to see jobs assigned to them.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>API unreachable</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Text style={styles.hint}>Calling {apiBaseUrl()}</Text>
          <View style={styles.retry}>
            <Button label="Retry" onPress={() => void load()} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {workers.map((worker) => (
            <Pressable
              key={worker.id}
              accessibilityRole="button"
              onPress={() => onSelect(worker)}
              style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
            >
              <Text style={styles.name}>{worker.name}</Text>
              <Text style={styles.id}>{worker.id}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 6,
  },
  subtitle: {
    color: colors.inkSecondary,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 24,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  name: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "600",
  },
  id: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "700",
  },
  errorBody: {
    color: colors.inkSecondary,
    fontSize: 15,
    marginTop: 6,
  },
  hint: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 8,
  },
  retry: {
    marginTop: 12,
  },
});

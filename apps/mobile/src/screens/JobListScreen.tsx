import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Job, Worker } from "@field-ops/contracts";
import { isAbortError, listJobs } from "../api";
import { Button } from "../components/Button";
import { Screen } from "../components/Screen";
import { StatusBadge } from "../components/StatusBadge";
import { formatTimestamp } from "../status";
import { colors } from "../theme";

const PAGE_SIZE = 20;

export function JobListScreen({
  worker,
  onOpenJob,
  onSignOut,
}: {
  worker: Worker;
  onOpenJob: (jobId: string) => void;
  onSignOut: () => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextCursorRef = useRef<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh" | "more", signal?: AbortSignal) => {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      if (mode === "more") setLoadingMore(true);
      setError(null);

      try {
        const page = await listJobs(
          {
            workerId: worker.id,
            limit: PAGE_SIZE,
            cursor: mode === "more" ? (nextCursorRef.current ?? undefined) : undefined,
          },
          signal,
        );
        nextCursorRef.current = page.nextCursor;
        setJobs((current) => (mode === "more" ? [...current, ...page.data] : page.data));
        setNextCursor(page.nextCursor);
      } catch (err: unknown) {
        if (isAbortError(err)) return;
        setError("Could not load jobs.");
      } finally {
        if (signal?.aborted) return;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [worker.id],
  );

  useEffect(() => {
    const controller = new AbortController();
    nextCursorRef.current = null;
    void load("initial", controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>My jobs</Text>
          <Text style={styles.title}>{worker.name}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onSignOut} hitSlop={8}>
          <Text style={styles.signOut}>Switch</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : error && jobs.length === 0 ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.retry}>
            <Button label="Retry" onPress={() => void load("initial")} />
          </View>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={jobs.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load("refresh")}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No jobs assigned to you right now.</Text>
          }
          ListFooterComponent={
            nextCursor ? (
              <View style={styles.footer}>
                <Button
                  label={loadingMore ? "Loading…" : "Load more"}
                  disabled={loadingMore}
                  variant="secondary"
                  onPress={() => void load("more")}
                />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => onOpenJob(item.id)}
              style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <StatusBadge status={item.status} />
              </View>
              {item.address ? <Text style={styles.meta}>{item.address}</Text> : null}
              <Text style={styles.meta}>Updated {formatTimestamp(item.updatedAt)}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  kicker: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  signOut: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 8,
  },
  spinner: {
    marginTop: 24,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
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
  cardTop: {
    gap: 8,
  },
  jobTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "600",
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 13,
    marginTop: 6,
  },
  empty: {
    color: colors.inkMuted,
    fontSize: 16,
    textAlign: "center",
  },
  footer: {
    marginTop: 8,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
  },
  retry: {
    marginTop: 12,
  },
});

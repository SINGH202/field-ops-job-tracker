import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { forwardTarget, JobStatus, JobWithEvents, Worker } from "@field-ops/contracts";
import { ApiError, getJob, isAbortError, transitionJob } from "../api";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Screen } from "../components/Screen";
import { StatusBadge } from "../components/StatusBadge";
import { formatTimestamp, illegalTransitionMessage, nextStatusLabel } from "../status";
import { colors } from "../theme";

export function JobDetailScreen({
  worker,
  jobId,
  onBack,
}: {
  worker: Worker;
  jobId: string;
  onBack: () => void;
}) {
  const [job, setJob] = useState<JobWithEvents | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        const next = await getJob(jobId, signal);
        setJob(next);
      } catch (err: unknown) {
        if (isAbortError(err)) return;
        setError("Could not load this job.");
      }
    },
    [jobId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function advance(toStatus: JobStatus) {
    if (!job) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await transitionJob(job.id, {
        toStatus,
        actorType: "WORKER",
        actorId: worker.id,
        note: note.trim() || undefined,
      });
      setJob(updated);
      setNote("");
      setConfirmingCancel(false);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError && err.code === "ILLEGAL_TRANSITION"
          ? illegalTransitionMessage(job.status, toStatus)
          : err instanceof ApiError
            ? err.message
            : "That status change could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!job && !error) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      </Screen>
    );
  }

  if (!job) {
    return (
      <Screen>
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.error}>{error ?? "Job not found."}</Text>
      </Screen>
    );
  }

  const upcoming = forwardTarget(job.status);
  const upcomingLabel = nextStatusLabel(job.status);
  const canAct =
    job.workerId === worker.id && job.status !== "COMPLETED" && job.status !== "CANCELED";

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>Back to jobs</Text>
        </Pressable>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{job.title}</Text>
          <StatusBadge status={job.status} />
        </View>
        <Text style={styles.meta}>Updated {formatTimestamp(job.updatedAt)}</Text>

        <View style={styles.card}>
          <Text style={styles.section}>Job information</Text>
          <Meta label="Address" value={job.address ?? "—"} />
          <Meta label="Description" value={job.description ?? "No description"} />

          {canAct ? (
            <View style={styles.actions}>
              <Text style={styles.label}>Optional note</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                maxLength={1000}
                placeholder="Visible on the status timeline"
                placeholderTextColor={colors.inkMuted}
                multiline
                style={styles.input}
              />
              {upcoming && upcomingLabel ? (
                <Button
                  label={submitting ? "Updating…" : upcomingLabel}
                  disabled={submitting}
                  onPress={() => void advance(upcoming)}
                />
              ) : null}
              <Button
                label="Cancel job"
                variant="danger"
                disabled={submitting}
                onPress={() => setConfirmingCancel(true)}
              />
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Status history</Text>
          {job.events.length === 0 ? (
            <Text style={styles.meta}>No status events yet.</Text>
          ) : (
            job.events.map((event) => (
              <View key={event.id} style={styles.event}>
                <StatusBadge status={event.toStatus} />
                <Text style={styles.meta}>{formatTimestamp(event.occurredAt)}</Text>
                <Text style={styles.meta}>
                  {event.actorType === "DISPATCHER" ? "Dispatcher" : "Worker"} {event.actorId}
                  {event.note ? ` — ${event.note}` : ""}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this job?"
        description={`${job.title} will move to Canceled. This cannot be undone.`}
        busy={submitting}
        onConfirm={() => void advance("CANCELED")}
        onCancel={() => {
          if (!submitting) setConfirmingCancel(false);
        }}
      />
    </Screen>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaBlock}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  spinner: {
    marginTop: 32,
  },
  scroll: {
    paddingBottom: 32,
  },
  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  titleRow: {
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "700",
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  section: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  metaBlock: {
    marginTop: 10,
  },
  label: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  value: {
    color: colors.ink,
    fontSize: 16,
    marginTop: 2,
  },
  actions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 80,
    padding: 12,
    textAlignVertical: "top",
  },
  event: {
    marginTop: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 15,
    marginTop: 12,
  },
});

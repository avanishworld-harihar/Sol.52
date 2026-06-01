"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-center";
import { revalidateProjectHubCaches } from "@/lib/project-hub-cache";
import {
  addProjectComment,
  fetchProjectComments,
  projectCommentsKey,
  toggleCommentPin,
  type ProjectComment,
  type ProjectListItem,
} from "@/lib/project-api-client";
import { cn } from "@/lib/utils";
import {
  Loader2,
  MessageSquare,
  Pin,
  PinOff,
  RefreshCw,
  Reply,
  Send,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

function formatCommentTime(iso: string): { date: string; time: string; relative: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "—", relative: "—" };
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const diffMin = Math.round((Date.now() - d.getTime()) / 60_000);
  let relative = "Just now";
  if (diffMin >= 1 && diffMin < 60) relative = `${diffMin}m ago`;
  else if (diffMin >= 60 && diffMin < 1440) relative = `${Math.floor(diffMin / 60)}h ago`;
  else if (diffMin >= 1440) relative = `${Math.floor(diffMin / 1440)}d ago`;
  return { date, time, relative };
}

function authorLabel(comment: ProjectComment, optimistic = false): string {
  if (optimistic) return "You";
  if (comment.created_by_id?.trim()) {
    return `User ${comment.created_by_id.slice(0, 8)}…`;
  }
  return "Team member";
}

function authorInitials(label: string): string {
  const parts = label.replace(/…$/, "").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

type CommentThread = {
  comment: ProjectComment;
  replies: ProjectComment[];
};

function buildThreads(comments: ProjectComment[]): CommentThread[] {
  const byParent = new Map<string | null, ProjectComment[]>();
  for (const c of comments) {
    const key = c.parent_comment_id ?? null;
    const list = byParent.get(key) ?? [];
    list.push(c);
    byParent.set(key, list);
  }

  const sortList = (list: ProjectComment[]) =>
    [...list].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });

  const roots = sortList(byParent.get(null) ?? []);
  return roots.map((comment) => ({
    comment,
    replies: sortList(byParent.get(comment.id) ?? []),
  }));
}

function CommentComposer({
  placeholder,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (text: string) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={busy}
        className={cn(
          "w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm",
          "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "dark:border-white/10 dark:bg-[#0c1017] dark:text-slate-100"
        )}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy || !text.trim()}
          className="gap-1.5"
          onClick={() => {
            const value = text.trim();
            if (!value) return;
            void Promise.resolve(onSubmit(value)).then(() => setText(""));
          }}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Send className="h-3.5 w-3.5" aria-hidden />
          )}
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  depth,
  busy,
  replyingTo,
  onReply,
  onCancelReply,
  onSubmitReply,
  onTogglePin,
  optimistic,
}: {
  comment: ProjectComment;
  depth: 0 | 1;
  busy?: boolean;
  replyingTo: string | null;
  onReply: (id: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentId: string, text: string) => void | Promise<void>;
  onTogglePin: (comment: ProjectComment) => void | Promise<void>;
  optimistic?: boolean;
}) {
  const label = authorLabel(comment, optimistic);
  const when = formatCommentTime(comment.created_at);
  const isReplying = replyingTo === comment.id;

  return (
    <article
      className={cn(
        "rounded-xl border p-3.5 transition-colors",
        depth === 1 && "ml-4 border-slate-100 bg-slate-50/50 sm:ml-8 dark:border-white/5 dark:bg-white/[0.02]",
        depth === 0 &&
          (comment.is_pinned
            ? "border-amber-200/90 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
            : "border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#0c1017]")
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300"
            aria-hidden
          >
            {authorInitials(label)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
                {label}
              </span>
              {comment.is_pinned ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  <Pin className="h-3 w-3" aria-hidden />
                  Pinned
                </span>
              ) : null}
              {optimistic ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Sending…
                </span>
              ) : null}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {comment.comment}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right text-[10px] font-medium text-slate-500 dark:text-slate-400">
          <p>{when.relative}</p>
          <p>
            {when.date} · {when.time}
          </p>
        </div>
      </div>

      {!optimistic ? (
        <div className="mt-3 flex flex-wrap gap-2 pl-10 sm:pl-[2.625rem]">
          {depth === 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              disabled={busy}
              onClick={() => onReply(comment.id)}
            >
              <Reply className="h-3.5 w-3.5" aria-hidden />
              Reply
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
            disabled={busy}
            onClick={() => void onTogglePin(comment)}
          >
            {comment.is_pinned ? (
              <>
                <PinOff className="h-3.5 w-3.5" aria-hidden />
                Unpin
              </>
            ) : (
              <>
                <Pin className="h-3.5 w-3.5" aria-hidden />
                Pin
              </>
            )}
          </Button>
        </div>
      ) : null}

      {isReplying ? (
        <div className="mt-3 pl-10 sm:pl-[2.625rem]">
          <CommentComposer
            placeholder="Write a reply…"
            submitLabel="Post reply"
            busy={busy}
            onCancel={onCancelReply}
            onSubmit={(text) => onSubmitReply(comment.id, text)}
          />
        </div>
      ) : null}
    </article>
  );
}

function CommentsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}

export function ProjectHubCommentsTab({
  project,
  enabled,
}: {
  project: ProjectListItem;
  enabled: boolean;
}) {
  const toast = useToast();
  const commentsKey = enabled ? projectCommentsKey(project.id) : null;
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const {
    data: comments,
    error,
    isLoading,
    isValidating,
    mutate: mutateComments,
  } = useSWR(commentsKey, fetchProjectComments, {
    revalidateOnFocus: false,
    dedupingInterval: 3_000,
  });

  const threads = useMemo(() => buildThreads(comments ?? []), [comments]);
  const totalCount = comments?.length ?? 0;

  const refreshAll = useCallback(async () => {
    await revalidateProjectHubCaches(project.id);
    await mutateComments();
  }, [mutateComments, project.id]);

  const handleAddComment = useCallback(
    async (text: string, parentId: string | null = null) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: ProjectComment = {
        id: tempId,
        project_id: project.id,
        comment: text,
        parent_comment_id: parentId,
        is_pinned: false,
        created_by_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setBusyAction(tempId);
      const previous = comments ?? [];
      await mutateComments([optimistic, ...previous], { revalidate: false });

      try {
        const res = await addProjectComment(project.id, {
          comment: text,
          parent_comment_id: parentId,
        });
        if (!res.ok || !res.data) throw new Error(res.error ?? "post_failed");
        await refreshAll();
        setReplyingTo(null);
        toast.success(parentId ? "Reply posted" : "Comment posted");
      } catch (e) {
        await mutateComments(previous, { revalidate: false });
        toast.error(
          "Could not post comment",
          e instanceof Error ? e.message : "Unknown error"
        );
      } finally {
        setBusyAction(null);
      }
    },
    [comments, mutateComments, project.id, refreshAll, toast]
  );

  const handleTogglePin = useCallback(
    async (comment: ProjectComment) => {
      const nextPinned = !comment.is_pinned;
      setBusyAction(comment.id);
      const previous = comments ?? [];
      const optimistic = previous.map((c) =>
        c.id === comment.id ? { ...c, is_pinned: nextPinned } : c
      );
      await mutateComments(optimistic, { revalidate: false });

      try {
        const res = await toggleCommentPin(project.id, comment.id, nextPinned);
        if (!res.ok) throw new Error(res.error ?? "pin_failed");
        await mutateComments();
      } catch (e) {
        await mutateComments(previous, { revalidate: false });
        toast.error(
          "Could not update pin",
          e instanceof Error ? e.message : "Unknown error"
        );
      } finally {
        setBusyAction(null);
      }
    },
    [comments, mutateComments, project.id, toast]
  );

  if (!enabled) return null;

  if (isLoading && !comments) {
    return (
      <div id="project-hub-panel-comments" role="tabpanel" aria-labelledby="project-hub-tab-comments">
        <CommentsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card
        id="project-hub-panel-comments"
        role="tabpanel"
        aria-labelledby="project-hub-tab-comments"
        className="border-red-200/90 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/30"
      >
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-extrabold text-red-800 dark:text-red-200">
            Could not load comments
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refreshAll()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      id="project-hub-panel-comments"
      role="tabpanel"
      aria-labelledby="project-hub-tab-comments"
      className="space-y-4"
    >
      <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
                Project comments
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {totalCount} comment{totalCount === 1 ? "" : "s"} · pinned first
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 self-start sm:self-auto"
            disabled={isValidating}
            onClick={() => void refreshAll()}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isValidating && "animate-spin")}
              aria-hidden
            />
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
        <CardContent className="p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            New comment
          </p>
          <CommentComposer
            placeholder="Add a note for the project team…"
            submitLabel="Post comment"
            busy={Boolean(busyAction?.startsWith("temp-"))}
            onSubmit={(text) => handleAddComment(text, null)}
          />
        </CardContent>
      </Card>

      {threads.length === 0 ? (
        <Card className="page-lite-item border-dashed border-slate-200 dark:border-white/10">
          <CardContent className="px-3 py-3 text-center max-sm:py-2.5 sm:px-4 sm:py-8">
            <MessageSquare
              className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600"
              aria-hidden
            />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              No comments yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Start the conversation with site notes, handoffs, or follow-ups.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map(({ comment, replies }) => (
            <div key={comment.id} className="space-y-2">
              <CommentCard
                comment={comment}
                depth={0}
                busy={busyAction === comment.id}
                replyingTo={replyingTo}
                optimistic={comment.id.startsWith("temp-")}
                onReply={setReplyingTo}
                onCancelReply={() => setReplyingTo(null)}
                onSubmitReply={(parentId, text) => handleAddComment(text, parentId)}
                onTogglePin={handleTogglePin}
              />
              {replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  depth={1}
                  busy={busyAction === reply.id}
                  replyingTo={replyingTo}
                  optimistic={reply.id.startsWith("temp-")}
                  onReply={setReplyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  onSubmitReply={(parentId, text) => handleAddComment(text, parentId)}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

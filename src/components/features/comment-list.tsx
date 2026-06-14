"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { apiGet, apiPost } from "@/lib/api";
import { commentSchema, type CommentValues } from "@/lib/schemas";
import { initials, relativeTime } from "@/lib/utils";
import type { Comment, Paginated } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { TextAreaField, SubmitButton } from "@/components/common/fields";
import { EmptyState } from "@/components/common/states";

export function CommentList({ postId }: { postId: number }) {
  const qc = useQueryClient();
  const key = ["comments", postId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => apiGet<Paginated<Comment>>(`/posts/${postId}/comments`),
  });

  const form = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "" },
  });

  const onSubmit = async (values: CommentValues) => {
    try {
      await apiPost<Comment>(`/posts/${postId}/comments`, values);
      form.reset({ body: "" });
      await qc.invalidateQueries({ queryKey: key });
    } catch {
      toast.error("Could not add comment");
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <TextAreaField control={form.control} name="body" label="Add a comment" placeholder="Write a reply…" />
          <div className="flex justify-end">
            <SubmitButton loading={form.formState.isSubmitting}>Comment</SubmitButton>
          </div>
        </form>
      </Form>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !data || data.results.length === 0 ? (
        <EmptyState title="No comments yet" hint="Be the first to reply." />
      ) : (
        <ul className="space-y-3">
          {data.results.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(c.author.username)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-md bg-muted px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">@{c.author.username}</span>
                  <span className="text-xs text-muted-foreground">{relativeTime(c.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

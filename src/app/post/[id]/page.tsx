"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import type { Post } from "@/lib/types";
import { AppShell } from "@/components/common/app-shell";
import { Container } from "@/components/common/container";
import { ErrorState, PostListSkeleton } from "@/components/common/states";
import { PostCard } from "@/components/features/post-card";
import { CommentList } from "@/components/features/comment-list";

export default function PostDetailPage() {
  const { status } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["post", id],
    enabled: status === "authed" && !Number.isNaN(id),
    queryFn: () => apiGet<Post>(`/posts/${id}`),
  });

  return (
    <AppShell>
      <Container className="space-y-4">
        {status !== "authed" || isLoading ? (
          <PostListSkeleton count={1} />
        ) : isError || !post ? (
          <ErrorState message="This post may have been deleted." />
        ) : (
          <>
            <PostCard post={post} onDeleted={() => router.replace("/")} />
            <h2 className="px-1 text-sm font-semibold text-muted-foreground">Comments</h2>
            <CommentList postId={post.id} />
          </>
        )}
      </Container>
    </AppShell>
  );
}

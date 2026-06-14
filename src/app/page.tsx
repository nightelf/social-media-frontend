"use client";

import * as React from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import type { Paginated, Post } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/common/app-shell";
import { Container } from "@/components/common/container";
import { EmptyState, ErrorState, PostListSkeleton } from "@/components/common/states";
import { PostCard } from "@/components/features/post-card";
import { PostComposer } from "@/components/features/post-composer";

type Scope = "all" | "following";

export default function FeedPage() {
  const { status } = useRequireAuth();
  const qc = useQueryClient();
  const [scope, setScope] = React.useState<Scope>("all");

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["feed", scope],
      enabled: status === "authed",
      initialPageParam: 1,
      queryFn: ({ pageParam }) =>
        apiGet<Paginated<Post>>(`/posts?scope=${scope}&page=${pageParam}`),
      getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    });

  const posts = data?.pages.flatMap((p) => p.results) ?? [];
  const refetchFeed = () => qc.invalidateQueries({ queryKey: ["feed"] });

  if (status !== "authed") {
    return (
      <AppShell>
        <Container>
          <PostListSkeleton />
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container className="space-y-4">
        <PostComposer onCreated={refetchFeed} />

        <div className="flex gap-2">
          {(["all", "following"] as Scope[]).map((s) => (
            <Button
              key={s}
              variant={scope === s ? "primary" : "outline"}
              size="sm"
              onClick={() => setScope(s)}
            >
              {s === "all" ? "Everyone" : "Following"}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <PostListSkeleton />
        ) : isError ? (
          <ErrorState />
        ) : posts.length === 0 ? (
          <EmptyState
            title={scope === "following" ? "No posts from people you follow" : "No posts yet"}
            hint={scope === "following" ? "Follow some people to fill your feed." : "Be the first to post!"}
          />
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onDeleted={refetchFeed} />
            ))}
            {hasNextPage && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Container>
    </AppShell>
  );
}

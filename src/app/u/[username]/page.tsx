"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import type { Paginated, Post, PublicUser } from "@/lib/types";
import { AppShell } from "@/components/common/app-shell";
import { Container } from "@/components/common/container";
import { EmptyState, ErrorState, PostListSkeleton } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/features/post-card";
import { ProfileHeader } from "@/components/features/profile-header";

export default function ProfilePage() {
  const { status } = useRequireAuth();
  const params = useParams();
  const username = String(params.username);

  const profileQ = useQuery({
    queryKey: ["profile", username],
    enabled: status === "authed",
    queryFn: () => apiGet<PublicUser>(`/users/${username}`),
  });

  const postsQ = useQuery({
    queryKey: ["profile-posts", username],
    enabled: status === "authed" && !!profileQ.data,
    queryFn: () => apiGet<Paginated<Post>>(`/posts?page=1&page_size=50`),
    select: (d) => d.results.filter((p) => p.author.username === username),
  });

  return (
    <AppShell>
      <Container className="space-y-4">
        {status !== "authed" || profileQ.isLoading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : profileQ.isError || !profileQ.data ? (
          <ErrorState message="No such user." />
        ) : (
          <>
            <ProfileHeader profile={profileQ.data} />
            <h2 className="px-1 text-sm font-semibold text-muted-foreground">Posts</h2>
            {postsQ.isLoading ? (
              <PostListSkeleton count={2} />
            ) : !postsQ.data || postsQ.data.length === 0 ? (
              <EmptyState title="No posts yet" />
            ) : (
              <div className="space-y-3">
                {postsQ.data.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </>
        )}
      </Container>
    </AppShell>
  );
}

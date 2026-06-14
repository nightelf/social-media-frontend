"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { initials, relativeTime } from "@/lib/utils";
import type { Post } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { LikeButton } from "@/components/features/like-button";

export function PostCard({ post, onDeleted }: { post: Post; onDeleted?: (id: number) => void }) {
  const { user } = useAuth();
  const [confirm, setConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const isOwn = user?.id === post.author.id;

  const remove = async () => {
    setDeleting(true);
    try {
      await apiDelete(`/posts/${post.id}`);
      toast.success("Post deleted");
      onDeleted?.(post.id);
    } catch {
      toast.error("Could not delete post");
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/u/${post.author.username}`}>
            <Avatar>
              <AvatarFallback>{initials(post.author.username)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <Link href={`/u/${post.author.username}`} className="font-medium hover:underline">
              @{post.author.username}
            </Link>
            <p className="text-xs text-muted-foreground">{relativeTime(post.created_at)}</p>
          </div>
          {isOwn && (
            <Button variant="ghost" size="icon" aria-label="Delete post" onClick={() => setConfirm(true)}>
              <Trash2 className="text-muted-foreground" />
            </Button>
          )}
        </div>

        <Link href={`/post/${post.id}`} className="block whitespace-pre-wrap break-words">
          {post.body}
        </Link>

        <div className="flex items-center gap-1 text-muted-foreground">
          <LikeButton postId={post.id} liked={post.liked_by_me} count={post.like_count} />
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/post/${post.id}`}>
              <MessageCircle />
              {post.comment_count}
            </Link>
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete this post?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={remove}
        loading={deleting}
      />
    </Card>
  );
}

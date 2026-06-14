"use client";

import * as React from "react";
import { Heart } from "lucide-react";

import { apiDelete, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LikeButton({
  postId,
  liked,
  count,
}: {
  postId: number;
  liked: boolean;
  count: number;
}) {
  const [state, setState] = React.useState({ liked, count });
  const [busy, setBusy] = React.useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      const res = state.liked
        ? await apiDelete<{ liked_by_me: boolean; like_count: number }>(`/posts/${postId}/like`)
        : await apiPost<{ liked_by_me: boolean; like_count: number }>(`/posts/${postId}/like`);
      setState({ liked: res.liked_by_me, count: res.like_count });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} disabled={busy} aria-pressed={state.liked}>
      <Heart className={cn(state.liked && "fill-destructive text-destructive")} />
      {state.count}
    </Button>
  );
}

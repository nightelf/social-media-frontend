"use client";

import * as React from "react";

import { apiDelete, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function FollowButton({
  username,
  isFollowing,
  onChange,
}: {
  username: string;
  isFollowing: boolean;
  onChange?: (r: { is_following: boolean; followers_count: number }) => void;
}) {
  const [following, setFollowing] = React.useState(isFollowing);
  const [busy, setBusy] = React.useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      const res = following
        ? await apiDelete<{ is_following: boolean; followers_count: number }>(`/users/${username}/follow`)
        : await apiPost<{ is_following: boolean; followers_count: number }>(`/users/${username}/follow`);
      setFollowing(res.is_following);
      onChange?.(res);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant={following ? "outline" : "primary"} size="sm" onClick={toggle} disabled={busy}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}

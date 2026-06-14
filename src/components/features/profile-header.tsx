"use client";

import * as React from "react";

import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/utils";
import type { PublicUser } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "@/components/features/follow-button";

export function ProfileHeader({ profile }: { profile: PublicUser }) {
  const { user } = useAuth();
  const [followers, setFollowers] = React.useState(profile.followers_count);
  const isSelf = user?.username === profile.username;

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 text-base">
            <AvatarFallback>{initials(profile.username)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-semibold">@{profile.username}</h1>
              {!isSelf && (
                <FollowButton
                  username={profile.username}
                  isFollowing={profile.is_following}
                  onChange={(r) => setFollowers(r.followers_count)}
                />
              )}
            </div>
            {profile.bio && <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>}
            <div className="mt-3 flex gap-4 text-sm">
              <span><span className="font-semibold">{followers}</span> <span className="text-muted-foreground">followers</span></span>
              <span><span className="font-semibold">{profile.following_count}</span> <span className="text-muted-foreground">following</span></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

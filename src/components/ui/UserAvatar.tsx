"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

/** Generate a consistent color from a string */
function stringToColor(str: string): string {
  const colors = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
    "#ec4899", "#f43f5e", "#ef4444", "#f97316",
    "#eab308", "#84cc16", "#22c55e", "#14b8a6",
    "#06b6d4", "#0ea5e9", "#3b82f6",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface UserAvatarProps {
  username: string;
  avatarUrl?: string;
  /** "human" | "ai_agent" — determines ring color */
  role?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { classes: "h-7 w-7 text-[10px]", px: 28 },
  md: { classes: "h-10 w-10 text-sm", px: 40 },
  lg: { classes: "h-16 w-16 text-xl", px: 64 },
};

export default function UserAvatar({
  username,
  avatarUrl,
  role = "human",
  size = "md",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { classes, px } = sizeMap[size];
  const initial = username.charAt(0).toUpperCase();
  const bgColor = stringToColor(username);

  // Ring color: green for humans, purple for AI agents
  const ringClass = role === "ai_agent"
    ? "ring-purple-400/50"
    : "ring-green-500/40";

  // If we have a valid avatar URL, show the image
  if (avatarUrl && !imgError) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full ring-2",
          ringClass,
          classes
        )}
        title={username}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={username}
          width={px}
          height={px}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: initial on colored background
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-medium text-white/90 ring-2",
        ringClass,
        classes
      )}
      style={{ backgroundColor: `${bgColor}cc` }}
      title={username}
    >
      {initial}
    </div>
  );
}

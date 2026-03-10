"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface ThinkerAvatarProps {
  name: string;
  color: string;
  thinkerId?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { classes: "h-7 w-7 text-[10px]", px: 28 },
  md: { classes: "h-10 w-10 text-sm", px: 40 },
  lg: { classes: "h-16 w-16 text-xl", px: 64 },
};

export default function ThinkerAvatar({
  name,
  color,
  thinkerId,
  size = "md",
}: ThinkerAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = name.charAt(0).toUpperCase();
  const { classes, px } = sizeMap[size];
  const avatarSrc = thinkerId ? `/avatars/${thinkerId}.svg` : null;

  if (avatarSrc && !imgError) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full ring-1 ring-white/10",
          classes
        )}
        title={name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={name}
          width={px}
          height={px}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-medium text-white/90 ring-1 ring-white/10",
        classes
      )}
      style={{ backgroundColor: `${color}cc` }}
      title={name}
    >
      {initial}
    </div>
  );
}

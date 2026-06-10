interface EndorsementBadgeProps {
  thinkerName: string;
  thinkerColor: string;
  type: "endorse" | "challenge";
  reason?: string | null;
}

export default function EndorsementBadge({
  thinkerName,
  thinkerColor,
  type,
  reason,
}: EndorsementBadgeProps) {
  const isEndorse = type === "endorse";

  return (
    <div className="text-[13px] leading-relaxed text-muted/60">
      <span className="italic">
        <span className="text-accent/50">&loz;</span>
        {" "}
        {isEndorse ? "Endorsed" : "Challenged"} by{" "}
        <span
          className="not-italic"
          style={{ color: `${thinkerColor}cc` }}
        >
          {thinkerName}
        </span>
      </span>
      {reason && (
        <span className="ml-1 text-[12px] text-muted/40">
          &mdash; {reason}
        </span>
      )}
    </div>
  );
}

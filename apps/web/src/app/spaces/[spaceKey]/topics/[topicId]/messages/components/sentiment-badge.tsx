import { Sentiment } from "@/app/lib/types";

interface SentimentBadgeProps {
  sentiment?: Sentiment | null;
}

const sentimentConfig = {
  POSITIVE: {
    label: "ポジティブな感情",
    emoji: "😊",
    text: "Positive",
    className: "badge-success",
  },
  NEGATIVE: {
    label: "ネガティブな感情",
    emoji: "😢",
    text: "Negative",
    className: "badge-error",
  },
  MIXED: {
    label: "複雑な感情",
    emoji: "🤔",
    text: "Mixed",
    className: "badge-info",
  },
  NEUTRAL: {
    label: "ニュートラルな感情",
    emoji: "😐",
    text: "Neutral",
    className: "badge-neutral",
  },
};

export default function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  if (!sentiment) {
    return null;
  }

  const { label, emoji, text, className } = sentimentConfig[sentiment];

  return (
    <div className="tooltip tooltip-right" data-tip={label}>
      <div
        aria-hidden="true"
        className={`badge ${className} badge-lg flex items-center gap-2`}
      >
        <span>{emoji}</span>
        {text}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

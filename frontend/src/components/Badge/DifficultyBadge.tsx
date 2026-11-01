import { useTranslation } from "react-i18next";
import { Badge, type BadgeTone } from "./Badge";

type DifficultyWord = "beginner" | "intermediate" | "advanced" | "technical";

/** Declared difficulty 1 to 5 as one of the design's four words (spec site/map). */
export function difficultyWord(difficulty: number): DifficultyWord {
  if (difficulty <= 1) return "beginner";
  if (difficulty <= 3) return "intermediate";
  return difficulty === 4 ? "advanced" : "technical";
}

const TONES: Record<DifficultyWord, BadgeTone> = {
  beginner: "success",
  intermediate: "info",
  advanced: "caution",
  technical: "danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: number }) {
  const { t } = useTranslation();
  const word = difficultyWord(difficulty);
  return <Badge tone={TONES[word]}>{t(`site.difficulty.${word}`)}</Badge>;
}

// src/lib/types/safety.ts

export interface SafetyEvaluation {
  status: "pass" | "warn" | "block";
  score: number | null;
  message: string;
}

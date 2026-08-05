type SleepScheduleValue = "EARLY" | "FLEXIBLE" | "LATE";
type TidinessValue = "MESSY" | "MODERATE" | "VERY_TIDY";
type FrequencyValue = "NEVER" | "RARELY" | "SOMETIMES" | "OFTEN" | "ALWAYS";
type HabitValue = "NO" | "SOMETIMES" | "YES";

type LegacySleepScheduleValue = "12AM-8AM" | "10PM-6AM" | "8PM-5AM";
type LegacyTidinessValue = "LOW" | "MEDIUM" | "HIGH";
type LegacyFrequencyValue = "DAILY" | "WEEKLY" | "BIWEEKLY";

type SleepScheduleInput = SleepScheduleValue | LegacySleepScheduleValue | string | null | undefined;
type TidinessInput = TidinessValue | LegacyTidinessValue | string | null | undefined;
type FrequencyInput = FrequencyValue | string | null | undefined;
type HabitInput = HabitValue | string | null | undefined;

const SLEEP_SCHEDULE_SCORE: Record<SleepScheduleValue, number> = {
  EARLY: 5,     // Sớm
  FLEXIBLE: 3,  // Linh hoạt
  LATE: 1,      // Cú đêm
};

const TIDINESS_SCORE: Record<TidinessValue, number> = {
  MESSY: 1,      // Bừa bộn
  MODERATE: 3,   // Bình thường
  VERY_TIDY: 5,  // Rất sạch sẽ
};

const FREQUENCY_SCORE: Record<FrequencyValue, number> = {
  NEVER: 1,
  RARELY: 2,
  SOMETIMES: 3,
  OFTEN: 4,
  ALWAYS: 5,
};

const HABIT_SCORE: Record<HabitValue, number> = {
  NO: 5,        // Tốt (không hút thuốc, không uống rượu)
  SOMETIMES: 3, // Trung bình
  YES: 1,       // Không tốt (hút thuốc, uống rượu)
};

const SLEEP_SCHEDULE_ALIASES: Record<LegacySleepScheduleValue, SleepScheduleValue> = {
  "12AM-8AM": "LATE",
  "10PM-6AM": "FLEXIBLE",
  "8PM-5AM": "EARLY",
};

const TIDINESS_ALIASES: Record<LegacyTidinessValue, TidinessValue> = {
  LOW: "MESSY",
  MEDIUM: "MODERATE",
  HIGH: "VERY_TIDY",
};

const FREQUENCY_ALIASES: Record<LegacyFrequencyValue, FrequencyValue> = {
  DAILY: "ALWAYS",
  WEEKLY: "OFTEN",
  BIWEEKLY: "SOMETIMES",
};

function normalizeEnumValue<TValue extends string>(
  rawValue: string | null | undefined,
  allowedValues: readonly TValue[],
  aliasMap?: Record<string, TValue>
): TValue | undefined {
  if (!rawValue) {
    return undefined;
  }

  const normalizedValue = rawValue.toUpperCase();
  if (allowedValues.includes(normalizedValue as TValue)) {
    return normalizedValue as TValue;
  }

  return aliasMap?.[normalizedValue];
}

export interface RoommateVector {
  sleepScore: number;
  tidyScore: number;
  cleaningScore: number;
  smokingScore: number;
  drinkingScore: number;
  cookingScore: number;
  petScore: number;
}

/**
 * Convert roommate profile to vector (1-5 scale)
 */
export function profileToVector(profile: any): RoommateVector {
  const sleepSchedule = normalizeEnumValue(
    profile.sleepSchedule,
    ["EARLY", "FLEXIBLE", "LATE"] as const,
    SLEEP_SCHEDULE_ALIASES
  );
  const tidiness = normalizeEnumValue(
    profile.tidiness,
    ["MESSY", "MODERATE", "VERY_TIDY"] as const,
    TIDINESS_ALIASES
  );
  const cleaningFreq = normalizeEnumValue(
    profile.cleaningFreq,
    ["NEVER", "RARELY", "SOMETIMES", "OFTEN", "ALWAYS"] as const, FREQUENCY_ALIASES
  );
  const smoking = normalizeEnumValue(profile.smoking, ["NO", "SOMETIMES", "YES"] as const);
  const drinking = normalizeEnumValue(profile.drinking, ["NO", "SOMETIMES", "YES"] as const);
  const cookingFreq = normalizeEnumValue(
    profile.cookingFreq,
    ["NEVER", "RARELY", "SOMETIMES", "OFTEN", "ALWAYS"] as const, FREQUENCY_ALIASES
  );

  return {
    sleepScore: sleepSchedule ? SLEEP_SCHEDULE_SCORE[sleepSchedule] : 3,
    tidyScore: tidiness ? TIDINESS_SCORE[tidiness] : 3,
    cleaningScore: cleaningFreq ? FREQUENCY_SCORE[cleaningFreq] : 3,
    smokingScore: smoking ? HABIT_SCORE[smoking] : 3,
    drinkingScore: drinking ? HABIT_SCORE[drinking] : 3,
    cookingScore: cookingFreq ? FREQUENCY_SCORE[cookingFreq] : 3,
    petScore: profile.hasPet ? 1 : 5, // Prefer no pets (5 = no pet)
  };
}

/**
 * Calculate dot product of two vectors
 * A·B = sum(A[i] × B[i])
 */
function dotProduct(a: RoommateVector, b: RoommateVector): number {
  return (
    a.sleepScore * b.sleepScore +
    a.tidyScore * b.tidyScore +
    a.cleaningScore * b.cleaningScore +
    a.smokingScore * b.smokingScore +
    a.drinkingScore * b.drinkingScore +
    a.cookingScore * b.cookingScore +
    a.petScore * b.petScore
  );
}

/**
 * Calculate magnitude of vector
 * ||A|| = sqrt(sum(A[i]²))
 */
function magnitude(v: RoommateVector): number {
  const sumOfSquares =
    v.sleepScore ** 2 +
    v.tidyScore ** 2 +
    v.cleaningScore ** 2 +
    v.smokingScore ** 2 +
    v.drinkingScore ** 2 +
    v.cookingScore ** 2 +
    v.petScore ** 2;

  return Math.sqrt(sumOfSquares);
}

/**
 * Calculate Cosine Similarity between two vectors
 * Returns value between 0 and 1
 *
 * Formula: cos(θ) = (A·B) / (||A|| × ||B||)
 */
export function cosineSimilarity(
  vectorA: RoommateVector,
  vectorB: RoommateVector
): number {
  const dotProd = dotProduct(vectorA, vectorB);
  const magA = magnitude(vectorA);
  const magB = magnitude(vectorB);

  // Avoid division by zero
  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dotProd / (magA * magB);
}

/**
 * Calculate budget compatibility
 * Returns 0-1 (0 if no overlap, 1 if exact match)
 */
export function budgetCompatibility(
  minA: number,
  maxA: number,
  minB: number,
  maxB: number
): number {
  // Check if budget ranges overlap
  const overlapMin = Math.max(minA, minB);
  const overlapMax = Math.min(maxA, maxB);

  if (overlapMin > overlapMax) {
    return 0; // No overlap
  }

  // Calculate overlap percentage
  const overlapRange = overlapMax - overlapMin;
  const avgRange = (maxA - minA + (maxB - minB)) / 2;

  return Math.min(overlapRange / avgRange, 1);
}

/**
 * Calculate overall compatibility percentage
 * Combines lifestyle (60%), budget (20%), gender (10%), age (10%)
 */
export function calculateCompatibility(
  userProfile: any,
  targetProfile: any
): number {
  // 1. Lifestyle compatibility (60% weight)
  const userVector = profileToVector(userProfile);
  const targetVector = profileToVector(targetProfile);
  const lifestyleSimilarity = cosineSimilarity(userVector, targetVector);

  // 2. Budget compatibility (20% weight)
  let budgetSim = 0;
  if (
    userProfile.budgetMin &&
    userProfile.budgetMax &&
    targetProfile.budgetMin &&
    targetProfile.budgetMax
  ) {
    budgetSim = budgetCompatibility(
      parseFloat(userProfile.budgetMin),
      parseFloat(userProfile.budgetMax),
      parseFloat(targetProfile.budgetMin),
      parseFloat(targetProfile.budgetMax)
    );
  } else {
    budgetSim = 1; // Default if not filled
  }

  // 3. Gender compatibility (10% weight)
  // Prefer opposite gender for roommate
  let genderScore = 0;
  if (
    userProfile.gender &&
    targetProfile.gender &&
    userProfile.gender !== targetProfile.gender
  ) {
    genderScore = 1;
  } else if (!userProfile.gender || !targetProfile.gender) {
    genderScore = 0.5;
  }

  // 4. Age compatibility (10% weight)
  // Prefer within 5 years
  let ageScore = 0;
  if (userProfile.age && targetProfile.age) {
    const ageDiff = Math.abs(userProfile.age - targetProfile.age);
    if (ageDiff <= 5) {
      ageScore = 1 - ageDiff / 10; // 1.0 at 0 years, decreases to 0.5 at 5 years
    } else {
      ageScore = Math.max(1 - ageDiff / 30, 0); // Decreases further beyond 5 years
    }
  } else {
    ageScore = 0.5;
  }

  // Weighted average
  const totalScore =
    lifestyleSimilarity * 0.6 +
    budgetSim * 0.2 +
    genderScore * 0.1 +
    ageScore * 0.1;

  // Convert to percentage (0-100)
  return Math.round(totalScore * 100);
}

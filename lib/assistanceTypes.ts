export const ASSISTANCE_TYPE_VALUES = [
  "financial",
  "physical",
  "expertise",
  "emotional",
  "other",
] as const;

export type AssistanceType = (typeof ASSISTANCE_TYPE_VALUES)[number];

export interface AssistanceTypeOption {
  value: AssistanceType;
  label: string;
  description: string;
}

export const ASSISTANCE_TYPE_CONFIG: Record<
  AssistanceType,
  AssistanceTypeOption
> = {
  financial: {
    value: "financial",
    label: "Financial Assistance",
    description: "Monetary support toward a specific need or emergency",
  },
  physical: {
    value: "physical",
    label: "Physical Assistance",
    description: "Hands-on help, labor, or physical support",
  },
  expertise: {
    value: "expertise",
    label: "Expertise / Skills",
    description: "Professional advice, mentorship, or specialized skills",
  },
  emotional: {
    value: "emotional",
    label: "Emotional Support",
    description: "Companionship, encouragement, or emotional care",
  },
  other: {
    value: "other",
    label: "Other",
    description: "Anything that doesn't fit the categories above",
  },
};

export const ASSISTANCE_TYPE_OPTIONS: AssistanceTypeOption[] =
  ASSISTANCE_TYPE_VALUES.map((v) => ASSISTANCE_TYPE_CONFIG[v]);

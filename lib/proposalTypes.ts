export const PROPOSAL_TYPE_VALUES = [
  "policy",
  "initiative",
  "budget",
  "event",
  "other",
] as const;

export type ProposalType = (typeof PROPOSAL_TYPE_VALUES)[number];

export interface ProposalTypeOption {
  value: ProposalType;
  label: string;
  description: string;
}

export const PROPOSAL_TYPE_CONFIG: Record<ProposalType, ProposalTypeOption> = {
  policy: {
    value: "policy",
    label: "Community Policy",
    description: "A new rule or policy for how the community operates",
  },
  initiative: {
    value: "initiative",
    label: "Community Initiative",
    description: "A new program or activity for the community to undertake",
  },
  budget: {
    value: "budget",
    label: "Budget Allocation",
    description: "A request to allocate community funds toward a purpose",
  },
  event: {
    value: "event",
    label: "Event Planning",
    description: "A proposal to organize or plan a community event",
  },
  other: {
    value: "other",
    label: "Other",
    description: "Anything that doesn't fit the categories above",
  },
};

export const PROPOSAL_TYPE_OPTIONS: ProposalTypeOption[] =
  PROPOSAL_TYPE_VALUES.map((v) => PROPOSAL_TYPE_CONFIG[v]);

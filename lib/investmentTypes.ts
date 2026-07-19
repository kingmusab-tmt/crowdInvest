// Single source of truth for investment types, shared by the Investment,
// MemberInvestment and InvestmentSuggestion models plus every dropdown/form
// that lets a user pick a type. Add a new type here and it propagates
// everywhere (schema enums still need their own array literal since
// Mongoose enums are evaluated at schema-definition time — see
// INVESTMENT_TYPE_VALUES usage in each model file).

export const INVESTMENT_TYPE_VALUES = [
  "stock",
  "business",
  "crypto",
  "real-estate",
  "bond",
  "mutual-fund",
] as const;

export type InvestmentType = (typeof INVESTMENT_TYPE_VALUES)[number];

export interface InvestmentTypeField {
  name: string;
  label: string;
  type: "text" | "number" | "date";
  placeholder?: string;
  helperText?: string;
}

export interface InvestmentTypeConfig {
  value: InvestmentType;
  label: string;
  description: string;
  fields: InvestmentTypeField[];
}

export const INVESTMENT_TYPE_CONFIG: Record<InvestmentType, InvestmentTypeConfig> = {
  stock: {
    value: "stock",
    label: "Stock",
    description: "Publicly traded company shares",
    fields: [
      {
        name: "ticker",
        label: "Ticker Symbol",
        type: "text",
        placeholder: "e.g., DANGCEM, AAPL",
      },
      {
        name: "exchange",
        label: "Stock Exchange",
        type: "text",
        placeholder: "e.g., NGX, NYSE",
      },
    ],
  },
  business: {
    value: "business",
    label: "Business",
    description: "Equity stake in a private business",
    fields: [
      {
        name: "industry",
        label: "Industry",
        type: "text",
        placeholder: "e.g., Agriculture, Retail",
      },
      {
        name: "equityPercentage",
        label: "Equity Percentage (%)",
        type: "number",
        placeholder: "e.g., 15",
      },
    ],
  },
  crypto: {
    value: "crypto",
    label: "Cryptocurrency",
    description: "Digital assets and tokens",
    fields: [
      {
        name: "coinSymbol",
        label: "Coin/Token Symbol",
        type: "text",
        placeholder: "e.g., BTC, ETH",
      },
      {
        name: "network",
        label: "Blockchain/Network",
        type: "text",
        placeholder: "e.g., Bitcoin, Ethereum",
      },
    ],
  },
  "real-estate": {
    value: "real-estate",
    label: "Real Estate",
    description: "Property and land investments",
    fields: [
      {
        name: "propertyAddress",
        label: "Property Address",
        type: "text",
        placeholder: "e.g., 12 Admiralty Way, Lekki",
      },
      {
        name: "propertyType",
        label: "Property Type",
        type: "text",
        placeholder: "e.g., Residential, Commercial, Land",
      },
    ],
  },
  bond: {
    value: "bond",
    label: "Bond",
    description: "Government or corporate debt instruments",
    fields: [
      {
        name: "issuer",
        label: "Issuer",
        type: "text",
        placeholder: "e.g., FGN, Corporate name",
      },
      {
        name: "couponRate",
        label: "Coupon Rate (%)",
        type: "number",
        placeholder: "e.g., 12.5",
      },
      {
        name: "maturityDate",
        label: "Maturity Date",
        type: "date",
      },
    ],
  },
  "mutual-fund": {
    value: "mutual-fund",
    label: "Mutual Fund",
    description: "Professionally managed pooled fund",
    fields: [
      {
        name: "fundManager",
        label: "Fund Manager",
        type: "text",
        placeholder: "e.g., ARM, Stanbic IBTC",
      },
      {
        name: "fundCategory",
        label: "Fund Category",
        type: "text",
        placeholder: "e.g., Money Market, Equity",
      },
    ],
  },
};

export const INVESTMENT_TYPE_OPTIONS: InvestmentTypeConfig[] =
  INVESTMENT_TYPE_VALUES.map((value) => INVESTMENT_TYPE_CONFIG[value]);

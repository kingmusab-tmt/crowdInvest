declare module "naija-state-local-government" {
  interface StateInfo {
    state: string;
    senatorial_districts: string[];
    lgas: string[];
  }

  const NigeriaStates: {
    all: () => StateInfo[];
    states: () => string[];
    senatorial_districts: (state: string) => StateInfo | { error: string };
    lgas: (state: string) => { state: string; lgas: string[] } | { error: string };
  };

  export default NigeriaStates;
}

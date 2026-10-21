export interface StandardPort {
  code: string;
  name: string;
  island?: string;
  country?: string;
}

export const STANDARD_PORTS: readonly StandardPort[] = [] as const;

export type PortCode = string;

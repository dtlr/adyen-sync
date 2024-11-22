import { z } from "zod";

export type Bindings = {
  APP_ENV: "PROD" | "prod" | "QA" | "qa" | "DEV" | "dev" | undefined;
  DATABASE_URL?: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_USER: string;
  DB_PASSWORD: string;
  ADYEN_KEY_TEST: string;
  ADYEN_KEY_LIVE: string;
};

export type AdyenTerminalsResponse = {
  _links: Links;
  itemsTotal: number;
  pagesTotal: number;
  data: TerminalData[];
};

export type AdyenStoresResponse = {
  _links: Links;
  itemsTotal: number;
  pagesTotal: number;
  data: StoreData[];
};

interface Links {
  first: {
    href: string;
  };
  last: {
    href: string;
  };
  next: {
    href: string;
  };
  self: {
    href: string;
  };
}

export interface StoreData {
  id: string;
  description: string;
  reference: string;
  status: string;
  merchantId: string;
  phoneNumber: string;
  address: Address;
  _links: Pick<Links, "self">;
}

export interface Address {
  line1: string;
  line2: string;
  line3: string;
  city: string;
  postalCode: string;
  stateOrProvince: string;
  country: string;
}

export interface TerminalData {
  id: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  assignment: Assignment;
  connectivity: Connectivity;
}

interface Assignment {
  companyId: string;
  merchantId: string;
  storeId: string;
  status: string;
  reassignmentTarget: ReassignmentTarget;
}

interface ReassignmentTarget {
  inventory: boolean;
}

interface Connectivity {
  cellular: Cellular;
  wifi: Wifi;
}

interface Cellular {
  iccid: string;
}

interface Wifi {
  ipAddress: string;
  macAddress: string;
}

export const adyenTerminalBoardWebhook = z.object({
  type: z.string(),
  createdAt: z.string(),
  environment: z.string(),
  data: z.object({
    companyId: z.string(),
    merchantId: z.string(),
    storeId: z.string(),
    uniqueTerminalId: z.string(),
  }),
});

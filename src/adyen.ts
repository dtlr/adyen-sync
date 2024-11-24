import axios from "axios";
import type {
  AdyenTerminalsResponse,
  StoreData,
  TerminalData,
} from "./types.js";

import type { AdyenStoresResponse } from "./types.js";
import { AdyenSyncError } from "./error.js";
import { ADYEN_KEY } from "./index.js";
import { ADYEN_KEY_LIVE, ADYEN_KEY_TEST, APP_ENV } from "./index.js";

export const fetchAdyenData = async (
  {
    type = "stores",
    page = 1,
    pageSize = 100,
  }: {
    type?: "stores" | "terminals";
    page?: number;
    pageSize?: number;
  } = {},
) => {
  const adyenKey = ADYEN_KEY
    ? ADYEN_KEY
    : APP_ENV?.toLowerCase() === "prod"
    ? ADYEN_KEY_LIVE
    : ADYEN_KEY_TEST;
  const adyenEndpoint =
    APP_ENV?.toLowerCase() === "prod" ? "management-live" : "management-test";
  try {
    let pagesTotal: number;
    let data: (StoreData | TerminalData)[] = [];

    do {
      const query =
        type.toLowerCase() === "stores"
          ? `https://${adyenEndpoint}.adyen.com/v3/stores?pageNumber=${page}&pageSize=${pageSize}`
          : `https://${adyenEndpoint}.adyen.com/v3/terminals?pageNumber=${page}&pageSize=${pageSize}`;
      const response = await axios.get<
        AdyenStoresResponse | AdyenTerminalsResponse
      >(query, {
        headers: {
          "Content-Type": "application/json",
          "X-API-key": adyenKey,
        },
      });
      pagesTotal = response.data.pagesTotal;
      const apiData = response.data.data;
      data = data.concat(apiData);
      page++;
    } while (pagesTotal > page);

    return data;
  } catch (error) {
    throw new AdyenSyncError({
      name: "ADYEN_API",
      message: "Error in the fetch call to Adyen API",
      cause: error,
    });
  }
};

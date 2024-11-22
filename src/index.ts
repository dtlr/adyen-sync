import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { RETAINED_304_HEADERS } from "hono/etag";
import { etag } from "hono/etag";
import { HTTPException } from "hono/http-exception";
import { AdyenSyncError } from "./error.js";
import {
  adyenTerminalBoardWebhook,
  type StoreData,
  type TerminalData,
} from "./types.js";
import { showRoutes } from "hono/dev";
import { fetchAdyenData } from "./adyen.js";
import { parseStoreRef } from "./utils.js";
import { updateDatabase } from "./db.js";
import { logger } from "./utils.js";

export const {
  DATABASE_URL,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  APP_PORT,
  APP_ENV,
  ADYEN_KEY,
  ADYEN_KEY_TEST,
  ADYEN_KEY_LIVE,
} = process.env;

const app = new Hono();

if (!DATABASE_URL && (!DB_USER || !DB_PASSWORD || !DB_HOST))
throw new AdyenSyncError({
  name: "DATABASE_CONFIG_MISSING",
  message: "Database configuration is missing.",
  cause: {
    DATABASE_URL: DATABASE_URL
      ? "Has value but is being treated as secure"
      : "Missing",
    DB_USER: DB_USER ? DB_USER : "Missing",
    DB_PASSWORD: DB_PASSWORD
      ? "Has value but is being treated as secure"
      : "Missing",
    DB_HOST: DB_HOST ? DB_HOST : "Missing",
    DB_PORT: DB_PORT ? DB_PORT : "Missing",
    },
  });

if (!ADYEN_KEY && (!ADYEN_KEY_TEST || !ADYEN_KEY_LIVE))
  throw new AdyenSyncError({
    name: "ADYEN_CONFIG_MISSING",
    message: "Adyen configuration is missing.",
    cause: {
      ADYEN_KEY: ADYEN_KEY ? "Has value but is being treated as secure" : "Missing",
      ADYEN_KEY_TEST: ADYEN_KEY_TEST ? "Has value but is being treated as secure" : "Missing",
      ADYEN_KEY_LIVE: ADYEN_KEY_LIVE ? "Has value but is being treated as secure" : "Missing",
    },
  });

app.use("*", requestId());
app.use(
  "*",
  etag({
    retainedHeaders: ["x-message", ...RETAINED_304_HEADERS],
  })
);
app.use(prettyJSON());
app.use("*", cors());
app.use("*", secureHeaders());

app.get("/readyz", (c) => {
  // logger.info({
  //   message: "Received request",
  //   requestId: c.get("requestId"),
  // });
  return c.json({ status: "ok" });
});

app.post("/callback/adyen", async (c) => {
  const body = await c.req.json();
  const parsedBody = adyenTerminalBoardWebhook.safeParse(body);
  if (!parsedBody.success) {
    throw new AdyenSyncError({
      requestId: c.get("requestId"),
      name: "ROUTE_ADYEN_WEBBHOOK",
      message: "Invalid webhook body",
      cause: {
        unprocessedBody: body,
        parsedBody,
        errors: parsedBody.error,
      },
    });
  }
  logger.info({
    message: "Received request",
    requestId: c.get("requestId"),
    body: parsedBody.data,
  });
  return c.json({ requestId: c.get("requestId") });
});

app.get("/fleet", async (c) => {
  const stores = (await fetchAdyenData()) as StoreData[];
  const terminals = (await fetchAdyenData({
    type: "terminals",
  })) as TerminalData[];
  const mposDevices = terminals.filter(
    (terminal) =>
      terminal.model === "S1E2L" &&
      terminal.assignment.status.toLowerCase() === "boarded"
  );
  const jmData: [string, string, string][] = [];
  for (const mposDevice of mposDevices) {
    const store = stores.find(
      (store) => store.id === mposDevice.assignment.storeId
    );
    if (!store?.reference)
      throw new AdyenSyncError({
        requestId: c.get("requestId"),
        name: "ROUTE_FLEET",
        message: "Unable to find store reference",
        cause: {
          stores,
          mposDevice,
        },
      });

    const storeRef = parseStoreRef(store.reference);
    if (!storeRef?.prefix || !storeRef?.number)
      throw new AdyenSyncError({
        requestId: c.get("requestId"),
        name: "ROUTE_FLEET",
        message: "Store reference processing",
        cause: {
          message: `Store ${store.id} reference, ${store.reference}, is not in the expected format.`,
        },
      });
    jmData.push([mposDevice.id, storeRef?.prefix, storeRef?.number]);
  }
  await updateDatabase(jmData);
  return c.json(
    { requestId: c.get("requestId"), message: "Fleet is going to be synced" },
    200
  );
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    logger.error(err);
    return c.json(
      { message: err.message, requestId: c.get("requestId") },
      err.status
    );
  } else if (err instanceof AdyenSyncError) {
    logger.error(err);
    return c.json({ message: err.message, requestId: c.get("requestId") }, 400);
  } else {
    logger.error(err);
    return c.json(
      {
        name: "UNHANDLED_ERROR",
        message: "Error caught",
        requestId: c.get("requestId"),
      },
      500
    );
  }
});

const port = parseInt(APP_PORT || "3000");
logger.info(`Server is running on ${port}`);
logger.info(`App environment: ${APP_ENV}`);

serve({
  fetch: app.fetch,
});

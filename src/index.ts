import { serve } from "@hono/node-server";
import { Hono, type Context } from "hono";
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
import { createLogger, format, config,transports } from "winston";

const getRequestId = (c: Context) => {
  return format((info, opts) => {
    info.requestId = c.get("requestId");
    return info;
  });
};

const logger = createLogger({
  levels: config.syslog.levels,
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "adyen-sync" },
  transports: [new transports.Console({ forceConsole: true })],
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
});

export const app = new Hono();

app.use("*", requestId());
app.use(
  "*",
  etag({
    retainedHeaders: ["x-message", ...RETAINED_304_HEADERS],
  }),
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
  const stores = (await fetchAdyenData(c)) as StoreData[];
  const terminals = (await fetchAdyenData(c, {
    type: "terminals",
  })) as TerminalData[];
  const mposDevices = terminals.filter(
    (terminal) =>
      terminal.model === "S1E2L" &&
      terminal.assignment.status.toLowerCase() === "boarded",
  );
  const jmData: [string, string, string][] = [];
  for (const mposDevice of mposDevices) {
    const store = stores.find(
      (store) => store.id === mposDevice.assignment.storeId,
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
  await updateDatabase(c, jmData);
  return c.json(
    { requestId: c.get("requestId"), message: "Fleet is going to be synced" },
    200,
  );
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    logger.error(err);
    return c.json(
      { message: err.message, requestId: c.get("requestId") },
      err.status,
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
      500,
    );
  }
});

showRoutes(app, {
  verbose: true,
});

const port = parseInt(process.env.APP_PORT || "3000");
console.log(`Server is running on ${port}`);
console.log(`App environment: ${process.env.APP_ENV}`);

serve({
  fetch: app.fetch,
});

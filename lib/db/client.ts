import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL as string;

if (!connectionString) {
  // eslint-disable-next-line no-console
  console.warn(
    "DATABASE_URL is not set. Drizzle client will not be initialized."
  );
}

export const queryClient = connectionString
  ? postgres(connectionString, { max: 1, prepare: true, ssl: "require" })
  : undefined;

export const db = queryClient
  ? drizzle(queryClient, { schema })
  : (undefined as unknown as ReturnType<typeof drizzle<typeof schema>>);

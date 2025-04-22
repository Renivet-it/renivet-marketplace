import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// export const connection = postgres(process.env.DATABASE_URL!);
// export const db = drizzle(connection, {
//     schema,
// });
// Create a connection pool with postgres-js
const connection = postgres(process.env.DATABASE_URL!, {
    max: 20, // Maximum number of connections in the pool (adjust based on your DB's max_connections)
    idle_timeout: 30, // Close idle connections after 30 seconds
    connect_timeout: 5, // Timeout for establishing a new connection (in seconds)
    max_lifetime: 60 * 30, // Close connections after 30 minutes to avoid stale connections
  });

  // Initialize drizzle with the pooled connection
  export const db = drizzle(connection, {
    schema,
  });

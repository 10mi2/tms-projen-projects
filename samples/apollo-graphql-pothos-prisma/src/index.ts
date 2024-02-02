import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { initContextCache } from "@pothos/core";

import { PrismaClient } from "@prisma/client";
import { BuilderContext } from "./builder.js";
import { schema } from "./schema.js";

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer<BuilderContext>({
  schema,
});

const prisma = new PrismaClient({ log: [{ level: "query", emit: "event" }] });
// log queries
prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
  console.log("Params: " + e.params);
  console.log("Duration: " + e.duration + "ms");
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer<BuilderContext>(server, {
  listen: { port: 4000 },
  context: async () => {
    return {
      ...initContextCache(),
      prisma,
    };
  },
});

console.log(`🚀 Server listening at: ${url}`);

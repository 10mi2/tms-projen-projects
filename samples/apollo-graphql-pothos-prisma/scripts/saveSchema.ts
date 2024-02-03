import fs from "node:fs/promises";
import { printSchema } from "graphql";
import { schema } from "../src/schema.js";

const schemaOut = printSchema(schema);

await fs.writeFile("./schema.graphql", schemaOut, "utf-8");

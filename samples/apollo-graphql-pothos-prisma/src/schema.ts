import { builder } from "./builder.js";

builder.queryType({ description: "Root query type" });
builder.mutationType({ description: "Root mutation type" });

import "./users.js";
import "./posts.js";

export const schema = builder.toSchema();

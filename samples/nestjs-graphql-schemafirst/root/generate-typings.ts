import { join } from "path";
import { GraphQLDefinitionsFactory } from "@nestjs/graphql";

const definitionsFactory = new GraphQLDefinitionsFactory();
// if esmSupportConfig is `true` then `void` can be `await` and the
// `.then(() => void 0)` can be removed.
void definitionsFactory
  .generate({
    typePaths: ["./src/**/*.graphql"],
    path: join(process.cwd(), "src/graphql.schema.ts"),
    outputAs: "interface",
  })
  .then(() => void 0);

import * as assert from "node:assert";
import * as path from "node:path";
import { JsonPatch, SampleDir, SampleFile, TextFile } from "projen";
import { EslintOverride } from "projen/lib/javascript";
import { deepMerge } from "projen/lib/util";
import {
  TmsTypeScriptAppProject,
  TmsTypeScriptAppProjectOptions,
} from "./tms-typescript-app-project";

export interface TmsTSApolloGraphQLProjectOptions
  extends TmsTypeScriptAppProjectOptions {
  /**
   * Which type of sample code to include, if `sampleCode` is true.
   *
   * @default "pothos-prisma"
   * @featured
   */
  readonly sampleType?: "pothos-prisma";
}

/**
 * Create a TypeScript Apollo GraphQL service project with [Ten Mile Square](https://tenmilesquare.com)
 * opinionated defaults, and preloaded with a sample application using the following stack:
 *
 * 1) [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
 * 2) [Pothos GraphQL](https://pothos-graphql.dev) Code-First Schema Generator
 * 3) [Prisma](https://www.prisma.io) Database ORM (configured for SQLite by default)
 * 4) Complete unit-test suite using [Jest](https://jestjs.io)
 *
 * A ReadMe will be installed to guide you through the setup and configuration of the project.
 *
 * @pjid tms-apollo-graphql-app
 */

export class TmsTSApolloGraphQLProject extends TmsTypeScriptAppProject {
  constructor(options: TmsTSApolloGraphQLProjectOptions) {
    const defaultOptions = {
      tsconfigBaseStrictest: true,
      tsconfig: {
        compilerOptions: {
          // exactOptionalPropertyTypes is too heavy handed, conflicts with prisma and pothos generated code
          exactOptionalPropertyTypes: false,
          // noPropertyAccessFromIndexSignature is too heavy handed as well
          noPropertyAccessFromIndexSignature: false,
        },
      },
      tsconfigDev: {
        compilerOptions: {
          esModuleInterop: true,
          exactOptionalPropertyTypes: false,
          noPropertyAccessFromIndexSignature: false,
        },
      },
      sampleCode: true,
      sampleType: "pothos-prisma",
    } satisfies Partial<TmsTSApolloGraphQLProjectOptions>;

    const mergedOptions = deepMerge(
      [
        defaultOptions, // will get mutated
        options,
      ],
      true,
    ) as TmsTSApolloGraphQLProjectOptions; // justified cast, since we know we're merging two of this type

    super({ ...mergedOptions, sampleCode: false, readme: undefined });

    const project = this;

    project.tasks.addTask("start:dev", {
      description: "Start the server in development mode",
      exec: "nodemon src/index.ts",
    });

    const prismaGenerateTask = project.tasks.addTask("prisma:generate", {
      description: "Update the prisma client",
      exec: "prisma generate",
    });
    project.preCompileTask.prependSpawn(prismaGenerateTask);

    this.addDeps(
      "@apollo/server",
      "graphql",
      "@pothos/core",
      "@prisma/client",
      "@pothos/plugin-prisma",
      "zod",
    );
    this.addDevDeps(
      "@10mi2/tms-projen-projects",
      "nodemon",
      "prisma",
      "jest-mock-extended",

      "@graphql-codegen/cli",
      "@graphql-codegen/client-preset",
      "@graphql-typed-document-node/core",
      "graphql",
      "@graphql-eslint/eslint-plugin",
    );

    // Since we use extends to get a lot of our settings, including moduleResolution
    // AND moduleResolution will follow module by default
    // AND https://github.com/hayes/pothos/issues/1107#issue-2042806192
    // we can set moduleResolution to null to get the desired behavior
    // 🤦🏻‍♂️ - since it's only a ts-jest issue, we'll only modify the dev tsconfig
    project.tsconfigDev.file.patch(
      JsonPatch.add("/compilerOptions/moduleResolution", null),
    );

    if (mergedOptions.sampleCode) {
      project.gitignore.exclude("dev.db", "dev.db-journal");

      if (mergedOptions.sampleType === "pothos-prisma") {
        const basePath = [
          __dirname,
          "..",
          "samples",
          "apollo-graphql-pothos-prisma",
        ];
        new SampleDir(this, this.srcdir, {
          sourceDir: path.join(...basePath, "src"),
        });
        new SampleDir(this, this.testdir, {
          sourceDir: path.join(...basePath, "test"),
        });
        new SampleDir(this, this.testdir, {
          sourceDir: path.join(...basePath, "prisma"),
        });
        for (const fileName of ["README.md"]) {
          new SampleFile(this, fileName, {
            sourcePath: path.join(...basePath, "root", fileName),
          });
        }
      } else {
        throw new Error("Unsupported sample type");
      }
    }

    project.tasks.addTask("start:dev", {
      description: "Start the server in development mode",
      exec: "nodemon src/index.ts",
    });

    const prismaGenerate = project.tasks.addTask("prisma:generate", {
      description: "Update the prisma client",
      exec: "prisma generate",
    });

    project.preCompileTask.prependSpawn(prismaGenerate);

    // project.gitignore.exclude(".env");
    project.gitignore.exclude("dev.db", "dev.db-journal");

    if (project.eslint) {
      // add graphql to eslint
      // See: https://the-guild.dev/graphql/eslint/docs/getting-started
      // tricky: `processor` is not in the type definition
      const eslintOverrideForTs = {
        files: ["*.ts"],
        processor: "@graphql-eslint/graphql",
        // extends: [
        //   "plugin:@graphql-eslint/operations-recommended",
        //   "plugin:prettier/recommended",
        // ],
      } satisfies EslintOverride & { processor: string };
      project.eslint.addOverride(eslintOverrideForTs);

      const tsOverridePosition = project.eslint.overrides.length;
      project.eslint.addOverride({
        files: ["*.ts"],
      });

      // graphql-eslint will internally make docs with names like:
      // 'test/util/posts.queries.ts/0_document.graphql'
      // This matches those - we exclude schema.graphql because it's not a document
      const eslintOverrideForGraphql = {
        files: ["*.graphql"],
        extends: [
          "plugin:prettier/recommended",
          "plugin:@graphql-eslint/schema-recommended",
          "plugin:@graphql-eslint/operations-recommended",
        ],
        parserOptions: {
          operations: "./test/**/*.ts",
          schema: "./schema.graphql",
        },
        excludedFiles: ["schema.graphql"],
        rules: {
          "prettier/prettier": "warn",
        },
      } satisfies EslintOverride & {
        parserOptions: { operations: string; schema: string };
      };
      project.eslint.addOverride(eslintOverrideForGraphql);

      project.eslint.addOverride({
        files: ["schema.graphql"],
        parser: "@graphql-eslint/eslint-plugin",
        plugins: ["@graphql-eslint"],
        extends: [
          "plugin:prettier/recommended",
          "plugin:@graphql-eslint/schema-recommended",
        ],
        rules: {
          "@graphql-eslint/strict-id-in-types": [
            "error",
            {
              exceptions: {
                types: ["PageInfo", "Cursor"],
                suffixes: ["Edge", "Connection"],
              },
            },
          ],
          "@graphql-eslint/require-description": [
            "error",
            {
              ObjectTypeDefinition: true,
              InterfaceTypeDefinition: true,
              EnumTypeDefinition: true,
              ScalarTypeDefinition: false, // cannot describe scalars in pothos
              InputObjectTypeDefinition: true,
              UnionTypeDefinition: true,
            },
          ],
          "prettier/prettier": "warn",
        },
      });

      // to get the graphql-eslint overrides to work with the typescript-eslint plugin,
      // we have to move the typescript-eslint config to an override as well
      // we'll use the file patching escape hatch to do this, so what's written before
      // is honored and kept, just moved
      const eslintFile = project.tryFindObjectFile(".eslintrc.json");
      assert(eslintFile, "eslint file not found");
      eslintFile.patch(
        JsonPatch.move("/parser", `/overrides/${tsOverridePosition}/parser`),
        JsonPatch.move("/env", `/overrides/${tsOverridePosition}/env`),
        JsonPatch.move("/plugins", `/overrides/${tsOverridePosition}/plugins`),
        JsonPatch.move(
          "/parserOptions",
          `/overrides/${tsOverridePosition}/parserOptions`,
        ),
        JsonPatch.move("/extends", `/overrides/${tsOverridePosition}/extends`),
        JsonPatch.move(
          "/settings",
          `/overrides/${tsOverridePosition}/settings`,
        ),
        JsonPatch.move("/rules", `/overrides/${tsOverridePosition}/rules`),
      );
    }

    const codegenConfig = new TextFile(project, "codegen.ts", {
      lines: [
        `import type { CodegenConfig } from "@graphql-codegen/cli";
import { printSchema } from "graphql";
import { schema } from "./src/schema";

// This is codegen for the typings of queries in the tests, where the test is a
// client. It's not codegen for the server itself.

// To run:
// npm run codegen

// To track changes:
// npm run codegen:watch

const config: CodegenConfig = {
  schema: printSchema(schema),
  config: {
    scalars: {
      Cursor: "string",
    },
  },
  generates: {
    "./test/gql/": {
      documents: ["test/**/*.ts"],
      preset: "client",
      hooks: {
        afterOneFileWrite: [
          "eslint --ext .ts --fix --no-error-on-unmatched-pattern",
        ],
      },
    },
    "./schema.graphql": {
      plugins: ["schema-ast"],
      hooks: {
        afterOneFileWrite: [
          "eslint --ext .graphql --fix --no-error-on-unmatched-pattern",
        ],
      },
    },
  },
};

export default config;
`,
      ],
      executable: false,
      marker: true,
    });
    codegenConfig.addLine(`// ${codegenConfig.marker}\n`);
    project.npmignore?.exclude("codegen.ts");
    project.tsconfigDev.addInclude("codegen.ts");

    const codegenTask = project.addTask("codegen", { exec: "graphql-codegen" });
    project.preCompileTask.prependSpawn(codegenTask);

    const postinstallTask = project.addTask("postinstall");
    postinstallTask.spawn(project.preCompileTask);

    project.addTask("codegen:watch", {
      exec: "nodemon -w 'test/**/*.ts' -i 'test/gql' -w 'src/' -e ts --exec graphql-codegen",
    });
  }
}

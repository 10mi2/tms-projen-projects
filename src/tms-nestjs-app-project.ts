import * as path from "node:path";
import { SampleDir, javascript } from "projen";
import { TypescriptConfigExtends } from "projen/lib/javascript";
import { deepMerge } from "projen/lib/util";
import {
  TmsTypeScriptAppProject,
  TmsTypeScriptAppProjectOptions,
} from "./tms-typescript-app-project";

export interface TmsNestJSAppProjectOptions
  extends TmsTypeScriptAppProjectOptions {
  /**
   * Which type of sample code to include, if `sampleCode` is true.
   *
   * @default "graphql-codefirst"
   * @featured
   */
  readonly sampleType?: "graphql-codefirst" | "graphql-schemafirst" | "rest";
}

/**
 * Create a [NestJS](https://docs.nestjs.com) TypeScript project with [Ten Mile Square](https://tenmilesquare.com)
 * opinionated defaults, and preloaded with one of a few possible sample applications.
 *
 * @pjid tms-nestjs-app
 */

export class TmsNestJSAppProject extends TmsTypeScriptAppProject {
  constructor(options: TmsNestJSAppProjectOptions) {
    const defaultOptions = {
      addDefaultBundle: false,

      esmSupportConfig: false,

      tsconfig: {
        compilerOptions: {
          // Needed for nestjs
          module: "commonjs",
          noImplicitAny: true,
          declaration: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          allowSyntheticDefaultImports: true,
          sourceMap: true,
          outDir: "./dist",
          baseUrl: "./",

          // Let the "extends" handle these
          target: undefined,
          forceConsistentCasingInFileNames: undefined,
          strictNullChecks: undefined, // Default to true when strict: true
          noEmit: undefined,
          noFallthroughCasesInSwitch: undefined,

          // Handled below with overrides
          // removeComments: true,
          // incremental: true,
          // strictBindCallApply: true,
        },
        extends: TypescriptConfigExtends.fromPaths([
          "@tsconfig/node18/tsconfig.json",
          "@tsconfig/strictest/tsconfig.json",
        ]),
      },

      tsconfigDev: {
        compilerOptions: {
          baseUrl: "./",

          module: "es2022",
          target: "es2022",
          experimentalDecorators: undefined,
          emitDecoratorMetadata: undefined,
          allowSyntheticDefaultImports: undefined,
          outDir: undefined,
          skipLibCheck: undefined,
          strictNullChecks: undefined,
          noImplicitAny: undefined,
          forceConsistentCasingInFileNames: undefined,
          noFallthroughCasesInSwitch: undefined,
          noEmit: true,
        },
        extends: TypescriptConfigExtends.fromPaths([
          "@tsconfig/node18/tsconfig.json",
          // "@tsconfig/strictest/tsconfig.json",
        ]),
      },

      jestOptions: {
        jestConfig: {
          // testEnvironment: "node",
          moduleFileExtensions: ["js", "json", "ts"],
          rootDir: ".",
          transform: {
            "^.+\\.(t|j)s$": new javascript.Transform("ts-jest", {
              useESM: false,
              tsconfig: "tsconfig.dev.json",
            }),
          },
          // collectCoverageFrom: ["**/*.(t|j)s"],
          // coverageDirectory: "../coverage",
          testMatch: ["<rootDir>/(test|src)/**/*(*)@(.|-)@(spec|test).ts?(x)"],
        },
        updateSnapshot: javascript.UpdateSnapshot.NEVER,
      },
      sampleCode: true,
      sampleType: "graphql-codefirst",
    } satisfies Partial<TmsNestJSAppProjectOptions>;

    const mergedOptions = deepMerge(
      [
        defaultOptions, // will get mutated
        options,
      ],
      true,
    ) as TmsNestJSAppProjectOptions; // justified cast, since we know we're merging two of this type

    super({ ...mergedOptions, sampleCode: false });

    this.compileTask.reset("nest build");
    if (this.eslint) {
      this.addTask("format").spawn(this.eslint.eslintTask);
    }
    this.addTask("start").exec("nest start");
    this.addTask("start:dev").exec("nest start --watch");
    this.addTask("start:debug").exec("nest start --debug --watch");
    this.addTask("start:prod").exec("node dist/main");
    this.addTask("test:e2e").exec("jest --config ./test/jest-e2e.json");

    this.addDeps(
      "@nestjs/common@^10.0.0",
      "@nestjs/core@^10.0.0",
      "@nestjs/platform-express@^10.0.0",
      "reflect-metadata@^0.1.13",
      "rxjs@^7.8.1",

      // graphql
      "graphql",
      "@graphql-tools/utils",
      "graphql-query-complexity",
      "class-transformer",
      "class-validator",
      "graphql-subscriptions",
      "@apollo/server",
      "@nestjs/graphql",
      "@nestjs/apollo",
    );
    this.addDevDeps(
      "@tsconfig/strictest",
      "file:/Users/rob/Projects/Ten-Mile-Square/TMSProjenProjects",
      "@nestjs/cli@^10.0.0",
      "@nestjs/schematics@^10.0.0",
      "@nestjs/testing@^10.0.0",
      "@types/express@^4.17.17",
      "@types/supertest@^2.0.12",
      "supertest@^6.3.3",
      "source-map-support@^0.5.21",
      "ts-loader@^9.4.3",
      "tsconfig-paths@^4.2.0",
    );

    if (this.tsconfig) {
      // Options not yet internally supported by projen
      this.tsconfig.file.addOverride("compilerOptions/removeComments", true);
      this.tsconfig.file.addOverride("compilerOptions/incremental", true);
      this.tsconfig.file.addOverride(
        "compilerOptions/strictBindCallApply",
        true,
      );
    }

    if (mergedOptions.sampleCode) {
      if (mergedOptions.sampleType === "graphql-codefirst") {
        new SampleDir(this, this.srcdir, {
          sourceDir: path.join(
            __dirname,
            "..",
            "samples",
            "nestjs-graphql-codefirst",
            "src",
          ),
        });
        new SampleDir(this, this.testdir, {
          sourceDir: path.join(
            __dirname,
            "..",
            "samples",
            "nestjs-graphql-codefirst",
            "test",
          ),
        });
      } else {
        throw new Error("Unsupported sample type");
      }
    }
  }
}

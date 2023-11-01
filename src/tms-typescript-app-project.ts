/* eslint-disable import/no-extraneous-dependencies */
import { sep } from "path";
import { Component, JsonPatch, SampleDir } from "projen";
import {
  NodePackageManager,
  TypeScriptModuleResolution,
  TypescriptConfigExtends,
  UpdateSnapshot,
} from "projen/lib/javascript";
import {
  TypeScriptAppProject,
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { deepMerge } from "projen/lib/util";

export interface TmsTypeScriptAppProjectOptions
  extends TypeScriptProjectOptions {
  /**
   * Add a default bundle to the project.
   *
   * Will bundle ./src/ to ./dist/ using esbuild.
   *
   * @default true
   * @featured
   */
  readonly addDefaultBundle?: boolean;

  /**
   * Configure for ESM
   *
   * @default true
   * @featured
   */
  readonly esmSupportConfig?: boolean;

  /**
   * Change the default-set eslint auto-fixable rules to "warn" instead of "error"
   *
   * @default true
   * @featured
   */
  readonly eslintFixableAsWarn?: boolean;
}

/**
 * Create a [TypeScriptAppProject](https://projen.io/api/API.html#typescriptappproject-) with
 * [Ten Mile Square](https://tenmilesquare.com) opinionated defaults.
 *
 * @pjid tms-typescript-app
 */

export class TmsTypeScriptAppProject extends TypeScriptAppProject {
  constructor(options: TmsTypeScriptAppProjectOptions) {
    const defaultOptions = {
      eslint: true,
      packageManager: NodePackageManager.NPM,
      prettier: true,
      projenrcTs: true,

      vscode: true,
      tsconfig: {
        compilerOptions: {
          alwaysStrict: undefined,
          declaration: undefined,
          esModuleInterop: undefined,
          experimentalDecorators: undefined,
          inlineSourceMap: undefined,
          inlineSources: undefined,
          lib: undefined,
          module: "es2022",
          noEmitOnError: undefined,
          noFallthroughCasesInSwitch: undefined,
          noImplicitAny: undefined,
          noImplicitReturns: undefined,
          noImplicitThis: undefined,
          noUnusedLocals: undefined,
          noUnusedParameters: undefined,
          resolveJsonModule: undefined,
          strict: undefined,
          strictNullChecks: undefined,
          strictPropertyInitialization: undefined,
          stripInternal: undefined,
          target: undefined,
          moduleResolution:
            options.esmSupportConfig ?? true
              ? TypeScriptModuleResolution.BUNDLER
              : TypeScriptModuleResolution.NODE,
          noEmit: true,
        },
        extends: TypescriptConfigExtends.fromPaths([
          "@tsconfig/node18/tsconfig.json",
        ]),
      },

      jest: true,
      jestOptions: {
        updateSnapshot: UpdateSnapshot.NEVER,
      },

      addDefaultBundle: true,
      esmSupportConfig: true,
    } satisfies Partial<TmsTypeScriptAppProjectOptions>;
    const mergedOptions = deepMerge(
      [
        defaultOptions, // will get mutated
        options,
      ],
      true,
    ) as TmsTypeScriptAppProjectOptions;

    super({ ...mergedOptions, sampleCode: false });

    this.addDevDeps("@tsconfig/node18");

    // Note: should adjust for https://eslint.style/guide/getting-started

    if (mergedOptions.eslintFixableAsWarn ?? true) {
      this.eslint?.addRules({
        "prettier/prettier": ["warn"],
        "import/order": [
          "warn",
          {
            groups: ["builtin", "external"],
            alphabetize: {
              order: "asc",
              caseInsensitive: true,
            },
          },
        ],
        "key-spacing": ["warn"],
        "no-multiple-empty-lines": ["warn"],
        "no-trailing-spaces": ["warn"],
        "dot-notation": ["warn"],
      });
    }

    if (mergedOptions.esmSupportConfig) {
      this.package.addField("type", "module");
      [this.tsconfig, this.tsconfigDev].forEach(
        (tsconfig) =>
          tsconfig &&
          tsconfig.file.patch(
            JsonPatch.add("/ts-node", {
              esm: true,
              preferTsExts: true,
              experimentalSpecifierResolution: "node",
            }),
          ),
      );
    } else {
      [this.tsconfig, this.tsconfigDev].forEach(
        (tsconfig) =>
          tsconfig &&
          tsconfig.file.patch(
            JsonPatch.add("/ts-node", {
              compilerOptions: {
                module: "commonjs",
              },
              preferTsExts: true,
              experimentalSpecifierResolution: "node",
            }),
          ),
      );
    }

    if (mergedOptions.jest && this.jest) {
      this.jest.config.globals = undefined;
      this.jest.config.transform = {
        "^.+\\.[tj]sx?$": [
          "ts-jest",
          {
            useESM: mergedOptions.esmSupportConfig ?? true,
            tsconfig: "tsconfig.dev.json",
          },
        ],
      };

      if (mergedOptions.esmSupportConfig ?? true) {
        this.jest.config.preset = "ts-jest/presets/default-esm";
        this.testTask.env("NODE_OPTIONS", "--experimental-vm-modules");
      } else {
        this.jest.config.preset = "ts-jest/presets/default";
      }
    }

    if (mergedOptions.vscode) {
      if (!this.vscode?.settings) {
        throw new Error("vscode settings not found, but should have been");
      }
      if (!this.vscode?.extensions) {
        throw new Error("vscode extensions not found, but should have been");
      }

      const settings = this.vscode?.settings;
      settings.addSetting("jest.jestCommandLine", "npm test --");
      settings.addSetting("jest.rootPath", "./");

      const extensions = this.vscode?.extensions;
      extensions.addRecommendations(
        "dbaeumer.vscode-eslint",
        "Orta.vscode-jest",
      );
    }

    if (mergedOptions.addDefaultBundle ?? true) {
      this.bundler.addBundle([this.srcdir, "index.ts"].join(sep), {
        target: "node18",
        platform: "node",
        format: mergedOptions.esmSupportConfig ?? true ? "esm" : "cjs",
        sourcemap: true,
      });
    }
    if (mergedOptions.sampleCode ?? true) {
      new SampleCode(this);
    }
  }
}

class SampleCode extends Component {
  constructor(project: TypeScriptProject) {
    super(project);
    const indexSrcCode = [
      'import { Hello } from "./hello";',
      "",
      "console.log(await new Hello().sayHello(2000));",
    ].join("\n");
    const helloSrcCode = [
      'import { setTimeout } from "timers/promises";',
      "export class Hello {",
      "  public async sayHello(delay: number = 100): Promise<string> {",
      "    await setTimeout(delay);",
      '    return "hello, world!";',
      "  }",
      "}",
    ].join("\n");

    const testCode = [
      'import { Hello } from "../src/hello";',
      "",
      'test("hello", async () => {',
      "  const hello = new Hello();",
      '  expect(await hello.sayHello()).toBe("hello, world!");',
      "});",
    ].join("\n");

    new SampleDir(project, project.srcdir, {
      files: {
        "index.ts": indexSrcCode,
        "hello.ts": helloSrcCode,
      },
    });

    if (project.jest) {
      new SampleDir(project, project.testdir, {
        files: {
          "hello.test.ts": testCode,
        },
      });
    }
  }
}

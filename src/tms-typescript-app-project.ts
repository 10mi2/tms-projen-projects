import { join as joinPath, relative as relativePath, sep } from "path";
import { Component, JsonPatch, SampleDir, TextFile } from "projen";
import {
  NodePackageManager,
  TypeScriptCompilerOptions,
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

export enum TmsTSConfigBase {
  NODE_LTS = "node-lts",
  NODE18 = "node18",
  NODE20 = "node20",
}

const RESET_COMPILER_OPTIONS = {
  alwaysStrict: undefined,
  declaration: undefined,
  esModuleInterop: undefined,
  experimentalDecorators: undefined,
  inlineSourceMap: undefined,
  inlineSources: undefined,
  lib: undefined,
  module: undefined,
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
} satisfies Partial<TypeScriptCompilerOptions>;

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

  /**
   * Declare a specific node version to put in `.nvmrc` for `nvm` or `fnm` to use
   *
   * NOTE: As of this writing ts-node (v10.9.1) has issues with node versions 18.19.x and newer (including 20.x)
   * when esm is enabled (`esmSupportConfig: true`)
   *
   * @default v18.18.2
   * @featured
   */
  readonly nodeVersion?: string;

  /**
   * TSConfig base configuration selection
   *
   * Using one of the options from https://github.com/tsconfig/bases as a base, then any explicit settings override
   * those. Note that only nodes18 and above are supported.
   *
   * @remarks
   *
   * Not all options are supported, perticularly those of node version that are older than is supported by Projen.
   *
   * @see {@link tsconfigBaseStrictest}
   *
   * @default TmsTSConfigBase.Node18
   *
   */
  readonly tsconfigBase?: TmsTSConfigBase;

  /**
   * TSConfig base configuration selection for `tsconfig.dev.json`, used to run projen itslef via `ts-node`
   *
   * @remarks
   *
   * Due to a bug in `ts-node` (v10.9.1) when used with Typescript 5.3.2 the tsconfig "extends" property when referring
   * to a file that's in `node_modules` will not be looked up properly. The workaround currently is to make the
   * reference relative to the tsconfig file.
   *
   * @see {@link tsconfigBase}
   *
   * @default TmsTSConfigBase.Node18
   *
   */
  readonly tsconfigBaseDev?: TmsTSConfigBase;

  /**
   * Include TSConfig "strinctest" configuration to {@link tsconfigBase}
   *
   * Using one of the options from https://github.com/tsconfig/bases as a base, then any explicit settings override
   * those. Note that only nodes18 and above are supported.
   *
   * @remarks
   *
   * If true will add the "strictest" configuration to the "extends" of the tsconfig.json file, *before* the base set by
   * the {@link tsconfigBase} option.
   *
   * Does **not** apply to `tsconfig.dev.json`.
   *
   * @see {@link tsconfigBase}
   *
   * @default true
   *
   */
  readonly tsconfigBaseStrictest?: boolean;
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

      nodeVersion: "v18.18.2",

      vscode: true,
      tsconfig: {
        compilerOptions: {
          ...RESET_COMPILER_OPTIONS,
          moduleResolution: TypeScriptModuleResolution.NODE16,
          noEmit: options.addDefaultBundle ?? true,
        },
        extends: TypescriptConfigExtends.fromPaths([
          ...(options.tsconfigBaseStrictest ?? true
            ? ["@tsconfig/strictest/tsconfig.json"]
            : []),
          `@tsconfig/${
            options.tsconfigBase ?? TmsTSConfigBase.NODE18
          }/tsconfig.json`,
        ]),
      },

      tsconfigDev: {
        compilerOptions: {
          ...RESET_COMPILER_OPTIONS,
          moduleResolution: TypeScriptModuleResolution.NODE16,
          noEmit: true,
        },
        extends: TypescriptConfigExtends.fromPaths([
          `${relativePath(
            joinPath(options.outdir ?? "."),
            "./node_modules",
          ).replace(/^(?!\.)/, "./")}/@tsconfig/${
            options.tsconfigBaseDev ?? TmsTSConfigBase.NODE18
          }/tsconfig.json`,
        ]),
      },

      jest: true,
      jestOptions: {
        updateSnapshot: UpdateSnapshot.NEVER,
      },

      addDefaultBundle: true,
      esmSupportConfig: true,

      tsconfigBase: TmsTSConfigBase.NODE18,
      tsconfigBaseDev: TmsTSConfigBase.NODE18,
      tsconfigBaseStrictest: true,
    } satisfies Partial<TmsTypeScriptAppProjectOptions>;
    const mergedOptions = deepMerge(
      [
        defaultOptions, // will get mutated
        options,
      ],
      true,
    ) as TmsTypeScriptAppProjectOptions;

    super({ ...mergedOptions, sampleCode: false });

    this.addDevDeps(
      ...new Set([
        `@tsconfig/${mergedOptions.tsconfigBase ?? TmsTSConfigBase.NODE18}`,
        `@tsconfig/${mergedOptions.tsconfigBaseDev ?? TmsTSConfigBase.NODE18}`,
        ...(mergedOptions.tsconfigBaseStrictest ?? true
          ? ["@tsconfig/strictest"]
          : []),
      ]),
    );

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

    if (mergedOptions.nodeVersion) {
      new TextFile(this, ".nvmrc", {
        lines: [mergedOptions.nodeVersion],
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

      this.jest.config.moduleNameMapper = {
        "^(\\.{1,2}/.*)\\.js$": "$1",
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
      'import { Hello } from "./hello.js";',
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
      'import { Hello } from "../src/hello.js";',
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

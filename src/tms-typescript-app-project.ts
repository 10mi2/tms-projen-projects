import { sep } from "path";
import { Component, JsonPatch, SampleDir, TextFile } from "projen";
import {
  NodePackageManager,
  TypeScriptCompilerOptions,
  TypeScriptModuleResolution,
  TypescriptConfig,
  TypescriptConfigExtends,
  UpdateSnapshot,
} from "projen/lib/javascript";
import {
  TypeScriptAppProject,
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { deepMerge } from "projen/lib/util";
import { pathsToModuleNameMapper } from "./util/paths-to-module-name-mapper";

export enum TmsTSConfigBase {
  NODE_LTS = "node-lts",
  NODE18 = "node18",
  NODE20 = "node20",
}

const RESET_COMPILER_OPTIONS = {
  alwaysStrict: undefined,
  declaration: undefined,
  esModuleInterop: undefined,
  exactOptionalPropertyTypes: undefined,
  experimentalDecorators: undefined,
  forceConsistentCasingInFileNames: undefined,
  inlineSourceMap: undefined,
  inlineSources: undefined,
  isolatedModules: undefined,
  lib: undefined,
  module: undefined,
  noEmitOnError: undefined,
  noFallthroughCasesInSwitch: undefined,
  noImplicitAny: undefined,
  noImplicitOverride: undefined,
  noImplicitReturns: undefined,
  noImplicitThis: undefined,
  noPropertyAccessFromIndexSignature: undefined,
  noUncheckedIndexedAccess: undefined,
  noUnusedLocals: undefined,
  noUnusedParameters: undefined,
  resolveJsonModule: undefined,
  skipLibCheck: undefined,
  strict: undefined,
  strictNullChecks: undefined,
  strictPropertyInitialization: undefined,
  stripInternal: undefined,
  target: undefined,
} satisfies Partial<TypeScriptCompilerOptions>;

const TSCONFIG_BASE_STRICTEST_SNAPSHOT = {
  strict: true,
  exactOptionalPropertyTypes: true,
  noFallthroughCasesInSwitch: true,
  noImplicitOverride: true,
  noImplicitReturns: true,
  noPropertyAccessFromIndexSignature: true,
  noUncheckedIndexedAccess: true,
  noUnusedLocals: true,
  noUnusedParameters: true,

  isolatedModules: true,

  esModuleInterop: true,
  skipLibCheck: true,
  forceConsistentCasingInFileNames: true,

  // Must be applied separately, not recognized by projen
  // allowUnusedLabels: false,
  // allowUnreachableCode: false,
  // checkJs: true,
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
   * When configuring for ESM, add a banner to the bundle to support `require` and `__dirname` and `__filename`
   *
   * @default (esmSupportConfig === true && addDefaultBundle === true)
   * @featured
   */
  readonly esmSupportAddRequireShim?: boolean;

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

  /**
   * Workaround `ts-node` bug with "extends" in `tsconfig*.json` files
   *
   * @remarks
   *
   * When {@link tsconfigBaseStrictest} is `true`, instead of extending the "strictest" configuration by making an
   * `extends` array in `tsconfig.json` it will copy a snapshot the contents of the "strictest" configuration instead.
   *
   * Once this bug is fixed you can safely choose to set this to `false` to get the benefits of the `extends` array.
   *
   * @see https://github.com/TypeStrong/ts-node/issues/2000
   *
   * @default true
   *
   */
  readonly tsconfigBaseNoArrayWorkaround?: boolean;

  /**
   * Workaround `ts-node` bug with Node 18.19 and newer, where running `ts-node` with `esm` support enabled will fail
   * with the error `ERR_UNKNOWN_FILE_EXTENSION` when you run `projen` itself.
   *
   * This workaround will work with node 16 and later, and has not been tested with earlier versions.
   *
   * THIS DOES NOT FIX ANY OTHER USAGE OF `ts-node` WITH `esm` SUPPORT, ONLY WHEN RUNNING `projen` ITSELF.
   *
   * If you are using `ts-node` with `esm` support in your project with Node 18.19 or newer, you will need to use the
   * workaround in your own:
   *
   * ```bash
   * # instead of
   * ts-node --project tsconfig.special.json src/index.ts
   *
   * # use
   * tsc .projenrc.ts && \
   *   TS_NODE_PROJECT=tsconfig.special.json node --loader ts-node/esm --no-warnings=ExperimentalWarning src/index.ts
   * ```
   *
   * If there are any type errors, the `node --loader ts-node/esm` yields a difficult-to-read error message, so we run
   * `tsc` first separately to get the type errors before running the `node` command.
   *
   * The `tsc` command assumes the correct tsconfig file where the target is `include`d has `noEmit` set to `true`. If
   * not, add `--noemit` to the `tsc` command.
   *
   * @see https://github.com/TypeStrong/ts-node/issues/2094
   *
   * @default if (node18_19_or_newer) { true } else { false }
   *
   */
  readonly tsNodeUnknownFileExtensionWorkaround?: boolean;
}

/**
 * Create a [TypeScriptAppProject](https://projen.io/api/API.html#typescriptappproject-) with
 * [Ten Mile Square](https://tenmilesquare.com) opinionated defaults.
 *
 * @pjid tms-typescript-app
 */

export class TmsTypeScriptAppProject extends TypeScriptAppProject {
  constructor(options: TmsTypeScriptAppProjectOptions) {
    const tsconfigBaseStrictestExtended =
      (options.tsconfigBaseStrictest ?? true) &&
      !(options.tsconfigBaseNoArrayWorkaround ?? true);
    const tsconfigBaseStrictestEmbedded =
      (options.tsconfigBaseStrictest ?? true) &&
      (options.tsconfigBaseNoArrayWorkaround ?? true);

    const nodeVersionSplit = process.versions.node
      .split(".")
      .map((v) => parseInt(v, 10));
    const node18_19_or_newer =
      nodeVersionSplit[0] > 18 ||
      (nodeVersionSplit[0] === 18 && nodeVersionSplit[1] >= 19);

    const defaultOptions = {
      eslint: true,
      packageManager: NodePackageManager.NPM,
      prettier: true,
      projenrcTs: true,

      projenVersion: ">=0.79.23",

      nodeVersion: `v${process.versions.node}`,

      vscode: true,
      tsconfig: {
        compilerOptions: {
          ...RESET_COMPILER_OPTIONS,
          ...(tsconfigBaseStrictestEmbedded
            ? TSCONFIG_BASE_STRICTEST_SNAPSHOT
            : {}),
          moduleResolution: TypeScriptModuleResolution.NODE16,
          noEmit: options.addDefaultBundle ?? true,
        },
        extends: TypescriptConfigExtends.fromPaths([
          ...(tsconfigBaseStrictestExtended
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
          `@tsconfig/${
            options.tsconfigBaseDev ?? TmsTSConfigBase.NODE18
          }/tsconfig.json`,
        ]),
      },

      jest: true,
      jestOptions: {
        updateSnapshot: UpdateSnapshot.NEVER,
      },
      tsJestOptions: {
        transformPattern: "^.+\\.m?[tj]sx?$",
        transformOptions: {
          useESM: options.esmSupportConfig ?? true,
        },
      },

      addDefaultBundle: true,
      esmSupportConfig: true,
      esmSupportAddRequireShim:
        (options.addDefaultBundle ?? true) &&
        (options.esmSupportConfig ?? true),

      tsconfigBase: TmsTSConfigBase.NODE18,
      tsconfigBaseDev: TmsTSConfigBase.NODE18,
      tsconfigBaseStrictest: true,
      tsconfigBaseNoArrayWorkaround: true,
      tsNodeUnknownFileExtensionWorkaround:
        options.tsNodeUnknownFileExtensionWorkaround ?? node18_19_or_newer,
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
        ...(tsconfigBaseStrictestExtended ? ["@tsconfig/strictest"] : []),
      ]),
      "ts-node@>=10.9.2",
    );

    if (this.tsconfig && tsconfigBaseStrictestEmbedded) {
      // Options not yet internally supported by projen
      this.tsconfig.file.addOverride(
        "compilerOptions.allowUnusedLabels",
        false,
      );
      this.tsconfig.file.addOverride(
        "compilerOptions.allowUnreachableCode",
        false,
      );
      this.tsconfig.file.addOverride("compilerOptions.checkJs", true);
    }

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
              preferTsExts: false,
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
      this.jest.config.moduleNameMapper = {
        "^(\\.{1,2}/.*)\\.m?js$": "$1",
        ...(this.tsconfig?.compilerOptions?.paths
          ? pathsToModuleNameMapper(this.tsconfig?.compilerOptions?.paths, {
              prefix: "<rootDir>/",
              useESM: true,
            })
          : {}),
      };
      if (mergedOptions.esmSupportConfig ?? true) {
        // "If you are using custom transform config, please remove preset from your Jest config to avoid issues that
        // Jest doesn't transform files correctly."
        // - https://kulshekhar.github.io/ts-jest/docs/next/guides/esm-support/
        // this.jest.config.preset = "ts-jest/presets/default-esm";

        // Since $NODE_OPTIONS may already have a value for debugging, we need to add to it
        this.testTask.env(
          "NODE_OPTIONS",
          "$(echo $NODE_OPTIONS --experimental-vm-modules)",
        );
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
        format: (mergedOptions.esmSupportConfig ?? true) ? "esm" : "cjs",
        sourcemap: true,
        watchTask: true,
        ...(mergedOptions.esmSupportAddRequireShim
          ? {
              banner: `import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const __filename = (await import('node:url')).fileURLToPath(import.meta.url);
const __dirname = (await import('node:path')).dirname(__filename);
`.replace(/\n/g, ""),
            }
          : undefined),
      });
    }
    if (mergedOptions.sampleCode ?? true) {
      new SampleCode(this);
    }

    const PROJEN_TSCONFIG_FILENAME = "tsconfig.projenrc.json";
    if (
      mergedOptions.tsNodeUnknownFileExtensionWorkaround &&
      this.defaultTask
    ) {
      const projenTsconfig = new TypescriptConfig(this, {
        fileName: PROJEN_TSCONFIG_FILENAME,
        include: [
          ".projenrc.ts",
          "projenrc/**/*.ts", // added by projen for tsconfig.dev - gives a place for projenrc included files
        ],
        extends: TypescriptConfigExtends.fromTypescriptConfigs([
          this.tsconfigDev,
        ]),
        compilerOptions: {
          ...RESET_COMPILER_OPTIONS,
        },
      });
      this.defaultTask.reset(
        `tsc --project ${projenTsconfig.fileName} && node --loader ts-node/esm --no-warnings=ExperimentalWarning .projenrc.ts`,
      );
      this.defaultTask.env("TS_NODE_PROJECT", projenTsconfig.fileName);
      this.defaultTask.description =
        "Run projen with ts-node/esm (workaround for Node 18.19+ applied)";
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

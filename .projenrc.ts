import { cdk, javascript } from "projen";
import {
  TypescriptConfig,
  TypescriptConfigExtends,
  UpdateSnapshot,
} from "projen/lib/javascript";

const project = new cdk.JsiiProject({
  author: "Ten Mile Square",
  authorOrganization: true,
  authorAddress: "rob@tenmilesquare.com",
  npmAccess: javascript.NpmAccess.PUBLIC,

  defaultReleaseBranch: "main",
  jsiiVersion: "~5.3.0",
  name: "tms-projen-projects",
  packageName: "@10mi2/tms-projen-projects",
  packageManager: javascript.NodePackageManager.NPM,
  projenrcTs: true,
  repositoryUrl: "https://github.com/10mi2/tms-projen-projects.git",
  license: "MIT",

  eslint: true,
  prettier: true,

  projenVersion: ">=0.79.23",

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */

  peerDeps: ["projen", "constructs"],

  jest: true,
  jestOptions: {
    updateSnapshot: UpdateSnapshot.NEVER,
  },
});

if (project.jest) {
  project.testTask.env(
    "NODE_OPTIONS",
    "$NODE_OPTIONS --experimental-vm-modules",
  );
}

project.tsconfigDev.addExclude("samples");

// set "esm mode" for the project
project.package.addField("type", "module");

// add `tsx` to avoid issues with `ts-node`
project.addDevDeps("tsx");

const PROJEN_TSCONFIG_FILENAME = "tsconfig.projenrc.json";
if (project.defaultTask) {
  // add a secondary projenrc-specific tsconfig file that doesn't emit JS
  const projenTsconfig = new TypescriptConfig(project, {
    fileName: PROJEN_TSCONFIG_FILENAME,
    include: [
      ".projenrc.ts",
      "projenrc/**/*.ts", // added by projen for tsconfig.dev - gives a place for projenrc included files
    ],
    extends: TypescriptConfigExtends.fromTypescriptConfigs([
      project.tsconfigDev,
    ]),
    compilerOptions: {
      noEmit: true,
      emitDeclarationOnly: false,
    },
  });

  // adjust the projen command to:
  // 1. run tsc to typecheck and syntax check the file
  project.defaultTask.reset(`tsc --project ${projenTsconfig.fileName}`);
  // 2. use the projenrc - specific tsconfig and tsx
  project.defaultTask.exec(
    `tsx --tsconfig ${projenTsconfig.fileName} .projenrc.ts`,
  );
  project.defaultTask.description =
    "Run projen with ts-node/esm (workaround for Node 18.19+ applied)";
}

if (project.jest) {
  project.testTask.env(
    "NODE_OPTIONS",
    "$NODE_OPTIONS --experimental-vm-modules",
  );
}

project.synth();

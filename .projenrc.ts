import { cdk, javascript } from "projen";
import { UpdateSnapshot } from "projen/lib/javascript";
const project = new cdk.JsiiProject({
  author: "Rob Giseburt",
  authorAddress: "rob@tenmilesquare.com",
  defaultReleaseBranch: "main",
  jsiiVersion: "~5.0.0",
  name: "tms-projen-projects",
  packageName: "tms-projen-projects",
  packageManager: javascript.NodePackageManager.NPM,
  projenrcTs: true,
  repositoryUrl: "https://github.com/10mi2/tms-projen-projects.git",

  eslint: true,
  prettier: true,

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
  project.jest.config.globals = undefined;
  project.jest.config.transform = {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        // useESM: true,
        tsconfig: "tsconfig.dev.json",
      },
    ],
  };
  project.jest.config.preset = "ts-jest/presets/default";
  project.testTask.env("NODE_OPTIONS", "--experimental-vm-modules");
}

project.synth();

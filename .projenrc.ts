import { cdk, javascript } from "projen";
import { UpdateSnapshot } from "projen/lib/javascript";

const project = new cdk.JsiiProject({
  author: "Ten Mile Square",
  authorOrganization: true,
  authorAddress: "rob@tenmilesquare.com",
  npmAccess: javascript.NpmAccess.PUBLIC,

  defaultReleaseBranch: "main",
  jsiiVersion: "~5.7.0",
  name: "tms-projen-projects",
  packageName: "@10mi2/tms-projen-projects",
  packageManager: javascript.NodePackageManager.NPM,
  projenrcTs: true,
  repositoryUrl: "https://github.com/10mi2/tms-projen-projects.git",
  license: "MIT",

  eslint: true,
  prettier: true,

  projenVersion: ">=0.79.23",

  // bundledDeps: []          /* Runtime dependencies of this module. */,
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

project.synth();

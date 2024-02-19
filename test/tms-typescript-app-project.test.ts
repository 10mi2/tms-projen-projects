import { Testing } from "projen/lib/testing";
import { TmsTypeScriptAppProject } from "../src/";

test("TMSTypeScriptAppProject has reasonable configuration", () => {
  const project = new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    // default settings
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot["tsconfig.json"]).toMatchSnapshot();
  expect(snapshot["tsconfig.dev.json"]).toMatchSnapshot();
  expect(snapshot["package.json"]).toMatchSnapshot();
  expect(snapshot[".vscode/settings.json"]).toMatchSnapshot();
  expect(snapshot[".vscode/extensions.json"]).toMatchSnapshot();

  expect(snapshot[".eslintrc.json"]).toMatchSnapshot();

  expect(snapshot[".nvmrc"]).toMatchSnapshot();

  expect(snapshot["src/index.ts"]).toBeDefined();
  expect(snapshot["src/hello.ts"]).toBeDefined();
  expect(snapshot["test/hello.test.ts"]).toBeDefined();

  const tasks = snapshot[".projen/tasks.json"].tasks;
  const bundleTask = tasks["bundle:index"];
  console.dir(bundleTask, { depth: 2 });
  const bundleCommand = bundleTask.steps[0].exec;
  expect(bundleCommand).toContain("--format=esm");
  expect(bundleCommand).toContain("--banner:js=");
});

test("TMSTypeScriptAppProject doesn't make sample code when told not to", () => {
  const project = new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    sampleCode: false,
    // default settings
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot["src/index.ts"]).toBeUndefined();
  expect(snapshot["src/hello.ts"]).toBeUndefined();
  expect(snapshot["test/hello.test.ts"]).toBeUndefined();
});

test("TMSTypeScriptAppProject doesn't make vscode settings when told not to", () => {
  const project = new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    vscode: false,
    // default settings
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot[".vscode/settings.json"]).toBeUndefined();
  expect(snapshot[".vscode/extensions.json"]).toBeUndefined();
});

test("TMSTypeScriptAppProject honors eslintFixableAsWarn=false", () => {
  const project = new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    eslintFixableAsWarn: false,
    // default settings
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot[".eslintrc.json"]).toMatchSnapshot(".eslintrc.json");
});

test("TMSTypeScriptAppProject honors esmSupportConfig=false", () => {
  const project = new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    eslintFixableAsWarn: false,
    esmSupportConfig: false,
    // default settings
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot["package.json"].type).toBeUndefined();
  expect(snapshot["tsconfig.json"]).toMatchSnapshot("tsconfig.json");
  expect(snapshot["tsconfig.dev.json"]).toMatchSnapshot("tsconfig.dev.json");

  const tasks = snapshot[".projen/tasks.json"].tasks;
  const bundleTask = tasks["bundle:index"];
  const bundleCommand = bundleTask.steps[0].exec;
  expect(bundleCommand).toContain("--format=cjs");
});

test("TMSTypeScriptAppProject honors esmSupportConfig=false", () => {
  const project = new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    eslintFixableAsWarn: false,
    esmSupportAddRequireShim: false,
    // default settings
    // esmSupportConfig: true,
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  const tasks = snapshot[".projen/tasks.json"].tasks;
  const bundleTask = tasks["bundle:index"];
  const bundleCommand = bundleTask.steps[0].exec;
  expect(bundleCommand).toContain("--format=esm");
  expect(bundleCommand).not.toContain("--banner:js=");
});

test("TMSTypeScriptAppProject honors strictest with workaround", () => {
  const project = new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    eslintFixableAsWarn: false,
    esmSupportConfig: false,
    tsconfigBaseStrictest: true,
    tsconfigBaseNoArrayWorkaround: true,
    // default settings
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot["tsconfig.json"].extends).toEqual(
    "@tsconfig/node18/tsconfig.json",
  );
  expect(snapshot["tsconfig.json"].compilerOptions).toMatchObject({
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

    allowUnusedLabels: false,
    allowUnreachableCode: false,
    checkJs: true,
  });
});

test("TMSTypeScriptAppProject honors strictest WITHOUT workaround", () => {
  const project = new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    eslintFixableAsWarn: false,
    esmSupportConfig: false,
    tsconfigBaseStrictest: true,
    tsconfigBaseNoArrayWorkaround: false,
    // default settings
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot["tsconfig.json"].extends).toEqual([
    "@tsconfig/strictest/tsconfig.json",
    "@tsconfig/node18/tsconfig.json",
  ]);
});

test("TMSTypeScriptAppProject honors NOT strictest", () => {
  const project = new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    eslintFixableAsWarn: false,
    esmSupportConfig: false,
    tsconfigBaseStrictest: false,
    tsconfigBaseNoArrayWorkaround: false,
    // default settings
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot["tsconfig.json"].extends).toEqual(
    "@tsconfig/node18/tsconfig.json",
  );
});

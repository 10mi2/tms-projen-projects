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

test.each([true, false])(
  "TMSTypeScriptAppProject honors tsNodeUnknownFileExtensionWorkaround=%p",
  (tsNodeUnknownFileExtensionWorkaround: boolean) => {
    const project = new TmsTypeScriptAppProject({
      name: "test",
      defaultReleaseBranch: "main",
      eslintFixableAsWarn: false,
      esmSupportConfig: false,
      // default settings
      tsNodeUnknownFileExtensionWorkaround,
    });
    const snapshot = Testing.synth(project);

    const tasks = snapshot[".projen/tasks.json"].tasks;
    const defaultTask = tasks.default;
    const defaultCommand = defaultTask.steps[0].exec;
    if (tsNodeUnknownFileExtensionWorkaround) {
      expect(defaultCommand).toContain("--loader ts-node/esm");
    } else {
      expect(defaultCommand).not.toContain("--loader ts-node/esm");
    }
  },
);
describe.each([
  { version: "16.17.1", isOver18d19: false },
  { version: "16.20.2", isOver18d19: false },
  { version: "18.15.0", isOver18d19: false },
  { version: "18.17.0", isOver18d19: false },
  { version: "18.17.1", isOver18d19: false },
  { version: "18.18.0", isOver18d19: false },
  { version: "18.18.2", isOver18d19: false },
  { version: "18.19.0", isOver18d19: true },
  { version: "20.9.0", isOver18d19: true },
  { version: "20.10.0", isOver18d19: true },
])(
  "TMSTypeScriptAppProject interprets process.version=$version as >= 18.19.x: $isOver18d19",
  ({ version: nodeVersion, isOver18d19 }) => {
    const originalProcess = process;
    beforeEach(() => {
      global.process = {
        ...originalProcess,
        versions: { ...originalProcess.versions, node: nodeVersion },
      };
    });
    afterEach(() => {
      global.process = originalProcess;
    });

    test(`TMSTypeScriptAppProject interprets process.version=${nodeVersion} as ${isOver18d19 ? ">=" : "<"} 18.19.x`, () => {
      const project = new TmsTypeScriptAppProject({
        name: "test",
        defaultReleaseBranch: "main",
        eslintFixableAsWarn: false,
        esmSupportConfig: false,
        // default settings
      });
      const snapshot = Testing.synth(project);

      const tasks = snapshot[".projen/tasks.json"].tasks;
      const defaultTask = tasks.default;
      const defaultCommand = defaultTask.steps[0].exec;
      if (isOver18d19) {
        expect(defaultCommand).toContain("--loader ts-node/esm");
      } else {
        expect(defaultCommand).not.toContain("--loader ts-node/esm");
      }
    });
  },
);

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

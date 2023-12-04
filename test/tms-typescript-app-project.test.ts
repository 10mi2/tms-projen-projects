import { Testing } from "projen/lib/testing";
// import { synthSnapshot } from "projen/lib/util/synth";
import { TmsTSConfigBase, TmsTypeScriptAppProject } from "../src/";

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

  expect(snapshot[".eslintrc.json"]).toMatchSnapshot();
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
  expect(snapshot["tsconfig.json"]).toMatchSnapshot();
  expect(snapshot["tsconfig.dev.json"]).toMatchSnapshot();
});

test("TMSTypeScriptAppProject handles relative projects properly", () => {
  const project = new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    // default settings
    tsconfigBase: TmsTSConfigBase.NODE_LTS,
  });
  new TmsTypeScriptAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    parent: project,
    outdir: "subproject",
    tsconfigBase: TmsTSConfigBase.NODE20,
    tsconfigBaseDev: TmsTSConfigBase.NODE20,
    // default settings
  });

  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot["tsconfig.json"]).toMatchSnapshot("tsconfig.json");
  expect(snapshot["tsconfig.json"].extends).toStrictEqual([
    "@tsconfig/strictest/tsconfig.json",
    "@tsconfig/node-lts/tsconfig.json",
  ]);
  expect(snapshot["tsconfig.dev.json"]).toMatchSnapshot("tsconfig.dev.json");
  expect(snapshot["tsconfig.dev.json"].extends).toStrictEqual(
    "./node_modules/@tsconfig/node18/tsconfig.json",
  );
  expect(snapshot["subproject/tsconfig.json"]).toMatchSnapshot(
    "subproject/tsconfig.json",
  );
  expect(snapshot["subproject/tsconfig.json"].extends).toStrictEqual([
    "@tsconfig/strictest/tsconfig.json",
    "@tsconfig/node20/tsconfig.json",
  ]);

  expect(snapshot["subproject/tsconfig.dev.json"]).toMatchSnapshot(
    "subproject/tsconfig.dev.json",
  );
  expect(snapshot["subproject/tsconfig.dev.json"].extends).toStrictEqual(
    "../node_modules/@tsconfig/node20/tsconfig.json",
  );
});

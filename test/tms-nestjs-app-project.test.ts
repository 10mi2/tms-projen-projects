import { Testing } from "projen/lib/testing";
import { TmsNestJSAppProject } from "../src";

test("TmsNestJSAppProject has reasonable configuration", () => {
  const project = new TmsNestJSAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    // default settings
  });
  const snapshot = Testing.synth(project);

  expect(snapshot["tsconfig.json"]).toMatchSnapshot();
  expect(snapshot["tsconfig.dev.json"]).toMatchSnapshot();
  expect(snapshot["package.json"]).toMatchSnapshot();
  expect(snapshot[".vscode/settings.json"]).toMatchSnapshot();
  expect(snapshot[".vscode/extensions.json"]).toMatchSnapshot();

  expect(snapshot[".eslintrc.json"]).toMatchSnapshot();

  expect(snapshot["src/main.ts"]).toBeDefined();
  expect(snapshot["test/app.e2e-spec.ts"]).toBeDefined();
});

test("TmsNestJSAppProject doesn't make sample code when told not to", () => {
  const project = new TmsNestJSAppProject({
    name: "test",
    defaultReleaseBranch: "main",
    sampleCode: false,
    // default settings
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot["src/main.ts"]).toBeUndefined();
  expect(snapshot["test/app.e2e-spec.ts"]).toBeUndefined();
});

import { Testing } from "projen/lib/testing";
import { TmsTSApolloGraphQLProject } from "../src";

test("TmsTSApolloGraphQLProject has reasonable configuration", () => {
  const project = new TmsTSApolloGraphQLProject({
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
  expect(snapshot["src/schema.ts"]).toBeDefined();
  expect(snapshot["test/users.test.ts"]).toBeDefined();
});

test("TmsTSApolloGraphQLProject doesn't make sample code when told not to", () => {
  const project = new TmsTSApolloGraphQLProject({
    name: "test",
    defaultReleaseBranch: "main",
    sampleCode: false,
    // default settings
  });
  const snapshot = Testing.synth(project); // synthSnapshot(project, { parseJson: true });

  expect(snapshot["src/index.ts"]).toBeUndefined();
  expect(snapshot["src/schema.ts"]).toBeUndefined();
  expect(snapshot["test/users.test.ts"]).toBeUndefined();
});

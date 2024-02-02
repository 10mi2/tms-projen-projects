# Ten Mile Square Technologies `projen` Projects

A collection of opinionated [projen](https://projen.io) projects, adding support for ESM, additional ESLint config, etc.

> <image alt="Ten Mile Square Logo" src="docs/10mi2-light-or-dark-bg5.svg" height="196" width="400px"/>
> 
> [Ten Mile Square](https://tenmilesquare.com) (10mi2 or `TMS`)
> is an enterprise technology consulting firm based in the Washington DC area.

# Table of Contents
- [Ten Mile Square Technologies `projen` Projects](#ten-mile-square-technologies-projen-projects)
- [Table of Contents](#table-of-contents)
  - [10mi2 TypeScript App (`tms-typescript-app`)](#10mi2-typescript-app-tms-typescript-app)
    - [Make a new `tms-typescript-app` project](#make-a-new-tms-typescript-app-project)
    - [Add `tms-typescript-app` to an existing project](#add-tms-typescript-app-to-an-existing-project)
    - [Usage](#usage)
  - [10mi2 Apollo Graphql App (`tms-apollo-graphql-app`)](#10mi2-apollo-graphql-app-tms-apollo-graphql-app)
    - [Make a new `tms-apollo-graphql-app` project](#make-a-new-tms-apollo-graphql-app-project)
    - [Add `tms-nestjs-app` to an existing project](#add-tms-nestjs-app-to-an-existing-project)
    - [Usage](#usage-1)
  - [10mi2 NestJS App (`tms-nestjs-app`)](#10mi2-nestjs-app-tms-nestjs-app)
    - [Make a new `tms-nestjs-app` project](#make-a-new-tms-nestjs-app-project)
    - [Add `tms-nestjs-app` to an existing project](#add-tms-nestjs-app-to-an-existing-project-1)
    - [Usage](#usage-2)
- [Adding to an existing project](#adding-to-an-existing-project)


## 10mi2 TypeScript App (`tms-typescript-app`)

A TypeScript App based on [TypeScriptAppProject](https://projen.io/api/API.html#typescriptappproject-) with the
following changes:

1. NPM is the default package manager
2. `eslint` and `prettier` are both enabled by default
   - Configure `eslint` to have all auto-fixable options set to warning instead of error
   - Adjustable with the `eslintFixableAsWarn` property (default: `true`)
3. VSCode support is enabled by default
4. TSConfig uses [`@tsconfig/node18`](https://github.com/tsconfig/bases#node-18-tsconfigjson) as the base config by
   default
   - `tconfig.json` is has all settings that are redundant removed
   - Adjustable with the `tsconfigBase` property (default: `TmsTSConfigBase.NODE18`)
   - The `tsconfigBaseStrictest` property controls strict settings (default: `true`)
     - This uses `@tsconfig/strictest` by setting `extends` to an array, which currently causes `ts-node` to fail
       ([issue #2000](https://github.com/TypeStrong/ts-node/issues/2000)), so the
       `tsconfigBaseNoArrayWorkaround` flag (`true` by default) is used to work around this by embedding a snapshot of the strictest settings directly
   - The `tsconfigBaseDev` property controls dev tool settings (such as `projen`) (default: `TmsTSConfigBase.NODE18`)
   - [ts-node issue #2094](https://github.com/TypeStrong/ts-node/issues/2094) prevents us from using Node > 18.18.x
   - ~~[ts-node issue #2076](https://github.com/TypeStrong/ts-node/issues/2076) prevents us from using ts-node with the
     app, and a workaround is in place to refer to the TSConfig bases relatively in the `tsconfig.dev.json` for now so
     `projen` works properly~~ (Fixed in `ts-node` [10.9.2](https://github.com/TypeStrong/ts-node/releases/tag/v10.9.2))
5. ESM suppport is enabled by default, adjusting TS and Jest configs as necessary
   - Controlled by the `esmSupportConfig` property (default: `true`)
6. Create a `bundle` task to build using `esbuild`
   - Controlled by the `addDefaultBundle` property (default: `true`)
   - `noEmit` is set to `true` assuming a bundle will be made and used or `tsx` or `ts-node` will be used if running
     directly

### Make a new `tms-typescript-app` project

Run this command *in a new directory*, and not within an existing project. IOW, the current directory should be empty
and there shouldn't be a `package.json` in any of the parent directories.

```bash
npx projen new --from @10mi2/tms-projen-projects tms-typescript-app
```

### Add `tms-typescript-app` to an existing project

Follow the instructions below for [adding to an existing project](#adding-to-an-existing-project).

Add the following to the top of your `.projenrc.ts` file:

```typescript
import { TmsTypeScriptAppProject } from "@10mi2/tms-projen-projects";
```

Add the following to the `.projenrc.ts` file *before* the `project.synth()`:

```typescript
new TmsTypeScriptAppProject({
  parent: project,
  name: "typescript-app",
  defaultReleaseBranch: "main",
  projenrcTs: true,
  packageManager: project.package.packageManager, // <- Use the same package manager as the parent project

  devDeps: ["@10mi2/tms-projen-projects"],

  // addDefaultBundle: true,     /* Add a default bundle to the project. */
  // deps: [],                   /* Runtime dependencies of this module. */
  // description: undefined,     /* The description is just a string that helps people understand the purpose of the package. */
  // eslintFixableAsWarn: true,  /* Change the default-set eslint auto-fixable rules to "warn" instead of "error". */
  // esmSupportConfig: true,     /* Configure for ESM. */
  // packageName: undefined,     /* The "name" in package.json. */

  // Change this to whatever you want that won't conflict with parent folders such as `src`, `lib`, or `test`:
  outdir: "app",
});
```

> ⚠️ You can run *some* of the `npm run ...` commands from the top level of the project and it'll run that command in all
> subprojects. However, to run commands in *just* the subproject, cd to that directory (set by `outdir`) and run the
> command there.

### Usage

Typical `projen` commands apply, such as `npm run build`, `npm run test`, and `npm run upgrade`.

For this project, there is no `npm run start`, but you can easily add one, such as the following

```typescript
// `project`` refers to the `TmsTypeScriptAppProject` object - if added as a subproject you may need to give it a name and
// use that instead of `project`

// const project = new TmsTypeScriptAppProject({ ... });

project.addTask("start", {
  steps: [{ spawn: "bundle" }, { exec: "node assets/index/index.js" }],
});

// project.synth();
```



## 10mi2 Apollo Graphql App (`tms-apollo-graphql-app`)

An example NestJS app, based on `TmsTSApolloGraphQLProject`, with a sample app. Experimental!

Will load up a sample app (more later):

- `pothos-prisma` - (**default**) which provides the following stak:
  - [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
  - [Pothos GraphQL](https://pothos-graphql.dev) Code-First Schema Generator
  - [Prisma](https://www.prisma.io) Database ORM (configured for SQLite by default)
  - Complete unit-test suite using [Jest](https://jestjs.io)
  - Uses sortable pagination according to the blog post Proper Pagination with GraphQL (link pending)
  - Uses unique IDs for every entity, always exposed as a string-encoded GraphQL `ID` type
    - The value is a Base64-encoded JSON object with enough info to uniquely identify the entity type and the entity itself


Note that the [TSConfig strictest](https://www.npmjs.com/package/@tsconfig/strictest) is used (can be
disabled with `tsconfigBaseStrictest: false`), and the sample code is adjusted to work with it.

Also the sample code has functional (but not coverage complete) tests that pass at first.

### Make a new `tms-apollo-graphql-app` project

Run this command *in a new directory*, and not within an existing project. IOW, the current directory should be empty
and there shouldn't be a `package.json` in any of the parent directories.

```bash
# make an Apollo code-first GraphQL app
npx projen new --from @10mi2/tms-projen-projects tms-apollo-graphql-app --sample-type=pothos-prisma
```

### Add `tms-nestjs-app` to an existing project

Follow the instructions below for [adding to an existing project](#adding-to-an-existing-project).

Add the following to the top of your `.projenrc.ts` file:

```typescript
import { TmsTSApolloGraphQLProject } from "@10mi2/tms-projen-projects";
```

Add the following to the `.projenrc.ts` file *before* the `project.synth()`:

```typescript
new TmsTSApolloGraphQLProject({
  parent: project,
  name: "apollo-graphql-app",
  defaultReleaseBranch: "main",
  projenrcTs: true,
  packageManager: project.package.packageManager, // <- Use the same package manager as the parent project

  sampleType: "pothos-prisma",

  // addDefaultBundle: true,     /* Add a default bundle to the project. */
  // deps: [],                   /* Runtime dependencies of this module. */
  // description: undefined,     /* The description is just a string that helps people understand the purpose of the package. */
  // eslintFixableAsWarn: true,  /* Change the default-set eslint auto-fixable rules to "warn" instead of "error". */
  // esmSupportConfig: true,     /* Configure for ESM. */
  // packageName: undefined,     /* The "name" in package.json. */

  // Change this to whatever you want that won't conflict with parent folders such as `src`, `lib`, or `test`:
  outdir: "app",
});
```

### Usage

Typical `projen` commands apply, such as `npm run build`, `npm run test`, and `npm run upgrade`.

A few additional commands have been added for convenience:

| Command                 | Description                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run bundle`        | Build the app into the `assets/index/` directory                                                            |
| `npm run start`         | Start the app                                                                                               |
| `npm run start:dev`     | Start the app in watch mode                                                                                 |
| `npm run codegen`       | Generate typings for embedded queries (found only in the tests), also generates `schema.graphql`            |
| `npm run codegen:watch` | Runs the same command as `codegen` but uses `nodemon` to watch for file changes (for when making the tests) |

More information can be found in the [README.md](samples/apollo-graphql-pothos-prisma/root/README.md) that's generated with the sample code.


## 10mi2 NestJS App (`tms-nestjs-app`)

An example NestJS app, based on `TmsTypeScriptAppProject`, with a few options of sample apps. Experimental!

Will load up one of a few sample apps:

- `graphql-codefirst` - (**default**) A NestJS app with a GraphQL API using the code-first approach
  - sample code from https://github.com/nestjs/nest/tree/master/sample/23-graphql-code-first
- `graphql-schemafirst` - A NestJS app with a GraphQL API using the code-first approach
  - sample code from https://github.com/nestjs/nest/tree/master/sample/12-graphql-schema-first

Note that in all cases the [TSConfig strictest](https://www.npmjs.com/package/@tsconfig/strictest) is used (can be
disabled with `tsconfigBaseStrictest: false`), and the sample code is adjusted to work with it.

Also the sample code has functional (but not coverage complete) tests added (or corrected), and should pass at first.

### Make a new `tms-nestjs-app` project

Run this command *in a new directory*, and not within an existing project. IOW, the current directory should be empty
and there shouldn't be a `package.json` in any of the parent directories.

```bash
# make a NestJS code-first GraphQL app
npx projen new --from @10mi2/tms-projen-projects tms-nestjs-app --sample-type=graphql-codefirst
```

### Add `tms-nestjs-app` to an existing project

Follow the instructions below for [adding to an existing project](#adding-to-an-existing-project).

Add the following to the top of your `.projenrc.ts` file:

```typescript
import { TmsNestJSAppProject } from "@10mi2/tms-projen-projects";
```

Add the following to the `.projenrc.ts` file *before* the `project.synth()`:

```typescript
new TmsNestJSAppProject({
  parent: project,
  name: "nestjs-typescript-app",
  defaultReleaseBranch: "main",
  projenrcTs: true,
  packageManager: project.package.packageManager, // <- Use the same package manager as the parent project

  // Choose ONE:
  sampleType: "graphql-codefirst",
  // sampleType: "graphql-schemafirst",

  // addDefaultBundle: true,     /* Add a default bundle to the project. */
  // deps: [],                   /* Runtime dependencies of this module. */
  // description: undefined,     /* The description is just a string that helps people understand the purpose of the package. */
  // eslintFixableAsWarn: true,  /* Change the default-set eslint auto-fixable rules to "warn" instead of "error". */
  // esmSupportConfig: true,     /* Configure for ESM. */
  // packageName: undefined,     /* The "name" in package.json. */

  // Change this to whatever you want that won't conflict with parent folders such as `src`, `lib`, or `test`:
  outdir: "app",
});
```

### Usage

Typical `projen` commands apply, such as `npm run build`, `npm run test`, and `npm run upgrade`.

A few additional commands have been added for convenience:

| Command                    | Description                                                     | Implementation                                              |
| -------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| `npm run compile`          | Build the app into the `dist/` directory                        | `nest build`                                                |
| `npm run start`            | Start the app                                                   | `nest start`                                                |
| `npm run start:dev`        | Start the app in watch mode                                     | `nest start --watch`                                        |
| `npm run start:debug`      | Start the app in debug+watch mode                               | `nest start --debug --watch`                                |
| `npm run start:prod`       | Execute the packaged code (in production)                       | `node dist/main`                                            |
| `npm run generate-typings` | Generate typings from `.gql` files (`graphql-schemafirst` only) | `ts-node --project=tsconfig.dev.json ./generate-typings.ts` |

Note that the `start` commands will indicate to connecto to `http://localhost:3000` (or `http://[::1]:3000` if you have
IPv6), but the GraphQL examples don't do much with the default route, so you need to use
[`http://localhost:3000/graphql`](http://localhost:3000/graphql)
(or [`http://[::1]:3000/graphql`](http://[::1]:3000/graphql)) to get to the GraphQL editor.

# Adding to an existing project

These instructions are for adding one of the above project types to an existing project.

Assuming you already have a `.projenrc.ts` file and it defines a `project` to use as a parent such as
[`MonorepoTsProject`](https://aws.github.io/aws-pdk/developer_guides/monorepo/index.html) from `@aws/pdk`, you can add
this project to it as a child.

First, temporarily add `@10mi2/tms-projen-projects` to your `devDeps`:

```typescript
const project = new monorepo.MonorepoTsProject({ // Or whatever is already there
  devDeps: [
   "@aws/pdk", // <- Whatever is already there
   "@10mi2/tms-projen-projects", // <- Add this
  ],
  /* ... */
});
```

Next run:

```bash
npx projen
```

Then add the project as a child with the code described above for each project type.

> ⚠️ If the parent project isn't called `project`, you'll need to adjust the code above to use the correct variable name. 

Then run `npx projen` again to update your project.

> ⚠️ There will only be *one* `.projenrc.ts` file in the repo, and any time you run `npx projen` it will update *all* of
> the defined projects and subprojects. Always run `npx projen` from the top level of the repo, where the `.projenrc.ts`
> file is.
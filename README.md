# Ten Mile Square Technologies `projen` Projects

A collection of opinionated projen projects.

## Typescript App

A typescript app based on [TypeScriptAppProject](https://projen.io/api/API.html#typescriptappproject-) with the
following changes:

1. NPM is the default package manager
2. `eslint` and `prettier` are both enabled by default
   - Configure `eslint` to have all auto-fixable options set to warning instead of error
   - Adjustable with the `eslintFixableAsWarn` property (default: `true`)
   - Note that `eslint` and 
3. VSCode is enables by default
4. TSConfig uses [`@tsconfig/node18`](https://github.com/tsconfig/bases#node-18-tsconfigjson) as the base config
   - `tconfig.json` is has all settings that are redundant removed
5. ESM suppport is enabled by default, adjusting TS and Jest configs as necessary
   - Controlled by the `esmSupportConfig` property (default: `true`)
   - Sets the `moduleResolution` to `"bundler"` 
6. Create a `bundle` task to build using `esbuild`
   - Controlled by the `addDefaultBundle` property (default: `true`)
   - `noEmit` is set to `true` assuming a bundle will be made and used, or `tsx` or `ts-node` will be used if running
     directly


```bash
# make a 10mi2 typescript app
npx projen new --from @10mi2/tms-projen-projects tms-typescript-app
```

## NestJS App

An example NestJS app. Experimental!

Will load up one of a few sample apps:

- `graphql-codefirst` - A NestJS app with a GraphQL API using the code-first approach
  - sample code from https://github.com/nestjs/nest/tree/master/sample/23-graphql-code-first
- `graphql-schemafirst` - A NestJS app with a GraphQL API using the code-first approach
  - sample code from https://github.com/nestjs/nest/tree/master/sample/12-graphql-schema-first


```bash
# make a NestJS code-first GraphQL app
npx projen new --from @10mi2/tms-projen-projects tms-nestjs-app --sample-type=graphql-codefirst
```
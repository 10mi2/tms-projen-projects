import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { DirectiveLocation, GraphQLDirective } from "graphql";
import { upperDirectiveTransformer } from "./common/directives/upper-case.directive.js";
import { RecipesModule } from "./recipes/recipes.module.js";

/**
 * Set to `true` to disable the default [GraphQL Playground](https://github.com/graphql/graphql-playground) and use the
 * embedded [Apollo Sandbox](https://www.apollographql.com/docs/graphos/explorer/sandbox) landing page instead
 * */
const useApolloStudio = false;

@Module({
  imports: [
    RecipesModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: "schema.gql",
      transformSchema: (schema) => upperDirectiveTransformer(schema, "upper"),
      installSubscriptionHandlers: true,
      buildSchemaOptions: {
        directives: [
          new GraphQLDirective({
            name: "upper",
            locations: [DirectiveLocation.FIELD_DEFINITION],
          }),
        ],
      },
      ...(useApolloStudio
        ? {
            playground: false,
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
          }
        : {}),
    }),
  ],
})
export class AppModule {}
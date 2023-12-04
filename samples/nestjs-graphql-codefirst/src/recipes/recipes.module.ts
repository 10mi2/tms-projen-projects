import { Module } from "@nestjs/common";
import { RecipesResolver } from "./recipes.resolver.js";
import { RecipesService } from "./recipes.service.js";
import { DateScalar } from "../common/scalars/date.scalar.js";

@Module({
  providers: [RecipesResolver, RecipesService, DateScalar],
})
export class RecipesModule {}

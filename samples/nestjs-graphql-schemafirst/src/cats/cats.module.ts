import { Module } from "@nestjs/common";
import { CatOwnerResolver } from "./cat-owner.resolver.js";
import { CatsResolver } from "./cats.resolver.js";
import { CatsService } from "./cats.service.js";
import { OwnersModule } from "../owners/owners.module.js";

@Module({
  imports: [OwnersModule],
  providers: [CatsService, CatsResolver, CatOwnerResolver],
})
export class CatsModule {}

import { ParseIntPipe, UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver, Subscription } from "@nestjs/graphql";
import { PubSub } from "graphql-subscriptions";
import { CatsGuard } from "./cats.guard.js";
import { CatsService } from "./cats.service.js";
import { CreateCatDto } from "./dto/create-cat.dto.js";
import { Cat } from "../graphql.schema.js";

const pubSub = new PubSub();

@Resolver("Cat")
export class CatsResolver {
  constructor(private readonly catsService: CatsService) {}

  @Query("cats")
  @UseGuards(CatsGuard)
  async getCats() {
    return this.catsService.findAll();
  }

  @Query("cat")
  async findOneById(
    @Args("id", ParseIntPipe)
    id: number,
  ): Promise<Cat> {
    return this.catsService.findOneById(id);
  }

  @Mutation("createCat")
  async create(@Args("createCatInput") args: CreateCatDto): Promise<Cat> {
    const createdCat = await this.catsService.create(args);
    void pubSub.publish("catCreated", { catCreated: createdCat });
    return createdCat;
  }

  @Subscription("catCreated")
  catCreated() {
    return pubSub.asyncIterator("catCreated");
  }
}

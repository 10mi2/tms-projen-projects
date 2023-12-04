import { Injectable } from "@nestjs/common";
import { Cat } from "../graphql.schema.js";

@Injectable()
export class CatsService {
  private readonly cats: Array<Cat & { ownerId?: number }> = [
    { id: 1, name: "Cat", age: 5, ownerId: 1 },
  ];

  create(cat: Cat): Cat {
    cat.id = this.cats.length + 1;
    this.cats.push(cat);
    return cat;
  }

  findAll(): Cat[] {
    return this.cats;
  }

  findOneById(id: number): Cat {
    const foundCat = this.cats.find((cat) => cat.id === id);
    if (!foundCat) {
      throw new Error("Cat not found");
    }
    return foundCat;
  }
}

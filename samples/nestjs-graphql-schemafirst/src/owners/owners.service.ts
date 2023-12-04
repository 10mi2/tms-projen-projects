import { Injectable } from "@nestjs/common";
import { Owner } from "../graphql.schema.js";

@Injectable()
export class OwnersService {
  private readonly owners: Owner[] = [{ id: 1, name: "Jon", age: 5 }];

  findOneById(id: number): Owner {
    const foundOwner = this.owners.find((owner) => owner.id === id);
    if (!foundOwner) {
      throw new Error("Owner not found");
    }
    return foundOwner;
  }
}

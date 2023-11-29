import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("query addRecipe", () => {
    return request(app.getHttpServer())
      .post("/graphql")
      .send({
        operationName: "addRecipe",
        query: `mutation addRecipe($data: NewRecipeInput!) {
  addRecipe(newRecipeData: $data) {
    id
  }
}`,
        variables: {
          data: {
            title: "a",
            description: "This is a description, because we had to",
            ingredients: [],
          },
        },
      })
      .expect(200)
      .expect({
        data: {
          addRecipe: {
            id: "0",
          },
        },
      });
  });

  it('query recipe("0")', () => {
    return request(app.getHttpServer())
      .post("/graphql")
      .send({
        operationName: "recipe",
        query: `query recipe($id: String = "0") {
  recipe(id: $id) {
    id
    description
    ingredients
  } 
}`,
        variables: {
          id: "0",
        },
      })
      .expect(200)
      .expect({
        data: {
          recipe: {
            id: "0",
            description: "This is a description, because we had to",
            ingredients: [],
          },
        },
      });
  });
});

import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module.js";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("mutation createCat", async () => {
    await request(app.getHttpServer())
      .post("/graphql")
      .send({
        operationName: "createCat",
        query: `mutation createCat($createCatInput: CreateCatInput!) {
  createCat(createCatInput: $createCatInput) {
  	id
  }
}`,
        variables: {
          createCatInput: {
            name: "beef",
            age: 122,
          },
        },
      })
      .expect(200)
      .expect({
        data: {
          createCat: {
            id: 2,
          },
        },
      });

    await request(app.getHttpServer())
      .post("/graphql")
      .send({
        query: `query {
  cats {
    name
    age
  }
}`,
        variables: {},
      })
      .expect(200)
      // .then((res) => console.log(JSON.stringify(res.body)));
      .expect({
        data: {
          cats: [
            { name: "Cat", age: 5 },
            { name: "beef", age: 122 },
          ],
        },
      });
  });
});

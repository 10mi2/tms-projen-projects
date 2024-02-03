// We can go a few different ways with this. We could:
// 1. Call Prisma directly to seed the database
// 2. Use the GraphQL API to seed the database

// We'l going to dogfood and go with 2, since this will also test the GraphQL API
// It will also be less fragile to database changes when the graphql schema stays the same

// import assert from "assert";
import { ApolloServer } from "@apollo/server";

/* eslint-disable-next-line import/no-extraneous-dependencies */
import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { BuilderContext } from "../src/builder.js";
import { schema } from "../src/schema.js";
import { createPost } from "../test/util/posts.queries.js";
import { createUser } from "../test/util/users.queries.js";

let server = new ApolloServer<BuilderContext>({
  schema,
});

// It's an actual PrismaClient instance - not a Mock
const prisma = new PrismaClient({ log: [{ level: "query", emit: "event" }] });
// log queries
// prisma.$on("query", (e) => {
//   console.log("Query: " + e.query);
//   console.log("Params: " + e.params);
//   console.log("Duration: " + e.duration + "ms");
// });

let totalUsers = 0;
let totalPosts = 0;
console.time("Seeding random data");
for (const _i of new Array<number>(Math.ceil(Math.random() * 100) + 30).fill(
  0,
)) {
  const userResult = await createUser({
    testServer: server,
    mockContext: { prisma },
    newUser: {
      email: faker.internet.email(),
      name: faker.person.fullName(),
    },
    check: false,
  });
  const user = userResult?.data?.createUser;
  if (!user) {
    console.warn("⚠️ No user created - that's odd.");
    continue;
  }

  totalUsers++;

  for (const _j of new Array<number>(Math.ceil(Math.random() * 100)).fill(0)) {
    const postResult = await createPost({
      testServer: server,
      mockContext: { prisma },
      newPost: {
        authorId: user.id,
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(),
        published: Math.random() > 0.5,
      },
      check: false,
    });

    const post = postResult?.data?.createPost;
    if (!post) {
      console.warn("⚠️ No post created - that's odd.");
      continue;
    }
    totalPosts++;
  }
}
console.timeEnd("Seeding random data");
console.log(`Created ${totalUsers} users and ${totalPosts} posts`);

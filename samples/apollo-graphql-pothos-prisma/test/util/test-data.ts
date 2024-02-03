import { Post, User } from "@prisma/client";

export const usersSimple = [
  {
    id: 1,
    name: "test",
    email: "blah.com",
  },
  {
    id: 2,
    name: "test2",
    email: "blah2.com",
  },
] satisfies Array<User>;
export const postsSimple = [
  {
    id: 1,
    title: "post by test",
    content: "blah.com conect",
    authorId: 1,
    published: true,
  },
  {
    id: 2,
    title: "post by test2",
    content: "blah2.com content",
    authorId: 2,
    published: false,
  },
  {
    id: 3,
    title: "2nd post by test2",
    content: "blah2.com content two",
    authorId: 2,
    published: false,
  },
  {
    id: 4,
    title: "3rd post by test2",
    content: "blah2.com content three",
    authorId: 2,
    published: false,
  },
] satisfies Array<Post>;

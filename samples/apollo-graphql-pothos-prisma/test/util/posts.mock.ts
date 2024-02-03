import assert from "assert";
import { Post, Prisma, User } from "@prisma/client";
import { DefaultArgs, GetFindResult } from "@prisma/client/runtime/library.js";
import { userFindUniqueOrThrowImpl } from "./users.mock.js";

type postFindManyReturn = ReturnType<Prisma.PostDelegate["findMany"]>;
export function postFindManyImpl<T extends Prisma.PostFindManyArgs>(
  posts: Post[],
  users: User[],
  defaultArgs?: T,
) {
  return <T2 extends Prisma.PostFindManyArgs>(
    args?: T2,
  ): postFindManyReturn => {
    const actualArgs = {
      ...defaultArgs,
      ...args,
    };

    const promise = (async () => {
      const filteredPosts: Post[] = posts.filter((post) => {
        if (actualArgs.where?.id !== undefined) {
          return actualArgs.where.id == post.id;
        }
        if (actualArgs.where?.authorId !== undefined) {
          return actualArgs.where.authorId == post.authorId;
        }
        return true;
      });
      if (actualArgs?.include?.author) {
        const filteredPostsWithAuthor: Array<Post & { author: User }> = [];
        for (const post of filteredPosts) {
          filteredPostsWithAuthor.push({
            ...post,
            author: await userFindUniqueOrThrowImpl(users, posts, {
              where: { id: post.authorId },
            })(),
          });
        }
        return filteredPostsWithAuthor;
      }

      return filteredPosts;
    })();

    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
    };
  };
}

type postFindUniqueOrThrowReturn = ReturnType<
  Prisma.PostDelegate["findUniqueOrThrow"]
>;
export function postFindUniqueOrThrowImpl<
  T extends Prisma.PostFindUniqueOrThrowArgs,
>(posts: Post[], users: User[], defaultArgs?: T) {
  return <T2 extends Prisma.PostFindUniqueOrThrowArgs>(
    args?: T2,
  ): postFindUniqueOrThrowReturn => {
    const actualArgs = {
      ...defaultArgs,
      ...args,
    };

    const whereId = actualArgs.where?.id;
    const foundPost = whereId
      ? posts.find((post) => whereId == post.id)
      : undefined;
    assert(foundPost !== undefined);

    const promise = (async () => {
      const post: Post & { author?: User } = foundPost;
      if (args?.include?.author) {
        post.author = await userFindUniqueOrThrowImpl(users, posts, {
          where: { id: post.authorId },
        })();
      }
      return post;
    })();

    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      author: userFindUniqueOrThrowImpl(users, posts, {
        where: { id: foundPost.authorId },
      }) as never,
      // as never since crazy typing, we don't care about most of it
    };
  };
}

type postCreateReturn = ReturnType<Prisma.PostDelegate["create"]>;
export function postCreateImpl(posts: Post[], users: User[]) {
  return <T extends Prisma.PostCreateArgs>(args: T): postCreateReturn => {
    const authorId = args.data.authorId;
    assert(typeof authorId === "number");
    const authorRaw = users.find((user) => user.id === authorId);
    assert(authorRaw !== undefined);
    const newPost = {
      id: posts.length + 1,
      content: null,
      published: false,
      ...args.data,
      authorId,
    } satisfies Post;
    posts.push(newPost);

    // add toStringTag and author
    const promise = Promise.resolve(newPost);
    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      author: userFindUniqueOrThrowImpl(users, posts, {
        where: { id: authorId },
      }) as never,
    };
  };
}

type postDeleteReturn = ReturnType<Prisma.PostDelegate["delete"]>;
export function postDeleteImpl(posts: Post[], users: User[]) {
  return <T extends Prisma.PostDeleteArgs>(args?: T): postDeleteReturn => {
    const postId = args?.where?.id;
    assert(postId !== undefined);

    const postIndex = posts.findIndex((post) => post.id === postId);
    const oldPost = posts.splice(postIndex, 1)[0];

    const promise = Promise.resolve(oldPost);
    const postsPromise = Promise.resolve([]);
    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      author: userFindUniqueOrThrowImpl(users, posts, {
        where: { id: oldPost.authorId },
      }) as never,
    };
  };
}

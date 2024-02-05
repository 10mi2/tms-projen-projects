import assert from "assert";
import { Post, Prisma, User } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library.js";
import { postFindManyImpl, postFindUniqueOrThrowImpl } from "./posts.mock.js";

type userFindManyReturn = ReturnType<Prisma.UserDelegate["findMany"]>;
export function userFindManyImpl(users: User[], posts: Post[]) {
  return <T extends Prisma.UserFindManyArgs>(args?: T): userFindManyReturn => {
    const promise = (async () => {
      const filteredUsers = users.filter(
        (user) => args?.where?.id === undefined || args.where.id == user.id,
      );
      if (args?.select?.posts) {
        const filteredUsersWithPosts: Array<User & { posts: Post[] }> = [];
        for (const user of filteredUsers) {
          filteredUsersWithPosts.push({
            ...user,
            posts: await postFindManyImpl(posts, users, {
              where: { authorId: user.id },
            })(
              typeof args.select.posts === "object"
                ? args.select.posts
                : undefined,
            ),
          });
        }
        // console.log(JSON.stringify({ args, filteredUsersWithPosts }, null, 2));

        return filteredUsersWithPosts;
      }
      // console.log(JSON.stringify({ args, filteredUsers }, null, 2));
      return filteredUsers;
    })();
    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
    };
  };
}

type userFindUniqueOrThrowReturn = ReturnType<
  Prisma.UserDelegate["findUniqueOrThrow"]
>;
export function userFindUniqueOrThrowImpl<
  T extends Prisma.UserFindUniqueOrThrowArgs,
>(users: User[], posts: Post[], defaultArgs?: T) {
  return <T2 extends Prisma.UserFindUniqueOrThrowArgs>(
    args?: T2,
  ): userFindUniqueOrThrowReturn => {
    const actualArgs = {
      ...defaultArgs,
      ...args,
    };

    const whereId = actualArgs.where?.id;
    assert(whereId !== undefined);
    const foundUser = users.find((user) => whereId == user.id);
    assert(foundUser !== undefined);

    const promise = Promise.resolve(foundUser);
    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      posts: postFindManyImpl(posts, users, {
        where: { authorId: foundUser?.id },
      }) as never,
      // as never since crazy typing, we don't care about most of it,
    };
  };
}

type userCreateReturn = ReturnType<Prisma.UserDelegate["create"]>;
export function userCreateImpl(users: User[]) {
  return <T extends Prisma.UserCreateArgs>(args?: T): userCreateReturn => {
    const newUser = {
      id: users.length + 1,
      name: args?.data?.name ?? "",
      email: args?.data?.email ?? "",
    } satisfies User;
    users.push(newUser);
    // add toStringTag and posts
    const promise = Promise.resolve(newUser);
    const postsPromise = Promise.resolve([]);
    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      posts: () => ({
        [Symbol.toStringTag]: "PrismaPromise" as const,
        then: postsPromise.then.bind(postsPromise),
        catch: postsPromise.catch.bind(postsPromise),
        finally: postsPromise.finally.bind(postsPromise),
      }),
    };
  };
}

type userDeleteReturn = ReturnType<Prisma.UserDelegate["delete"]>;
export function userDeleteImpl(users: User[], posts: Post[]) {
  return <T extends Prisma.UserDeleteArgs>(args?: T): userDeleteReturn => {
    const userId = args?.where?.id;
    assert(userId !== undefined);

    let postIndex = 0;
    while (
      (postIndex = posts.findIndex((post) => post.authorId === userId)) !== -1
    ) {
      posts.splice(postIndex, 1);
    }

    const userIndex = users.findIndex((user) => user.id === userId);
    const oldUser = users.splice(userIndex, 1)[0];

    const promise = Promise.resolve(oldUser);
    const postsPromise = Promise.resolve([]);
    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      posts: () => ({
        [Symbol.toStringTag]: "PrismaPromise" as const,
        then: postsPromise.then.bind(postsPromise),
        catch: postsPromise.catch.bind(postsPromise),
        finally: postsPromise.finally.bind(postsPromise),
      }),
    };
  };
}

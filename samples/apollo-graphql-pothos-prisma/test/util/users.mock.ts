import assert from "assert";
import { Post, Prisma, PrismaPromise, User } from "@prisma/client";
import { InternalArgs } from "@prisma/client/runtime/library.js";
import { postFindManyImpl, postFindUniqueOrThrowImpl } from "./posts.mock.js";

// Here we make a mock implementation of a few functions of the Prisma UYserDelegate
// Due to how Prisma handles return values, like making a Promise with additional properties (!), we have to do some
// acrobatics to make the mock implementation type correctly to ensure we're retuning the right values

// NOTE: This is a very basic implementation, and does not handle all possible cases.
// Specifically, it does not handle the `include` fields of the Prisma query arguments AT ALL, and the `select` fields
// are only honored to *add* relation fields to the returned object, not to *remove* fields from the returned object.

// Convenient alias for the various `prisma.user` function query arguments
type userFindUniqueOrThrowArgs = Prisma.Args<
  Prisma.UserDelegate,
  "findUniqueOrThrow"
>;
type userCreateArgs = Prisma.Args<Prisma.UserDelegate, "create">;
type userDeleteArgs = Prisma.Args<Prisma.UserDelegate, "delete">;

/**
 * Make a `prisma.user.findMany` mock implementation - this function returns a function that is the mock implementation
 *
 * @param users - Array of User objects to use as sample data
 * @param posts - Array of Post objects to use as sample data
 * @returns A mock function that takes the query arguments and returns a faked "PrismaPromise" of the result
 */
export function userFindManyImpl(users: User[], posts: Post[]) {
  // This is the actual mock function that will be returned, with the user and post data references "baked in"
  return <A extends Prisma.UserFindManyArgs>(
    args?: Prisma.Exact<A, Prisma.UserFindManyArgs>,
  ): PrismaPromise<
    Prisma.Result<Prisma.UserDelegate, typeof args, "findMany">
  > => {
    const promise = (async () => {
      const filteredUsers = users.filter(
        (user) => args?.where?.id === undefined || args.where.id == user.id,
      );
      if (args?.select?.posts) {
        const filteredUsersWithPosts: Array<User & { posts: Post[] }> = [];
        for (const user of filteredUsers) {
          filteredUsersWithPosts.push({
            ...user,
            posts: await postFindManyImpl(
              posts,
              users,
            )({
              ...(typeof args.select.posts === "object"
                ? args.select.posts
                : {}),
              where: {
                authorId: user.id,
              },
            }),
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
} // End userFindManyImpl

/**
 * Make a `prisma.user.findUniqueOrThrow` mock implementation - this function returns a function that is the mock
 * implementation
 *
 * @param users - Array of User objects to use as sample data
 * @param posts - Array of Post objects to use as sample data
 * @param defaultArgs - (optional) Default arguments to use for the query (for example, to limit the results to a
 * certain user)
 * @returns A mock function that takes the query arguments and returns a faked "PrismaPromise" of the result
 */
export function userFindUniqueOrThrowImpl(users: User[], _posts: Post[]) {
  // This is the actual mock function that will be returned, with the user and post data references "baked in"
  return <A extends userFindUniqueOrThrowArgs>(
    args?: Prisma.Exact<A, userFindUniqueOrThrowArgs>,
  ): Prisma.Prisma__UserClient<
    Prisma.Result<Prisma.UserDelegate, typeof args, "findUniqueOrThrow">
  > => {
    const whereId = args?.where.id;
    assert(whereId !== undefined);
    const foundUser = users.find((user) => whereId == user.id);
    assert(foundUser !== undefined);

    const promise = Promise.resolve(
      foundUser as Prisma.Result<
        Prisma.UserDelegate,
        typeof args,
        "findUniqueOrThrow"
      >,
    );
    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      posts: () =>
        Promise.reject("Not implemented: userFindUniqueOrThrow.posts") as never,
    };
  };
} // End userFindUniqueOrThrowImpl

/**
 * Make a `prisma.user.create` mock implementation - this function returns a function that is the mock implementation
 *
 * @param users - Array of User objects to use as sample data
 * @returns A mock function that takes the query arguments and returns a faked "PrismaPromise" of the result
 */
export function userCreateImpl(users: User[]) {
  // This is the actual mock function that will be returned, with the user and post data references "baked in"
  return <A extends userCreateArgs>(
    args: Prisma.Exact<A, userCreateArgs>,
  ): Prisma.Prisma__UserClient<
    Prisma.Result<Prisma.UserDelegate, typeof args, "create">
  > => {
    const newUser = {
      id: users.length + 1,
      name: args?.data?.name ?? "",
      email: args?.data?.email ?? "",
    } satisfies User;
    users.push(newUser);
    // add toStringTag and posts
    const promise = Promise.resolve(
      newUser as Prisma.Result<Prisma.UserDelegate, typeof args, "create">,
    );
    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      posts: <T extends Prisma.PostDefaultArgs = {}>(
        args2?: Prisma.Subset<T, Prisma.PostDefaultArgs>,
      ) => {
        return postFindUniqueOrThrowImpl(
          [],
          users,
        )({ ...args2, where: { id: newUser.id } }) as never;
      },
    };
  };
} // End userCreateImpl

/**
 * Make a `prisma.user.delete` mock implementation - this function returns a function that is the mock implementation
 *
 * @param users - Array of User objects to use as sample data
 * @param posts - Array of Post objects to use as sample data - used for the return value
 * @returns A mock function that takes the query arguments and returns a faked "PrismaPromise" of the result
 */
export function userDeleteImpl(users: User[], posts: Post[]) {
  // This is the actual mock function that will be returned, with the user and post data references "baked in"
  return <A extends userDeleteArgs>(
    args?: Prisma.Exact<A, userDeleteArgs>,
  ): Prisma.Prisma__UserClient<
    Prisma.Result<Prisma.UserDelegate, typeof args, "delete">
  > => {
    const userId = args?.where?.id;
    assert(userId !== undefined);

    const oldPosts: Array<Post> = [];

    let postIndex = 0;
    while (
      (postIndex = posts.findIndex((post) => post.authorId === userId)) !== -1
    ) {
      oldPosts.push(...posts.splice(postIndex, 1));
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
      posts: <T extends Prisma.PostDefaultArgs = {}>(
        args2?: Prisma.Subset<T, Prisma.PostDefaultArgs>,
      ) => {
        return postFindUniqueOrThrowImpl(
          oldPosts,
          users,
        )({ ...args2, where: { id: userId } }) as never;
      },
    };
  };
} // End userDeleteImpl

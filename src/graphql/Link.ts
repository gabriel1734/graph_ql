import { Prisma } from '@prisma/client';
import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';
import AppError from '../utils/AppError';

export const Link = objectType({
  name: 'Link',
  definition(t) {
    t.nonNull.int('id');
    t.nonNull.string('description');
    t.nonNull.string('url');
    t.nonNull.dateTime('createdAt');
    t.dateTime('updatedAt');
    t.int('totalVotes');
    t.field('postedBy', {
      type: 'User',
      resolve(parent, args, context) {
        return context.prisma.link
          .findUnique({ where: { id: parent.id } })
          .postedBy();
      },
    });
    t.nonNull.list.nonNull.field('voters', {
      type: 'User',
      resolve(parent, args, context) {
        return context.prisma.link
          .findUnique({ where: { id: parent.id } })
          .voters();
      },
    });
  },
});

export const LinkOrderByInput = inputObjectType({
  name: 'LinkOrderByInput',
  definition(t) {
    t.field('description', { type: Sort });
    t.field('url', { type: Sort });
    t.field('createdAt', { type: Sort });
  },
});

export const Sort = enumType({
  name: 'Sort',
  members: ['asc', 'desc'],
});

export const Feed = objectType({
  name: 'Feed',
  definition(t) {
    t.nonNull.list.nonNull.field('links', { type: 'Link' });
    t.nonNull.int('count');
    t.id('id');
  },
});

export const LinkQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('feed', {
      type: 'Feed',
      args: {
        filter: stringArg(),
        skip: intArg(),
        take: intArg(),
        orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
      },
      async resolve(parent, args, context) {
        const where = args.filter
          ? {
              OR: [
                { description: { contains: args.filter } },
                { url: { contains: args.filter } },
              ],
            }
          : {};

        const links = context.prisma.link.findMany({
          where,
          skip: args?.skip as number | undefined,
          take: args?.take as number | undefined,
          orderBy: args?.orderBy as
            | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
            | undefined,
        });

        if (!links) {
          throw new AppError('No links found', 404);
        }

        const count = await context.prisma.link.count({ where });
        const id = `main-feed: ${JSON.stringify(args)}`;

        return {
          links,
          count,
          id,
        };
      },
    });
  },
});

export const LinkMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('post', {
      type: 'Link',
      args: {
        description: nonNull(stringArg()),
        url: nonNull(stringArg()),
      },

      async resolve(parent, args, context) {
        const { description, url } = args;
        const { userId } = context;

        if (!userId) {
          throw new AppError('Not authenticated', 401);
        }

        const isExistingLink = await context.prisma.link.findFirst({
          where: {
            OR: [{ description }, { url }],
          },
        });

        if (isExistingLink) {
          throw new Error('Link or description already exists');
        }

        const newLink = context.prisma.link.create({
          data: {
            description,
            url,
            postedBy: { connect: { id: userId } },
          },
        });

        if (!newLink) {
          throw new Error('Could not create link');
        }

        return newLink;
      },
    });
  },
});

export const UpdateLinkMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('updateLink', {
      type: 'Link',
      args: {
        id: nonNull(intArg()),
        description: nonNull(stringArg()),
        url: nonNull(stringArg()),
      },

      async resolve(parent, args, context) {
        const { id, description, url } = args;

        const { userId } = context;

        if (!userId) {
          throw new Error('Not authenticated');
        }

        const linkExist = await context.prisma.link.findUnique({
          where: { id },
        });

        if (!linkExist) {
          throw new Error('Link does not exist');
        }

        const isExistingLink = await context.prisma.link.findFirst({
          where: {
            OR: [{ description }, { url }],
          },
        });

        if (isExistingLink) {
          throw new Error('Link or description already exists');
        }

        const isTheSameUser = await context.prisma.link.findFirst({
          where: {
            AND: [{ id }, { postedById: userId }],
          },
        });

        if (!isTheSameUser) {
          throw new AppError(
            'Not authorized, you are not the owner of this link',
            401,
          );
        }

        const link = context.prisma.link.update({
          where: {
            id,
          },
          data: {
            description,
            url,
            postedBy: { connect: { id: userId } },
          },
        });

        return link;
      },
    });
  },
});

export const DeleteLinkMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('deleteLink', {
      type: 'Link',
      args: {
        id: nonNull(intArg()),
      },

      async resolve(parent, args, context) {
        const { id } = args;
        const { userId } = context;

        if (!userId) {
          throw new Error('Not authenticated');
        }

        const isLinkExist = await context.prisma.link.findFirst({
          where: {
            id,
          },
        });

        if (!isLinkExist) {
          throw new Error('Link does not exist');
        }

        const isTheSameUser = await context.prisma.link.findFirst({
          where: {
            AND: [{ id }, { postedById: userId }],
          },
        });

        if (!isTheSameUser) {
          throw new Error('Not authorized, you are not the owner of this link');
        }

        const link = context.prisma.link.delete({
          where: {
            id,
          },
        });

        if (!link) {
          throw new Error('Could not delete link');
        }

        return link;
      },
    });
  },
});

export const FindOneLink = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('findOneLink', {
      type: 'Link',
      args: {
        id: nonNull(intArg()),
      },

      resolve(parent, args, context) {
        const { id } = args;

        const link = context.prisma.link.findUnique({
          where: {
            id,
          },
        });

        if (!link) {
          throw new Error(`Couldn't find link with id ${id}`);
        }

        return link;
      },
    });
  },
});

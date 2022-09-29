import { extendType, intArg, nonNull, objectType, stringArg } from 'nexus';
import { NexusGenObjects } from '../../nexus-typegen';

export const Link = objectType({
  name: 'Link',
  definition(t) {
    t.nonNull.int('id');
    t.nonNull.string('description');
    t.nonNull.string('url');
  },
});

const links: NexusGenObjects['Link'][] = [
  {
    id: 1,
    description: 'Fullstack tutorial for GraphQL',
    url: 'www.howtographql.com',
  },
  {
    id: 2,
    description: 'GraphQL Schema Language',
    url: 'graphql.org/learn/schema',
  },
];

export const LinkQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.field('feed', {
      type: 'Link',
      resolve(parent, args, context, info) {
        return links;
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

      resolve(parent, args) {
        const { description, url } = args;

        const idCount = links.length + 1;
        const link = {
          id: idCount,
          description,
          url,
        };
        links.push(link);
        return link;
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

      resolve(parent, args) {
        const { id, description, url } = args;

        const link = links.find((link) => link.id === id);

        if (!link) {
          throw new Error(`Couldn't find link with id ${id}`);
        }

        link.description = description;
        link.url = url;

        links.find((link) => link.id === id)!.description = link.description;
        links.find((link) => link.id === id)!.url = link.url;

        return link;
      },
    });
  },
});

export const DeleteLinkMutatio = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('deleteLink', {
      type: 'Link',
      args: {
        id: nonNull(intArg()),
      },

      resolve(parent, args) {
        const { id } = args;

        const link = links.find((link) => link.id === id);

        if (!link) {
          throw new Error(`Couldn't find link with id ${id}`);
        }

        links.splice(links.indexOf(link!), 1);

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

      resolve(parent, args) {
        const { id } = args;

        const link = links.find((link) => link.id === id);

        if (!link) {
          throw new Error(`Couldn't find link with id ${id}`);
        }

        return link;
      },
    });
  },
});

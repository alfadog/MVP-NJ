type PrismaClientLike = Record<string, any>;

type PrismaClientConstructor = new (...args: any[]) => PrismaClientLike;

let PrismaClientCtor: PrismaClientConstructor | undefined;

try {
  // eslint-disable-next-line global-require
  PrismaClientCtor = require('@prisma/client').PrismaClient as PrismaClientConstructor;
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using PrismaClient stub – did you run "pnpm prisma generate"?', error);
  }

  class PrismaClientStub implements PrismaClientLike {
    constructor(..._args: any[]) {}

    user = {
      upsert: async (args: Record<string, any>) => ({
        id: args?.create?.id ?? 'stub-user',
        ...args?.create,
      }),
    };

    gameSession = {
      create: async (args: Record<string, any>) => ({
        id: 'stub-session',
        ...args?.data,
      }),
      findMany: async () => [],
    };
  }

  PrismaClientCtor = PrismaClientStub;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientLike };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClientCtor!({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

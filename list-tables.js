const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`);
  console.log(result);
}
main().catch(console.error).finally(() => prisma.$disconnect());

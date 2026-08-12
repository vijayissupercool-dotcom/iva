import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  console.log("=== User Table ===")
  console.table(await prisma.user.findMany())
  console.log("=== Workspace Table ===")
  console.table(await prisma.workspace.findMany())
  console.log("=== WorkspaceMember Table ===")
  console.table(await prisma.workspaceMember.findMany())
}
main().catch(console.error).finally(() => prisma.$disconnect())

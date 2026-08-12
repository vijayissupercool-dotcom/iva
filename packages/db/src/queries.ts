import { prisma } from './index'

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Ensures the specified user is a member of the specified workspace.
 * Throws ForbiddenError if the user is not a member.
 * Returns the membership record if successful.
 */
export async function requireWorkspaceMember(userId: string, workspaceId: string) {
  if (!userId || !workspaceId) {
    throw new UnauthorizedError('Missing user ID or workspace ID')
  }

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  })

  if (!member) {
    throw new ForbiddenError('User is not a member of this workspace')
  }

  return member
}

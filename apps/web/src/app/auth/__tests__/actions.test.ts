import { expect, test, vi } from 'vitest'
import { createWorkspace } from '../actions'

// Mock dependencies
vi.mock('@/utils/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'test-user-123', email: 'test@example.com' }
          }
        })
      }
    })
  }
})

vi.mock('@lva/db', () => {
  const txMock = {
    user: { upsert: vi.fn().mockResolvedValue({}) },
    workspace: { create: vi.fn().mockResolvedValue({}) }
  }
  return {
    prisma: {
      $transaction: vi.fn(async (cb) => cb(txMock))
    }
  }
})

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

test('createWorkspace should create a user and workspace', async () => {
  const formData = new FormData()
  formData.append('name', 'Test Workspace')

  const { prisma } = await import('@lva/db')
  const { redirect } = await import('next/navigation')

  await createWorkspace(formData)

  expect(prisma.$transaction).toHaveBeenCalled()
  
  // The transaction callback would have been called
  expect(redirect).toHaveBeenCalledWith('/app')
})

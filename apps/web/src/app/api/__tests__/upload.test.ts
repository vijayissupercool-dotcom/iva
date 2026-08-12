import { expect, test, vi, beforeEach } from 'vitest'
import { POST as signUploadPOST } from '../uploads/sign/route'
import { POST as createRecordingPOST } from '../recordings/route'
import { POST as completeRecordingPOST } from '../recordings/[id]/complete/route'

// Mock the dependencies
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
    }
  }))
}))

vi.mock('@lva/db', () => ({
  prisma: {
    recordingSession: {
      create: vi.fn().mockResolvedValue({ id: 'test-session-id' }),
      findUnique: vi.fn().mockResolvedValue({ id: 'test-session-id', workspaceId: 'test-workspace-id' }),
      update: vi.fn().mockResolvedValue({ id: 'test-session-id', status: 'UPLOADED' })
    },
    processingJob: {
      create: vi.fn().mockResolvedValue({ id: 'test-job-id' })
    }
  },
  requireWorkspaceMember: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-signed-url.com/upload')
}))

vi.mock('@/lib/s3', () => ({
  s3: {
    send: vi.fn().mockResolvedValue({})
  },
  S3_BUCKET: 'mock-bucket'
}))

// Needs mock of PutObjectCommand and HeadObjectCommand
vi.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: class {},
  HeadObjectCommand: class {}
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test('POST /api/recordings - Creates a recording session', async () => {
  const req = new Request('http://localhost/api/recordings', {
    method: 'POST',
    body: JSON.stringify({ workspaceId: '123e4567-e89b-12d3-a456-426614174000' })
  })
  const res = await createRecordingPOST(req)
  const json = await res.json()
  expect(res.status).toBe(200)
  expect(json.sessionId).toBe('test-session-id')
})

test('POST /api/uploads/sign - Generates signed URL', async () => {
  const req = new Request('http://localhost/api/uploads/sign', {
    method: 'POST',
    body: JSON.stringify({ 
      workspaceId: '123e4567-e89b-12d3-a456-426614174000',
      contentType: 'video/webm',
      extension: 'webm'
    })
  })
  const res = await signUploadPOST(req)
  const json = await res.json()
  expect(res.status).toBe(200)
  expect(json.url).toBe('https://mock-signed-url.com/upload')
  expect(json.key).toContain('workspaces/123e4567-e89b-12d3-a456-426614174000/uploads/')
  expect(json.key).toContain('.webm')
})

test('POST /api/recordings/[id]/complete - Marks session as uploaded and triggers job', async () => {
  const req = new Request('http://localhost/api/recordings/test-session-id/complete', {
    method: 'POST',
    body: JSON.stringify({ 
      storageKey: 'test/key.webm',
      duration: 12000
    })
  })
  const res = await completeRecordingPOST(req, { params: { id: 'test-session-id' } })
  const json = await res.json()
  expect(res.status).toBe(200)
  expect(json.success).toBe(true)
  expect(json.session.status).toBe('UPLOADED')
})

import { createClient } from '@/utils/supabase/server'
import { requireWorkspaceMember, prisma } from '@lva/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { s3, S3_BUCKET } from '@/lib/s3'
import { HeadObjectCommand } from '@aws-sdk/client-s3'

const completeRecordingSchema = z.object({
  storageKey: z.string().min(1),
  duration: z.number().nonnegative(),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = params

    const body = await req.json()
    const result = completeRecordingSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 })
    }
    
    const { storageKey, duration } = result.data

    // Fetch the session
    const session = await prisma.recordingSession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Enforce workspace isolation
    await requireWorkspaceMember(user.id, session.workspaceId)

    // Verify upload exists in MinIO/R2
    try {
      const command = new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: storageKey,
      })
      await s3.send(command)
    } catch (s3Error: any) {
      console.error('S3 Verification failed:', s3Error)
      return NextResponse.json({ error: 'Uploaded file not found in storage' }, { status: 400 })
    }

    // Update session
    const updatedSession = await prisma.recordingSession.update({
      where: { id: sessionId },
      data: {
        status: 'UPLOADED',
        storageKeys: { push: storageKey },
        duration,
      }
    })

    // Create a ProcessingJob to trigger worker
    await prisma.processingJob.create({
      data: {
        type: 'TRANSCODE', // The first step in our pipeline
        entityId: sessionId,
        status: 'QUEUED',
      }
    })

    return NextResponse.json({
      success: true,
      session: updatedSession
    })
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Error completing recording session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

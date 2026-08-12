import { createClient } from '@/utils/supabase/server'
import { requireWorkspaceMember, prisma } from '@lva/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createRecordingSchema = z.object({
  workspaceId: z.string().uuid(),
  // For V1, the client can just declare they want a session
  // Further details like exact start time or OS metadata can go here later
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = createRecordingSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 })
    }
    
    const { workspaceId } = result.data

    // Enforce workspace isolation
    await requireWorkspaceMember(user.id, workspaceId)

    // Create RecordingSession with status CREATED
    const session = await prisma.recordingSession.create({
      data: {
        workspaceId,
        userId: user.id,
        status: 'CREATED',
        storageKeys: [], // Will be populated when completed
        duration: 0,
      }
    })

    return NextResponse.json({
      sessionId: session.id,
    })
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Error creating recording session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { createClient } from '@/utils/supabase/server'
import { requireWorkspaceMember } from '@lva/db'
import { s3, S3_BUCKET } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const signRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  contentType: z.string().min(1),
  extension: z.string().min(1)
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = signRequestSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 })
    }
    
    const { workspaceId, contentType, extension } = result.data

    // Enforce workspace isolation
    await requireWorkspaceMember(user.id, workspaceId)

    // Generate stable path for this upload
    // e.g. workspaces/<workspaceId>/uploads/<date>/<uuid>.<ext>
    const dateStr = new Date().toISOString().split('T')[0]
    const fileId = uuidv4()
    const key = `workspaces/${workspaceId}/uploads/${dateStr}/${fileId}.${extension}`

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    })

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return NextResponse.json({
      url: signedUrl,
      key,
    })
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Error generating signed URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

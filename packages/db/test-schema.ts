import { prisma } from './src/index'

async function main() {
  console.log('Testing new logic: Creating RecordingSession, ProcessingJob, and ChangeDetection...')

  // Clean up
  await prisma.changeDetection.deleteMany()
  await prisma.stepEvidence.deleteMany()
  await prisma.processingJob.deleteMany()
  await prisma.captureEvent.deleteMany()
  await prisma.recordingSession.deleteMany()
  await prisma.segmentVersion.deleteMany()
  await prisma.segment.deleteMany()
  await prisma.scanRun.deleteMany()
  await prisma.share.deleteMany()
  await prisma.videoVersion.deleteMany()
  await prisma.video.deleteMany()
  await prisma.project.deleteMany()
  await prisma.workspaceMember.deleteMany()
  await prisma.user.deleteMany()
  await prisma.workspace.deleteMany()

  // 1. Setup workspace & user
  const workspace = await prisma.workspace.create({
    data: { name: 'Test WS', slug: 'test-ws-' + Date.now() }
  })
  const user = await prisma.user.create({
    data: { email: `test-${Date.now()}@example.com` }
  })

  // 2. Create RecordingSession (Phase 2 logic)
  const session = await prisma.recordingSession.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      status: 'UPLOADING',
      duration: 120000,
      storageKeys: ['session/1/video.mp4', 'session/1/events.json']
    }
  })
  console.log('✅ Created RecordingSession:', session.id)

  // 3. Create CaptureEvent with specific fields
  const captureEvent = await prisma.captureEvent.create({
    data: {
      sessionId: session.id,
      type: 'CLICK',
      timestamp: 5000,
      url: 'https://example.com',
      targetIdentity: { selector: '#submit-btn' },
      viewport: { width: 1920, height: 1080 }
    }
  })
  console.log('✅ Created CaptureEvent:', captureEvent.id)

  // 4. Create ProcessingJob (Phase 2 logic)
  const job = await prisma.processingJob.create({
    data: {
      type: 'TRANSCODE',
      entityId: session.id,
      status: 'QUEUED'
    }
  })
  console.log('✅ Created ProcessingJob:', job.id)

  // 5. Create Video, Segment, ScanRun, ChangeDetection
  const project = await prisma.project.create({
    data: { name: 'Test Project', workspaceId: workspace.id }
  })
  const video = await prisma.video.create({
    data: { title: 'Test Video', slug: 'test-video-' + Date.now(), workspaceId: workspace.id, projectId: project.id }
  })
  const segment = await prisma.segment.create({
    data: { videoId: video.id, stableKey: 'step-1', ordinal: 1, title: 'Click Submit' }
  })
  const scanRun = await prisma.scanRun.create({
    data: { videoId: video.id }
  })
  const detection = await prisma.changeDetection.create({
    data: {
      videoId: video.id,
      segmentId: segment.id,
      baselineVersionId: 'ver-123',
      scanRunId: scanRun.id,
      confidence: 0.95,
      oldEvidence: { transcript: 'Submit' },
      newEvidence: { transcript: 'Save' },
      status: 'OPEN'
    }
  })
  console.log('✅ Created ChangeDetection:', detection.id)

  console.log('All tests passed for Phase 2 schema logic!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

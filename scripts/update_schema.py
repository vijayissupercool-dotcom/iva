import re

def update_schema():
    with open('packages/db/schema.prisma', 'r') as f:
        content = f.read()

    # 1. Update Segment to include evidences and changeDetections
    content = content.replace('changeEvents ChangeEvent[]', 'changeDetections ChangeDetection[]\n  evidences StepEvidence[]')

    # 2. Update ScanRun to include changeDetections instead of changeEvents
    content = content.replace('changeEvents ChangeEvent[]', 'changeDetections ChangeDetection[]')

    # 3. Update Video to include shares
    content = content.replace('scanRuns            ScanRun[]', 'scanRuns            ScanRun[]\n  shares              Share[]')

    # 4. Update RecordingSession
    old_recording_session = """model RecordingSession {
  id          String   @id @default(cuid())
  videoId     String?  // null until first save; sessions can start before a Video row exists
  workspaceId String
  userId      String
  status      SessionStatus @default(RECORDING)
  startedAt   DateTime @default(now())
  endedAt     DateTime?
  captureEvents CaptureEvent[]
}"""
    new_recording_session = """model RecordingSession {
  id            String         @id @default(cuid())
  videoId       String?
  workspaceId   String
  userId        String
  status        SessionStatus  @default(CREATED)
  duration      Int?
  storageKeys   String[]
  error         String?
  startedAt     DateTime       @default(now())
  endedAt       DateTime?
  captureEvents CaptureEvent[]
}"""
    content = content.replace(old_recording_session, new_recording_session)

    # 5. Update CaptureEvent
    old_capture_event = """model CaptureEvent {
  id          String   @id @default(cuid())
  sessionId   String
  type        String   // matches capture-protocol union tag
  timestamp   Int      // ms since session start
  payload     Json
  session     RecordingSession @relation(fields: [sessionId], references: [id])
}"""
    new_capture_event = """model CaptureEvent {
  id             String           @id @default(cuid())
  sessionId      String
  type           String
  timestamp      Int
  url            String?
  targetIdentity Json?
  viewport       Json?
  coordinates    Json?
  metadata       Json?
  session        RecordingSession @relation(fields: [sessionId], references: [id])
}"""
    content = content.replace(old_capture_event, new_capture_event)

    # 6. Replace ChangeEvent with ChangeDetection
    old_change_event = """model ChangeEvent {
  id          String   @id @default(cuid())
  videoId     String
  segmentId   String
  scanRunId   String
  changeType  ChangeType   // URL | SELECTOR | DOM_SIGNATURE | TEXT | SCREENSHOT | WORKFLOW
  severity    Severity     // COSMETIC | MATERIAL | BREAKING
  oldValue    String?
  newValue    String?
  confidence  Float
  status      ChangeStatus @default(OPEN) // OPEN | ACKNOWLEDGED | RESOLVED | IGNORED
  createdAt   DateTime @default(now())
  segment     Segment @relation(fields: [segmentId], references: [id])
  scanRun     ScanRun @relation(fields: [scanRunId], references: [id])
}"""
    new_change_detection = """model ChangeDetection {
  id                String       @id @default(cuid())
  videoId           String
  segmentId         String
  baselineVersionId String
  scanRunId         String
  detectedAt        DateTime     @default(now())
  confidence        Float
  status            ChangeStatus @default(OPEN)
  reason            String?
  oldEvidence       Json?
  newEvidence       Json?
  visualDiffAssetId String?
  domDiff           Json?
  textDiff          Json?
  recommendedAction String?
  segment           Segment      @relation(fields: [segmentId], references: [id])
  scanRun           ScanRun      @relation(fields: [scanRunId], references: [id])
}"""
    content = content.replace(old_change_event, new_change_detection)

    # 7. Add StepEvidence, ProcessingJob, Share, AnalyticsEvent
    # We will inject these before "model Publish"
    new_models = """model StepEvidence {
  id              String   @id @default(cuid())
  segmentId       String
  startTime       Int
  endTime         Int
  screenshotKey   String?
  targetIdentity  Json?
  actionType      String
  transcriptRange Json?
  confidence      Float
  segment         Segment  @relation(fields: [segmentId], references: [id])
}

model ProcessingJob {
  id          String    @id @default(cuid())
  type        String
  entityId    String
  status      JobStatus @default(QUEUED)
  progress    Int       @default(0)
  attempt     Int       @default(0)
  error       String?
  startedAt   DateTime  @default(now())
  completedAt DateTime?
}

model Share {
  id         String     @id @default(cuid())
  videoId    String
  token      String     @unique
  accessType AccessType @default(PUBLIC)
  expiresAt  DateTime?
  revokedAt  DateTime?
  createdAt  DateTime   @default(now())
  video      Video      @relation(fields: [videoId], references: [id])
}

model AnalyticsEvent {
  id                String   @id @default(cuid())
  videoId           String
  versionId         String?
  eventType         String
  sessionId         String?
  anonymousViewerId String?
  metadata          Json?
  timestamp         DateTime @default(now())
}

"""
    content = content.replace('model Publish {', new_models + 'model Publish {')

    # Remove ViewEvent
    old_view_event = """model ViewEvent {
  id         String   @id @default(cuid())
  videoId    String
  versionId  String
  viewerHash String?  // anonymized
  watchedMs  Int?
  createdAt  DateTime @default(now())
}"""
    content = content.replace(old_view_event + '\n\n', '')
    content = content.replace(old_view_event + '\n', '')
    content = content.replace(old_view_event, '')

    # 8. Update SessionStatus Enum
    old_session_status = """enum SessionStatus { 
  RECORDING 
  PAUSED 
  STOPPED 
  UPLOADED 
  FAILED 
}"""
    new_session_status = """enum SessionStatus {
  CREATED
  RECORDING
  STOPPING
  UPLOADING
  UPLOADED
  PROCESSING
  READY
  FAILED
  CANCELLED
}"""
    content = content.replace(old_session_status, new_session_status)

    # 9. Add AccessType Enum
    new_access_type = """enum AccessType {
  PUBLIC
  PASSWORD
  WORKSPACE_ONLY
  EXPIRING
}
"""
    content = content + '\n' + new_access_type

    with open('packages/db/schema.prisma', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    update_schema()
    print("Schema updated successfully")

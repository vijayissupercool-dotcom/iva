# LVA Data Model

## Core Entities & The Step/Version Split

LVA's core value proposition revolves around treating screen-recorded videos not as single binary files, but as structured sequences of semantic steps that evolve over time. This means the database schema explicitly separates "logical steps" from "step media content."

### 1. `Segment` (Logical Step)
- Represents the **persistent identity** of a step across all versions of a video.
- Key properties: `stableKey`, `ordinal`, `title`.
- **Why this exists:** When a user replaces the recording for step 4, the system needs a way to know that it is still conceptually "step 4", even though its media asset and text have completely changed.

### 2. `SegmentVersion` (Step Media)
- Represents a **specific piece of media** associated with a logical step at a specific version.
- Key properties: `videoAssetId`, `startMs`, `endMs`, `transcript`, `selectorSignature`.
- **Why this exists:** Versions in LVA are immutable. If `video_version: 5` is published, its `step_versions` can never be edited. If a step changes, a new `step_version` is created and associated with `video_version: 6`.

### 3. `Video` and `VideoVersion`
- **Video:** The root entity for a project's recording. Contains a `publishedVersionId` pointer to the currently live version, and a unique `slug` for the public viewer.
- **VideoVersion:** An immutable snapshot of the video. Contains an array of `SegmentVersion` records. The render pipeline composes a `VideoVersion` into a single `renderedAssetId`.

### 4. `RecordingSession` and `CaptureEvent`
- When the extension records, it creates a `RecordingSession` with `SessionStatus` (e.g., `UPLOADING`, `PROCESSING`).
- `CaptureEvent` tracks deterministic user interactions (clicks, typing, scrolling) during a session. They store `url`, `targetIdentity` (DOM path, role), `viewport`, and `coordinates`.

### 5. `ChangeDetection` and `StepEvidence`
- **ChangeDetection:** Records deterministic drift between what was recorded (`oldEvidence`) and the current live UI (`newEvidence`). Provides a `confidence` score and `recommendedAction`.
- **StepEvidence:** Snapshots the state of a step for comparison. Includes `transcriptRange`, `screenshotKey`, and `targetIdentity`.

### 6. `ProcessingJob`
- State representation of async BullMQ tasks (transcription, keyframe extraction, rendering).

### 7. `Share` and `AnalyticsEvent`
- **Share:** Manages public and protected access to published videos via unique `token`s.
- **AnalyticsEvent:** Centralized tracking for engagement, views, and step-replacements across the workspace.

## Immutable Version Lifecycle
1. **DRAFT:** New segments are recorded and assembled.
2. **READY_FOR_REVIEW:** AI processing complete, pending human approval.
3. **APPROVED:** User accepts the timeline.
4. **RENDERING:** Remotion/FFmpeg composes the MP4.
5. **PUBLISHED:** The `Video.publishedVersionId` is updated. This version is now locked.
6. **(New Draft):** A new draft version is cloned from the published version, allowing selective recapture of drifted steps.

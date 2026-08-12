-- Enable RLS on core tables
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Video" ENABLE ROW LEVEL SECURITY;

-- Create helper function
CREATE OR REPLACE FUNCTION public.user_has_workspace_access(workspace_id text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "WorkspaceMember"
    WHERE "workspaceId" = workspace_id
      AND "userId" = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workspace Policies
CREATE POLICY "Users can view workspaces they belong to"
ON "Workspace" FOR SELECT
USING (public.user_has_workspace_access(id));

CREATE POLICY "Users can create workspaces"
ON "Workspace" FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update workspaces they own"
ON "Workspace" FOR UPDATE
USING (public.user_has_workspace_access(id));

-- WorkspaceMember Policies
CREATE POLICY "Users can view members of their workspaces"
ON "WorkspaceMember" FOR SELECT
USING (public.user_has_workspace_access("workspaceId"));

CREATE POLICY "Users can insert themselves as members"
ON "WorkspaceMember" FOR INSERT
WITH CHECK ("userId" = auth.uid()::text);

-- Project Policies
CREATE POLICY "Users can access Projects in their workspace"
ON "Project" FOR ALL 
USING (public.user_has_workspace_access("workspaceId"));

-- Video Policies
CREATE POLICY "Users can access Videos in their workspace"
ON "Video" FOR ALL 
USING (public.user_has_workspace_access("workspaceId"));

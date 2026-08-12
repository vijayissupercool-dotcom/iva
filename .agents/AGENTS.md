
- **Prisma Migrations**: Never auto-confirm destructive-migration prompts with a script. If Prisma warns about data loss (e.g. dropping columns or enum values), stop execution and present the warning to the user for explicit approval, even in local development environments.

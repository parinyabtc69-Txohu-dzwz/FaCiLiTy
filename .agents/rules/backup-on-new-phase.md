# Backup on New Phase

## Trigger
Whenever the user explicitly announces the start of a new "Phase" or "เฟส" (e.g., "เฟส 8", "เริ่มเฟสใหม่", "Phase 9").

## Action
BEFORE making any modifications to the codebase or planning the implementation, you MUST:
1. Create a full zip archive backup of the current project directory.
2. Save the zip file in the parent directory (outside the current workspace) to prevent nested backups.
3. Use a clear naming convention: `[ProjectName]_Backup_Phase[Number]_[YYYYMMDD_HHmm].zip`.
4. Inform the user that the backup has been successfully created before proceeding with the tasks for the new phase.

## Tools
Use the `run_command` tool with PowerShell's `Compress-Archive` to create the zip file.

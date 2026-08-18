# Not-found database coverage — `sfp-057`

| Source phrase | Step / category | Likely category | Nearest existing entities | Why insufficient | Gap kind |
| --- | --- | --- | --- | --- | --- |
| inspect or update RAID controller firmware | 4 / Hypothesize | Test or Repair Procedure | `test.firmware.settings_review`, `repair.firmware.restore_settings` | Settings review and restoration do not inspect a controller firmware version, compare release notes, or apply a firmware update. The source discusses this alternative but does not establish it as the cause. | missing object |
| attach the ADU diagnostic report to the support record | 6 / Document | `cardless_action` | `tool.storage.raid_console`, `test.storage.drive_health` | Existing objects can produce evidence but do not represent publishing the action and attached report to a Worklog or ticket. | mechanic |
| make a full backup, rebuild the server from scratch, and restore data | 9 / Repair | Repair Procedure or Protocol | `repair.storage.rebuild_array`, `verify.storage.raid_healthy` | Array reconstruction is not the same as system backup/restore and disaster recovery after an unrecoverable rebuild. | missing object |
| verify restored server but no explicit healthy RAID state | 10 / Verify | Validation Procedure | `verify.storage.raid_healthy`, `verify.boot.normal_boot` | Service restoration is reported, but neither array health nor normal boot evidence is preserved. This is a source-evidence gap, not proof that another validation object is needed. | educational detail |

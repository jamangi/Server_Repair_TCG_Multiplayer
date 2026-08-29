# Not-found database coverage — `exp-006`

These platform-specific details from [GA-7PESH2 BMC Recovery](https://forums.serverbuilds.net/t/ga-7pesh2-bmc-recovery/882) do not justify duplicate domain objects.

| Source phrase | Lifecycle step | Classification | Nearest existing entities | Why no direct match / disposition |
| --- | --- | --- | --- | --- |
| GA-7PESH2 board model | Observe | `educational_detail` | `component.board.system`, `component.management.bmc` | The platform identifies compatibility/provenance; the generic board and BMC boundaries already exist. |
| AST-family controller designation | Observe | `alias` | `component.management.bmc` | It is a chipset implementation of the existing BMC Component. |
| vendor recovery executable, flags, and image filename | Repair | `alias` | `repair.management.recover_bmc_firmware`, `tool.diagnostics.bootable_media` | The executable performs the platform-specific Repair; it is not automatically a Diagnostic Command or a reusable generic object. |
| UART console interaction | Test | `not_found` | `test.management.bmc_recovery_state`, `tool.management.bmc_console` | The interface exposes the recoverable state, but no current stable Tool or Command exactly represents UART access. Keep it as source/Ticket detail pending later applicability review, not a new TASK-041 object. |
| TFTP image-transfer invocation | Repair | `not_found` | `repair.management.recover_bmc_firmware`, `protocol.service.firmware_change_control` | It transports the replacement image during Repair and is not diagnostic proof. Do not promote a transport invocation into a Command. |
| exact firmware package version | Repair / Verify | `educational_detail` | `repair.management.recover_bmc_firmware`, `verify.management.bmc_functional` | Preserve it as source/Ticket provenance, not a universal version target. |
| community post preserves the recovery path and successful result | Document | `educational_detail` | Frozen Document/Worklog behavior (no domain entity) | The source contains an explicit record, but it does not justify a new domain object or change Documentation semantics. |

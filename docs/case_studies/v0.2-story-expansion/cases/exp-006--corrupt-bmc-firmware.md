# `exp-006` — Corrupt BMC firmware

## Research boundary

This is a source-preserving TASK-041 reduction. It supports later review of a distinct episode but does not authorize domain, gameplay, Story content, or execution of the source procedure.

## Source and eligibility

- **Primary source:** [GA-7PESH2 BMC Recovery](https://forums.serverbuilds.net/t/ga-7pesh2-bmc-recovery/882)
- **Firsthand author / publisher:** `Johannes`; serverbuilds.net Forums
- **Published / access:** 2019-07-16; accessed 2026-08-28
- **Eligibility:** Eligible. The author reports a failed update with power loss, retained bootloader access, image transfer and integrity/platform checks, flashing, a method that worked with reset/normal-start as its acceptance boundary, and an intentional written recovery record.
- **Lifecycle score:** 10/10.

## Copyright-safe paraphrase

The GA-7PESH2 lost power during a BMC firmware update and became unresponsive apart from the controller indicator. The author used the board's controller-specific serial recovery path to reach its bootloader, transferred the matching firmware image over an isolated network service, and required the bootloader's integrity and platform checks to pass before flashing. The author describes this as the method that worked and defines reset followed by normal BMC/board startup as the acceptance boundary, then records the experience for others.

This reduction deliberately omits raw commands, addresses, pin mappings, electrical details, and flash offsets. They are dangerous and board-specific, and the research record is not a repair guide.

## Lifecycle reduction

| # | Category | Atomic source event | Lifecycle contribution | Fidelity | Source locator | Current stable-object cross-reference |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | Power was lost during a BMC update; afterward the board was otherwise unresponsive while the BMC indicator remained lit. | Establishes a firmware-interruption event and loss of management/board function. | explicit | Opening paragraphs | `symptom.firmware.update_failed`; `symptom.management.bmc_not_responding`; `component.management.bmc` |
| 2 | Hypothesize | The author treated the failed update as a corrupt BMC firmware state that might still be recoverable through the controller bootloader. | Distinguishes corrupt application firmware from a completely unreachable controller or an unrelated board fault. | explicit | Opening framing and recovery setup | `fault.management.bmc_firmware.corrupt` |
| 3 | Test | The board-specific serial connection reached the BMC bootloader and produced console output. | Shows that a recovery-capable controller layer remains alive. | explicit | Recovery narrative before image transfer | `test.management.bmc_recovery_state` as the closest current Test; UART has no current stable object |
| 4 | Test | The matching firmware image transferred into volatile memory over the isolated recovery network. | Shows that the bootloader and recovery network path can receive an image without yet writing flash. | explicit | Recovery narrative, transfer stage | Generic recovery-state evidence; TFTP has no current stable Command |
| 5 | Test | Image-header, platform-identity, kernel, filesystem, and bootloader integrity checks passed before writing. | Distinguishes a valid matching image from a corrupt transfer or wrong-platform image. | explicit | Recovery narrative, validation stage | `test.management.bmc_recovery_state`; no exact current checksum/platform-check action |
| 6 | Isolate | A recoverable BMC flash-corruption state is concluded from the failed-update timing, live bootloader, valid transferred image, and later successful reflash. | Crosses from a dead-board appearance to the embedded-controller firmware path through synthesis of the reported evidence. | inferred | Opening and pre-flash test sequence | `fault.management.bmc_firmware.corrupt` |
| 7 | Repair | The validated board-specific image was written through the recovery environment. | Changes the isolated firmware state. | explicit | Recovery narrative, flash stage | `repair.management.recover_bmc_firmware` as a generic equivalent only |
| 8 | Verify | The author reports that the recovery method worked and gives reset followed by normal BMC/board startup as its acceptance boundary. | Supports functional recovery at the level reported, without claiming an independently documented login, inventory, sensor check, or persistence test. | explicit | Opening success statement and closing acceptance statement | `verify.management.bmc_functional` as the closest current validation |
| 9 | Document | The author deliberately wrote down the successful experience as a recovery guide. | Preserves the explanation for later operators, while remaining non-authoritative community material. | explicit | Opening sentence and completed initiating post | No current gameplay/document action is authorized by this research row |

## Uncertainties, rejected sources, and safety boundary

- This is firsthand community evidence, not a Gigabyte service bulletin. Similar-looking boards can use different controllers, voltage levels, headers, flash banks, images, and recovery protections.
- The initiating post says the method worked, but its detailed reset/normal-start wording is an acceptance statement rather than a preserved post-repair transcript. No independent BMC access or full board inventory test is recorded.
- Later replies include unsuccessful and partially successful adaptations on other boards, demonstrating that the procedure must not be generalized.
- **Rejected as primary:** [Dell R720xd motherboard initialization error](https://www.dell.com/community/en/conversations/rack-servers/720xd-motherboard-initialization-error-fix-or-replace/64d7d8a1e76b0831726869a4). It reports board replacement but no post-repair BMC or system validation.
- **Alternate:** [Dell C6100 / XS23-TY BMC recovery procedure](https://www.dell.com/community/en/conversations/poweredge-hardware-general/pe-c6100-xs23-ty-bmc-not-alivenot-present-recovery-procedure/647f5c4af4ccf8a8de73f10b). It supplies a plausible recovery mechanism but less explicit firsthand execution and before/after verification in its initiating post.
- Bootloader-level flashing can permanently destroy firmware, board identity, configuration, or hardware. Only a platform-authorized procedure, exact validated image, correct electrical interface, protected power, configuration backup, recovery/replacement plan, and qualified operator are within the safety boundary. Do not derive an executable procedure from this reduction.

## Distinct-episode value

The case can support an episode where “dead board” is not yet the final diagnosis: the player must distinguish a live recovery layer, validate the image and platform before state change, then verify management functionality after recovery. It does not authorize exposing raw recovery commands, adding UART/TFTP Cards, or making low-level flashing a routine action.

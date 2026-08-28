# UI sound-effect source review

Status: **planning input only; source audio remains local and excluded from Git**

Reviewed: **2026-08-28**

## Source package

- Package: `JDSherbert - Sci Fi UI SFX Pack (FREE)`
- Creator and copyright holder: **JDSherbert / Josh Herbert**
- Creator page named by the license: <https://jdsherbert.itch.io>
- Local source location: `sound_effects/JDSherbert - Sci Fi UI SFX Pack (FREE)/`
- Supplied license: `LICENSE.pdf`, SHA-256 `C2A6E7CC4304BA2BDBA4A4D6F93AE9F3C664B0D794FC3D2D374527AF73821A9F`
- Package inventory: 151 files and 32,373,226 bytes: one license plus 150 audio files.

The 150 audio files are fifteen unique effects duplicated across mono and stereo, with `m4a`, `mp3`, `ogg`, HD WAV, and SD WAV encodings for each channel layout. The user prefers the stereo sources for listening and any future authorized delivery conversion. A production integration should never ship all duplicate encodings.

## Unique effect inventory

| Semantic family | Supplied variants | Count | Initial planning posture |
| --- | --- | ---: | --- |
| Cancel | `Cancel - 1`, `Cancel - 2` | 2 | Pending-decision cancellation or deliberate abandonment; distinct from neutral dialog dismissal. |
| Cursor | `Cursor - 1` through `Cursor - 4` | 4 | Eligible pointer-hover or keyboard-focus transitions after audio is unlocked; never continuous pointer movement. |
| Error | `Error - 1`, `Error - 2` | 2 | Rejected actions and validation failures after visible/accessible feedback. These two sounds were omitted from the initial user count but are present in the pack. |
| Glitching | `Glitching (Loop) - 1` | 1 | Excluded by default. It is long and abrasive; any later use requires a reviewed, short, low-gain non-looping edit and an explicit catalogue entry. |
| Popup Close | `Popup Close - 1` | 1 | Neutral dialog, drawer, history, or inspector dismissal. |
| Popup Open | `Popup Open - 1` | 1 | Dialog, drawer, history, or inspector opening. |
| Select | `Select - 1`, `Select - 2` | 2 | Successful selection or activation. A higher-priority result cue, such as Popup Open, should prevent a second Select cue for the same gesture. |
| Swipe | `Swipe - 1`, `Swipe - 2` | 2 | Only an actual spatial page, carousel, tray, or scene transition approved by the catalogue; not every Previous/Next button. |
| **Total** |  | **15** |  |

## License findings

The supplied license permits free or commercial project use, editing/remixing, distribution of a finished project containing the assets, and royalty-free use. It also:

- requires visible credit to JDSherbert in project credits, description, or README;
- forbids reselling, redistributing, or sharing the raw files, including modified raw files;
- forbids placing the assets in a pack, template, or tool from which others can obtain them directly;
- forbids claiming the sounds as original project creations;
- forbids AI-model or dataset training without written permission; and
- retains copyright with the creator and supplies the assets without warranty.

## Repository and deployment consequence

Do **not** commit the supplied `sound_effects/` directory or any selected/converted sound from it under the current evidence. This project is both a public source repository and a static GitHub Pages application: repository assets and browser-delivered audio are directly retrievable, so the license's finished-project permission should not be assumed to override its raw-file redistribution prohibition.

TASK-031 may inspect, measure, and audition the local sources to create planning metadata. TASK-032 may integrate audible assets only after one of these gates is satisfied:

1. written permission from the copyright holder explicitly allowing the selected effects to be stored in this public repository and delivered as directly retrievable static web assets; or
2. replacement sounds governed by terms that explicitly permit public repository inclusion and static-web redistribution.

If the JDSherbert pack is cleared, preserve the permission and license record, ship only the curated delivery encodings, and add visible credit in both the root README and the application's Settings/Credits surface. Recommended credit from the supplied license: `Sounds by JDSherbert — https://jdsherbert.itch.io`.

This is a repository planning and provenance record, not legal advice.


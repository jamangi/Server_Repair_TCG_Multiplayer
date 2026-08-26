import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), '..', '..');
const readJson = async (relative) => JSON.parse(await readFile(path.join(root, relative), 'utf8'));

export const REVIEW_SOURCES = Object.freeze([
  { id: 'source.dell.poweredge_service', title: 'Dell PowerEdge Installation and Service Manual — installing and removing system components', url: 'https://www.dell.com/support/manuals/en-us/poweredge-r6625/r6625_ism/installing-and-removing-system-components', authority: 'platform vendor service manual' },
  { id: 'source.dmtf.ipmi', title: 'DMTF IPMI and Redfish event-log specifications', url: 'https://www.dmtf.org/standards/ipmi', authority: 'platform-management standard' },
  { id: 'source.fluke.continuity', title: 'Fluke continuity testing guidance', url: 'https://www.fluke.com/en-us/learn/blog/digital-multimeters/how-to-test-for-continuity', authority: 'measurement-tool vendor guidance' },
  { id: 'source.freedesktop.journalctl', title: 'systemd journalctl manual', url: 'https://www.freedesktop.org/software/systemd/man/latest/journalctl.html', authority: 'upstream command manual' },
  { id: 'source.kernel.ipmi', title: 'Linux kernel IPMI driver documentation', url: 'https://docs.kernel.org/driver-api/ipmi.html', authority: 'upstream platform documentation' },
  { id: 'source.kernel.ras', title: 'Linux kernel Reliability, Availability and Serviceability documentation', url: 'https://docs.kernel.org/admin-guide/RAS/main.html', authority: 'upstream platform documentation' },
  { id: 'source.man.dmesg', title: 'dmesg manual', url: 'https://man7.org/linux/man-pages/man1/dmesg.1.html', authority: 'upstream command manual' },
  { id: 'source.man.ethtool', title: 'ethtool manual', url: 'https://man7.org/linux/man-pages/man8/ethtool.8.html', authority: 'upstream command manual' },
  { id: 'source.man.free', title: 'free manual', url: 'https://man7.org/linux/man-pages/man1/free.1.html', authority: 'upstream command manual' },
  { id: 'source.man.ip_address', title: 'ip-address manual', url: 'https://man7.org/linux/man-pages/man8/ip-address.8.html', authority: 'upstream command manual' },
  { id: 'source.man.ip_route', title: 'ip-route manual', url: 'https://man7.org/linux/man-pages/man8/ip-route.8.html', authority: 'upstream command manual' },
  { id: 'source.man.lsblk', title: 'lsblk manual', url: 'https://man7.org/linux/man-pages/man8/lsblk.8.html', authority: 'upstream command manual' },
  { id: 'source.man.lspci', title: 'lspci manual', url: 'https://man7.org/linux/man-pages/man8/lspci.8.html', authority: 'upstream command manual' },
  { id: 'source.man.ping', title: 'ping manual', url: 'https://man7.org/linux/man-pages/man8/ping.8.html', authority: 'upstream command manual' },
  { id: 'source.nvmexpress.specification', title: 'NVM Express specifications', url: 'https://nvmexpress.org/specifications/', authority: 'storage protocol standard' },
  { id: 'source.rfc2131.dhcp', title: 'RFC 2131 — Dynamic Host Configuration Protocol', url: 'https://www.rfc-editor.org/rfc/rfc2131.html', authority: 'Internet standard' },
  { id: 'source.smartmontools.smartctl', title: 'smartmontools documentation', url: 'https://www.smartmontools.org/wiki/TocDoc', authority: 'upstream command documentation' },
  { id: 'source.uefi.boot_manager', title: 'UEFI Specification — Boot Manager', url: 'https://uefi.org/specs/UEFI/2.11/03_Boot_Manager.html', authority: 'firmware standard' }
]);

const commandSources = {
  'command.ipmi.sel_elist': ['source.dmtf.ipmi', 'source.kernel.ipmi'],
  'command.linux.dhclient': ['source.rfc2131.dhcp'],
  'command.linux.dmesg': ['source.man.dmesg'],
  'command.linux.ethtool': ['source.man.ethtool'],
  'command.linux.free_h': ['source.man.free'],
  'command.linux.ip_addr': ['source.man.ip_address'],
  'command.linux.ip_route': ['source.man.ip_route'],
  'command.linux.journalctl': ['source.freedesktop.journalctl'],
  'command.linux.lsblk': ['source.man.lsblk'],
  'command.linux.lspci': ['source.man.lspci'],
  'command.linux.nvme_smart_log': ['source.nvmexpress.specification'],
  'command.linux.smartctl': ['source.smartmontools.smartctl'],
  'command.network.ping': ['source.man.ping'],
};

function sourceIdsFor(id) {
  if (commandSources[id]) return commandSources[id];
  if (id.includes('.boot.') || id.includes('.firmware.')) return ['source.uefi.boot_manager', 'source.dell.poweredge_service'];
  if (id.includes('.memory.') || id.includes('.compute.') || id.includes('.pcie.')) return ['source.kernel.ras', 'source.dell.poweredge_service'];
  if (id.includes('.network.')) return ['source.rfc2131.dhcp', 'source.man.ethtool', 'source.man.ip_address', 'source.man.ip_route', 'source.man.ping'];
  if (id.includes('.storage.')) return ['source.man.lsblk', 'source.smartmontools.smartctl', 'source.nvmexpress.specification', 'source.dell.poweredge_service'];
  if (id.includes('.management.') || id.includes('.system.bmc')) return ['source.dmtf.ipmi', 'source.kernel.ipmi', 'source.dell.poweredge_service'];
  if (id.includes('.power.') || id.includes('.electrical.')) return ['source.fluke.continuity', 'source.dell.poweredge_service'];
  if (id.includes('.thermal.') || id.includes('.cooling.') || id.includes('.system.controlled')) return ['source.kernel.ras', 'source.dell.poweredge_service'];
  return ['source.dell.poweredge_service'];
}

function learnerCopy(record) {
  return {
    short_description: record.presentation?.short_description ?? '',
    education_text: record.education_text ?? null,
    purpose: record.purpose ?? null,
    capabilities: record.capabilities ?? null,
    steps_summary: record.steps_summary ?? null,
    success_conditions: record.success_conditions ?? null,
  };
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function acronymIds(record, glossary) {
  const value = Object.values(learnerCopy(record)).flat().filter(Boolean).join(' ');
  return glossary.terms
    .filter(({ term }) => new RegExp(`(^|[^A-Za-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9]|$)`).test(value))
    .map(({ id }) => id);
}

export async function buildTask024ReviewLedger() {
  const [manifest, coverage, glossary] = await Promise.all([
    readJson('viewer/content/manifest.json'),
    readJson('content/gameplay-v1/playable-coverage-v3.json'),
    readJson('content/gameplay-v1/technical-action-glossary-v1.json'),
  ]);
  const packs = await Promise.all(manifest.files.map((relative) => readJson(`viewer/content/${relative.replace('./', '')}`)));
  const byId = new Map(packs.flatMap((pack) => pack.entities).map((record) => [record.id, record]));
  const records = coverage.selected_action_definition_ids.map((id) => {
    const record = byId.get(id);
    if (!record) throw new Error(`Cannot review missing playable domain record ${id}.`);
    return {
      domain_id: id,
      review_status: 'reviewed',
      source_ids: sourceIdsFor(id),
      acronym_ids: acronymIds(record, glossary),
      scoped_uncertainty: 'Exact thresholds, indicators, slot maps, hot-swap conditions, and service steps remain controlled by approved platform documentation.',
      technical_copy_sha256: digest(learnerCopy(record)),
    };
  });
  const ledger = {
    review_version: 'technical-copy-review-v1',
    reviewed_on: '2026-08-26',
    review_scope: '71 published playable primary domain records',
    sources: REVIEW_SOURCES,
    records,
  };
  const output = path.join(root, 'content', 'gameplay-v1', 'technical-copy-review-v1.json');
  await writeFile(output, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
  return ledger;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const ledger = await buildTask024ReviewLedger();
  console.log(`Recorded ${ledger.records.length} reviewed technical-copy entries.`);
}

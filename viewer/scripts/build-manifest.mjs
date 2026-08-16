import{readdir,writeFile}from'node:fs/promises';
import{fileURLToPath}from'node:url';
import{dirname,join}from'node:path';
const scriptDirectory=dirname(fileURLToPath(import.meta.url));
const contentDirectory=join(scriptDirectory,'..','content');
const files=(await readdir(contentDirectory)).filter(x=>x.endsWith('.json')&&x!=='manifest.json').sort().map(x=>'./'+x);
await writeFile(join(contentDirectory,'manifest.json'),JSON.stringify({format_version:1,generated_at:new Date().toISOString(),files},null,2)+'\n');
console.log(`Manifest contains ${files.length} pack(s).`);

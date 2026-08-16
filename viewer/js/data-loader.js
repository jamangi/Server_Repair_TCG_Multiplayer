export async function loadAllContent(){
  const r=await fetch('./content/manifest.json',{cache:'no-cache'}); if(!r.ok) throw new Error(`manifest ${r.status}`);
  const manifest=await r.json(); const base=new URL('./content/',location.href);
  const packs=await Promise.all((manifest.files||[]).map(async file=>{const x=await fetch(new URL(file,base));if(!x.ok)throw new Error(`${file} ${x.status}`);return x.json()}));
  const records=packs.flatMap(p=>(p.entities||[]).map(e=>({...e,_pack_id:p.pack_id,_pack_name:p.name||p.pack_id})));
  return {manifest,packs,records};
}

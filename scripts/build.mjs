import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url);const assets={};
async function collect(dir,prefix=''){for(const entry of await readdir(new URL(dir,root),{withFileTypes:true})){const path=prefix+'/'+entry.name;if(entry.isDirectory())await collect(dir+'/'+entry.name,path);else{const ext=entry.name.split('.').pop();const type={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',svg:'image/svg+xml',xml:'application/xml',txt:'text/plain; charset=utf-8'}[ext]||'application/octet-stream';assets[path]={body:await readFile(new URL(dir+'/'+entry.name,root),'utf8'),type};}}}
await collect('web');
const core=(await readFile(new URL('web/assets/core.js',root),'utf8')).replace(/\bexport (?=(?:function|const)\b)/g,'');
const worker=(await readFile(new URL('worker/index.js',root),'utf8')).replace(/^import .*?;\n/m,'');
await rm(new URL('dist',root),{recursive:true,force:true});await mkdir(new URL('dist/server',root),{recursive:true});await mkdir(new URL('dist/.openai',root),{recursive:true});
await writeFile(new URL('dist/server/index.js',root),`const ASSETS=${JSON.stringify(assets)};\n${core}\n${worker}`);
await writeFile(new URL('dist/.openai/hosting.json',root),await readFile(new URL('.openai/hosting.json',root)));
console.log(`Built Worker with ${Object.keys(assets).length} embedded assets; no production dependencies.`);

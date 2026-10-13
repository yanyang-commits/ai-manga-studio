// Served only behind Sites dispatch, which validates and supplies visitor identity.
import {normalizeProject} from '../web/assets/core.js';
const MAX_BODY=8*1024*1024;
const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const failure=(status,code,message)=>response({error:{code,message}},status);
async function identity(request){
 const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
 if(!id||!email)return null;
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));
 let name=request.headers.get('oai-authenticated-user-full-name')||'';
 if(request.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8')try{name=decodeURIComponent(name);}catch{name='';}
 return {id:Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join(''),name:name||email,email,provider:'chatgpt'};
}
async function readJSON(request){
 if(Number(request.headers.get('content-length')||0)>MAX_BODY)throw new Error('BODY_TOO_LARGE');
 const reader=request.body?.getReader();if(!reader)throw new Error('INVALID_JSON');const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BODY){await reader.cancel();throw new Error('BODY_TOO_LARGE');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export function validateCloudProjects(input){
 if(!Array.isArray(input)||input.length>30)throw new Error('项目列表最多包含 30 个项目');
 const ids=new Set();return input.map(raw=>{if(typeof raw?.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(raw.id)||ids.has(raw.id))throw new Error('项目标识无效或重复');ids.add(raw.id);const p=normalizeProject(raw);p.id=raw.id;p.updatedAt=new Date().toISOString();p.shots=p.shots.map((s,i)=>({...s,id:typeof raw.shots?.[i]?.id==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(raw.shots[i].id)?raw.shots[i].id:s.id}));return p;});
}
export async function handleAPI(request,env){
 const url=new URL(request.url),user=await identity(request);
 if(url.pathname==='/api/session'&&request.method==='GET')return response({user,cloudAvailable:!!env.BUCKET,providers:[{id:'chatgpt',name:'ChatGPT',enabled:true,url:'/signin-with-chatgpt?return_to=%2Fstudio.html%3Fspace%3Dcloud'},{id:'google',name:'Google',enabled:false,reason:'独立 Google 登录尚未配置'},{id:'apple',name:'Apple',enabled:false,reason:'独立 Apple 登录尚未配置'}],ai:{remote:false,local:true}});
 if(url.pathname==='/api/health'&&request.method==='GET')return response({status:'ok',version:'0.2.0',cloudBinding:!!env.BUCKET});
 if(url.pathname==='/api/ai')return failure(503,'AI_NOT_CONFIGURED','模型服务尚未配置；请使用本地创意联想或复制提示词到外部工具。');
 if(url.pathname!=='/api/projects')return failure(404,'NOT_FOUND','接口不存在');
 if(!user)return failure(401,'SIGN_IN_REQUIRED','登录后才可访问云端项目，游客可使用本地工作区。');
 if(!env.BUCKET)return failure(503,'CLOUD_UNAVAILABLE','云端存储暂不可用，请保留草稿并导出备份。');
 const key=`projects/${user.id}/workspace.json`;
 if(request.method==='GET'){const file=await env.BUCKET.get(key);if(!file)return response({projects:[],revision:null});return response({projects:JSON.parse(await file.text()).projects,revision:file.etag});}
 if(request.method!=='PUT')return failure(405,'METHOD_NOT_ALLOWED','不支持此请求方法');
 if(request.headers.get('Origin')!==url.origin||!request.headers.get('content-type')?.startsWith('application/json'))return failure(403,'INVALID_ORIGIN','请求来源无效');
 try{
  const input=await readJSON(request),projects=validateCloudProjects(input.projects);
  if(input.revision!==null&&!(typeof input.revision==='string'&&/^[a-zA-Z0-9-]{1,128}$/.test(input.revision)))return failure(400,'INVALID_REVISION','必须提供读取时的版本号');
  const onlyIf=input.revision===null?{etagDoesNotMatch:'*'}:{etagMatches:input.revision};
  const saved=await env.BUCKET.put(key,JSON.stringify({schemaVersion:1,projects,updatedAt:new Date().toISOString()}),{onlyIf,httpMetadata:{contentType:'application/json'}});
  if(!saved)return failure(409,'VERSION_CONFLICT','云端已有新版本。请先导出当前草稿，再重新读取云端数据。');
  return response({revision:saved.etag,updatedAt:new Date().toISOString()});
 }catch(error){if(error.message==='BODY_TOO_LARGE')return failure(413,'BODY_TOO_LARGE','云端项目总大小不能超过 8MB');if(error instanceof SyntaxError)return failure(400,'INVALID_JSON','JSON 格式错误');if(error.message.includes('项目')||error.message.includes('schemaVersion'))return failure(400,'INVALID_PROJECT',error.message);throw error;}
}
export default {async fetch(request,env){
 try{
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/'))return await handleAPI(request,env);
  // Sites dispatch owns /signin-with-chatgpt, /signout-with-chatgpt and /callback.
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  let path=decodeURIComponent(url.pathname);if(path==='/')path='/index.html';
  if(!path.includes('.')&&ASSETS[path+'.html'])path+='.html';
  const asset=ASSETS[path],fallback=ASSETS['/404.html'];const selected=asset||fallback;
  return new Response(request.method==='HEAD'?null:selected.body,{status:asset?200:404,headers:{'Content-Type':selected.type,'Cache-Control':path.endsWith('.html')?'no-cache':'public, max-age=300','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
 }catch{return failure(500,'SERVER_ERROR','服务暂时不可用，请稍后重试。');}
}};

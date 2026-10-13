import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAPI} from '../worker/index.js';
import {newProject} from '../web/assets/core.js';
import {PROMPTS} from '../web/assets/catalog.js';
import {associate} from '../web/assets/assist.js';
class Bucket {
 files=new Map(); counter=0;
 async get(k){const f=this.files.get(k);return f?{etag:f.etag,text:async()=>f.body}:null;}
 async put(k,body,{onlyIf}){const old=this.files.get(k);if(onlyIf.etagDoesNotMatch==='*'&&old||onlyIf.etagMatches&&old?.etag!==onlyIf.etagMatches)return null;const f={body,etag:String(++this.counter)};this.files.set(k,f);return f;}
}
const req=(user,body,origin='https://test.example')=>new Request('https://test.example/api/projects',{method:body?'PUT':'GET',headers:{...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':`${user}@example.test`}:{}),...(body?{'Content-Type':'application/json',Origin:origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
test('cloud requires identity and isolates accounts; stale updates rejected',async()=>{
 const env={BUCKET:new Bucket()};assert.equal((await handleAPI(req(),env)).status,401);
 const p=newProject();let r=await handleAPI(req('a',{projects:[p],revision:null}),env);assert.equal(r.status,200);const {revision}=await r.json();
 assert.equal((await (await handleAPI(req('b'),env)).json()).projects.length,0);
 assert.equal((await (await handleAPI(req('a'),env)).json()).projects[0].id,p.id);
 assert.equal((await handleAPI(req('a',{projects:[],revision:null}),env)).status,409);
 assert.equal((await handleAPI(req('a',{projects:[],revision},'https://evil.example'),env)).status,403);
 assert.equal((await handleAPI(req('a',{projects:[{...p,id:'../b'}],revision}),env)).status,400);
 assert.equal((await handleAPI(req('a',{projects:[],revision}),env)).status,200);
 assert.equal((await handleAPI(req('a',{projects:[p],revision}),env)).status,409);
});
test('48 prompts cover every stage; associative variants change all stages',()=>{
 assert.equal(PROMPTS.length,48);assert.equal(new Set(PROMPTS.map(p=>p.id)).size,48);
 for(const stage of ['brief','script','characters','shots','production','delivery'])assert.notDeepEqual(associate(newProject(),stage,0),associate(newProject(),stage,1));
});

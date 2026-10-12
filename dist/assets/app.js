import {STAGES,CHECKS,TEMPLATES,newProject,normalizeProject,exampleProject,buildPrompt,projectMarkdown,shotsCSV} from './core.js';
const $=s=>document.querySelector(s);
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=document.body.dataset.page;
let toastTimer;
function toast(message){$('#toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').textContent='',4500);}
const STORE='mangaflow.projects.v1', ACTIVE='mangaflow.active.v1';
let projects=[],currentId='',storageFailed=false,loadBlocked=false;
try {
  const raw=localStorage.getItem(STORE);
  if(raw){const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error('Invalid data');projects=parsed.slice(0,30).map(p=>{const clean=normalizeProject(p);if(typeof p.id==='string')clean.id=p.id;if(typeof p.updatedAt==='string')clean.updatedAt=p.updatedAt;return clean;});}
  currentId=localStorage.getItem(ACTIVE)||projects[0]?.id||'';
}catch{storageFailed=true;loadBlocked=true;toast('无法读取本地项目。为保护已有数据，本次只在内存中编辑，请导出备份。');}
const current=()=>projects.find(p=>p.id===currentId)||projects[0];
function persist(){
  if(loadBlocked){saveLabel('本次为临时编辑：无法读取原存储，请导出 JSON 备份。');return false;}
  try{localStorage.setItem(STORE,JSON.stringify(projects));localStorage.setItem(ACTIVE,currentId);storageFailed=false;saveLabel('已保存到本机 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}));return true;}
  catch{storageFailed=true;saveLabel('保存失败：浏览器容量不足或禁用存储。请立即导出 JSON。');toast('本地保存失败，请立即导出 JSON 备份。');return false;}
}
function saveLabel(message){if($('#save-status'))$('#save-status').textContent=message;}
function touch(){const p=current();if(p)p.updatedAt=new Date().toISOString();persist();}
function addProject(p){if(projects.length>=30){toast('已达到 30 个项目，请备份并删除不需要的项目。');return false;}projects.push(p);currentId=p.id;persist();return true;}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('已复制，可粘贴到你的 AI 工具。');}catch{const box=$('#prompt-output');if(box){box.focus();box.select();toast('请按 Ctrl/Cmd+C 复制已选中的提示词。');}else{toast('浏览器未允许复制，请在工作台生成后手动复制。');}}}
function download(content,ext,mime){const p=current();const filename=(p.name||'漫序项目').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,80);const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=filename+'.'+ext;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已发起下载，请保存备份文件。');}
function templateCard(t){return `<article class="template-card"><div class="template-top"><span class="pill">${t.short}</span><span class="number">${t.icon} / 06</span></div><h3>${t.title}</h3><p>${t.prompt}</p><div class="actions"><a class="text-link" href="studio.html?stage=${t.id}">在工作台使用 ↗</a><button class="btn small" data-copy-template="${t.id}">复制模板</button></div></article>`;}
if(page==='index'){
  $('#home-flow').innerHTML=STAGES.map(s=>`<a class="flow-card" href="studio.html?stage=${s.id}"><span class="number">${s.icon} /</span><h3>${s.name}</h3><p>${s.desc}</p><span class="arrow" aria-hidden="true">↗</span></a>`).join('');
  $('#home-templates').innerHTML=TEMPLATES.slice(1,4).map(templateCard).join('');
}
if(page==='templates'){
  let category='all';
  $('#template-filters').innerHTML=[{id:'all',short:'全部'},...STAGES].map(s=>`<button class="filter ${s.id==='all'?'active':''}" aria-pressed="${s.id==='all'}" data-filter="${s.id}">${s.short}</button>`).join('');
  function renderTemplates(){const q=$('#template-search').value.trim().toLowerCase();const result=TEMPLATES.filter(t=>(category==='all'||t.id===category)&&`${t.title}${t.prompt}${t.name}`.toLowerCase().includes(q));$('#template-list').innerHTML=result.map(templateCard).join('')||'<div class="empty no-results">没有找到匹配的模板。试试“分镜”“角色”或清空筛选。</div>';$('#template-count').textContent=`共 ${result.length} 个模板 · 可直接复制，也可带入项目上下文`;}
  $('#template-search').addEventListener('input',renderTemplates);
  $('#template-filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;category=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));});renderTemplates();});renderTemplates();
}
if(page==='workflow'){
  const inputs=['一句故事想法、目标受众与制作限制','已确认的企划、目标时长与核心冲突','剧本中的角色、场景与世界观','已确认的剧本与角色设定','分镜表、角色参考与素材命名规则','完成的画面、声音、字幕与封面素材'];
  const checks=['故事可用一句话说清；冲突明确；场景数量可控','对白能被演出来；每场推动故事；时长可实现','外貌与配色可重复；角色动机清晰；避免设定冲突','镜头可执行；总时长合理；空间与动作连续','每个镜头都有对应素材；人物一致；声画可同步','字幕无误；授权清楚；格式符合平台要求；留存备份'];
  $('#workflow-list').innerHTML=STAGES.map((s,i)=>`<section class="workflow-row"><span class="number">${s.icon}</span><div><h2>${s.name}</h2><p>${s.desc}</p><h3>从这些输入开始</h3><p>${inputs[i]}</p><a class="text-link" href="studio.html?stage=${s.id}">进入这个阶段 ↗</a></div><div><h3>本阶段产出</h3><p>${s.deliverable}</p><h3>进入下一步前，确认</h3><p>${checks[i]}</p></div></section>`).join('');
}
let stage=new URLSearchParams(location.search).get('stage')||'brief';if(!STAGES.some(s=>s.id===stage))stage='brief';
function field(label,key,value,{type='text',hint='',full=false,tall=false}={}){return `<label class="field ${full?'full':''}"><span>${label}</span>${type==='textarea'?`<textarea class="${tall?'tall':''}" data-field="${key}" maxlength="20000">${escape(value)}</textarea>`:`<input data-field="${key}" value="${escape(value)}" type="${type}" ${type==='number'?'min="15" max="600" step="1"':'maxlength="'+(key==='name'?100:200)+'"'}>`}${hint?`<span class="field-hint">${hint}</span>`:''}</label>`;}
function updateProjectBar(){const p=current();$('#project-select').innerHTML=projects.map(x=>`<option value="${escape(x.id)}" ${x.id===p.id?'selected':''}>${escape(x.name)}</option>`).join('');}
function updateProgress(){const p=current();$('#stage-nav').innerHTML=STAGES.map(s=>`<button class="stage-btn ${s.id===stage?'active':''}" data-stage="${s.id}" aria-current="${s.id===stage?'step':'false'}"><span>${s.icon}</span>${s.short}<span class="stage-status">${p.completed.includes(s.id)?'✓':'·'}</span></button>`).join('');$('#progress-fill').style.width=`${p.completed.length/6*100}%`;$('#progress-text').textContent=`已确认 ${p.completed.length} / 6 个阶段`;}
function renderShot(s,i){return `<article class="shot" data-shot="${escape(s.id)}"><div class="shot-top"><strong>SHOT ${String(i+1).padStart(2,'0')}</strong><div><button class="btn small" data-move="${escape(s.id)}" ${i===0?'disabled':''} aria-label="上移镜头 ${i+1}">↑</button> <button class="btn small danger" data-remove-shot="${escape(s.id)}" aria-label="删除镜头 ${i+1}">删除</button></div></div><div class="field-grid"><label class="field full">画面与动作<textarea data-shot-field="scene" maxlength="4000">${escape(s.scene)}</textarea></label><label class="field">景别 / 运镜<input data-shot-field="camera" maxlength="500" value="${escape(s.camera)}" placeholder="例如：近景 / 缓慢推进"></label><label class="field">时长（秒）<input data-shot-field="seconds" type="number" min="1" max="120" step="1" value="${s.seconds}"></label><label class="field full">对白 / 声音<textarea data-shot-field="dialogue" maxlength="2000">${escape(s.dialogue)}</textarea></label></div></article>`;}
function shotSummary(){const p=current();const total=p.shots.reduce((sum,s)=>sum+s.seconds,0);if($('#shot-summary'))$('#shot-summary').textContent=`${p.shots.length} 个镜头 · 累计 ${total} 秒 / 目标 ${p.duration} 秒${total===p.duration?' · 时长吻合':total>p.duration?` · 超出 ${total-p.duration} 秒`:` · 还差 ${p.duration-total} 秒`}`;}
function renderEditor(){
  const p=current();if(!p)return;updateProjectBar();updateProgress();const s=STAGES.find(x=>x.id===stage);
  let body='';
  if(stage==='brief')body=`<div class="field-grid">${field('项目名称','name',p.name)}${field('题材','genre',p.genre)}${field('视觉风格','style',p.style)}<label class="field">画幅<select data-field="ratio">${['9:16','16:9','1:1'].map(r=>`<option ${p.ratio===r?'selected':''}>${r}</option>`).join('')}</select></label>${field('目标时长（秒）','duration',p.duration,{type:'number',hint:'首作建议 60 秒，可设为 15—600 秒。'})}${field('目标受众','audience',p.audience)}${field('一句故事想法','idea',p.idea,{type:'textarea',full:true,hint:'谁，在什么情境下，想要什么，又遇到了什么阻碍？'})}</div>`;
  if(stage==='script')body=field('分集 / 分场剧本','script',p.script,{type:'textarea',tall:true,hint:'建议按时间段写出地点、人物行动、对白、声音与结尾悬念。可将外部 AI 生成结果粘贴在这里修改。'});
  if(stage==='characters')body=field('角色与世界观设定','characters',p.characters,{type:'textarea',tall:true,hint:'记录角色姓名、外貌锚点、服装配色、道具、动机与禁止变化项。多个角色用空行分隔。'});
  if(stage==='shots')body=`<div class="helper" id="shot-summary"></div><div id="shot-list">${p.shots.map(renderShot).join('')||'<div class="empty">第一镜，从这里开始。<br>添加镜头，记录画面、动作、声音和节奏。</div>'}</div><button class="btn" data-action="add-shot">＋ 添加镜头</button>`;
  if(stage==='production')body=field('画面 / 视频 / 配音 / 音效制作备注','production',p.production,{type:'textarea',tall:true,hint:'按镜号记录外部素材链接、版本、生成提示词、配音角色、音效与授权来源。此处保存文字及链接，不上传素材。'});
  if(stage==='delivery')body=field('剪辑与发布备注','delivery',p.delivery,{type:'textarea',hint:'记录成片链接、封面标题、简介、剪辑节奏、目标平台与导出规格。'})+CHECKS.map((label,i)=>`<label class="check-row"><input type="checkbox" data-check="${i}" ${p.checks.includes(i)?'checked':''}><span>${label}</span></label>`).join('');
  $('#editor').innerHTML=`<div class="editor-heading"><div><h2>${s.icon} &nbsp; ${s.name}</h2><p>${s.desc}</p></div><button class="btn small" data-action="complete">${p.completed.includes(stage)?'✓ 已确认 · 撤销':'标记阶段完成'}</button></div>${body}<div class="helper">先写下已知信息，再让 AI 帮你补全。提示词将包含当前项目上下文；本工具不会直接调用模型。</div><div class="actions"><button class="btn primary" data-action="prompt">生成阶段提示词 ✧</button><a class="text-link" href="workflow.html">查看阶段验收标准 ↗</a></div><div class="prompt-panel" id="prompt-panel" hidden><div class="prompt-header"><h3>阶段提示词 · 本地组装</h3><button class="btn small" data-action="copy-prompt">复制提示词</button></div><label class="sr-only" for="prompt-output">阶段提示词</label><textarea id="prompt-output" readonly></textarea></div>`;
  if(stage==='shots')shotSummary();
  if(storageFailed)saveLabel(loadBlocked?'本次仅临时编辑：请导出 JSON 备份。':'本地保存不可用，请立即导出 JSON。');
}
function chooseStage(id){stage=id;const url=new URL(location.href);url.searchParams.set('stage',id);history.replaceState({},'',url);renderEditor();}
if(page==='studio'){
  if(!projects.length)addProject(newProject());else if(!projects.some(p=>p.id===currentId))currentId=projects[0].id;
  renderEditor();
  $('#project-select').addEventListener('change',e=>{currentId=e.target.value;persist();renderEditor();});
  $('#editor').addEventListener('input',e=>{
    const el=e.target,p=current();
    if(el.dataset.field){const key=el.dataset.field;p[key]=key==='duration'?Math.max(15,Math.min(600,Number(el.value)||60)):el.value;touch();if(key==='name')updateProjectBar();}
    if(el.dataset.shotField){const shot=p.shots.find(s=>s.id===el.closest('[data-shot]').dataset.shot);const key=el.dataset.shotField;shot[key]=key==='seconds'?Math.max(1,Math.min(120,Number(el.value)||5)):el.value;touch();shotSummary();}
    if(el.dataset.check!==undefined){const i=Number(el.dataset.check);p.checks=p.checks.filter(x=>x!==i);if(el.checked)p.checks.push(i);touch();}
    if($('#prompt-panel')&&!el.matches('#prompt-output'))$('#prompt-panel').hidden=true;
  });
  $('#editor').addEventListener('change',e=>{const el=e.target;if(el.dataset.field==='duration')el.value=current().duration;if(el.dataset.shotField==='seconds')el.value=current().shots.find(s=>s.id===el.closest('[data-shot]').dataset.shot).seconds;});
  $('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2*1024*1024)throw new Error('文件超过 2MB，请选择项目 JSON。');const p=normalizeProject(JSON.parse(await file.text()));if(addProject(p)){renderEditor();toast('已导入为新项目。');}}catch(error){toast('导入失败：'+error.message);}e.target.value='';});
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.copyTemplate){const t=TEMPLATES.find(t=>t.id===b.dataset.copyTemplate);await copy(`你是一位漫剧编导与制作统筹。\n项目背景：[填写故事、受众、风格、画幅和目标时长]\n已有材料：[填写剧本与角色设定]\n任务：${t.prompt}\n约束：保持角色和世界观一致；标注不确定信息。\n验收：给出可执行结果及三个需要人工复核的要点。`);return;}
  if(b.dataset.stage){chooseStage(b.dataset.stage);return;}
  if(b.dataset.removeShot){if(!confirm('删除这个镜头？此操作不能撤销。'))return;current().shots=current().shots.filter(s=>s.id!==b.dataset.removeShot);touch();renderEditor();return;}
  if(b.dataset.move){const p=current(),i=p.shots.findIndex(s=>s.id===b.dataset.move);if(i>0){[p.shots[i],p.shots[i-1]]=[p.shots[i-1],p.shots[i]];touch();renderEditor();}return;}
  const action=b.dataset.action;if(!action)return;
  if(action==='example'){if(addProject(exampleProject())){if(page==='studio'){chooseStage('brief');toast('已新建示例项目。');}else if(storageFailed){toast('浏览器存储不可用，请进入工作台后载入示例。');}else location.href='studio.html';}return;}
  if(page!=='studio')return;const p=current();
  switch(action){
    case 'new':if(addProject(newProject(`未命名漫剧 ${projects.length+1}`)))chooseStage('brief');break;
    case 'delete':if(confirm(`删除「${p.name}」？无法撤销，请确保已经导出备份。`)){projects=projects.filter(x=>x.id!==p.id);currentId=projects[0]?.id||'';if(!projects.length)addProject(newProject());else persist();renderEditor();toast('已删除项目。');}break;
    case 'import':$('#import-file').click();break;
    case 'complete':p.completed=p.completed.includes(stage)?p.completed.filter(x=>x!==stage):[...p.completed,stage];touch();renderEditor();break;
    case 'add-shot':if(p.shots.length>=100){toast('单项目最多 100 个镜头。');break;}p.shots.push({id:crypto.randomUUID(),scene:'',camera:'',dialogue:'',seconds:5});touch();renderEditor();break;
    case 'prompt':$('#prompt-output').value=buildPrompt(p,stage);$('#prompt-panel').hidden=false;$('#prompt-panel').scrollIntoView({behavior:'smooth',block:'nearest'});break;
    case 'copy-prompt':await copy($('#prompt-output').value);break;
    case 'export-json':download(JSON.stringify(p,null,2),'json','application/json;charset=utf-8');break;
    case 'export-md':download(projectMarkdown(p),'md','text/markdown;charset=utf-8');break;
    case 'export-csv':download(shotsCSV(p),'csv','text/csv;charset=utf-8');break;
  }
});

export const STAGES = [
  {id:'brief', name:'故事企划', short:'企划', icon:'01', desc:'把灵感变成可执行的创作简报', deliverable:'一句话故事 · 受众 · 风格 · 时长'},
  {id:'script', name:'分集剧本', short:'剧本', icon:'02', desc:'打磨开场钩子、冲突与结尾悬念', deliverable:'场景说明 · 对白 · 叙事节奏'},
  {id:'characters', name:'角色设定', short:'角色', icon:'03', desc:'建立角色与世界观的一致性', deliverable:'外貌锚点 · 服装 · 性格 · 禁用变化'},
  {id:'shots', name:'分镜规划', short:'分镜', icon:'04', desc:'把故事拆成可制作的镜头', deliverable:'景别 · 画面 · 运镜 · 时长'},
  {id:'production', name:'视听制作', short:'制作', icon:'05', desc:'组织画面、动态、配音与声音', deliverable:'素材链接 · 动态提示 · 配音稿 · 音效'},
  {id:'delivery', name:'剪辑交付', short:'交付', icon:'06', desc:'检查节奏、字幕与发布资产', deliverable:'成片检查 · 封面文案 · 交付清单'}
];
export const CHECKS = ['角色造型与镜头连续性已检查','对白、配音与字幕已核对','音乐、字体和素材授权已确认','画幅、分辨率与发布平台要求已核对','封面、简介与 AI 内容标识要求已核对','项目资料和成片已分别备份'];
const text = (v,n=20000) => typeof v === 'string' ? v.slice(0,n) : '';
export function newProject(name='未命名漫剧') {
  return {schemaVersion:1,id:globalThis.crypto.randomUUID(),name,updatedAt:new Date().toISOString(),genre:'悬疑',style:'电影感国漫',ratio:'9:16',duration:60,idea:'',audience:'',script:'',characters:'',production:'',delivery:'',shots:[],completed:[],checks:[]};
}
export function normalizeProject(input) {
  if (!input || typeof input !== 'object' || input.schemaVersion !== 1 || typeof input.name !== 'string') throw new Error('不是可识别的漫序项目文件（需要 schemaVersion: 1）');
  const p = newProject(text(input.name,100) || '未命名漫剧');
  for (const k of ['idea','audience','script','characters','production','delivery','genre','style']) p[k]=text(input[k]);
  p.ratio=['9:16','16:9','1:1'].includes(input.ratio)?input.ratio:'9:16';
  p.duration=Math.max(15,Math.min(600,Number(input.duration)||60));
  p.shots=(Array.isArray(input.shots)?input.shots:[]).slice(0,100).map(s=>({id:globalThis.crypto.randomUUID(),scene:text(s?.scene,4000),camera:text(s?.camera,500),dialogue:text(s?.dialogue,2000),seconds:Math.max(1,Math.min(120,Number(s?.seconds)||5))}));
  p.completed=[...new Set((Array.isArray(input.completed)?input.completed:[]).filter(x=>STAGES.some(s=>s.id===x)))];
  p.checks=[...new Set((Array.isArray(input.checks)?input.checks:[]).filter(x=>Number.isInteger(x)&&x>=0&&x<CHECKS.length))];
  return p;
}
export function exampleProject() {
  const p=newProject('末班列车');
  Object.assign(p,{idea:'深夜的最后一班地铁，一位插画师发现车窗倒影比现实早发生十秒。下一站，她必须决定是否相信倒影中的自己。',audience:'喜欢都市悬疑与反转故事的年轻观众',characters:'林夕，25岁，短黑发、琥珀色眼睛、墨绿色风衣，随身携带红色速写本。外冷内热、善于观察。保持发型、服装、速写本颜色一致。',script:'【0—8秒｜钩子】空荡的车厢，林夕抬头，倒影先她一步转过脸。\n【8—40秒｜冲突】广播响起陌生站名，速写本里出现一幅她从未画过的画：自己站在封闭的站台上。\n【40—60秒｜悬念】列车停下，窗中的她摇了摇头。现实中的车门缓缓打开。',completed:['brief','script','characters']});
  p.shots=[{id:globalThis.crypto.randomUUID(),scene:'深夜空车厢，冷色灯光，林夕独自坐在窗边。红色速写本成为唯一暖色。',camera:'远景 / 缓慢推进',dialogue:'环境音：车轮与轨道摩擦',seconds:8},{id:globalThis.crypto.randomUUID(),scene:'林夕的眼睛与窗中倒影重叠，倒影提前转头。',camera:'特写 / 固定机位',dialogue:'林夕：刚才……是我动了吗？',seconds:7},{id:globalThis.crypto.randomUUID(),scene:'手指翻开速写本，陌生站台的画面逐渐显露。',camera:'近景 / 俯拍',dialogue:'广播：下一站，归途。',seconds:10}];
  return p;
}
const objectives={brief:'生成一句话梗概、受众分析、三幕大纲和制作难点。提出两个不同的冲突方向；指出需要补充的信息。',script:'基于企划编写分场剧本，标明时间段、地点、角色行动、对白与声音。开场建立钩子，结尾留出悬念。',characters:'输出角色设定表：身份、动机、外貌锚点、服装配色、标志物、表情、三视图提示词与禁止变化项。避免仅靠抽象形容词。',shots:'把剧本拆成可执行的分镜表：镜号、景别、画面、角色动作、运镜、对白、音效、时长、画面提示词。检查总时长及场景连续性。',production:'基于分镜生成逐镜制作清单：静帧画面提示词、首尾帧关系、视频动作与运镜提示词、配音语气、音效需求、素材命名。保持角色外观一致。',delivery:'输出剪辑节奏建议、字幕与声音检查、封面标题备选、发布简介和交付清单。指出仍需人工核查的素材授权及平台要求。'};
export function buildPrompt(p,stage='brief') {
  if(!objectives[stage]) stage='brief';
  return `你是一位漫剧编导与制作统筹。请完成【${STAGES.find(s=>s.id===stage).name}】任务。\n\n【项目简报】\n片名：${p.name}\n题材：${p.genre}\n视觉风格：${p.style}\n画幅：${p.ratio}；目标时长：${p.duration}秒\n目标受众：${p.audience||'待确认'}\n故事灵感：${p.idea||'待补充，请先询问核心故事'}\n\n【已有剧本】\n${p.script||'尚未填写'}\n\n【角色一致性设定】\n${p.characters||'尚未填写'}\n\n【已有分镜】\n${p.shots.map((s,i)=>`${i+1}. ${s.scene} | ${s.camera} | ${s.dialogue} | ${s.seconds}秒`).join('\n')||'尚未填写'}\n\n【制作备注】\n${p.production||'暂无'}\n\n【任务】\n${objectives[stage]}\n\n【约束与验收】\n保留已确定的角色、道具和世界观；新增假设明确标注。总时长以${p.duration}秒为目标。优先少角色、少场景、可执行的镜头。只输出当前阶段结果，不声称已经生成图片、配音或视频。列出最关键的三项人工复核点。`;
}
export const TEMPLATES = STAGES.map(s=>({...s, title:['一句灵感，变成故事企划','让短剧开场就有吸引力','让角色在每一镜保持一致','把剧本拆成可执行的镜头','组织画面、动态和声音','完成成片前的最后一轮检查'][STAGES.indexOf(s)], prompt:objectives[s.id]}));
export function projectMarkdown(p) {
 return `# ${p.name}\n\n${p.genre} · ${p.style} · ${p.ratio} · ${p.duration}秒\n\n## 故事企划\n${p.idea}\n\n目标受众：${p.audience}\n\n## 分集剧本\n${p.script}\n\n## 角色设定\n${p.characters}\n\n## 分镜\n${p.shots.map((s,i)=>`### 镜头 ${i+1}（${s.seconds}秒）\n${s.scene}\n\n景别/运镜：${s.camera}\n\n对白/声音：${s.dialogue}`).join('\n\n')}\n\n## 制作备注\n${p.production}\n\n## 交付备注\n${p.delivery}\n\n## 检查清单\n${CHECKS.map((s,i)=>`- [${p.checks.includes(i)?'x':' '}] ${s}`).join('\n')}\n\n导出于 ${new Date().toISOString()}\n`;
}
export function shotsCSV(p) {
 const cell=v=>'"'+String(v).replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
 return '\ufeff'+[['镜号','画面','景别与运镜','对白与声音','时长(秒)'],...p.shots.map((s,i)=>[i+1,s.scene,s.camera,s.dialogue,s.seconds])].map(r=>r.map(cell).join(',')).join('\r\n');
}

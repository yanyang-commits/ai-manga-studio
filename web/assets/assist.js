const banks={
 contrast:['让最可靠的人隐藏一个代价','把日常道具变成异常规则的证据','让角色的优势在此刻成为阻碍','让观众先知道危险，角色后知道','把想逃离的地点变成唯一安全区','让一个善意决定引出意外后果'],
 place:['末班车厢','停电的便利店','凌晨的电梯','即将拆除的旧楼','雨夜的天桥','废弃的摄影棚'],
 prop:['一张日期错误的车票','一段提前出现的录音','一个从不走动的钟','一本多出一页的速写本','一把不属于任何门的钥匙','一张缺少主角的合照']
};
export function associate(p,stage,seed=0){
 const n=Math.abs(Number(seed)||0),pick=(a,i)=>a[(n+i)%a.length];const story=p.idea?.trim()||'一个普通人遭遇无法解释的异常';
 const opening=`以「${p.name||'未命名故事'}」为起点：${story.slice(0,150)}`;
 const byStage={
 brief:[['反差命题',`${opening}\n尝试：${pick(banks.contrast,0)}。如何用一个动作让观众看懂？`],['跨场景联想',`把冲突放到${pick(banks.place,1)}，加入${pick(banks.prop,2)}。它能如何改变主角目标？`],['代价联想','如果主角获得想要的东西，却失去一段关系，最后会选择什么？写出两个相反选择。']],
 script:[['开场异常',`${opening}\n先让${pick(banks.prop,0)}出现，再延迟解释。用5秒动作替代说明性台词。`],['潜台词','让角色说“没事”，同时做一个暴露恐惧的小动作。这个矛盾怎样推动下一场？'],['反转回收',`把“${pick(banks.contrast,2)}”作为反转方向；前半段埋下两处可被重新理解的细节。`]],
 characters:[['欲望与恐惧',`围绕「${p.genre||'故事'}」主角写：最想得到什么、最不愿承认什么、为此隐瞒了谁？`],['视觉锚点',`为角色保留一个轮廓、一组主辅色和${pick(banks.prop,3)}。检查不同景别是否仍能识别。`],['关系反差','设计一位与主角目标相同、方法相反的人。让两人必须暂时合作。']],
 shots:[['信息层级',`先用远景交代空间，再用近景表现行动，最后特写${pick(banks.prop,1)}。三镜分别揭示什么新信息？`],['视角变换','用道具视角或门外遮挡视角重拍同一动作。仅保留能增强当前情绪的一种变化。'],['无声镜头','选择一句解释性对白，把它变成手部动作、目光转移或道具位置变化。']],
 production:[['动态最小化','固定机位，只让一个主体动作发生；用风、灯光或背景虚化补足氛围，减少画面漂移。'],['声音反差','画面保持平静，让远处声音暗示危险。列出环境底噪、动作声、静默三个层次。'],['角色连续性','先锁定同一角色参考、服装配色和道具，再比较每镜首尾帧。一次只调整一个变量。']],
 delivery:[['节奏对照','做一版删除20%解释性内容的粗剪，检查故事是否仍成立。将省下的时间留给关键选择。'],['封面反差',`围绕“${p.name||'故事标题'}”提炼观众想问的一个问题，只使用作品中确实出现的画面与冲突。`],['复盘实验','下一部只改变开场钩子、镜头数量或声音设计中的一个变量，记录耗时与观看反馈。']]
 };
 const cards=byStage[stage]||byStage.brief;
 return cards.map(([title,body],i)=>[title,body+(n&&['production','delivery'].includes(stage)?`\n本轮实验：在${pick(banks.place,i)}的场景中，围绕${pick(banks.prop,i+1)}验证这一方案。`:'')]);
}
export function reviewProject(p,stage){
 const notes=[];if(!p.idea?.trim())notes.push('先补充一句故事：主角、目标、阻碍、代价。');if(!p.audience?.trim())notes.push('目标受众为空，先明确希望观众获得的情绪。');
 if(stage!=='brief'&&!p.script?.trim())notes.push('剧本尚为空：先写可被表演的行动与对白。');if(['shots','production','delivery'].includes(stage)&&!p.characters?.trim())notes.push('角色设定尚为空，跨镜头容易缺少一致性依据。');
 if(['shots','production','delivery'].includes(stage)){const total=p.shots.reduce((a,s)=>a+s.seconds,0);if(!p.shots.length)notes.push('还没有分镜，先添加一个建立场景的镜头。');else if(total!==p.duration)notes.push(`镜头总时长 ${total} 秒，目标 ${p.duration} 秒，需调整 ${Math.abs(total-p.duration)} 秒。`);const missing=p.shots.filter(s=>!s.scene?.trim()).length;if(missing)notes.push(`${missing} 个镜头缺少画面与动作描述。`);}
 if(stage==='delivery'&&p.checks.length<6)notes.push(`交付清单尚有 ${6-p.checks.length} 项未确认。`);
 return notes.length?notes:['基础信息较完整。下一步请人工检查人物动机、视觉连续性与素材授权；规则检查不能判断故事质量。'];
}

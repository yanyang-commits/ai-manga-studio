/** Future same-origin backend adapter. Never put model credentials in browser code. */
export class HttpAIProvider {
  constructor(endpoint='/api/generations') { this.endpoint=endpoint; }
  async create({stage,prompt,projectId,signal}) {
    const response=await fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stage,prompt,projectId}),signal});
    if(!response.ok) throw new Error(`AI 服务请求失败（${response.status}）`);
    const result=await response.json();
    if(!result || typeof result.jobId!=='string') throw new Error('AI 服务返回格式无效');
    return result;
  }
}
// This adapter is deliberately not imported by the v0.1 UI. No live AI backend exists yet.

# AI 接口契约草案（未实现）

本文件是下一迭代的实施约定，不代表可调用接口。当前页面不调用 /api。

## POST /api/generations

鉴权：服务端会话；同源 Cookie 时验证 CSRF。Header: Content-Type: application/json，Idempotency-Key: 客户端生成的 UUID（后续实现时加入）。

```json
{"projectId":"uuid","stage":"script","prompt":"完整项目上下文与任务"}
```

服务端必须验证项目所有权、stage 白名单、prompt 长度、请求体上限、用户配额及并发数。具体模型/供应商由后端配置，禁止客户端任意指定任意上游 URL。密钥仅存在服务端 Secret。

响应：202 Accepted。

```json
{"jobId":"job_uuid","status":"queued"}
```

GET /api/generations/:jobId（再次校验所有权）：

```json
{"jobId":"job_uuid","status":"succeeded","output":{"kind":"text","text":"待用户确认的结果"},"usage":{"estimatedCost":0,"currency":"USD"}}
```

这里的 estimatedCost: 0 只是 JSON 字段示意，不能用作真实价格或 UI 默认报价。真实费用由供应商用量计算。

失败返回 {error:{code,message,retryable}}。HTTP: 400 输入无效、401 未登录、403 无权访问、413 超限、429 配额/速率超限、502 上游失败。用户可取消请求，超时后允许查看任务状态，不盲目重复计费。

## 生成结果应用

生成内容先显示预览，用户确认后写入字段；同时保留之前版本。文本和模型输出都按不可信内容处理，禁止执行 HTML / JavaScript。未来支持 Markdown 时使用安全渲染器。

## 首个真实接入的验收

- 用户能完成企划 → 请求文本生成 → 预览 → 应用 → 导出。
- 请求失败不会破坏原稿；重复请求不会重复计费。
- 任何构建产物、日志或 API 响应不包含服务端密钥。
- 两个账号之间不能读取或修改对方项目和任务。
- 配额限制触发时返回真实原因，不展示虚构生成结果。

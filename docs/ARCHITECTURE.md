# 架构与扩展

## 当前数据流

HTML 内容页 → app.js 页面交互 → core.js 数据/提示词/导出 → localStorage。

工作台将当前项目留在内存；每次字段输入尝试同步保存。导出使用内存数据，因此磁盘配额失败后仍可下载备份。发现存储内容不可解析时不覆盖原存储，改为临时编辑并提示导出。

## Project v1

- schemaVersion: 1；id: UUID；name；updatedAt: ISO 时间。
- brief: 扁平字段 idea、audience、genre、style、ratio、duration。
- script、characters、production、delivery: 多行文本。
- shots: [{id, scene, camera, dialogue, seconds}]。
- completed: 阶段 ID 数组；checks: 交付清单序号数组。
- JSON 导入创建新 ID，避免覆盖已有项目；采用字段白名单。

上限：30 项目、100 镜头/项目、10MB 导入文件、20,000 字符普通长文本；镜头画面 4,000 字、对白 2,000 字、运镜 500 字。生产阶段限制应在加入后端后前后端共用。

## 后端接入策略

1. 保留静态页面与 core.js，新增独立同源 API 层；不把 provider SDK 或密钥放前端。
2. 抽出 Repository 接口：list/get/create/update/remove/export。由 localStorage 实现迁移为 HTTP 实现，保留 JSON 迁移能力。
3. 生成结果独立保存为 Generation，不直接覆盖 Project。UI 呈现预览与差异，用户确认后应用。
4. 图像、TTS、视频任务统一 Job 状态机 queued/running/succeeded/failed/cancelled。大文件进入对象存储，仅在数据库保留元数据与授权信息。
5. 用服务端生成的 asset ID / signed URL；禁止直接 fetch 任意用户 URL，防止 SSRF。跨用户每次读写都校验所有权。
6. 商业化前增加身份、请求大小、频率、配额、成本审计、幂等、Webhook 验签、任务重试和删除策略。

`dist/assets/ai-provider.js` 是未启用的 HTTP 客户端示例，不是生产后端。参见 API.md。

## 部署

静态输出目录就是 dist/，无需编译。Sites 的源仓库和 GitHub 用户仓库各有用途：Sites 保存部署源；GitHub 是用户可直接维护的项目仓库。没有设置自动双向同步。后续修改应同时更新两者，或在确定托管平台后建立单一发布流水线。

本次按所有者明确要求将 Sites 改为 public。HTML/JS 中不包含登录门槛或 ChatGPT OAuth 调用；游客直接使用本地工作区。内容页开放索引，工作台标为 noindex。独立域名可在品牌确定后配置。GitHub 的公开可见性与站点访问权限分别管理。

## v0.1.1 数据可靠性

新增批量备份容器 {kind: "mangaflow-backup", schemaVersion: 1, exportedAt, projects}。导入先校验全部项目及总数，成功后一次性加入内存，避免无效备份导致部分导入。导入创建新身份，不替换现有数据。

保存前比较 localStorage 的最新序列化快照，并监听 storage 事件。发现其他标签页修改后暂停本页保存，允许导出内存数据后刷新。这是冲突检测，不是原子事务；需要强一致性时应迁移到 IndexedDB 或服务端版本控制。

浏览器拒绝剪贴板权限时，打开原生 dialog 呈现完整文本，支持键盘和移动端长按复制。

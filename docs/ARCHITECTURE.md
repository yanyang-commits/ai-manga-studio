# v0.2 架构

web/ 保存原生页面与 ES Modules；scripts/build.mjs 将页面和资源嵌入 Worker ESM。Sites 负责公开托管、原生 ChatGPT 认证以及 BUCKET R2 绑定。没有 npm 生产依赖。

游客通过 localStorage 保存。账号通过 /api/projects 保存至按用户散列 ID 隔离的 R2 JSON 对象。两个空间分开；游客数据须明确导入才上传。账号草稿不复制到 localStorage。条件写入保护版本冲突，错误时保留页面草稿并提示导出。

本地 assist.js 提供规则组合与字段检查，catalog.js 提供 48 个任务模板和分阶段官方工具。模型接口未启用。Google / Apple OAuth 仍是后续工作，不能只依赖 UI 禁用状态判断服务端权限。

# v0.2 API

GET /api/session 返回平台身份、云存储绑定状态与可用提供方。ChatGPT 使用 /signin-with-chatgpt，退出 /signout-with-chatgpt；这些路由属于 Sites dispatcher。

GET /api/projects 需登录，返回 projects 与 revision。PUT /api/projects 需同源 Origin、application/json，提交 projects 与读取时 revision（首次为 null）。上限 30 项、8MB；401 未登录，403 来源错误，409 版本冲突，413 超大请求。R2 使用条件写入，不覆盖陈旧版本。

GET /api/health 返回应用版本与绑定状态。/api/ai 返回 503 AI_NOT_CONFIGURED，目前没有模型调用。Google / Apple 独立登录尚未实现。

服务端依赖 Sites 对身份头的可信注入；不得直接部署到没有身份网关的运行环境。客户端不能传用户 ID 选择存储空间。

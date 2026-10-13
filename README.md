# 漫序 MangaFlow

面向独立创作者的 AI 漫剧全流程工作台：企划 → 剧本 → 角色 → 分镜 → 视听制作 → 剪辑交付。

**v0.2.0 已于 2026-10-13 公开发布。游客无需登录。**

- 正式站点：https://mangaflow-studio.leoyang6667.chatgpt.site
- 提示词库：https://mangaflow-studio.leoyang6667.chatgpt.site/templates.html
- 公开仓库：https://github.com/yanyang-commits/ai-manga-studio

## 功能与实际状态

| 功能 | 状态 |
| --- | --- |
| 游客工作区 | 浏览器本地保存，多项目、备份导入、JSON / Markdown / CSV 导出 |
| ChatGPT 登录 | 接入 Sites 原生登录入口；账号工作区服务端代码已部署，真实登录与云端往返尚未完成端到端验证 |
| 账号云端存储 | Sites R2 按用户隔离；带版本条件写入、冲突保护、同源校验；登录用户可主动复制游客草稿 |
| Google / Apple 独立登录 | 尚未配置，不可使用；界面明确禁用，不模拟成功 |
| 创作辅助 | 六阶段本地规则联想、替代方向、AI 追问组装、缺项及时长检查 |
| 提示词库 | 48 条，六阶段各 8 条；搜索、筛选、查看完整指令、带入项目上下文 |
| 外部工具 | 按阶段提供 ChatGPT、Claude、Gemini、即梦、Firefly、Runway、ElevenLabs、CapCut 官方入口 |
| 真实模型生成 | 未启用；本地联想不是模型推理，本站不会直接生成图像、视频或配音 |

## 使用与隐私

游客直接进入工作台，草稿仅留在当前浏览器。清理浏览器数据可能丢失草稿，请定期导出全部项目备份。登录账号后默认使用独立云端工作区，可切回游客本地工作区。游客内容不会自动上传；需主动点击导入游客草稿。退出登录不会删除游客数据。共享设备请注意本地草稿隐私。

云端每账号最多 30 个项目、请求上限 8MB。服务端以平台验证的身份生成存储键，不接受客户端指定用户。版本冲突时停止保存，请先导出当前草稿，再刷新读取云端。网络错误时当前编辑暂留页面，不冒充同步成功。外部 AI 链接不会自动发送草稿，需自行复制。

## 技术栈与目录

原生 HTML / CSS / JavaScript ES Modules + Worker ESM + Sites 原生认证与 R2。**零 npm 运行依赖**，无外部字体、CDN 脚本或分析追踪。托管、认证、云存储仍依赖 Sites 基础设施。

```text
web/                  页面源码与本地静态资源
  index.html          首页：价值介绍、六阶段、工作台与模板入口
  studio.html         六阶段创作工作台
  templates.html      48 条提示词
  workflow.html       流程与验收标准
  guide.html          操作和数据说明
  qa.html             noindex 响应式验证夹具
  assets/core.js      数据模型与导出
  assets/catalog.js   模板和工具目录
  assets/assist.js    本地联想及检查
  assets/app.js       UI 与本地 / 云端保存
worker/index.js       身份、云端项目 API、静态资源服务
scripts/              构建、产物验证、链接检查
tests/                Node 内置测试
.openai/hosting.json   Sites 项目标识与 R2 绑定
dist/                 自动生成 Worker 部署产物，不提交
```

## 本地开发

Node.js 20+、Python 3，无需 npm install。

```sh
npm run check
npm test
npm run build
python3 scripts/check-links.py
npm start
```

`npm start` 仅预览 web/ 前端，访问 http://localhost:3000；云端 API 和原生登录需部署到 Sites。build 将页面嵌入 dist/server/index.js，并生成 hosting manifest。不要将未经身份网关保护的 Worker 直接暴露到公网：代码信任 Sites 注入且已验证的身份头。

## 验证记录

2026-10-13：12 项 Node 测试通过，JS 语法、内部链接、Worker 构建及 default.fetch 校验通过。自动化覆盖云端未登录拒绝、账号隔离、跨站写入拒绝、无效项目标识与陈旧版本冲突；存储测试使用内存替身，不等同生产云端验证。

真实浏览器检查：桌面首页；提示词搜索“反转”得到 1/48，带入剧本工作台；联想切换；登录弹窗及不可用入口状态。390px iframe 首页、375px iframe 工作台和提示词库完成视觉检查，工作台与提示词库无横向溢出。手机验证是 CSS 视口测试，非实体手机或 iOS Safari 测试。

生产 API 的直接探测被当前执行环境拦截（HTTP 403 / 浏览器 ERR_BLOCKED_BY_CLIENT），因此未宣称生产登录、R2 写入或身份头清洗已端到端验证。页面正常公开加载，Sites 返回部署成功。上线版本：Sites version 3，应用 v0.2.0。

## 后续迭代顺序

1. 完成真实账号登录、云端读写与多设备冲突验收。
2. 在 Google / Apple 开发者控制台配置应用、域名、回调与服务端凭据，实施 OAuth 状态校验、PKCE / nonce、令牌验证及账号关联，再启用入口。不能仅添加按钮冒充登录。
3. 配置服务端模型接口、配额与速率限制，再开放剧本和分镜辅助生成；密钥不得进入公开仓库或浏览器。
4. 再考虑媒体任务队列、素材版本管理、协作和付费，避免过早引入复杂依赖。

详见 docs/。反馈：https://github.com/yanyang-commits/ai-manga-studio/issues

## 品牌标识

2026-10-13 更新原创 SVG 标识：漫画分格、展开书页与播放三角组合，沿用森林绿与浅青绿色。`web/assets/logo.svg` 用于全站导航，`favicon.svg` 用于浏览器标签；无需外部图片或字体。

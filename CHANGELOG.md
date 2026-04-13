# 更新日志 / Changelog

## v2.0.0 — 2026-04-14 · 全站重构与功能升级

### 🏠 首页 (index.html)
- **体验版群聊要求**：恢复完整文案，增加加粗强调与 4000 条消息上下文说明
- **定制版价格卡片**：从独立卡片改为表格行式布局，与其他价格方案风格统一
- **服务条例标题**：移除"（摘要）"字样
- **致谢插件列表**：根据服务器实际运行状态全面更新（新增 20+ 插件、移除 14 个已下线插件），所有链接均核实有效

### 📖 功能指南 (guide.html)
- **全面重构**：从旧版 guide_old.html 迁移至全新卡片布局，增加分类筛选、搜索功能
- **插件同步**：根据服务器最新状态移除 5 个已下线插件（persona_plus、figurine、templates_draw、emojimix、xibao），新增 14 个插件指南条目
- **搜索引擎**：全新 guide-search.js 实现实时关键词搜索与高亮

### 🖥️ 状态监控 (status.html)
- 全面重写为独立页面，支持 Bot 存活状态实时监控
- 新增自动刷新、状态指示灯与详细信息面板

### 🔧 后端服务
- **bot_server.py**：新增精确到分钟的自动解封定时器、CORS 安全域名限制、环境变量管理 ADMIN_KEY
- **stats_server.py**：支持 X-Real-IP 头获取真实访客 IP
- **community_server.py**：全新社区留言板后端（端口 5002），支持 QQ 头像、留言审核、管理面板

### 🎨 样式
- 合并 style.css 为统一的 styles.css
- 新增定制版价格行样式与亮色主题适配
- bot_style.css 细节修复

### 🆕 新增页面
- **board.html** — 社区留言板
- **admin_board.html** — 留言板管理后台
- **pay.html** — 支付/赞赏页面
- **admin.js / app.js** — 前端管理与应用逻辑

### 🧹 清理
- 删除旧版 guide_old.html、script.js、style.css、requirements.txt、README.md
- 删除访问统计使用说明.md
- 更新 .gitignore，排除 stats.json/messages.json/bot_accounts.json 等运行时数据

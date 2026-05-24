---
name: vocab-master
description: 背单词网站项目规范
---

# 技术栈
React 19 + Vite + Tailwind CSS + shadcn/ui + localStorage + Web Speech API

# 代码规范
1. 组件用函数式 + Hooks
2. 常量放 src/config/app.js
3. 数据操作走 src/utils/storage.js（Promise 封装）
4. props 写 JSDoc
5. 颜色用 Tailwind 主题变量，禁止硬编码

# 文件结构
src/components/       可复用组件
src/components/quiz/  题型组件
src/pages/            页面
src/utils/            工具函数
src/data/             静态数据
src/config/           配置文件

# 命名规范
组件: PascalCase（WordCard.jsx）
工具函数: camelCase（calculateNextReview）
常量: UPPER_SNAKE_CASE（REVIEW_WARNING_THRESHOLD）

# 扩展预留
- storage.js 必须返回 Promise，预留后端迁移
- 所有配置项抽离到 app.js
- 组件必须接收可覆盖的 props
- 题型通过注册机制扩展ss
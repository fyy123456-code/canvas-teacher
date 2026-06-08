# Canvas Teacher 课程设计

## 目标

`canvas-teacher` 是一个用于从零学习画布编辑器工程能力的参考项目。它会沿用 `ai-design-canvas` 的核心技术方向，但范围会小很多，目的是让每一个画布概念都可以被单独理解，并且可以在 `canvas-student` 中手写复现。

这个项目不连接 `apps/skywork-web`，第一阶段也不依赖后端。

## 学习方式

每一小节都会刻意保持很小。每节只介绍一个画布概念，在 `canvas-teacher` 中实现一个聚焦的参考改动，然后给出你在 `canvas-student` 中手写复现的任务。

每一小节固定按这个结构进行：

1. 说明这一节要做什么。
2. 讲解这一节用到的画布知识。
3. 在 `canvas-teacher` 中实现最小参考代码。
4. 把这一节提交为一个 Git commit。
5. 在 `docs/lessons` 下写一份简短课程文档。
6. 给出 `canvas-student` 的手写任务和一个小练习。

## 变更追踪

每一小节都会单独提交。你可以用下面的命令查看每节改了什么：

```bash
git log --oneline
git show --stat HEAD
git show --patch HEAD
```

课程文档会放在：

```text
docs/lessons/
```

每份课程文档包含：

- 本节目标
- 知识点
- 改动文件
- 关键代码解释
- 学生手写任务
- 常见错误
- 小练习

## 技术栈

参考项目使用和 `ai-design-canvas` 相同方向的核心技术栈：

- React
- TypeScript
- Vite
- Konva
- MobX
- SCSS

第一阶段不包含 Vue 包装层、后端 API、AI 工具、远程素材库、会员权益判断、服务端批注同步。

## 第一阶段范围

第一阶段聚焦画布核心能力：

1. 创建项目并安装依赖。
2. 渲染一个空白 Konva Stage。
3. 添加一个 Layer。
4. 画一个固定图形。
5. 读取鼠标指针坐标。
6. 用状态保存一个元素数据。
7. 根据状态渲染元素。
8. 拖拽元素，并把位置同步回状态。
9. 上传本地图片。
10. 渲染 Konva Image。
11. 选中图片。
12. 给选中的图片绑定 Transformer。
13. 缩放选中的图片，并把尺寸写回状态。
14. 平移画布。
15. 围绕鼠标指针缩放画布。
16. 框选元素。
17. 多选元素。
18. 添加文本元素。
19. 使用 DOM 覆盖层编辑文本。
20. 删除选中元素。
21. 添加撤销和重做。
22. 本地保存。
23. 导出画布。

如果某个功能在实现时仍然太复杂，会继续拆成更小的小节。

## 第一阶段暂不做的内容

下面这些功能会刻意延后：

- AI 去背景
- AI 擦除/局部修图
- AI 扩图
- AI 文本编辑
- 后端素材库
- 后端批注
- 知识库集成
- 云端项目持久化
- Vue SDK 包装层
- 权限和会员逻辑

## 仓库角色

预期的工作区结构是：

```text
/Users/fyy/Desktop/projects/canvas-teacher
/Users/fyy/Desktop/projects/canvas-student
```

`canvas-teacher` 是参考实现。`canvas-student` 是你手写练习的项目。

参考项目要保持清晰、直接、容易读。在你掌握底层概念之前，避免过早抽象。

## 第一个实现步骤

第一节代码课是 lesson 00：创建 Vite React TypeScript 项目，并安装核心依赖。

在理解项目骨架之前，不写画布功能代码。

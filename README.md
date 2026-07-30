# 故事浏览器

在线阅读 Project Sekai / Bang Dream 剧情文本的 Web 应用。

## 功能

- 目录浏览、模糊路径匹配
- 文件内容查看（自动换行、URL 链接识别）
- 国内加速开关（通过代理访问 GitHub Raw）
- 一键复制全文
- 源码链接直达 GitHub / Gitee

## 技术栈

React 19 + Vite + TypeScript + React Router

## 本地开发

```bash
npm ci
npm run dev
```

## 构建

```bash
npm run build    # 输出到 dist/
```

## 数据生成

`public/file_list/` 下的文件树由 `scripts/generate.py` 生成：

1. 将故事仓库克隆到本地
2. 在 `scripts/config.py` 中配置路径（不入库）
3. 运行生成脚本：

```bash
python scripts/generate.py
```

生成器支持分层拆分：超过指定深度的子目录会被写入独立的 `file_list.json`，前端按需懒加载。

## 部署

推送到 `main` 分支自动触发 GitHub Pages 部署（`.github/workflows/deploy-page.yml`）。

数据同步通过 `sync-file-list.yml` 手动触发：克隆仓库 → 重新生成文件树 → 有变化则自动构建部署。

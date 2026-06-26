# 论坛体 BBCode 预览器

这是一个纯静态网页项目，可以直接部署到 Vercel。

## 功能

- 左边编辑，右边实时预览
- 手机端编辑 / 预览切换
- 自动保存草稿
- 一键复制 BBCode
- 深色模式
- 预览字号调整
- 滚动同步
- 尽量模拟平台最终阅读效果

## 支持的 BBCode

- `[b]...[/b]`
- `[i]...[/i]`
- `[u]...[/u]`
- `[s]...[/s]`
- `[color=gray]...[/color]`
- `[size=14]...[/size]`
- `[blockquote]...[/blockquote]`
- `[quote]...[/quote]`
- `[url]https://example.com[/url]`
- `[url=https://example.com]文字[/url]`
- `[img]https://example.com/image.jpg[/img]`
- `[br]`

其中 `[br]` 用来分隔楼层。

## 部署到 Vercel

1. 在 GitHub 新建仓库。
2. 上传本项目所有文件。
3. 在 Vercel 新建项目。
4. 选择这个 GitHub 仓库。
5. 点击 Deploy。

以后修改 GitHub 里的文件并 Commit，Vercel 会自动更新网站。

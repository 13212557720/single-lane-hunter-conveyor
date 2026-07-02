# 单路猎人：无限传送带

Phaser + Vite 制作的 5 分钟单路防守小游戏原型。

## 本地运行

```bash
npm install
npm run dev -- --port 5173
```

## 构建

```bash
npm run assets:optimize
npm run build
```

P0 原始 PNG 素材保留在本地，不提交到仓库。游戏运行时加载的是 `public/assets/p0-runtime/` 下的 WebP 压缩素材。

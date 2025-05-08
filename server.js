// server.js
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const express = require('express');
require('dotenv').config({ path: '.env.local' });

// 開発モードかどうか
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// 環境変数からURLを取得
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
const parsedUrl = new URL(appUrl);
const port = parseInt(parsedUrl.port, 10) || 3000;

// 証明書のパスを環境変数から取得（デフォルト値を設定）
const certKeyPath = process.env.HTTPS_KEY_PATH || './localhost-key.pem';
const certPath = process.env.HTTPS_CERT_PATH || './localhost.pem';

// mkcert で生成した証明書と秘密鍵のパス
const httpsOptions = {
  key: fs.readFileSync(certKeyPath),
  cert: fs.readFileSync(certPath),
};

// キャッシュを完全に無効化
app.prepare().then(() => {
  const server = express();
  
  // Gzip圧縮を有効化
  server.use(compression());
  
  // すべてのリクエストに対してキャッシュを無効化
  server.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });
  
  // WebSocketの接続を確実にするための設定
  server.use((req, res, next) => {
    // WebSocketのアップグレードリクエストを処理
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
      res.setHeader('Connection', 'Upgrade');
      res.setHeader('Upgrade', 'websocket');
    }
    next();
  });
  
  // その他のリクエストはNext.jsに渡す
  server.all('*', (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });
  
  // HTTPSサーバーの作成
  createServer(httpsOptions, server).listen(port, (err) => {
    if (err) throw err;
  });
});

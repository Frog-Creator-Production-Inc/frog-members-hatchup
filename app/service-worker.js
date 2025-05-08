// サービスワーカーのバージョン
const CACHE_VERSION = 'v1';
const CACHE_NAME = `microcms-cache-${CACHE_VERSION}`;

// キャッシュを一時的に無効化
const CACHING_ENABLED = false;

// キャッシュするリソース
const CACHE_URLS = [
  '/',
  '/dashboard',
  '/api/microcms',
  // 他の重要なページやリソース
];

// MicroCMSの画像URLパターン
const MICROCMS_IMAGE_PATTERN = /https:\/\/images\.microcms-assets\.io\/assets\/.*/;

// キャッシュの有効期限（24時間）
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// インストール時にキャッシュを初期化
self.addEventListener('install', (event) => {
  if (!CACHING_ENABLED) {
    return;
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS);
    })
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  // すべてのキャッシュを削除
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          return caches.delete(name);
        })
      );
    })
  );
});

// リクエストをインターセプトしてキャッシュから提供
self.addEventListener('fetch', (event) => {
  // キャッシュが無効の場合は常にネットワークから取得
  if (!CACHING_ENABLED) {
    return;
  }
  
  // APIリクエストやMicroCMS画像のみを処理
  if (
    event.request.url.includes('/api/microcms') ||
    MICROCMS_IMAGE_PATTERN.test(event.request.url)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // キャッシュがある場合はそれを返す
          if (cachedResponse) {
            // バックグラウンドでキャッシュを更新（stale-while-revalidate）
            const fetchPromise = fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch((error) => {
                // エラー処理のみ残す
              });
            
            return cachedResponse;
          }
          
          // キャッシュがない場合はネットワークからフェッチしてキャッシュに保存
          return fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
  }
});

// プッシュ通知の受信
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'コンテンツが更新されました',
      icon: '/icon.png',
      badge: '/badge.png',
      data: {
        url: data.url || '/',
      },
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'コンテンツ更新通知',
        options
      )
    );
  }
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
}); 
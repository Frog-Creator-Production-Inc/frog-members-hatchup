'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // 既存のサービスワーカーを登録解除
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister().then(success => {
            console.log('ServiceWorker登録解除:', success ? '成功' : '失敗')
          })
        }
      })
      
      // キャッシュをクリア
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            console.log('キャッシュを削除:', cacheName)
            caches.delete(cacheName)
          })
        })
      }
      
      // 新しいサービスワーカーを登録（必要な場合）
      if (window.location.protocol === 'https:') {
        window.addEventListener('load', () => {
          // ngrok環境の場合は、Service Workerの登録をスキップ
          if (window.location.hostname.includes('ngrok')) {
            console.log('ngrok環境ではService Workerを登録しません')
            return
          }

          navigator.serviceWorker
            .register('/service-worker.js', { 
              updateViaCache: 'none',
              scope: '/' // 明示的にスコープを指定
            })
            .then((registration) => {
              console.log('ServiceWorker登録成功:', registration.scope)
            })
            .catch((error) => {
              console.error('ServiceWorker登録失敗:', error)
            })
        })
      } else {
        console.log('ServiceWorkerはHTTPSが必要です')
      }
    } else {
      console.log('ServiceWorkerはこの環境でサポートされていません')
    }
  }, [])

  return null
} 
// 传讯 · 新篇章 — Service Worker
const CACHE = 'chuanxun-v1';
const ASSETS = [
  '.',
  'index.html',
  'css/main.css',
  'js/config.js',
  'js/utils.js',
  'js/view-manager.js',
  'js/app.js',
  'js/chat.js',
  'js/replies.js',
  'js/multi-session.js',
  'js/daily-greeting.js',
  'js/mood-calendar.js',
  'js/checkin.js',
  'js/anniversaries.js',
  'js/draw-board.js',
  'js/ai-settings.js',
  'js/ai-chat.js',
  'js/gomoku.js',
  'js/memory-game.js',
  'js/fortune.js',
  'js/appearance.js',
  'js/chat-settings.js',
  'js/data-manager.js',
  'js/music.js',
  'js/sound-settings.js',
  'js/other-settings.js',
  'js/sleep.js',
  'js/whisper.js',
  'js/envelope.js',
  'js/decision.js',
  'js/stats.js',
  'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

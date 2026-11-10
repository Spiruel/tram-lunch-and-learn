import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { ServerResponse, IncomingMessage } from 'http'

function remoteClickerPlugin(): Plugin {
  let sseClients: ServerResponse[] = []
  let currentSlideState = { index: 0, title: 'Talk Outline', total: 37 }

  const REMOTE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">
  <title>Presentation Remote · Pixel Watch</title>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; padding: 18px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a; color: #f8fafc;
      min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between;
      touch-action: manipulation;
    }
    .header {
      text-align: center; padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .status-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px; border-radius: 9999px;
      background: rgba(13, 148, 136, 0.2); color: #2dd4bf;
      font-size: 13px; font-weight: 600;
    }
    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #2dd4bf;
      box-shadow: 0 0 10px #2dd4bf; animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
    .slide-info {
      background: rgba(255,255,255,0.06); border-radius: 18px;
      padding: 20px; text-align: center; margin: 16px 0;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .slide-number {
      font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .slide-title {
      font-size: 21px; font-weight: 700; margin: 10px 0 0; color: #fff; line-height: 1.3;
    }
    .watch-box {
      background: rgba(124, 58, 237, 0.18); border: 1px solid rgba(124, 58, 237, 0.4);
      border-radius: 16px; padding: 14px; text-align: center; margin-bottom: 16px;
    }
    .watch-title { font-size: 14px; font-weight: 700; color: #c4b5fd; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .watch-desc { font-size: 12.5px; color: #ddd6fe; margin-top: 4px; line-height: 1.4; }
    .btn-grid {
      display: grid; grid-template-columns: 1fr 2fr; gap: 14px; flex: 1; min-height: 220px;
    }
    .ctrl-btn {
      border: none; border-radius: 22px; font-size: 17px; font-weight: 700;
      cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;
      transition: transform 0.08s, filter 0.08s;
    }
    .ctrl-btn:active { transform: scale(0.96); filter: brightness(1.2); }
    .btn-prev { background: #334155; color: #f1f5f9; }
    .btn-next { background: #0284c7; color: #fff; font-size: 22px; }
    .btn-icon { font-size: 32px; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="status-badge" id="statusBadge">
      <span class="pulse-dot"></span> <span id="statusText">Connected to Mac</span>
    </div>
  </div>

  <div class="slide-info">
    <div class="slide-number" id="slideNum">Slide 1 / 37</div>
    <div class="slide-title" id="slideTitle">Talk Outline</div>
  </div>

  <div class="watch-box">
    <div class="watch-title">⌚ Pixel Watch Double-Pinch Active</div>
    <div class="watch-desc">Double-pinch your thumb & index finger to advance from your wrist</div>
  </div>

  <div class="btn-grid">
    <button class="ctrl-btn btn-prev" onclick="sendAction('prev')">
      <span class="btn-icon">◀</span>
      <span>PREV</span>
    </button>
    <button class="ctrl-btn btn-next" onclick="sendAction('next')">
      <span class="btn-icon">▶</span>
      <span>NEXT</span>
    </button>
  </div>

  <audio id="silenceAudio" loop src="/audio/silence.wav"></audio>

  <script>
    const audio = document.getElementById('silenceAudio');
    function ensureAudio() {
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    }
    document.addEventListener('touchstart', ensureAudio, { once: true });
    document.addEventListener('click', ensureAudio, { once: true });

    function setupMediaSession(title) {
      if (!('mediaSession' in navigator)) return;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || 'Tram Presentation',
        artist: 'Double-Pinch to Advance',
        album: 'Tram Presentation Remote',
      });
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.setActionHandler('play', () => { sendAction('next'); ensureAudio(); });
      navigator.mediaSession.setActionHandler('pause', () => { sendAction('next'); ensureAudio(); });
      navigator.mediaSession.setActionHandler('nexttrack', () => sendAction('next'));
      navigator.mediaSession.setActionHandler('previoustrack', () => sendAction('prev'));
    }

    function sendAction(action) {
      if (navigator.vibrate) navigator.vibrate(25);
      fetch('/api/remote/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      }).catch(err => console.error(err));
    }

    function connectSSE() {
      const ev = new EventSource('/api/remote/events');
      ev.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === 'sync' && d.state) {
            document.getElementById('slideNum').textContent = 'Slide ' + (d.state.index + 1) + ' / ' + d.state.total;
            document.getElementById('slideTitle').textContent = d.state.title;
            setupMediaSession('(' + (d.state.index + 1) + '/' + d.state.total + ') ' + d.state.title);
          }
        } catch(err) {}
      };
      ev.onerror = () => {
        document.getElementById('statusText').textContent = 'Reconnecting...';
        setTimeout(connectSSE, 2000);
      };
    }
    connectSSE();
    setupMediaSession('Tram Presentation Remote');
  </script>
</body>
</html>`

  return {
    name: 'remote-clicker-plugin',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next) => {
        const rawUrl = req.url || '/'
        const url = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`)

        if (url.pathname === '/api/remote/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          })
          res.write(`data: ${JSON.stringify({ type: 'sync', state: currentSlideState })}\n\n`)
          sseClients.push(res)
          req.on('close', () => {
            sseClients = sseClients.filter((c) => c !== res)
          })
          return
        }

        if (url.pathname === '/api/remote/action') {
          const handleAction = (action: string) => {
            for (const client of sseClients) {
              client.write(`data: ${JSON.stringify({ type: 'action', action })}\n\n`)
            }
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            })
            res.end(JSON.stringify({ ok: true, action }))
          }

          if (req.method === 'GET') {
            handleAction(url.searchParams.get('action') || 'next')
            return
          }

          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              handleAction(data.action || 'next')
            } catch {
              handleAction('next')
            }
          })
          return
        }

        if (url.pathname === '/api/remote/state' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              currentSlideState = { ...currentSlideState, ...JSON.parse(body || '{}') }
              for (const client of sseClients) {
                client.write(`data: ${JSON.stringify({ type: 'sync', state: currentSlideState })}\n\n`)
              }
            } catch {}
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
            res.end(JSON.stringify({ ok: true }))
          })
          return
        }

        if (url.pathname === '/remote') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(REMOTE_HTML)
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), remoteClickerPlugin()],
  server: {
    port: 5188,
    host: true,
    allowedHosts: true,
    open: false,
  },
})

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SlideSpec } from '../types';

interface WatchRemoteProps {
  currentSlide: SlideSpec;
  slideIndex: number;
  totalSlides: number;
  stepForward: () => void;
  stepBackward: () => void;
}

export const WatchRemoteController: React.FC<WatchRemoteProps> = ({
  currentSlide,
  slideIndex,
  totalSlides,
  stepForward,
  stepBackward,
}) => {
  const localNetworkIp = '192.168.1.142';
  const resolvedHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.hostname
    : localNetworkIp;
  const remoteUrl = `http://${resolvedHost}:5188/remote`;
  const [showModal, setShowModal] = useState<boolean>(false);
  const [phoneConnected, setPhoneConnected] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keep references to stepForward & stepBackward up to date in callbacks
  const stepForwardRef = useRef(stepForward);
  const stepBackwardRef = useRef(stepBackward);
  useEffect(() => {
    stepForwardRef.current = stepForward;
    stepBackwardRef.current = stepBackward;
  }, [stepForward, stepBackward]);

  // Connect to local SSE remote bridge (receives clicks from paired phone / watch)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/remote/events');
      eventSource.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'action') {
            if (msg.action === 'next') stepForwardRef.current();
            else if (msg.action === 'prev') stepBackwardRef.current();
          } else if (msg.type === 'sync') {
            setPhoneConnected(true);
          }
        } catch {}
      };
      eventSource.onerror = () => {
        // SSE disconnected (e.g. static host)
      };
    } catch {}
    return () => {
      eventSource?.close();
    };
  }, []);

  // Broadcast current slide metadata to the local bridge so phone/watch displays it
  useEffect(() => {
    fetch('/api/remote/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        index: slideIndex,
        title: currentSlide.title.replace(/<[^>]*>/g, ''),
        total: totalSlides,
      }),
    }).catch(() => {});
  }, [slideIndex, currentSlide, totalSlides]);

  const updateMediaSession = useCallback(
    (slide: SlideSpec, idx: number) => {
      if (!('mediaSession' in navigator)) return;

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${idx + 1}/${totalSlides} · ${slide.title.replace(/<[^>]*>/g, '')}`,
          artist: 'Double-Pinch to advance',
          album: 'Tram Lunch & Learn',
          artwork: [
            {
              src: '/tweet/frost_avatar.jpg',
              sizes: '400x400',
              type: 'image/jpeg',
            },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch (err) {
        console.warn('MediaSession metadata update error:', err);
      }
    },
    [totalSlides]
  );

  // Synchronize metadata whenever current slide changes
  useEffect(() => {
    if (isActive) {
      updateMediaSession(currentSlide, slideIndex);
    }
  }, [currentSlide, slideIndex, isActive, updateMediaSession]);

  const enableRemote = useCallback(async () => {
    try {
      if (!audioRef.current) {
        const audio = new Audio('/audio/silence.wav');
        audio.loop = true;
        audioRef.current = audio;
      }

      await audioRef.current.play();

      if ('mediaSession' in navigator) {
        // Pixel Watch double-pinch toggles Play / Pause on active media sessions.
        // By handling BOTH 'play' and 'pause' with stepForward, every pinch advances!
        navigator.mediaSession.setActionHandler('play', () => {
          stepForwardRef.current();
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
          }
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          stepForwardRef.current();
          // Resume playing silent audio so media controls remain active
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          stepForwardRef.current();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          stepBackwardRef.current();
        });
      }

      setIsActive(true);
      updateMediaSession(currentSlide, slideIndex);
    } catch (err) {
      console.error('Failed to enable watch remote:', err);
      alert('To enable Pixel Watch remote, please interact with the page first.');
    }
  }, [currentSlide, slideIndex, updateMediaSession]);

  const disableRemote = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      } catch (e) {
        // Some browsers may not allow clearing handlers
      }
    }
    setIsActive(false);
  }, []);

  const toggleRemote = useCallback(() => {
    if (isActive) {
      disableRemote();
    } else {
      enableRemote();
    }
  }, [isActive, enableRemote, disableRemote]);

  // Keyboard shortcut 'W' toggles Watch Remote
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'w' || e.key === 'W') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        toggleRemote();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleRemote]);

  return (
    <>
      <div className="watch-remote-container">
        <button
          type="button"
          className={`watch-remote-pill ${isActive ? 'is-active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleRemote();
          }}
          title={isActive ? 'Pixel Watch remote active (Click to disable, or press W)' : 'Enable Pixel Watch remote (or press W)'}
          aria-label="Pixel Watch Clicker Remote"
        >
          <span className="watch-icon">⌚</span>
          <span className="watch-label">
            {isActive ? 'Watch Clicker Active' : 'Watch Clicker'}
          </span>
          {isActive && <span className="watch-pulse-dot" />}
        </button>

        <button
          type="button"
          className="watch-help-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}
          title="How to control with Pixel Watch"
          aria-label="Watch Help"
        >
          ?
        </button>
      </div>

      {showModal && (
        <div
          className="watch-modal-overlay"
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(false);
          }}
        >
          <div
            className="watch-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="watch-modal-header">
              <h3>Pixel Watch Presentation Clicker</h3>
              <button
                type="button"
                className="watch-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="watch-modal-body">
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#fff8f3', padding: '16px', borderRadius: '14px', border: '1px solid #ebd9c8', marginBottom: '20px' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(remoteUrl)}`}
                  alt="Remote QR Code"
                  style={{ width: '124px', height: '124px', borderRadius: '8px', background: '#fff', padding: '6px', border: '1px solid #ebd9c8' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a', marginBottom: '4px' }}>
                    Scan with Your Phone (Paired to Watch)
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', lineHeight: 1.4 }}>
                    Opens the local presentation bridge at{' '}
                    <strong style={{ color: '#0284c7' }}>
                      {remoteUrl}
                    </strong>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: phoneConnected ? '#0d9488' : '#7c2d12' }}>
                    <span>{phoneConnected ? '🟢' : '🟡'}</span>
                    <span>{phoneConnected ? 'Phone Bridge Connected' : 'Ready for Phone Scan'}</span>
                  </div>
                </div>
              </div>

              <div className="watch-guide-section">
                <h4>Option 1: Phone WiFi Bridge (For Pixel Watch Double-Pinch)</h4>
                <p>
                  Since your Pixel Watch is paired via Bluetooth to your Android phone, the phone acts as the instant WiFi bridge to your Mac:
                </p>
                <ol>
                  <li>Scan the QR code above with your phone camera, or navigate to <code>/remote</code>.</li>
                  <li>Tap the screen once to enable the silent audio session.</li>
                  <li><strong>Double-pinch your thumb and index finger together on your Pixel Watch</strong>. The watch triggers play/pause, which instantly steps the presentation forward on your Mac!</li>
                  <li>You also get large tactile NEXT / PREV buttons and live slide tracking on your phone screen.</li>
                </ol>
              </div>

              <div className="watch-guide-section">
                <h4>Option 2: Direct Bluetooth HID (No Phone Needed)</h4>
                <p>
                  If you want your watch to pair directly to your Mac as a physical presentation clicker:
                </p>
                <ul>
                  <li>Install <strong>WowMouse Presenter</strong> or <strong>Wear Presentation Remote</strong> from Google Play on your Pixel Watch.</li>
                  <li>On your Mac, open <strong>System Settings ➔ Bluetooth</strong> and pair directly with the watch.</li>
                  <li>The watch acts as a physical Bluetooth keyboard (sending <code>ArrowRight</code> / <code>Space</code>) directly to your Mac without needing WiFi.</li>
                </ul>
              </div>
            </div>

            <div className="watch-modal-footer">
              <button
                type="button"
                className={`watch-btn-primary ${isActive ? 'btn-danger' : 'btn-active'}`}
                onClick={() => {
                  toggleRemote();
                }}
              >
                {isActive ? 'Deactivate Watch Remote' : 'Activate Watch Remote Now'}
              </button>
              <button
                type="button"
                className="watch-btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
  const [isActive, setIsActive] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keep references to stepForward & stepBackward up to date in callbacks
  const stepForwardRef = useRef(stepForward);
  const stepBackwardRef = useRef(stepBackward);
  useEffect(() => {
    stepForwardRef.current = stepForward;
    stepBackwardRef.current = stepBackward;
  }, [stepForward, stepBackward]);

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
              <div className="watch-guide-section">
                <h4>Method 1: Zero-Install Double-Pinch (Media Controls)</h4>
                <p>
                  Uses the web-standard <strong>HTML5 MediaSession API</strong> with a silent background audio loop. No custom apps needed!
                </p>
                <ol>
                  <li>
                    Click <strong>“Watch Clicker”</strong> (or press <strong>W</strong>) to turn it on.
                  </li>
                  <li>
                    Ensure your presentation is open in Chrome on your phone, laptop, or projector device.
                  </li>
                  <li>
                    Your Pixel Watch will show the active media card (with the current slide title and number).
                  </li>
                  <li>
                    <strong>Double-pinch your thumb and index finger together</strong>. The watch sends a play/pause toggle, which advances the presentation forward!
                  </li>
                  <li>
                    You can also tap the <strong>Next ⏭</strong> or <strong>Previous ⏮</strong> buttons right on the watch screen.
                  </li>
                </ol>
              </div>

              <div className="watch-guide-section">
                <h4>Method 2: Direct Bluetooth HID (WowMouse Presenter)</h4>
                <p>
                  If your laptop is connected directly to a HDMI projector and your watch is paired via Bluetooth directly to the laptop:
                </p>
                <ul>
                  <li>Install <strong>WowMouse Presenter</strong> (by Doublepoint) from Google Play on your Pixel Watch.</li>
                  <li>Pair your Pixel Watch to your Mac/PC laptop via normal Bluetooth settings.</li>
                  <li>Open WowMouse on the watch. Double-pinching acts as a physical Bluetooth clicker (sends ArrowRight), advancing the slides seamlessly!</li>
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

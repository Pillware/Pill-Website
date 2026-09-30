import { useRef, useState, useEffect, useCallback } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import VolumeControl from './VolumeControl';

// Returns the element currently in fullscreen (cross-browser), or null.
const getFullscreenElement = () =>
    document.fullscreenElement || document.webkitFullscreenElement || null;

// Valid fullscreen sizing modes.
const FULLSCREEN_MODES = ['letterbox', 'width', 'height'];

// Draw the current video frame to a canvas and return it as a JPEG data URL.
// Used to cover the player while a new quality source loads. Returns null if
// the video has no frame yet or canvas 2D context is unavailable.
const captureVideoFrame = (video) => {
    if (!video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
};

/**
 * Self-contained custom video player: autoplay loop, hover-revealed
 * controls, a draggable vertical volume slider (desktop only), fullscreen
 * toggling and an optional HD/4K quality switch. Owns all of its own state.
 *
 * Props:
 * - src: video source URL
 * - autoPlay / loop: playback behavior (default true)
 * - showVolumeControl: render the mute button + volume slider (default true)
 * - showFullscreenControl: render the fullscreen toggle (default true)
 * - showQualityControl: render the HD/4K quality toggle (default false)
 * - src4k: URL of the higher-quality source used by the quality toggle. When
 *   set, it is also preloaded in the background and the player upgrades to it
 *   automatically once it can play through - a manual quality switch cancels
 *   the automatic upgrade
 * - fullscreenMode: how the video fills the fullscreen - 'letterbox' |
 *   'width' | 'height' (default 'letterbox': whole video visible with bars)
 * - className: extra classes merged onto the player container (e.g. a
 *   fixed-height class to crop the video on mobile)
 * - cover: fills the container and crops the overflow (object-fit: cover).
 *   Pair with a container height via `className`; the video only crops when
 *   the container has a definite height.
 */
const VideoPlayer = ({
    src,
    autoPlay = true,
    loop = true,
    showVolumeControl = true,
    showFullscreenControl = true,
    showQualityControl = false,
    src4k,
    fullscreenMode = 'letterbox',
    className = '',
    cover = false,
}) => {
    const containerRef = useRef(null);
    const videoRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    // Sound is disabled by default.
    const [muted, setMuted] = useState(true);
    // Volume 0..1, driven by the vertical slider.
    const [volume, setVolume] = useState(1);
    // The source currently rendered into the <video> (HD or 4K).
    const [currentSrc, setCurrentSrc] = useState(src);
    // True once the user switched to the 4K source.
    const [is4K, setIs4K] = useState(false);
    // True while the higher-quality source is loading.
    const [isQualityLoading, setIsQualityLoading] = useState(false);
    // True when the blur/spinner overlay is visible (only if load > 1s).
    const [showQualityOverlay, setShowQualityOverlay] = useState(false);
    // Keeps the player box at the old video's aspect ratio while the new
    // source loads, so the layout doesn't collapse/flicker.
    const [placeholderAspectRatio, setPlaceholderAspectRatio] = useState(null);
    // Last frame of the old source, shown instead of black while the new
    // quality source loads.
    const [frozenFrameUrl, setFrozenFrameUrl] = useState(null);
    // Resume info for the pending quality switch (time + was playing).
    const pendingResumeRef = useRef(null);
    // 1s timer that decides whether the spinner overlay should appear.
    const qualityOverlayTimerRef = useRef(null);
    // True once the background HD -> 4K upgrade has run or been abandoned
    // (manual quality switch, load error), so it never runs twice.
    const autoUpgradeDoneRef = useRef(false);

    const isMuted = muted || volume === 0;

    // Keep the fullscreen state in sync with the browser's fullscreen element.
    useEffect(() => {
        const handler = () => {
            setIsFullscreen(getFullscreenElement() === containerRef.current);
        };
        document.addEventListener('fullscreenchange', handler);
        document.addEventListener('webkitfullscreenchange', handler);
        return () => {
            document.removeEventListener('fullscreenchange', handler);
            document.removeEventListener('webkitfullscreenchange', handler);
        };
    }, []);

    // Keep the DOM volume/muted state in sync (more reliable than the React
    // props alone - the browser otherwise clamps the first writes).
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.volume = volume;
        video.muted = muted || volume === 0;
    }, [volume, muted]);

    // Clear the quality-overlay timer if the player unmounts mid-switch.
    useEffect(() => {
        return () => clearTimeout(qualityOverlayTimerRef.current);
    }, []);

    // When the rendered source changes (quality switch), wait for the new
    // source to load, then resume playback from the saved position.
    useEffect(() => {
        const video = videoRef.current;
        const pending = pendingResumeRef.current;
        if (!video || !pending) return;
        pendingResumeRef.current = null;

        let finished = false;
        let resumed = false;
        const handleLoadedMetadata = () => {
            video.currentTime = pending.resumeTime;
        };
        const resume = () => {
            if (resumed || !pending.wasPlaying) return;
            resumed = true;
            video.play().catch(() => {});
        };
        const handleSeeked = () => resume();
        const handleCanPlay = () => {
            resume();
            finish();
        };
        const handleError = () => finish();
        const cleanup = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
        };
        const finish = () => {
            if (finished) return;
            finished = true;
            cleanup();
            clearTimeout(qualityOverlayTimerRef.current);
            setIsQualityLoading(false);
            setShowQualityOverlay(false);
            setPlaceholderAspectRatio(null);
            setFrozenFrameUrl(null);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('error', handleError);
        return cleanup;
    }, [currentSrc]);

    const toggleFullscreen = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;

        if (getFullscreenElement()) {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            return;
        }

        const request = el.requestFullscreen || el.webkitRequestFullscreen;
        if (request) {
            Promise.resolve(request.call(el)).catch(() => {});
        }
    }, []);

    const toggleSound = () => setMuted((prev) => !prev);

    // Swap the rendered source, remembering the current playback position so
    // the player resumes exactly where it left off instead of restarting.
    // Shared by the manual HD/4K button and the automatic background upgrade.
    const performSourceSwitch = (nextIs4K) => {
        const video = videoRef.current;
        if (!video) return;

        pendingResumeRef.current = {
            resumeTime: video.currentTime,
            wasPlaying: !video.paused,
        };
        // Keep the old video's aspect ratio and frame on screen while the
        // new source loads (no collapse, no black blink). The spinner only
        // appears if loading takes longer than 1 second.
        setPlaceholderAspectRatio(
            video.videoWidth && video.videoHeight
                ? `${video.videoWidth} / ${video.videoHeight}`
                : null
        );
        setFrozenFrameUrl(captureVideoFrame(video));
        setIs4K(nextIs4K);
        setIsQualityLoading(true);
        setShowQualityOverlay(false);
        clearTimeout(qualityOverlayTimerRef.current);
        qualityOverlayTimerRef.current = setTimeout(() => {
            setShowQualityOverlay(true);
        }, 1000);
        setCurrentSrc(nextIs4K ? src4k : src);
    };

    // Toggle between the HD and 4K sources in either direction. A manual
    // switch always wins over the automatic upgrade, so it disables it.
    const switchQuality = () => {
        if (!videoRef.current || !src4k || isQualityLoading) return;
        autoUpgradeDoneRef.current = true;
        performSourceSwitch(!is4K);
    };

    // Background quality upgrade: once the main source can play, fetch the
    // 4K file with a hidden preloader and, when the browser can play it
    // through, switch the player over - playback continues from the current
    // position. Skipped for data-saver users, who should not get a silent
    // 4K download.
    useEffect(() => {
        if (!src4k || navigator.connection?.saveData) return;
        const video = videoRef.current;
        if (!video) return;

        let cancelled = false;
        let preloader = null;

        const handleReady = () => {
            if (cancelled || autoUpgradeDoneRef.current) return;
            autoUpgradeDoneRef.current = true;
            performSourceSwitch(true);
        };
        const handleError = () => {
            autoUpgradeDoneRef.current = true;
        };

        // Start only after the main source can play, so the 4K download
        // never competes with the first seconds of playback.
        const startPreload = () => {
            if (cancelled || autoUpgradeDoneRef.current) return;
            preloader = document.createElement('video');
            preloader.preload = 'auto';
            preloader.muted = true;
            preloader.playsInline = true;
            preloader.src = src4k;
            preloader.addEventListener('canplaythrough', handleReady, { once: true });
            preloader.addEventListener('error', handleError, { once: true });
            preloader.load();
        };

        if (video.readyState >= 3) {
            startPreload();
        } else {
            video.addEventListener('canplay', startPreload, { once: true });
        }

        return () => {
            cancelled = true;
            video.removeEventListener('canplay', startPreload);
            if (preloader) {
                preloader.removeEventListener('canplaythrough', handleReady);
                preloader.removeEventListener('error', handleError);
                // Abort any download still in flight.
                preloader.removeAttribute('src');
                preloader.load();
            }
        };
    }, [src4k]);

    // Mobile: double-tap toggles fullscreen (touch devices only).
    const handleVideoDoubleClick = () => {
        if (window.matchMedia('(hover: none)').matches) toggleFullscreen();
    };

    // Fullscreen sizing mode: letterbox (contain), fill width, or fill height.
    const effectiveFullscreenMode = FULLSCREEN_MODES.includes(fullscreenMode)
        ? fullscreenMode
        : 'letterbox';

    return (
        <div
            ref={containerRef}
            className={`group relative rounded-xl overflow-hidden border border-white/[0.06] bg-black [:fullscreen]:rounded-none [:fullscreen]:border-0 player-video-fullscreen-${effectiveFullscreenMode} ${className}`}
        >
            <video
                ref={videoRef}
                src={currentSrc}
                className={`player-video w-full touch-manipulation ${cover ? 'h-full object-cover' : 'h-auto'}`}
                style={
                    placeholderAspectRatio
                        ? { aspectRatio: placeholderAspectRatio }
                        : undefined
                }
                autoPlay={autoPlay}
                loop={loop}
                muted={isMuted}
                playsInline
                controls={false}
                onDoubleClick={handleVideoDoubleClick}
            />
            {/* Last frame of the old source, covering the black blink while
                the new quality source loads. */}
            {frozenFrameUrl && (
                <img
                    src={frozenFrameUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
            )}
            {/* Blur + darken + spinner while the 4K source loads (fades in/out). */}
            <div
                className={`quality-overlay${showQualityOverlay ? ' quality-overlay-visible' : ''}`}
                aria-hidden="true"
            >
                <div className="quality-spinner" />
            </div>
            {(showVolumeControl || showFullscreenControl || showQualityControl) && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 [@media(hover:none)]:hidden">
                    {showQualityControl && src4k && (
                        <button
                            type="button"
                            onClick={switchQuality}
                            disabled={isQualityLoading}
                            aria-label={is4K ? 'Switch to HD' : 'Switch to 4K'}
                            title={is4K ? 'Switch to HD' : 'Switch to 4K'}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/50 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-sm cursor-pointer transition-all duration-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-wait"
                        >
                            {is4K ? '4K' : 'HD'}
                        </button>
                    )}
                    {showVolumeControl && (
                        <VolumeControl
                            volume={volume}
                            muted={muted}
                            onVolumeChange={setVolume}
                            onToggleMute={toggleSound}
                        />
                    )}
                    {showFullscreenControl && (
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                            className="p-2 rounded-lg bg-black/50 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-sm cursor-pointer transition-all duration-200"
                        >
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5" />
                            ) : (
                                <Maximize className="w-5 h-5" />
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;

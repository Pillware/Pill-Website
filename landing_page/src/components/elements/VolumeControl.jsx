import { useRef, useState } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';

/**
 * Vertical volume control for the video player: a mute button plus a
 * draggable vertical slider that unfolds on hover (desktop only). Owns its
 * own drag state and track ref; reports changes through callbacks.
 *
 * Props:
 * - volume: current volume 0..1
 * - muted: whether the mute toggle is on
 * - onVolumeChange(volume): called when the slider sets a new volume
 * - onToggleMute(): called when the mute button is clicked
 */
const VolumeControl = ({ volume, muted, onVolumeChange, onToggleMute }) => {
    const volumeTrackRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const isMuted = muted || volume === 0;

    // Convert a pointer position inside the volume track to a 0..1 volume.
    const updateVolumeFromPointer = (event) => {
        const track = volumeTrackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const ratio = 1 - (event.clientY - rect.top) / rect.height;
        onVolumeChange(Math.min(1, Math.max(0, ratio)));
    };

    // Start dragging the slider (pointer capture keeps the drag going even
    // when the cursor leaves the track). Adjusting implies intent to hear,
    // so clear the mute toggle.
    const handlePointerDown = (event) => {
        event.preventDefault();
        const track = volumeTrackRef.current;
        if (!track) return;
        track.setPointerCapture(event.pointerId);
        setIsDragging(true);
        if (muted) onToggleMute();
        updateVolumeFromPointer(event);
    };

    const handlePointerMove = (event) => {
        if (!isDragging) return;
        updateVolumeFromPointer(event);
    };

    const handlePointerUp = (event) => {
        setIsDragging(false);
        const track = volumeTrackRef.current;
        if (track?.hasPointerCapture?.(event.pointerId)) {
            track.releasePointerCapture(event.pointerId);
        }
    };

    return (
        <div className="volume-control relative flex flex-col gap-[10px]">
            <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Unmute' : 'Mute'}
                className="p-2 rounded-lg bg-black/50 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-sm cursor-pointer transition-all duration-200"
            >
                {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                ) : volume < 0.5 ? (
                    <Volume1 className="w-5 h-5" />
                ) : (
                    <Volume2 className="w-5 h-5" />
                )}
            </button>
            {/* Vertical volume slider, unfolds on hover (desktop only). */}
            <div
                className={`volume-slider${
                    isDragging ? ' volume-slider-dragging' : ''
                }${isMuted ? ' volume-slider-muted' : ''}`}
            >
                <div
                    ref={volumeTrackRef}
                    role="slider"
                    aria-label="Volume"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(volume * 100)}
                    className="volume-track"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <div
                        className="volume-fill"
                        style={{ height: `${volume * 100}%` }}
                    />
                    <div
                        className="volume-thumb"
                        style={{ bottom: `${volume * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default VolumeControl;

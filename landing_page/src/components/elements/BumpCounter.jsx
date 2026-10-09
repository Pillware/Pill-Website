import { useEffect, useRef, useState } from 'react';

/*
 * Animated counter for numeric stats.
 *
 * When the value changes the displayed number tweens from the previous
 * value to the new one (600ms, ease out). The number itself scales up
 * ONCE per burst of changes: while new values keep arriving it stays
 * enlarged without bumping again, and it eases back to its base scale as
 * soon as the counter settles on a final value.
 *
 * Visitors with reduced motion enabled get the new value instantly,
 * without tween or scaling.
 */

// Counter animation constants: how far the number scales up while its
// value is changing, and how long each animation phase runs, in
// milliseconds.
const RAISED_SCALE = 1.18;
const RAISE_DURATION_MILLISECONDS = 180;
const RELEASE_DURATION_MILLISECONDS = 320;
const TWEEN_DURATION_MILLISECONDS = 600;

const BumpCounter = ({ value }) => {
    const [displayedValue, setDisplayedValue] = useState(value);

    // Mirrors the displayed number so the tween can read it without
    // restarting on every animation frame.
    const displayedValueRef = useRef(value);

    const numberRef = useRef(null);
    const scaleAnimationRef = useRef(null);
    const isRaisedRef = useRef(false);

    // Current scale of the number, so a new animation can continue
    // smoothly from wherever the previous one left off.
    const readNumberScale = () => {
        const node = numberRef.current;

        if (!node) {
            return 1;
        }

        const transformValue = getComputedStyle(node).transform;

        if (!transformValue || transformValue === 'none') {
            return 1;
        }

        try {
            return new DOMMatrixReadOnly(transformValue).a;
        } catch {
            return 1;
        }
    };

    // Grows the number on the first change of a burst. Calls while it is
    // already raised are ignored so continuing changes do not restart
    // the scaling.
    const raiseNumberScale = () => {
        const node = numberRef.current;

        if (isRaisedRef.current || !node) {
            return;
        }

        // Read the scale before cancelling the previous animation so the
        // new one starts exactly where the old one stopped.
        const from = readNumberScale();

        isRaisedRef.current = true;

        scaleAnimationRef.current?.cancel();

        scaleAnimationRef.current = node.animate(
            [
                { transform: `scale(${from})` },
                { transform: `scale(${RAISED_SCALE})` },
            ],
            {
                duration: RAISE_DURATION_MILLISECONDS,
                easing: 'ease-out',
                fill: 'forwards',
            },
        );
    };

    // Eases the number back to its base scale once the counter has
    // stopped adding.
    const releaseNumberScale = () => {
        const node = numberRef.current;

        if (!isRaisedRef.current || !node) {
            return;
        }

        const from = readNumberScale();

        isRaisedRef.current = false;

        scaleAnimationRef.current?.cancel();

        const settleAnimation = node.animate(
            [
                { transform: `scale(${from})` },
                { transform: 'scale(1)' },
            ],
            {
                duration: RELEASE_DURATION_MILLISECONDS,
                easing: 'ease-out',
                fill: 'forwards',
            },
        );

        scaleAnimationRef.current = settleAnimation;

        // Drop the fill after settling so the element returns to its
        // natural, untransformed state.
        settleAnimation.finished
            .then(() => {
                if (scaleAnimationRef.current === settleAnimation) {
                    settleAnimation.cancel();
                    scaleAnimationRef.current = null;
                }
            })
            .catch(() => {});
    };

    // Cancels any active scale animation and returns to base scale.
    const resetNumberScale = () => {
        isRaisedRef.current = false;
        scaleAnimationRef.current?.cancel();
        scaleAnimationRef.current = null;
    };

    useEffect(() => {
        if (value == null) {
            resetNumberScale();
            displayedValueRef.current = null;
            setDisplayedValue(null);

            return undefined;
        }

        const displayed = displayedValueRef.current;

        // Skip when the number has not actually changed.
        if (displayed === value) {
            return undefined;
        }

        const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (reduceMotion) {
            resetNumberScale();
            displayedValueRef.current = value;
            setDisplayedValue(value);

            return undefined;
        }

        // The first real reading tweens from zero so the counter
        // visibly arrives instead of popping in.
        const from = displayed ?? 0;
        const startTime = performance.now();

        // Scale up once per burst of changes.
        raiseNumberScale();

        let tweenFrame = null;

        // Time based so throttled or dropped frames (background tab)
        // still land exactly on the target value.
        const step = (now) => {
            const progress = Math.min(
                (now - startTime) / TWEEN_DURATION_MILLISECONDS,
                1,
            );

            // Ease out cubic: fast start, soft landing.
            const eased = 1 - Math.pow(1 - progress, 3);

            const next =
                progress >= 1
                    ? value
                    : Math.round(from + (value - from) * eased);

            displayedValueRef.current = next;
            setDisplayedValue(next);

            if (progress < 1) {
                tweenFrame = requestAnimationFrame(step);
            } else {
                // The counter has stopped adding: return to base scale.
                releaseNumberScale();
            }
        };

        tweenFrame = requestAnimationFrame(step);

        return () => {
            if (tweenFrame !== null) {
                cancelAnimationFrame(tweenFrame);
            }
        };
    }, [value]);

    // Cancel any lingering scale animation on unmount. Kept separate from
    // the tween effect because the raised scale intentionally survives
    // tween restarts within a burst.
    useEffect(
        () => () => {
            scaleAnimationRef.current?.cancel();
        },
        [],
    );

    return (
        <span ref={numberRef} className="inline-block">
            {displayedValue == null
                ? '—'
                : displayedValue.toLocaleString()}
        </span>
    );
};

export default BumpCounter;

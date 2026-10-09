import { useState } from 'react';
import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { defaultAuroraParams } from './Aurora';

// Slider metadata for every tunable Aurora value: the params key, the panel
// label, and the slider range. Kept as data so the panel stays declarative
// and a new knob only needs one entry here.
const controlGroups = [
    {
        label: 'Reveal',
        controls: [
            { key: 'revealDelay', label: 'Reveal delay (s)', min: 0, max: 2, step: 0.05 },
        ],
    },
    {
        label: 'Reeded glass',
        controls: [
            { key: 'ribWidth', label: 'Rib width (px)', min: 20, max: 320, step: 5 },
            { key: 'ribRotation', label: 'Rib rotation (deg)', min: -90, max: 90, step: 1 },
            { key: 'ribRefraction', label: 'Rib refraction', min: 0, max: 200, step: 5 },
            { key: 'edgeGlint', label: 'Edge glint', min: 0, max: 1, step: 0.01 },
            { key: 'lightLeak', label: 'Light leak', min: 0, max: 1.5, step: 0.01 },
            { key: 'leakVariation', label: 'Leak variation', min: 0, max: 1, step: 0.05 },
            { key: 'leakFlicker', label: 'Leak flicker', min: 0, max: 1, step: 0.05 },
            { key: 'ribReflections', label: 'Rib reflections', min: 0, max: 1.5, step: 0.01 },
        ],
    },
    {
        label: 'Gradient',
        controls: [
            { key: 'gradientSpeed', label: 'Gradient speed', min: 0, max: 3, step: 0.05 },
            { key: 'exposure', label: 'Exposure', min: 0.2, max: 2.5, step: 0.05 },
        ],
    },
    {
        label: 'Noise warp',
        controls: [
            { key: 'noiseScaleX', label: 'Noise scale X', min: 0.05, max: 1.5, step: 0.05 },
            { key: 'noiseScaleY', label: 'Noise scale Y', min: 0.05, max: 1.5, step: 0.05 },
            { key: 'warpStrength', label: 'Warp strength', min: 0, max: 0.8, step: 0.01 },
            { key: 'warpSpeed', label: 'Warp speed', min: 0, max: 1, step: 0.01 },
        ],
    },
    {
        label: 'Texture',
        controls: [
            { key: 'filmGrain', label: 'Film grain', min: 0, max: 0.2, step: 0.002 },
            { key: 'pillPattern', label: 'Pill pattern', min: 0, max: 1.5, step: 0.05 },
            { key: 'pillScale', label: 'Pill scale (px)', min: 10, max: 400, step: 1 },
        ],
    },
    {
        label: 'Dither',
        controls: [
            {
                key: 'ditherPattern',
                label: 'Pattern',
                type: 'select',
                options: [
                    { value: 0, label: 'None' },
                    { value: 1, label: 'Bayer 4x4' },
                    { value: 2, label: 'Bayer 8x8' },
                    { value: 3, label: 'Gradient noise' },
                    { value: 4, label: 'Random' },
                ],
            },
            { key: 'ditherAmount', label: 'Dither amount', min: 0, max: 1, step: 0.01 },
            {
                type: 'range',
                label: 'Brightness range',
                keys: ['brightnessRangeStart', 'brightnessRangeEnd'],
                min: 0,
                max: 1,
                step: 0.01,
            },
            { key: 'ditherLevels', label: 'Dither levels', min: 2, max: 12, step: 1 },
            { key: 'ditherScale', label: 'Dither scale (px)', min: 1, max: 6, step: 1 },
        ],
    },
];

// Compact display for a slider value: trims float noise to three decimals.
const formatSliderValue = (value) => (Math.round(value * 1000) / 1000).toString();

/**
 * Floating tuning panel for the Aurora hero effect. Renders as an absolutely
 * positioned glass card in the top right corner of its parent; every slider
 * drives the shader live through the params object owned by the parent.
 */
const AuroraControls = ({ params, onChange, onReset, isPaused, onTogglePause, fps }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Slider handler factory: forwards one key's new numeric value to the
    // parent, which owns the whole params object.
    const handleSliderChange = (key) => (event) => {
        onChange(key, Number(event.target.value));
    };

    // Select handler factory: same contract as the sliders, for the pickers.
    const handleSelectChange = (key) => (event) => {
        onChange(key, Number(event.target.value));
    };

    // Resolves a params value with the authored default as the fallback, so a
    // hot-reload with stale parent state cannot leave a control showing NaN.
    const paramValue = (key) => params[key] ?? defaultAuroraParams[key];

    // Range handler factory: forwards the moved thumb of a two-handle range
    // slider, clamped so the thumbs keep a minimum gap (the shader's fade
    // band needs its start strictly below its end).
    const rangeThumbMinimumGap = 0.05;
    const handleRangeChange = (control, thumbIndex) => (event) => {
        const [lowKey, highKey] = control.keys;
        const movedValue = Number(event.target.value);
        if (thumbIndex === 0) {
            onChange(lowKey, Math.min(movedValue, paramValue(highKey) - rangeThumbMinimumGap));
        } else {
            onChange(highKey, Math.max(movedValue, paramValue(lowKey) + rangeThumbMinimumGap));
        }
    };

    return (
        <div className="absolute right-4 top-20 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-black/55 backdrop-blur-md text-white shadow-2xl shadow-black/40">
            {/* Header: title, the live FPS readout, and the reset/collapse
                controls - always visible so the folded panel still shows the
                frame rate. */}
            <div className="flex items-center gap-1 px-3 py-2">
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                <span className="flex-1 min-w-0 truncate text-[11px] font-semibold uppercase tracking-widest text-white/80">
                    Effect controls
                </span>
                <span
                    className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] leading-none tabular-nums text-white/70"
                    title="Aurora render rate"
                >
                    {fps === null || fps === undefined ? '-- FPS' : `${fps} FPS`}
                </span>
                <button
                    type="button"
                    onClick={onReset}
                    title="Reset to defaults"
                    aria-label="Reset effect controls"
                    className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => setIsCollapsed((previous) => !previous)}
                    title={isCollapsed ? 'Expand controls' : 'Collapse controls'}
                    aria-label={isCollapsed ? 'Expand effect controls' : 'Collapse effect controls'}
                    aria-expanded={!isCollapsed}
                    className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>
            </div>

            {!isCollapsed && (
                <div className="px-3 pb-3 max-h-[62vh] overflow-y-auto space-y-3">
                    {controlGroups.map((group) => (
                        <div key={group.label}>
                            <div className="text-[10px] uppercase tracking-widest text-white/35 mb-1.5">{group.label}</div>
                            <div className="space-y-2">
                                {group.controls.map((control) => (
                                    control.type === 'select' ? (
                                        <label key={control.key} className="block">
                                            <span className="flex items-center justify-between text-[11px] text-white/60">
                                                <span>{control.label}</span>
                                            </span>
                                            <select
                                                value={paramValue(control.key)}
                                                onChange={handleSelectChange(control.key)}
                                                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white/85 outline-none cursor-pointer focus:border-brand-500/60"
                                            >
                                                {control.options.map((option) => (
                                                    <option key={option.value} value={option.value} className="bg-[#141418] text-white">
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    ) : control.type === 'range' ? (
                                        <label key={control.keys.join('-')} className="block">
                                            <span className="flex items-center justify-between text-[11px] text-white/60">
                                                <span>{control.label}</span>
                                                <span className="tabular-nums text-white/85">
                                                    {formatSliderValue(paramValue(control.keys[0]))} - {formatSliderValue(paramValue(control.keys[1]))}
                                                </span>
                                            </span>
                                            <div className="dual-range mt-1">
                                                <div className="dual-range-track" aria-hidden="true" />
                                                <div
                                                    className="dual-range-fill"
                                                    aria-hidden="true"
                                                    style={{
                                                        left: `${(((paramValue(control.keys[0]) - control.min) / (control.max - control.min)) * 100)}%`,
                                                        right: `${100 - (((paramValue(control.keys[1]) - control.min) / (control.max - control.min)) * 100)}%`,
                                                    }}
                                                />
                                                <input
                                                    type="range"
                                                    min={control.min}
                                                    max={control.max}
                                                    step={control.step}
                                                    value={paramValue(control.keys[0])}
                                                    onChange={handleRangeChange(control, 0)}
                                                    aria-label={`${control.label} minimum`}
                                                    style={{ zIndex: paramValue(control.keys[0]) > (control.min + control.max) / 2 ? 5 : 3 }}
                                                />
                                                <input
                                                    type="range"
                                                    min={control.min}
                                                    max={control.max}
                                                    step={control.step}
                                                    value={paramValue(control.keys[1])}
                                                    onChange={handleRangeChange(control, 1)}
                                                    aria-label={`${control.label} maximum`}
                                                    style={{ zIndex: 4 }}
                                                />
                                            </div>
                                        </label>
                                    ) : (
                                        <label key={control.key} className="block cursor-pointer">
                                            <span className="flex items-center justify-between text-[11px] text-white/60">
                                                <span>{control.label}</span>
                                                <span className="tabular-nums text-white/85">{formatSliderValue(paramValue(control.key))}</span>
                                            </span>
                                            <input
                                                type="range"
                                                min={control.min}
                                                max={control.max}
                                                step={control.step}
                                                value={paramValue(control.key)}
                                                onChange={handleSliderChange(control.key)}
                                                className="mt-1 w-full accent-brand-500 cursor-pointer"
                                            />
                                        </label>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Pause freezes the shader clock in place; the sliders
                        keep working, so any frozen frame can still be tuned. */}
                    <label className="flex items-center gap-2 pt-2 border-t border-white/10 text-[11px] text-white/60 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isPaused}
                            onChange={onTogglePause}
                            className="accent-brand-500"
                        />
                        Pause animation
                    </label>
                </div>
            )}
        </div>
    );
};

export default AuroraControls;

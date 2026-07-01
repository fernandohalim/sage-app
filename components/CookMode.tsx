"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Recipe, ScaledIngredient } from "@/lib/engine";
import { scaleByFactor } from "@/lib/engine";
import { formatQuantity } from "@/lib/format";
import { useWakeLock } from "@/lib/useWakeLock";

/** M:SS from seconds, e.g. 90 → "1:30". */
function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

interface RunningTimer {
  /** Step id — one timer per step; starting again resets it. */
  key: string;
  label: string;
  total: number;
  remaining: number;
  done: boolean;
}

/**
 * Cook mode: enlarged, high-contrast, hands-free-friendly. Each step shows its
 * scaled ingredient amounts inline (pulled from the same engine `ScaleResult`),
 * steps with a timer get a tappable countdown, and any number can run at once.
 * The screen is kept awake for the duration.
 */
export function CookMode({
  recipe,
  factor,
}: {
  recipe: Recipe;
  factor: number;
}) {
  useWakeLock(true);

  const result = useMemo(
    () => scaleByFactor(recipe, factor > 0 ? factor : 1),
    [recipe, factor],
  );

  const scaledById = useMemo(() => {
    const map = new Map<string, ScaledIngredient>();
    for (const s of result.ingredients) map.set(s.ingredient.id, s);
    return map;
  }, [result]);

  // --- Concurrent timers, driven by one interval ---
  const [timers, setTimers] = useState<RunningTimer[]>([]);
  const alerted = useRef<Set<string>>(new Set());

  const anyRunning = timers.some((t) => t.remaining > 0);

  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) =>
          t.remaining > 0 ? { ...t, remaining: t.remaining - 1 } : t,
        ),
      );
    }, 1000);
    return () => clearInterval(id);
  }, [anyRunning]);

  // Fire a gentle alert as each timer reaches zero (once per run).
  useEffect(() => {
    for (const t of timers) {
      if (t.remaining === 0 && !t.done && !alerted.current.has(t.key)) {
        alerted.current.add(t.key);
        notifyTimerDone();
        setTimers((prev) =>
          prev.map((p) => (p.key === t.key ? { ...p, done: true } : p)),
        );
      }
    }
  }, [timers]);

  const startTimer = useCallback((key: string, label: string, total: number) => {
    alerted.current.delete(key);
    setTimers((prev) => {
      const next = prev.filter((t) => t.key !== key);
      return [...next, { key, label, total, remaining: total, done: false }];
    });
  }, []);

  const dismissTimer = useCallback((key: string) => {
    alerted.current.delete(key);
    setTimers((prev) => prev.filter((t) => t.key !== key));
  }, []);

  const timerFor = (key: string) => timers.find((t) => t.key === key);

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-terracotta">
            Cook mode
          </span>
          <h1 className="font-display text-3xl font-semibold leading-tight text-ink">
            {recipe.title}
          </h1>
          <p className="num text-sm text-muted">
            {formatServings(result.targetServings)} · {formatFactor(factor)}
          </p>
        </div>
        <Link
          href={`/recipe/${recipe.id}`}
          className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-terracotta hover:text-terracotta"
        >
          Done
        </Link>
      </header>

      {/* Steps with inline scaled amounts + timers */}
      <ol className="flex flex-col gap-5">
        {recipe.steps.map((step, i) => {
          const refs = step.ingredientRefs
            .map((id) => scaledById.get(id))
            .filter((s): s is ScaledIngredient => Boolean(s));
          const active = step.timerSeconds ? timerFor(step.id) : undefined;

          return (
            <li
              key={step.id}
              className="rounded-2xl border border-line bg-surface p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="num flex size-9 shrink-0 items-center justify-center rounded-full bg-terracotta/12 text-base font-semibold text-terracotta">
                  {i + 1}
                </span>
                {step.title && (
                  <h2 className="font-display text-xl font-semibold text-ink">
                    {step.title}
                  </h2>
                )}
              </div>

              {/* Inline scaled amounts for this step's ingredients */}
              {refs.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {refs.map((s) => (
                    <span
                      key={s.ingredient.id}
                      className={`num rounded-lg px-2.5 py-1 text-[15px] font-medium ${
                        s.wasAdjusted && s.ingredient.scalingClass !== "fixed"
                          ? "bg-saffron/15 text-saffron"
                          : "bg-canvas text-ink"
                      }`}
                    >
                      {formatQuantity(s.scaledAmount, s.ingredient.unit)}{" "}
                      <span className="font-normal text-muted">
                        {s.ingredient.name}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {step.text && (
                <p className="text-lg leading-relaxed text-ink">{step.text}</p>
              )}

              {/* Timer control */}
              {step.timerSeconds !== undefined && (
                <div className="mt-4">
                  {active ? (
                    <TimerChip
                      timer={active}
                      onRestart={() =>
                        startTimer(
                          step.id,
                          step.title || `Step ${i + 1}`,
                          step.timerSeconds!,
                        )
                      }
                      onDismiss={() => dismissTimer(step.id)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        startTimer(
                          step.id,
                          step.title || `Step ${i + 1}`,
                          step.timerSeconds!,
                        )
                      }
                      className="num inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Start {formatClock(step.timerSeconds)} timer
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Fixed bottom bar: every live/finished timer, visible while scrolling */}
      {timers.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-20 mx-auto flex max-w-2xl flex-col gap-2 px-4">
          {timers.map((t) => (
            <div
              key={t.key}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${
                t.done
                  ? "border-rust/40 bg-rust/15"
                  : "border-line bg-surface-raised/95"
              }`}
            >
              <span className="flex-1 truncate text-sm font-medium text-ink">
                {t.label}
              </span>
              <span
                className={`num text-lg font-semibold tabular-nums ${
                  t.done ? "text-rust" : "text-ink"
                }`}
              >
                {t.done ? "Time's up" : formatClock(t.remaining)}
              </span>
              <button
                type="button"
                onClick={() => dismissTimer(t.key)}
                className="rounded-full px-2 py-1 text-sm font-medium text-muted transition-colors hover:text-ink"
                aria-label="Dismiss timer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimerChip({
  timer,
  onRestart,
  onDismiss,
}: {
  timer: RunningTimer;
  onRestart: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <span
        className={`num inline-flex items-center rounded-full px-5 py-2.5 text-base font-semibold ${
          timer.done ? "bg-rust/15 text-rust" : "bg-canvas text-ink"
        }`}
      >
        {timer.done ? "Time's up" : formatClock(timer.remaining)}
      </span>
      <button
        type="button"
        onClick={onRestart}
        className="text-sm font-medium text-terracotta transition-opacity hover:opacity-80"
      >
        Restart
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        Clear
      </button>
    </div>
  );
}

/** A short, non-alarming chime + a vibration where supported. */
function notifyTimerDone() {
  try {
    if ("vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* ignore */
  }
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    /* audio not available */
  }
}

function formatServings(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const label = rounded === 1 ? "serving" : "servings";
  return `${rounded.toFixed(2).replace(/\.?0+$/, "")} ${label}`;
}

function formatFactor(factor: number): string {
  return `${(Math.round(factor * 100) / 100).toFixed(2).replace(/\.?0+$/, "")}×`;
}

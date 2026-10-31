import React, { useState } from "react";

// "Artha Mint" loader. Styles live in the critical inline <style> in index.html (shared with
// the pre-hydration #app-loading splash, which renders this exact markup), so the splash →
// React handoff is pixel-identical. --ad-t phase-locks every loop to the page clock, so the
// animation continues rather than restarting when the splash fades out on top of this.

const EDGES = Array.from({ length: 12 }, (_, i) => i);
const MOTES = [
  [28, 0],
  [44, -1.3],
  [58, -2.6],
  [70, -0.7],
  [36, -3.4],
  [64, -2],
];
const WORDS = ["Plan", "Grow", "Secure", "Prosper"];
const ORBITS = [1, 2, 3];

// Orbits render twice: once behind the coin, once (clipped to the near half) in front of it.
const orbit = (n: number) => (
  <div key={n} className={`ad-orbit ad-orbit--${n}`}>
    <div className="ad-ring">
      <i className="ad-node" />
    </div>
  </div>
);

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

export function LoadingScreen() {
  const [phase] = useState(() => `${-performance.now()}ms`);

  return (
    <div
      className="ad-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{ "--ad-t": phase } as CSSVars}
    >
      <div className="ad-stage" aria-hidden="true">
        <div className="ad-floor" />
        {MOTES.map(([x, d]) => (
          <i key={x} className="ad-mote" style={{ "--x": `${x}%`, "--d": `${d}s` } as CSSVars} />
        ))}
        <div className="ad-scene">
          <div className="ad-gyro">{ORBITS.map(orbit)}</div>
        </div>
        <div className="ad-scene">
          <div className="ad-gyro">
            <div className="ad-coin">
              {EDGES.map((i) => (
                <i key={i} className="ad-coin-edge" style={{ "--i": i } as CSSVars} />
              ))}
              <div className="ad-coin-face ad-coin-face--front">
                <img src="/logo.png" alt="" />
              </div>
              <div className="ad-coin-face ad-coin-face--back">&#8377;</div>
            </div>
          </div>
        </div>
        {ORBITS.map((n) => (
          <div key={n} className={`ad-scene ad-scene--front-${n}`}>
            <div className="ad-gyro">{orbit(n)}</div>
          </div>
        ))}
      </div>
      <div className="ad-words" aria-hidden="true">
        {WORDS.map((w, i) => (
          <React.Fragment key={w}>
            {i > 0 && <b>&bull;</b>}
            <span style={{ "--d": `${i * 1.2}s` } as CSSVars}>{w}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="ad-track" aria-hidden="true">
        <i />
      </div>
      <span className="ad-sr">Loading your dashboard…</span>
    </div>
  );
}

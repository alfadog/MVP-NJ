export const MEMORY_MATRIX_ORIGINAL_CSS = String.raw`
:host {
  color-scheme: light dark;
  --bg-color: #f6ede2;
  --bg-texture: radial-gradient(circle at 20% 20%, rgba(253, 244, 215, 0.7) 0%, rgba(247, 229, 204, 0.9) 35%, rgba(226, 196, 171, 0.9) 60%, rgba(201, 163, 140, 0.95) 100%);
  --surface-color: rgba(255, 253, 250, 0.92);
  --text-primary: #3b2f2a;
  --text-secondary: rgba(59, 47, 42, 0.7);
  --accent: #3cc7c4;
  --accent-soft: rgba(60, 199, 196, 0.18);
  --correct: #22c55e;
  --correct-strong: #1a9e4d;
  --correct-contrast: #0e1d13;
  --danger: #ef4444;
  --overlay: rgba(28, 18, 14, 0.7);
  --card-shadow: 0 18px 45px rgba(82, 53, 39, 0.28);
  --card-radius: 20px;
  --board-frame: #4b3a32;
  --board-cell: #6a4f3f;
  --board-highlight: #3cc7c4;
  --board-correct: #22c55e;
  --board-fail: #ef4444;
  --board-mark: #fefce8;
  --board-remaining-fill: rgba(60, 199, 196, 0.2);
  --board-remaining-outline: rgba(60, 199, 196, 0.8);
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
}

:host[data-theme='dark'] {
  --bg-color: #121012;
  --bg-texture: radial-gradient(circle at 15% 15%, rgba(61, 50, 44, 0.65) 0%, rgba(47, 38, 34, 0.85) 40%, rgba(24, 19, 17, 0.94) 100%);
  --surface-color: rgba(34, 27, 24, 0.92);
  --text-primary: #fdf7f1;
  --text-secondary: rgba(253, 247, 241, 0.68);
  --overlay: rgba(10, 7, 6, 0.78);
  --card-shadow: 0 16px 46px rgba(0, 0, 0, 0.45);
}

:host[data-theme='dark'] .hud {
  color: #fff;
}

:host {
  -webkit-text-size-adjust: 100%;
}

html {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
}

* {
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  min-height: 100vh;
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
  background: var(--bg-texture);
  color: var(--text-primary);
}

button {
  font: inherit;
}

#app {
  min-height: 100vh;
}

.app {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.app__backdrop {
  position: absolute;
  inset: 0;
  background: var(--bg-texture);
  filter: saturate(1.05);
  z-index: 0;
}

.home,
.play,
.prelevel,
.pause,
.modal,
.gameover {
  position: relative;
  z-index: 1;
}

.home,
.play {
  width: min(460px, 100%);
}

.home {
  display: none;
  padding: 32px 20px;
}

.home--visible {
  display: block;
}

.home__card {
  background: var(--surface-color);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: 28px 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
}

.home__cover {
  width: 160px;
  height: 160px;
  border-radius: 20px;
  object-fit: cover;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.35);
}

.home__title {
  margin: 0;
  font-size: 32px;
  letter-spacing: 0.04em;
}

.home__description {
  margin: 0;
  font-size: 16px;
  color: var(--text-secondary);
}

.home__stats {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 15px;
  color: var(--text-secondary);
}

.home__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.home__stat strong {
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.home__stat em {
  font-style: normal;
  font-size: 22px;
  color: var(--text-primary);
}

.home__actions {
  width: 100%;
  display: flex;
  gap: 16px;
}

.button {
  flex: 1;
  border: none;
  border-radius: 16px;
  padding: 14px 18px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
  background: rgba(255, 255, 255, 0.18);
  color: var(--text-primary);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.16);
}

.button:active {
  transform: scale(0.97);
}

.button--primary {
  background: linear-gradient(135deg, #3cc7c4 0%, #2aa39f 100%);
  color: #062223;
}

.button--icon {
  flex: 0 0 auto;
  width: 54px;
  height: 54px;
  border-radius: 999px;
  font-size: 26px;
  background: rgba(8, 47, 73, 0.08);
  color: var(--text-primary);
}

.play {
  display: none;
  flex-direction: column;
  gap: 18px;
  padding: 36px 20px 32px;
  filter: none;
  transition: filter 180ms ease;
}

.play--visible {
  display: flex;
}

.play--paused {
  filter: blur(6px) brightness(0.6);
}

.hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--board-frame);
}

.hud__pause {
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: inherit;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  font-size: 26px;
  cursor: pointer;
  transition: transform 140ms ease;
}

.hud__pause:active {
  transform: scale(0.92);
}

.hud__level {
  flex: 1;
  text-align: center;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: inherit;
}

.hud__right {
  display: flex;
  gap: 18px;
}

.hud__metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: inherit;
}

.hud__metric span {
  opacity: 0.75;
}

.hud__metric strong {
  font-size: 22px;
  letter-spacing: 0.04em;
}

.board {
  position: relative;
  width: min(440px, 94vw);
  background: var(--board-frame);
  border-radius: 28px;
  box-shadow: 0 26px 58px rgba(36, 23, 16, 0.35);
  padding: clamp(16px, 4vw, 22px);
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(var(--grid-cols, 3), minmax(0, 1fr));
  grid-template-rows: repeat(var(--grid-rows, 3), minmax(0, 1fr));
  grid-auto-rows: minmax(0, 1fr);
  gap: clamp(6px, 1.6vw, 10px);
  padding: clamp(6px, 1.4vw, 10px);
  background: var(--board-frame);
  border-radius: 20px;
  transition: opacity 160ms ease;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.grid--disabled {
  pointer-events: none;
  opacity: 0.68;
}

.cell {
  border: none;
  border-radius: 16px;
  background: var(--board-cell);
  color: var(--board-mark);
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: background 160ms ease, box-shadow 160ms ease;
  box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.16);
  touch-action: manipulation;
}

.cell:active {
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.24);
}

.cell--pressed {
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.24);
}

.cell__mark {
  min-width: 0;
  min-height: 0;
  opacity: 0;
  transform: translateY(6px) scale(0.9);
  transition: opacity 150ms ease, transform 150ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(18px, 4.8vw, 28px);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--board-mark);
}

.cell__mark--show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.cell__mark--positive {
  color: var(--board-mark);
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
}

.cell__mark--negative {
  color: #ffe9e9;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
}

.cell--preview {
  background: var(--board-highlight);
  box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.12);
}

.cell--flash-ok {
  background: var(--board-correct);
  box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.14);
}

.cell--remembered {
  background: var(--board-highlight);
  box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.1);
}

.cell--fail {
  background: var(--board-fail);
  box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.18);
}

.cell--remaining {
  background: var(--board-remaining-fill);
  box-shadow: inset 0 0 0 2px var(--board-remaining-outline);
  position: relative;
}

.board__skip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: clamp(120px, 38vw, 160px);
  height: clamp(120px, 38vw, 160px);
  border-radius: 50%;
  border: 2px solid #fff;
  background: transparent;
  color: #fff;
  font-size: clamp(16px, 4.6vw, 22px);
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.2;
  text-align: center;
  white-space: pre-line;
  opacity: 0;
  pointer-events: none;
  transition: opacity 140ms ease;
}

.board__skip > span {
  display: block;
}

.board__skip--visible {
  opacity: 0.3;
  pointer-events: auto;
}

.board__skip:disabled {
  pointer-events: none;
}

.prelevel {
  position: fixed;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(28, 18, 14, 0.45);
  z-index: 5;
  backdrop-filter: blur(3px);
}

.prelevel--visible {
  display: flex;
}

.prelevel__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.prelevel__banner {
  padding: 18px 30px;
  border-radius: 999px;
  background: rgba(16, 12, 10, 0.72);
  color: #fefcf9;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 180ms ease, transform 180ms ease;
}

.prelevel__banner-title {
  font-size: clamp(20px, 6vw, 28px);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: none;
}

.prelevel__banner-subtitle {
  font-size: clamp(16px, 4.5vw, 20px);
  letter-spacing: 0.04em;
  text-align: center;
  text-transform: none;
}

.prelevel__banner--show {
  opacity: 1;
  transform: translateY(0);
}

.bubble {
  display: none;
}

.bubble--in {
  opacity: 1;
  transform: scale(1);
}

.pause {
  position: fixed;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: var(--overlay);
  padding: 24px;
  z-index: 6;
}

.pause--visible {
  display: flex;
}

.pause__card {
  width: min(340px, 100%);
  background: var(--surface-color);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: 32px 26px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  text-align: center;
}

.pause__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pause__button {
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  background: rgba(8, 47, 73, 0.08);
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 140ms ease, background 140ms ease;
}

.pause__button:active {
  transform: scale(0.97);
}

.modal {
  position: fixed;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--overlay);
  z-index: 7;
}

.modal--visible {
  display: flex;
}

.modal__card {
  width: min(360px, 100%);
  background: var(--surface-color);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: 32px 26px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.modal__title {
  margin: 0;
  text-align: center;
  font-size: 26px;
}

.modal__list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 16px;
}

.modal__list strong {
  font-weight: 700;
  color: var(--text-primary);
}

.modal__close {
  align-self: center;
  width: 160px;
}

.gameover {
  position: fixed;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 6;
}

.gameover--visible {
  display: flex;
}

.gameover__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  pointer-events: auto;
}

.gameover__title {
  margin: 0;
  font-size: clamp(32px, 8vw, 42px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--board-highlight);
  text-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
  opacity: 0;
  transform: translateY(12px);
}

.gameover__title--animate {
  animation: gameover-fade 1.1s ease forwards;
}

.gameover__score,
.gameover__best {
  margin: 0;
  padding: 8px 16px;
  border-radius: 999px;
  letter-spacing: 0.05em;
  background: rgba(16, 12, 10, 0.65);
  color: #fefcf9;
  backdrop-filter: blur(2px);
  text-align: center;
}

.gameover__score {
  font-size: clamp(20px, 6vw, 28px);
  font-weight: 700;
}

.gameover__best {
  font-size: clamp(16px, 4.5vw, 20px);
}

.gameover__actions {
  display: flex;
  gap: 18px;
}

.gameover__action {
  width: 68px;
  height: 68px;
  border-radius: 999px;
  border: none;
  background: rgba(15, 10, 8, 0.78);
  color: var(--board-highlight);
  font-size: 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.gameover__action:active {
  transform: scale(0.95);
}

.gameover__icon {
  width: 28px;
  height: 28px;
  display: block;
}

@keyframes gameover-fade {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .home__cover {
    width: 140px;
    height: 140px;
  }

  .home__title {
    font-size: 28px;
  }

  .play {
    padding: 28px 16px;
  }

  .hud__level {
    font-size: 22px;
  }

  .bubble {
    width: 104px;
    height: 104px;
    font-size: 40px;
    border-width: 5px;
  }
}

`;

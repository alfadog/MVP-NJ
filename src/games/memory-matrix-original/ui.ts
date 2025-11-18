import { checkPick, getPatternDuration, levelDown, nextLevel, startLevel, startSession } from './game'
import { getBestLevel, setBestLevel, getResultHistory, recordResult } from './storage'
import type { ResultEntry } from './storage'
import type { LevelState, UIOptions } from './types'
import {
  createGridInputTelemetry,
  getCellIndex as readCellIndex,
  markCellRemembered,
  resolveGridInputFeature,
  resetCellState,
  setupGridInputController,
  type GridActivationResult,
  type GridInputController,
} from './input'

type Mode = 'home' | 'prelevel' | 'pattern' | 'input' | 'paused' | 'gameover';
type PrelevelMessage = { title: string; subtitle?: string };

type LeaderboardEntry = {
  position: number;
  score: number;
  user: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
};

type ScoreSubmitResponse = {
  accepted: boolean;
  best_score?: number;
  top?: LeaderboardEntry[];
  me?: LeaderboardEntry;
  error?: string;
};

const COUNTDOWN_START = 3;
const COUNTDOWN_INTERVAL_MS = 500;
const SESSION_MS = 100_000;
const SESSION_SECONDS = SESSION_MS / 1000;

export function initMemoryMatrixOriginalUI(options: UIOptions): () => void {
  const root = options.container;
  const host = options.hostElement;

  root.innerHTML = '';
  host.setAttribute('data-theme', options.initialScheme);

  const appEl = document.createElement('div');
  appEl.className = 'app';

  const backdropEl = document.createElement('div');
  backdropEl.className = 'app__backdrop';

  const homeEl = createHome();
  const playEl = createPlayArea();
  const prelevelEl = createPrelevelOverlay();
  const pauseEl = createPauseOverlay();
  const howToEl = createHowToModal();
  const gameOverEl = createGameOverOverlay();
  appEl.append(backdropEl, homeEl.container, playEl.container, prelevelEl.container, pauseEl.container, howToEl.container, gameOverEl.container);
  root.append(appEl);

  const doc = root.ownerDocument ?? document;
  const gridInputFeature = resolveGridInputFeature(doc);
  const gridTelemetry = createGridInputTelemetry({ enabled: gridInputFeature.telemetryEnabled });
  const useModernGridInput = gridInputFeature.mode === 'modern';

  let gridController: GridInputController | null = null;
  let mode: Mode = 'home';
  if (useModernGridInput) {
    gridController = setupGridInputController({
      grid: playEl.grid,
      isInteractive: () => mode === 'input',
      getCellIndex: readCellIndex,
      telemetry: gridTelemetry,
      onCellActivate: (cell, index) => handleCellActivation(cell, index, 'pointer'),
    });
  }

  appEl.addEventListener('click', (event) => {
    if (!ignoreNextRevealClick) {
      return;
    }

    ignoreNextRevealClick = false;

    if (revealClickResetTimer !== null) {
      window.clearTimeout(revealClickResetTimer);
      revealClickResetTimer = null;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
  }, true);

  let resumeMode: Mode | null = null;
  let countdownValue = COUNTDOWN_START;
  let countdownTimer: number | null = null;
  let patternTimer: number | null = null;
  let patternRemaining = 0;
  let patternDeadline = 0;
  let patternCountdownTimer: number | null = null;
  let patternCountdownValue: number | null = null;
  let patternCountdownRemainingDelay = 0;
  let patternCountdownNextTick = 0;
  let howToFromPause = false;

  let remainingRevealTimer: number | null = null;
  let levelTransitionQueued = false;
  let revealTapArmed = false;
  let ignoreNextRevealClick = false;
  let revealClickResetTimer: number | null = null;

  let timerActive = false;
  let timerRemaining = SESSION_MS;
  let timerDeadline = 0;
  let timerFrame: number | null = null;
  let lastTimerSeconds = SESSION_SECONDS;
  let timerEnded = false;

  let bestLevel = getBestLevel();
  let resultHistory: ResultEntry[] = getResultHistory();
  let bestScore = resultHistory[0]?.score ?? 0;
  let gameState = startSession();
  let levelState = startLevel(gameState);
  let remoteBestScore: number | null = null;
  let remoteTop: LeaderboardEntry[] | undefined;
  let remoteMe: LeaderboardEntry | undefined;
  let remoteStatus: 'idle' | 'pending' | 'error' = 'idle';
  let remoteError: string | null = null;
  let lastLocalBestMessage = '';

  renderLevel(levelState);
  updateHud();
  renderHomeStats();
  resetTimer();
  showHome();

  playEl.pauseButton.addEventListener('click', () => {
    if (mode === 'home' || mode === 'paused' || mode === 'gameover') {
      return;
    }

    pauseGame();
  });

  playEl.grid.addEventListener('click', (event) => {
    if (mode !== 'input') {
      return;
    }

    const isKeyboard = event.detail === 0;
    if (useModernGridInput && !isKeyboard) {
      event.preventDefault();
      return;
    }

    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('.cell');
    if (!target) {
      return;
    }

    const index = readCellIndex(target);
    if (index === null) {
      return;
    }

    const outcome = handleCellActivation(target, index, isKeyboard ? 'keyboard' : 'pointer');

    if (outcome === 'ignored') {
      return;
    }

    gridTelemetry.keyboardCommit(outcome === 'wrong' ? 'wrong' : outcome === 'duplicate' ? 'duplicate' : 'accepted');
  });

  playEl.goButton.addEventListener('click', () => {
    triggerRevealStart('button');
  });

  function handleCellActivation(cell: HTMLButtonElement, index: number, _cause: 'pointer' | 'keyboard'): GridActivationResult {
    if (mode !== 'input') {
      return 'ignored';
    }

    const result = checkPick(levelState, index);
    if (result === 'duplicate') {
      cell.classList.remove('cell--pressed');
      return 'duplicate';
    }

    if (result === 'wrong') {
      markWrong(cell);
      gameState.score -= gameState.level;
      updateHud();
      options.telegram?.haptics?.notify('warning');
      gameState.mistakes += 1;

      if (gameState.mistakes >= 2) {
        options.telegram?.haptics?.notify('error');
        queueLevelTransition('down');
      }
      return 'wrong';
    }

    flashCorrect(cell);
    gameState.score += gameState.level;
    updateHud();
    options.telegram?.haptics?.impact('light');

    if (result === 'complete') {
      options.telegram?.haptics?.notify('success');
      queueLevelTransition('up');
    }

    return 'accepted';
  }

  homeEl.playButton.addEventListener('click', () => {
    options.telegram?.haptics?.impact('light');
    restartSession();
    openPrelevel(getPrelevelMessage(gameState.level, 'start'));
  });

  homeEl.helpButton.addEventListener('click', () => {
    options.telegram?.haptics?.impact('light');
    openHowTo(false);
  });

  pauseEl.resumeButton.addEventListener('click', () => {
    options.telegram?.haptics?.impact('light');
    closePause();
  });

  pauseEl.restartButton.addEventListener('click', () => {
    options.telegram?.haptics?.impact('medium');
    pauseEl.container.classList.remove('pause--visible');
    playEl.container.classList.remove('play--paused');
    resumeMode = null;
    restartSession();
    openPrelevel(getPrelevelMessage(gameState.level, 'start'));
  });

  pauseEl.quitButton.addEventListener('click', () => {
    options.telegram?.haptics?.impact('medium');
    showHome();
    options.onExit?.();
  });

  pauseEl.howToButton.addEventListener('click', () => {
    options.telegram?.haptics?.impact('light');
    openHowTo(true);
  });

  howToEl.closeButton.addEventListener('click', () => {
    closeHowTo();
  });

  gameOverEl.homeButton.addEventListener('click', () => {
    options.telegram?.haptics?.impact('light');
    showHome();
    options.onExit?.();
  });

  gameOverEl.restartButton.addEventListener('click', () => {
    options.telegram?.haptics?.impact('medium');
    restartSession();
    openPrelevel(getPrelevelMessage(gameState.level, 'start'));
  });

  options.telegram?.backButton?.setHandler(() => {
    if (mode === 'paused') {
      closePause();
      return;
    }

    if (howToEl.container.classList.contains('modal--visible')) {
      closeHowTo();
      return;
    }

    if (mode === 'home') {
      return;
    }

    pauseGame();
  });
  options.telegram?.backButton?.show();

  function showHome(): void {
    mode = 'home';
    resumeMode = null;
    clearAllTimers();
    levelTransitionQueued = false;
    countdownValue = COUNTDOWN_START;
    resetTimer();
    resetBoardState();
    playEl.container.classList.remove('play--visible', 'play--paused');
    homeEl.container.classList.add('home--visible');
    prelevelEl.container.classList.remove('prelevel--visible');
    setPrelevelMessage();
    pauseEl.container.classList.remove('pause--visible');
    gameOverEl.container.classList.remove('gameover--visible');
    gameOverEl.title.classList.remove('gameover__title--animate');
    prelevelEl.bubble.textContent = '';
    prelevelEl.bubble.classList.remove('bubble--in');
    renderHomeStats();
  }

  function renderHomeStats(): void {
    bestLevel = Math.max(bestLevel, getBestLevel());
    resultHistory = getResultHistory();
    bestScore = resultHistory[0]?.score ?? 0;
    homeEl.bestLevel.textContent = String(bestLevel);
    const displayBest = remoteBestScore ?? bestScore;
    homeEl.bestScore.textContent = String(displayBest);
    homeEl.bestScore.dataset.source = remoteBestScore !== null ? 'global' : 'local';
    if (remoteBestScore !== null) {
      homeEl.bestScore.title = `Global best score • Local best: ${bestScore}`;
    } else {
      homeEl.bestScore.removeAttribute('title');
    }
  }

  function restartSession(): void {
    clearAllTimers();
    levelTransitionQueued = false;
    options.onStartGame?.();
    gameState = startSession(gameState.random);
    levelState = startLevel(gameState);
    renderLevel(levelState);
    updateHud();
    resetTimer();
    playEl.container.classList.add('play--visible');
    playEl.container.classList.remove('play--paused');
    homeEl.container.classList.remove('home--visible');
    prelevelEl.container.classList.remove('prelevel--visible');
    setPrelevelMessage();
    pauseEl.container.classList.remove('pause--visible');
    gameOverEl.container.classList.remove('gameover--visible');
    gameOverEl.title.classList.remove('gameover__title--animate');
    playEl.grid.classList.add('grid--disabled');
    mode = 'pattern';
  }

  function queueLevelTransition(direction: 'up' | 'down'): void {
    if (levelTransitionQueued) {
      return;
    }

    levelTransitionQueued = true;
    mode = 'pattern';
    playEl.grid.classList.add('grid--disabled');

    if (direction === 'down') {
      gameState.mistakes = 0;
    }

    window.setTimeout(() => {
      if (mode === 'gameover') {
        levelTransitionQueued = false;
        return;
      }

      if (direction === 'up') {
        levelState = nextLevel(gameState);
        if (gameState.level > bestLevel) {
          bestLevel = gameState.level;
          setBestLevel(bestLevel);
          homeEl.bestLevel.textContent = String(bestLevel);
        }
        renderLevel(levelState);
        updateHud();
        openPrelevel(getPrelevelMessage(gameState.level, 'up'));
        levelTransitionQueued = false;
        return;
      }

      revealRemainingTargets();
      scheduleRemainingRevealClear(1000, () => {
        if (mode === 'gameover') {
          levelTransitionQueued = false;
          return;
        }
        levelState = levelDown(gameState);
        renderLevel(levelState);
        updateHud();
        openPrelevel(getPrelevelMessage(gameState.level, 'down'));
        levelTransitionQueued = false;
      });
    }, 320);
  }

  function getPrelevelMessage(level: number, direction: 'start' | 'up' | 'down'): PrelevelMessage {
    if (direction === 'down') {
      return {
        title: `Back to Level ${level}`,
        subtitle: `${level} points per block`,
      };
    }

    return {
      title: `Level ${level}`,
      subtitle: `${level} points per block`,
    };
  }

  function openPrelevel(message?: PrelevelMessage): void {
    mode = 'prelevel';
    countdownValue = COUNTDOWN_START;
    prelevelEl.bubble.textContent = '';
    prelevelEl.bubble.classList.remove('bubble--in');
    playEl.grid.classList.add('grid--disabled');
    setPrelevelMessage(message);
    prelevelEl.container.classList.add('prelevel--visible');
    runCountdown();
  }

  function setPrelevelMessage(message?: PrelevelMessage): void {
    if (!message) {
      prelevelEl.bannerTitle.textContent = '';
      prelevelEl.bannerSubtitle.textContent = '';
      prelevelEl.bannerSubtitle.hidden = true;
      prelevelEl.banner.classList.remove('prelevel__banner--show');
      return;
    }

    prelevelEl.bannerTitle.textContent = message.title;
    if (message.subtitle) {
      prelevelEl.bannerSubtitle.textContent = message.subtitle;
      prelevelEl.bannerSubtitle.hidden = false;
    } else {
      prelevelEl.bannerSubtitle.textContent = '';
      prelevelEl.bannerSubtitle.hidden = true;
    }
    prelevelEl.banner.classList.add('prelevel__banner--show');
  }

  function runCountdown(): void {
    if (mode !== 'prelevel') {
      return;
    }

    if (countdownValue <= 0) {
      finishCountdown();
      return;
    }

    prelevelEl.bubble.textContent = String(countdownValue);
    prelevelEl.bubble.classList.remove('bubble--in');
    void prelevelEl.bubble.offsetWidth;
    prelevelEl.bubble.classList.add('bubble--in');

    countdownTimer = window.setTimeout(() => {
      countdownValue -= 1;
      runCountdown();
    }, COUNTDOWN_INTERVAL_MS);
  }

  function finishCountdown(): void {
    if (mode === 'gameover') {
      return;
    }
    prelevelEl.container.classList.remove('prelevel--visible');
    prelevelEl.bubble.textContent = '';
    prelevelEl.bubble.classList.remove('bubble--in');
    setPrelevelMessage();
    options.telegram?.haptics?.impact('medium');
    startTimer();
    showPattern();
  }

  function showPattern(): void {
    if (mode === 'gameover') {
      return;
    }
    mode = 'pattern';
    playEl.grid.classList.add('grid--disabled');
    clearPatternTimer();
    clearRemainingReveal();
    clearPattern();

    levelState.targets.forEach((idx: number) => {
      const cell = playEl.grid.querySelector<HTMLElement>(`.cell[data-index="${idx}"]`);
      cell?.classList.add('cell--preview');
    });

    showGoButton();
    patternRemaining = getPatternDuration(levelState.level);
    patternDeadline = performance.now() + patternRemaining;
    startPatternCountdown();
    patternTimer = window.setTimeout(() => {
      hidePattern();
      enterInput();
    }, patternRemaining);
  }

  function hidePattern(): void {
    clearPatternTimer();
    stopPatternCountdown(true);
    levelState.targets.forEach((idx: number) => {
      const cell = playEl.grid.querySelector<HTMLElement>(`.cell[data-index="${idx}"]`);
      cell?.classList.remove('cell--preview');
    });
  }

  function enterInput(): void {
    if (mode === 'gameover') {
      return;
    }
    mode = 'input';
    playEl.grid.classList.remove('grid--disabled');
    hideGoButton();
  }

  function pauseGame(): void {
    if (mode === 'paused') {
      return;
    }

    resumeMode = mode;
    mode = 'paused';
    playEl.container.classList.add('play--paused');
    pauseEl.container.classList.add('pause--visible');
    clearCountdownTimer();

    if (resumeMode === 'pattern') {
      stopPatternCountdown(false);
      patternRemaining = Math.max(0, patternDeadline - performance.now());
      clearPatternTimer();
    }

    if (resumeMode === 'prelevel') {
      prelevelEl.container.classList.remove('prelevel--visible');
    }
  }

  function closePause(): void {
    if (mode !== 'paused') {
      return;
    }

    pauseEl.container.classList.remove('pause--visible');
    playEl.container.classList.remove('play--paused');

    if (!resumeMode) {
      mode = 'home';
      return;
    }

    const targetMode = resumeMode;
    resumeMode = null;

    if (targetMode === 'prelevel') {
      mode = 'prelevel';
      prelevelEl.container.classList.add('prelevel--visible');
      runCountdown();
      return;
    }

    if (targetMode === 'pattern') {
      mode = 'pattern';
      if (patternRemaining <= 0) {
        hidePattern();
        enterInput();
      } else {
        patternDeadline = performance.now() + patternRemaining;
        startPatternCountdown();
        patternTimer = window.setTimeout(() => {
          hidePattern();
          enterInput();
        }, patternRemaining);
      }
      return;
    }

    mode = targetMode;
    if (mode === 'input') {
      playEl.grid.classList.remove('grid--disabled');
    }
  }

  function openHowTo(fromPause: boolean): void {
    howToFromPause = fromPause;
    if (fromPause) {
      pauseEl.container.classList.remove('pause--visible');
    }
    howToEl.container.classList.add('modal--visible');
  }

  function closeHowTo(): void {
    howToEl.container.classList.remove('modal--visible');
    if (howToFromPause) {
      pauseEl.container.classList.add('pause--visible');
      howToFromPause = false;
    }
  }

  function endGame(reason: 'timeout' | 'fail' = 'fail'): void {
    if (mode === 'gameover') {
      return;
    }
    mode = 'gameover';
    freezeTimer();
    clearCountdownTimer();
    clearPatternTimer();
    prelevelEl.container.classList.remove('prelevel--visible');
    setPrelevelMessage();
    pauseEl.container.classList.remove('pause--visible');
    playEl.container.classList.remove('play--paused');
    playEl.grid.classList.add('grid--disabled');
    clearRemainingReveal();
    hideGoButton();
    levelTransitionQueued = false;

    const currentLevel = gameState.level;
    const currentScore = gameState.score;

    const record = recordResult(currentScore, currentLevel);
    resultHistory = record.results;
    bestScore = resultHistory[0]?.score ?? 0;

    const hasPreviousResults = record.previousBest !== null;
    const isNewRecord = !record.previousBest || currentScore > record.previousBest.score;
    const topAfter = resultHistory[0] ?? null;

    const showGameOver = () => {
      if (isNewRecord) {
        gameOverEl.title.textContent = 'New Record!';
      } else {
        gameOverEl.title.textContent = reason === 'timeout' ? 'TIME IS OVER' : 'Game Over';
      }

      gameOverEl.score.textContent = `Your score: ${currentScore} (Level ${currentLevel})`;

      if (!hasPreviousResults) {
        lastLocalBestMessage = 'Play again to compare results';
      } else if (isNewRecord && record.previousBest) {
        lastLocalBestMessage = `Previous best: ${record.previousBest.score} (Level ${record.previousBest.level})`;
      } else if (topAfter) {
        lastLocalBestMessage = `Best score: ${topAfter.score} (Level ${topAfter.level})`;
      } else {
        lastLocalBestMessage = '';
      }

      renderGameOverFooter();

      gameOverEl.title.classList.remove('gameover__title--animate');
      void gameOverEl.title.offsetWidth;
      gameOverEl.title.classList.add('gameover__title--animate');
      gameOverEl.container.classList.add('gameover--visible');

      updateBests();
    };

    const elapsed = Math.max(0, Math.round(SESSION_MS - timerRemaining));
    const durationMs = Math.min(SESSION_MS, elapsed);
    options.onFinishGame?.({ score: currentScore, level: currentLevel, durationMs });
    void submitScoreToServer(currentScore, currentLevel, durationMs);

    if (reason === 'timeout') {
      revealRemainingTargets();
      scheduleRemainingRevealClear(1000, showGameOver);
      return;
    }

    revealRemainingTargets();
    showGameOver();
  }

  function renderGameOverFooter(): void {
    if (remoteStatus === 'pending') {
      gameOverEl.best.textContent = 'Submitting score…';
      gameOverEl.best.hidden = false;
      return;
    }

    if (remoteStatus === 'error' && remoteError) {
      const parts = [remoteError];
      if (lastLocalBestMessage) {
        parts.push(lastLocalBestMessage);
      }
      gameOverEl.best.textContent = parts.join(' • ');
      gameOverEl.best.hidden = false;
      return;
    }

    if (remoteBestScore !== null) {
      const parts = [`Global best: ${remoteBestScore}`];
      if (remoteMe) {
        parts.push(`You: #${remoteMe.position} (${remoteMe.score})`);
      }
      if (remoteTop && remoteTop.length > 0) {
        const snippet = remoteTop
          .slice(0, 3)
          .map((entry) => `${entry.position}. ${formatUser(entry.user)} ${entry.score}`)
          .join(', ');
        if (snippet) {
          parts.push(`Top ${Math.min(3, remoteTop.length)}: ${snippet}`);
        }
      }
      if (lastLocalBestMessage) {
        parts.push(lastLocalBestMessage);
      }
      gameOverEl.best.textContent = parts.join(' • ');
      gameOverEl.best.hidden = false;
      return;
    }

    if (lastLocalBestMessage) {
      gameOverEl.best.textContent = lastLocalBestMessage;
      gameOverEl.best.hidden = false;
    } else {
      gameOverEl.best.textContent = '';
      gameOverEl.best.hidden = true;
    }
  }

  async function submitScoreToServer(score: number, level: number, durationMs: number): Promise<void> {
    const telegram = (window as any).Telegram?.WebApp;
    const initData = typeof telegram?.initData === 'string' ? telegram.initData : '';
    if (!initData) {
      return;
    }

    remoteStatus = 'pending';
    remoteError = null;
    renderGameOverFooter();

    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, level, duration_ms: durationMs, initData }),
      });

      let payload: ScoreSubmitResponse;
      try {
        payload = (await response.json()) as ScoreSubmitResponse;
      } catch (error) {
        throw new Error('Unexpected score response');
      }

      if (!response.ok || !payload.accepted) {
        throw new Error(payload.error ?? 'Score rejected');
      }

      if (typeof payload.best_score === 'number') {
        remoteBestScore = payload.best_score;
      }
      remoteTop = payload.top;
      remoteMe = payload.me;
      remoteStatus = 'idle';
      remoteError = null;
      renderHomeStats();
      renderGameOverFooter();
    } catch (error) {
      console.error('Score submission failed', error);
      remoteStatus = 'error';
      const message = (error as Error).message ?? 'Score submission failed';
      remoteError = message === 'Unexpected score response'
        ? 'Score submission failed. Please try again.'
        : message;
      renderGameOverFooter();
    }
  }

  function formatUser(user: LeaderboardEntry['user']): string {
    if (user.username) {
      return `@${user.username}`;
    }
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    if (name) {
      return name;
    }
    return String(user.id);
  }

  function revealRemainingTargets(): void {
    removeRemainingHighlights();
    levelState.targets.forEach((idx: number) => {
      if (levelState.picked.has(idx)) {
        return;
      }
      const cell = playEl.grid.querySelector<HTMLElement>(`.cell[data-index="${idx}"]`);
      cell?.classList.add('cell--remaining');
    });
  }

  function scheduleRemainingRevealClear(delay: number, afterClear?: () => void): void {
    if (remainingRevealTimer !== null) {
      window.clearTimeout(remainingRevealTimer);
    }
    remainingRevealTimer = window.setTimeout(() => {
      remainingRevealTimer = null;
      removeRemainingHighlights();
      afterClear?.();
    }, delay);
  }

  function clearRemainingReveal(): void {
    if (remainingRevealTimer !== null) {
      window.clearTimeout(remainingRevealTimer);
      remainingRevealTimer = null;
    }
    removeRemainingHighlights();
  }

  function removeRemainingHighlights(): void {
    playEl.grid.querySelectorAll('.cell--remaining').forEach((cell) => {
      cell.classList.remove('cell--remaining');
    });
  }

  function updateBests(): void {
    if (gameState.level > bestLevel) {
      bestLevel = gameState.level;
      setBestLevel(bestLevel);
    }
    renderHomeStats();
  }

  function renderLevel(level: LevelState): void {
    playEl.grid.innerHTML = '';
    playEl.grid.style.setProperty('--grid-cols', String(level.columns));
    playEl.grid.style.setProperty('--grid-rows', String(level.rows));
    playEl.grid.style.gridTemplateColumns = `repeat(${level.columns}, minmax(0, 1fr))`;
    playEl.grid.style.gridTemplateRows = `repeat(${level.rows}, minmax(0, 1fr))`;
    const total = level.total;

    for (let i = 0; i < total; i += 1) {
      const cell = document.createElement('button');
      cell.className = 'cell';
      cell.type = 'button';
      cell.dataset.index = String(i);
      cell.setAttribute('aria-pressed', 'false');

      const mark = document.createElement('span');
      mark.className = 'cell__mark';
      mark.setAttribute('aria-hidden', 'true');
      cell.append(mark);

      playEl.grid.append(cell);
    }
  }

  function updateHud(): void {
    playEl.level.textContent = `Level ${gameState.level}`;
    playEl.scoreValue.textContent = String(gameState.score);
  }

  function updateTimeDisplay(seconds: number): void {
    playEl.timeValue.textContent = String(seconds);
  }

  function resetTimer(): void {
    if (timerFrame !== null) {
      window.cancelAnimationFrame(timerFrame);
      timerFrame = null;
    }
    timerActive = false;
    timerEnded = false;
    timerRemaining = SESSION_MS;
    timerDeadline = 0;
    lastTimerSeconds = SESSION_SECONDS;
    updateTimeDisplay(lastTimerSeconds);
  }

  function freezeTimer(): void {
    if (timerFrame !== null) {
      window.cancelAnimationFrame(timerFrame);
      timerFrame = null;
    }
    timerActive = false;
  }

  function startTimer(): void {
    if (timerActive || timerEnded) {
      return;
    }
    timerActive = true;
    timerDeadline = performance.now() + timerRemaining;
    timerFrame = window.requestAnimationFrame(tickTimer);
  }

  function tickTimer(): void {
    if (!timerActive) {
      timerFrame = null;
      return;
    }

    const now = performance.now();
    const remainingMs = Math.max(0, timerDeadline - now);
    timerRemaining = remainingMs;

    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    if (seconds !== lastTimerSeconds) {
      lastTimerSeconds = seconds;
      updateTimeDisplay(seconds);
    }

    if (remainingMs <= 0) {
      timerActive = false;
      timerEnded = true;
      timerFrame = null;
      updateTimeDisplay(0);
      if (mode !== 'gameover') {
        endGame('timeout');
      }
      return;
    }

    timerFrame = window.requestAnimationFrame(tickTimer);
  }

  function clearAllTimers(): void {
    clearCountdownTimer();
    clearPatternTimer();
    clearRemainingReveal();
    stopPatternCountdown(true);
  }

  function clearCountdownTimer(): void {
    if (countdownTimer !== null) {
      window.clearTimeout(countdownTimer);
      countdownTimer = null;
    }
  }

  function clearPatternTimer(): void {
    if (patternTimer !== null) {
      window.clearTimeout(patternTimer);
      patternTimer = null;
    }
    patternRemaining = 0;
    patternDeadline = 0;
  }

  function setGoButtonCountdown(value: number | null): void {
    if (value == null) {
      playEl.goButtonCountdown.hidden = true;
      playEl.goButtonCountdown.textContent = '';
      return;
    }

    playEl.goButtonCountdown.hidden = false;
    const nextValue = String(value);
    if (playEl.goButtonCountdown.textContent !== nextValue) {
      playEl.goButtonCountdown.textContent = nextValue;
    }
  }

  function startPatternCountdown(): void {
    if (mode !== 'pattern') {
      return;
    }

    const remainingMs = Math.max(0, patternDeadline - performance.now());
    if (remainingMs <= 0) {
      return;
    }

    if (patternCountdownValue === null) {
      const baseSeconds = Math.floor(remainingMs / 1000);
      patternCountdownValue = baseSeconds > 0 ? baseSeconds : 1;
      setGoButtonCountdown(patternCountdownValue);

      if (patternCountdownValue <= 1) {
        patternCountdownRemainingDelay = 0;
        patternCountdownNextTick = 0;
        return;
      }

      const extraMs = remainingMs - baseSeconds * 1000;
      const firstDelay = extraMs > 0 ? extraMs + 1000 : 1000;
      schedulePatternCountdown(firstDelay);
      return;
    }

    setGoButtonCountdown(patternCountdownValue);

    if (patternCountdownValue <= 1) {
      patternCountdownRemainingDelay = 0;
      patternCountdownNextTick = 0;
      return;
    }

    const delay =
      patternCountdownRemainingDelay > 0
        ? patternCountdownRemainingDelay
        : Math.max(1, remainingMs - (patternCountdownValue - 1) * 1000);

    schedulePatternCountdown(delay);
  }

  function stopPatternCountdown(reset: boolean): void {
    if (patternCountdownTimer !== null) {
      window.clearTimeout(patternCountdownTimer);
      patternCountdownTimer = null;
    }

    if (!reset && patternCountdownValue !== null && patternCountdownValue > 1 && patternCountdownNextTick > 0) {
      patternCountdownRemainingDelay = Math.max(0, patternCountdownNextTick - performance.now());
    } else {
      patternCountdownRemainingDelay = 0;
    }

    patternCountdownNextTick = 0;

    if (reset) {
      patternCountdownValue = null;
      setGoButtonCountdown(null);
    }
  }

  function schedulePatternCountdown(delay: number): void {
    if (patternCountdownTimer !== null) {
      window.clearTimeout(patternCountdownTimer);
      patternCountdownTimer = null;
    }

    if (patternCountdownValue === null || patternCountdownValue <= 1) {
      patternCountdownRemainingDelay = 0;
      patternCountdownNextTick = 0;
      return;
    }

    const safeDelay = Math.max(1, delay);
    patternCountdownRemainingDelay = safeDelay;
    patternCountdownNextTick = performance.now() + safeDelay;
    patternCountdownTimer = window.setTimeout(() => {
      patternCountdownTimer = null;
      patternCountdownRemainingDelay = 0;
      patternCountdownNextTick = 0;

      if (mode !== 'pattern' || patternCountdownValue === null) {
        return;
      }

      if (patternCountdownValue > 1) {
        patternCountdownValue -= 1;
        setGoButtonCountdown(patternCountdownValue);

        if (patternCountdownValue > 1) {
          schedulePatternCountdown(1000);
        }
      }
    }, safeDelay);
  }

  function clearPattern(): void {
    stopPatternCountdown(true);
    playEl.grid.querySelectorAll('.cell--preview').forEach((cell) => {
      cell.classList.remove('cell--preview');
    });
    hideGoButton();
  }

  function resetBoardState(): void {
    clearRemainingReveal();
    playEl.grid.querySelectorAll<HTMLButtonElement>('.cell').forEach((cell) => {
      resetCellState(cell);
    });
    playEl.grid.classList.add('grid--disabled');
    hideGoButton();
  }

  function triggerRevealStart(origin: 'button' | 'global'): void {
    if (mode !== 'pattern' || !revealTapArmed) {
      return;
    }

    disarmRevealTap();

    if (origin === 'button') {
      options.telegram?.haptics?.impact('light');
    }

    skipReveal();
  }

  function handleFirstRevealTap(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    if (!revealTapArmed || mode !== 'pattern') {
      return;
    }

    const target = event.target as HTMLElement | null;
    const tappedButton = target?.closest('.board__skip') !== null;

    ignoreNextRevealClick = true;
    if (revealClickResetTimer !== null) {
      window.clearTimeout(revealClickResetTimer);
    }
    revealClickResetTimer = window.setTimeout(() => {
      ignoreNextRevealClick = false;
      revealClickResetTimer = null;
    }, 0);

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    triggerRevealStart(tappedButton ? 'button' : 'global');
  }

  function armRevealTap(): void {
    if (revealTapArmed) {
      return;
    }

    revealTapArmed = true;
    appEl.addEventListener('pointerdown', handleFirstRevealTap, true);
  }

  function disarmRevealTap(): void {
    if (!revealTapArmed) {
      return;
    }

    revealTapArmed = false;
    appEl.removeEventListener('pointerdown', handleFirstRevealTap, true);
  }

  function skipReveal(): void {
    hidePattern();
    enterInput();
  }

  function showGoButton(): void {
    playEl.goButton.disabled = false;
    playEl.goButton.classList.add('board__skip--visible');
    armRevealTap();
  }

  function hideGoButton(): void {
    playEl.goButton.disabled = true;
    playEl.goButton.classList.remove('board__skip--visible');
    disarmRevealTap();
    setGoButtonCountdown(null);
  }

  function flashCorrect(cell: HTMLElement): void {
    cell.classList.remove('cell--remaining', 'cell--fail', 'cell--pressed');
    cell.classList.add('cell--flash-ok');
    const mark = cell.querySelector<HTMLElement>('.cell__mark');
    if (mark) {
      mark.textContent = `+${gameState.level}`;
      mark.classList.remove('cell__mark--negative');
      mark.classList.add('cell__mark--positive', 'cell__mark--show');
    }

    markCellRemembered(cell as HTMLButtonElement);

    window.setTimeout(() => {
      if (!cell.isConnected) {
        return;
      }
      cell.classList.remove('cell--flash-ok');
      cell.classList.add('cell--remembered');
      if (mark) {
        mark.classList.remove('cell__mark--show', 'cell__mark--positive');
        mark.textContent = '';
      }
    }, 260);
  }

  function markWrong(cell: HTMLElement): void {
    cell.classList.remove('cell--flash-ok', 'cell--remembered', 'cell--remaining', 'cell--pressed');
    cell.classList.add('cell--fail');
    const mark = cell.querySelector<HTMLElement>('.cell__mark');
    if (mark) {
      mark.textContent = `-${gameState.level}`;
      mark.classList.remove('cell__mark--positive');
      mark.classList.add('cell__mark--negative', 'cell__mark--show');
    }
    cell.setAttribute('aria-pressed', 'false');
  }

  return () => {
    clearAllTimers();
    gridController?.destroy();
    disarmRevealTap();
    host.removeAttribute('data-theme');
    root.innerHTML = '';
  };
}

function createHome() {
  const container = document.createElement('section');
  container.className = 'home';

  const card = document.createElement('div');
  card.className = 'home__card';

  const cover = document.createElement('img');
  cover.className = 'home__cover';
  cover.alt = 'Memory Matrix cover';
  cover.src = '/games/memory-matrix-original/preview.svg';

  const title = document.createElement('h1');
  title.className = 'home__title';
  title.textContent = 'Memory Matrix';

  const description = document.createElement('p');
  description.className = 'home__description';
  description.textContent = 'Memorize the pattern, then tap the same cells.';

  const stats = document.createElement('div');
  stats.className = 'home__stats';

  const bestLevel = document.createElement('span');
  bestLevel.className = 'home__stat';
  bestLevel.innerHTML = '<strong>Best Level</strong><em>1</em>';

  const bestScore = document.createElement('span');
  bestScore.className = 'home__stat';
  bestScore.innerHTML = '<strong>Best Score</strong><em>0</em>';

  stats.append(bestLevel, bestScore);

  const actions = document.createElement('div');
  actions.className = 'home__actions';

  const playButton = document.createElement('button');
  playButton.className = 'button button--primary home__play';
  playButton.type = 'button';
  playButton.textContent = 'Play Game';

  const helpButton = document.createElement('button');
  helpButton.className = 'button button--icon home__help';
  helpButton.type = 'button';
  helpButton.setAttribute('aria-label', 'How to play');
  helpButton.textContent = '?';

  actions.append(playButton, helpButton);
  card.append(cover, title, description, stats, actions);
  container.append(card);

  return {
    container,
    playButton,
    helpButton,
    bestLevel: bestLevel.querySelector('em') as HTMLElement,
    bestScore: bestScore.querySelector('em') as HTMLElement,
  };
}

function createPlayArea() {
  const container = document.createElement('div');
  container.className = 'play';

  const hud = document.createElement('header');
  hud.className = 'hud';

  const pauseButton = document.createElement('button');
  pauseButton.type = 'button';
  pauseButton.className = 'hud__pause';
  pauseButton.setAttribute('aria-label', 'Pause');
  pauseButton.textContent = '⏸';

  const level = document.createElement('div');
  level.className = 'hud__level';
  level.textContent = 'Level 1';

  const right = document.createElement('div');
  right.className = 'hud__right';

  const time = document.createElement('div');
  time.className = 'hud__metric';
  time.innerHTML = '<span>Time</span><strong>100</strong>';

  const score = document.createElement('div');
  score.className = 'hud__metric';
  score.innerHTML = '<span>Score</span><strong>0</strong>';

  right.append(time, score);
  hud.append(pauseButton, level, right);

  const board = document.createElement('div');
  board.className = 'board';

  const grid = document.createElement('div');
  grid.className = 'grid grid--disabled';
  const skipButton = document.createElement('button');
  skipButton.type = 'button';
  skipButton.className = 'board__skip';
  skipButton.setAttribute('aria-label', 'Tap to start the round');
  skipButton.disabled = true;

  const skipButtonCountdown = document.createElement('span');
  skipButtonCountdown.className = 'board__skip-countdown';
  skipButtonCountdown.hidden = true;

  const skipButtonLineTop = document.createElement('span');
  skipButtonLineTop.className = 'board__skip-line';
  skipButtonLineTop.textContent = 'Tap to';

  const skipButtonLineBottom = document.createElement('span');
  skipButtonLineBottom.className = 'board__skip-line';
  skipButtonLineBottom.textContent = 'start';

  skipButton.append(skipButtonCountdown, skipButtonLineTop, skipButtonLineBottom);

  board.append(grid, skipButton);

  container.append(hud, board);

  return {
    container,
    pauseButton,
    level,
    timeValue: time.querySelector('strong') as HTMLElement,
    scoreValue: score.querySelector('strong') as HTMLElement,
    grid,
    goButton: skipButton,
    goButtonCountdown: skipButtonCountdown,
  };
}

function createPrelevelOverlay() {
  const container = document.createElement('div');
  container.className = 'prelevel';

  const content = document.createElement('div');
  content.className = 'prelevel__content';

  const banner = document.createElement('div');
  banner.className = 'prelevel__banner';

  const bannerTitle = document.createElement('span');
  bannerTitle.className = 'prelevel__banner-title';

  const bannerSubtitle = document.createElement('span');
  bannerSubtitle.className = 'prelevel__banner-subtitle';
  bannerSubtitle.hidden = true;

  banner.append(bannerTitle, bannerSubtitle);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.setAttribute('aria-hidden', 'true');
  bubble.hidden = true;

  content.append(banner, bubble);
  container.append(content);

  return { container, bubble, banner, bannerTitle, bannerSubtitle };
}

function createPauseOverlay() {
  const container = document.createElement('div');
  container.className = 'pause';

  const card = document.createElement('div');
  card.className = 'pause__card';

  const title = document.createElement('h2');
  title.textContent = 'Paused';

  const list = document.createElement('div');
  list.className = 'pause__actions';

  const resumeButton = createPauseButton('▶ Resume');
  const restartButton = createPauseButton('↺ Restart');
  const quitButton = createPauseButton('✕ Quit');
  const howToButton = createPauseButton('? How To Play');

  list.append(resumeButton, restartButton, quitButton, howToButton);
  card.append(title, list);
  container.append(card);

  return { container, resumeButton, restartButton, quitButton, howToButton };
}

function createPauseButton(text: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pause__button';
  button.textContent = text;
  return button;
}

function createHowToModal() {
  const container = document.createElement('div');
  container.className = 'modal';

  const card = document.createElement('div');
  card.className = 'modal__card';

  const title = document.createElement('h2');
  title.className = 'modal__title';
  title.textContent = 'How To Play';

  const list = document.createElement('ul');
  list.className = 'modal__list';
  [
    { title: 'Goal', body: 'Score as much as you can in 100 seconds.' },
    { title: 'How', body: 'Watch the highlighted cells, then repeat the same cells.' },
    { title: 'Scoring', body: 'The higher your level, the more points each cell gives.' },
    { title: 'Mistakes', body: 'Two mistakes lower your level.' },
  ].forEach(({ title, body }) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = `${title}:`;
    li.append(strong, document.createTextNode(` ${body}`));
    list.append(li);
  });

  const closeButton = document.createElement('button');
  closeButton.className = 'button button--primary modal__close';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';

  card.append(title, list, closeButton);
  container.append(card);

  return { container, closeButton };
}

function createGameOverOverlay() {
  const container = document.createElement('div');
  container.className = 'gameover';

  const content = document.createElement('div');
  content.className = 'gameover__content';

  const title = document.createElement('h2');
  title.className = 'gameover__title';
  title.textContent = 'Game Over';

  const score = document.createElement('p');
  score.className = 'gameover__score';

  const best = document.createElement('p');
  best.className = 'gameover__best';

  const actions = document.createElement('div');
  actions.className = 'gameover__actions';

  const homeButton = document.createElement('button');
  homeButton.type = 'button';
  homeButton.className = 'gameover__action';
  homeButton.setAttribute('aria-label', 'Home');
  homeButton.append(createGameOverIcon('home'));

  const restartButton = document.createElement('button');
  restartButton.type = 'button';
  restartButton.className = 'gameover__action';
  restartButton.setAttribute('aria-label', 'Restart');
  restartButton.append(createGameOverIcon('restart'));

  actions.append(homeButton, restartButton);
  content.append(title, score, best, actions);
  container.append(content);

  return { container, title, score, best, homeButton, restartButton };
}

function createGameOverIcon(type: 'home' | 'restart'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'gameover__icon');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const makePath = (d: string) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    element.setAttribute('d', d);
    return element;
  };

  if (type === 'home') {
    svg.append(
      makePath('M4 11.5L12 5l8 6.5'),
      makePath('M6.5 11.5V19.5h5V14.5h3V19.5H18V11.5')
    );
  } else {
    svg.append(
      makePath('M12 20a8 8 0 1 1 5.66-14.14'),
      makePath('M20 5.2V11h-5.2'),
      makePath('M20 5.2l-3.2-3.2'),
      makePath('M20 5.2l-3.2 3.2')
    );
  }

  return svg;
}

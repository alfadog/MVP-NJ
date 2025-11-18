export type GridActivationResult = 'accepted' | 'duplicate' | 'wrong' | 'ignored';

export interface GridInputFeatureConfig {
  mode: 'modern' | 'legacy';
  telemetryEnabled: boolean;
}

export interface GridInputControllerOptions {
  grid: HTMLElement;
  isInteractive: () => boolean;
  getCellIndex: (cell: HTMLButtonElement) => number | null;
  onCellActivate: (
    cell: HTMLButtonElement,
    index: number,
    event: PointerEvent,
    meta: { startedAt: number }
  ) => GridActivationResult;
  telemetry: GridInputTelemetry;
}

export interface GridInputController {
  destroy(): void;
}

export interface GridInputTelemetryOptions {
  enabled: boolean;
  logger?: (event: string, payload: Record<string, unknown>) => void;
  sampleSize?: number;
}

export type GridCommitStatus = 'accepted' | 'duplicate' | 'wrong';

export interface GridInputTelemetrySnapshot {
  started: number;
  committed: number;
  dropped: number;
  cancels: number;
  duplicates: number;
  wrong: number;
  latencies: number[];
}

export interface GridInputTelemetry {
  pointerStart(pointerId: number, index: number, startedAt: number): void;
  pointerCommit(pointerId: number, status: GridCommitStatus): void;
  pointerDrop(pointerId: number, reason: 'cancel' | 'leave' | 'ignored'): void;
  keyboardCommit(status: GridCommitStatus): void;
  snapshot(): GridInputTelemetrySnapshot;
}

const PRESS_CLASS = 'cell--pressed';

const DEFAULT_LOGGER = (event: string, payload: Record<string, unknown>) => {
  console.debug(`[grid-input] ${event}`, payload);
};

interface PointerSession {
  index: number;
  startedAt: number;
}

class GridInputTelemetryImpl implements GridInputTelemetry {
  private readonly enabled: boolean;

  private readonly logger: (event: string, payload: Record<string, unknown>) => void;

  private readonly sampleSize: number;

  private sessions = new Map<number, PointerSession>();

  private started = 0;

  private committed = 0;

  private dropped = 0;

  private cancels = 0;

  private duplicates = 0;

  private wrong = 0;

  private latencies: number[] = [];

  constructor(options: GridInputTelemetryOptions) {
    this.enabled = options.enabled;
    this.logger = options.logger ?? DEFAULT_LOGGER;
    this.sampleSize = options.sampleSize ?? 120;
  }

  pointerStart(pointerId: number, index: number, startedAt: number): void {
    this.started += 1;
    if (this.enabled) {
      this.sessions.set(pointerId, { index, startedAt });
    }
  }

  pointerCommit(pointerId: number, status: GridCommitStatus): void {
    this.committed += 1;
    if (status === 'duplicate') {
      this.duplicates += 1;
    }
    if (status === 'wrong') {
      this.wrong += 1;
    }

    if (!this.enabled) {
      this.sessions.delete(pointerId);
      return;
    }

    const session = this.sessions.get(pointerId);
    this.sessions.delete(pointerId);
    if (!session) {
      return;
    }

    const startedAt = session.startedAt;
    window.requestAnimationFrame(() => {
      const latency = performance.now() - startedAt;
      this.latencies.push(latency);
      if (this.latencies.length > this.sampleSize) {
        this.latencies.splice(0, this.latencies.length - this.sampleSize);
      }
      this.logger('commit', {
        latency,
        status,
        index: session.index,
        sampleSize: this.latencies.length,
      });
    });
  }

  pointerDrop(pointerId: number, reason: 'cancel' | 'leave' | 'ignored'): void {
    if (reason === 'cancel') {
      this.cancels += 1;
    } else {
      this.dropped += 1;
    }

    if (!this.enabled) {
      this.sessions.delete(pointerId);
      return;
    }

    const session = this.sessions.get(pointerId);
    this.sessions.delete(pointerId);
    if (!session) {
      return;
    }

    this.logger('drop', { index: session.index, reason });
  }

  keyboardCommit(status: GridCommitStatus): void {
    this.committed += 1;
    if (status === 'duplicate') {
      this.duplicates += 1;
    }
    if (status === 'wrong') {
      this.wrong += 1;
    }

    if (!this.enabled) {
      return;
    }

    this.logger('keyboard', { status });
  }

  snapshot(): GridInputTelemetrySnapshot {
    return {
      started: this.started,
      committed: this.committed,
      dropped: this.dropped,
      cancels: this.cancels,
      duplicates: this.duplicates,
      wrong: this.wrong,
      latencies: [...this.latencies],
    };
  }
}

export function createGridInputTelemetry(options: GridInputTelemetryOptions): GridInputTelemetry {
  return new GridInputTelemetryImpl(options);
}

export function resolveGridInputFeature(doc: Document): GridInputFeatureConfig {
  let mode: GridInputFeatureConfig['mode'] = 'modern';
  let telemetryEnabled = false;

  try {
    const search = new URLSearchParams(doc.location.search);
    const modeFlag = search.get('gridInput');
    const telemetryFlag = search.get('gridInputTelemetry');

    if (modeFlag === 'legacy') {
      mode = 'legacy';
    } else if (modeFlag === 'modern' || modeFlag === 'fast') {
      mode = 'modern';
    }

    if (telemetryFlag === '1' || telemetryFlag === 'true') {
      telemetryEnabled = true;
    } else if (telemetryFlag === '0' || telemetryFlag === 'false') {
      telemetryEnabled = false;
    }

    const storage = window.localStorage;
    const storedMode = storage.getItem('grid-input-mode');
    if (!modeFlag && storedMode) {
      if (storedMode === 'legacy' || storedMode === 'modern') {
        mode = storedMode;
      }
    }

    const storedTelemetry = storage.getItem('grid-input-telemetry');
    if (!telemetryFlag && storedTelemetry) {
      telemetryEnabled = storedTelemetry === '1';
    }
  } catch (error) {
    console.warn('Failed to resolve grid input feature flags', error);
  }

  return { mode, telemetryEnabled };
}

export function setupGridInputController(options: GridInputControllerOptions): GridInputController {
  const { grid, isInteractive, getCellIndex, onCellActivate, telemetry } = options;

  let activePointerId: number | null = null;
  let activeCell: HTMLButtonElement | null = null;
  let activeIndex: number | null = null;
  let startedAt = 0;

  const handlePointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    if (!isInteractive() || grid.classList.contains('grid--disabled')) {
      return;
    }

    if (activePointerId !== null) {
      return;
    }

    const cell = resolveCellFromEvent(grid, event);
    if (!cell) {
      return;
    }

    const index = getCellIndex(cell);
    if (index === null) {
      return;
    }

    event.preventDefault();

    startedAt = performance.now();
    activePointerId = event.pointerId;
    activeCell = cell;
    activeIndex = index;

    telemetry.pointerStart(event.pointerId, index, startedAt);

    addPressedState(cell);

    trySetPointerCapture(grid, event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    const cell = resolveCellFromPoint(grid, event.clientX, event.clientY);
    if (!cell) {
      clearActiveCell();
      return;
    }

    const index = getCellIndex(cell);
    if (index === null) {
      clearActiveCell();
      return;
    }

    if (cell === activeCell) {
      return;
    }

    setActiveCell(cell, index);
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    const cell = resolveCellFromPoint(grid, event.clientX, event.clientY) ?? activeCell;
    const index = cell ? getCellIndex(cell) : null;

    const pointerId = event.pointerId;
    const started = startedAt;

    tryReleasePointerCapture(grid, event.pointerId);

    activePointerId = null;
    startedAt = 0;

    if (!cell || index === null) {
      clearActiveCell();
      telemetry.pointerDrop(pointerId, 'leave');
      return;
    }

    setActiveCell(cell, index);

    const currentCell = activeCell;
    const currentIndex = activeIndex;
    clearActiveCell();

    if (!currentCell || currentIndex === null) {
      telemetry.pointerDrop(pointerId, 'leave');
      return;
    }

    const result = onCellActivate(currentCell, currentIndex, event, { startedAt: started });

    if (result === 'ignored') {
      telemetry.pointerDrop(pointerId, 'ignored');
      return;
    }

    telemetry.pointerCommit(pointerId, result === 'wrong' ? 'wrong' : result === 'duplicate' ? 'duplicate' : 'accepted');
  };

  const handlePointerCancel = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    tryReleasePointerCapture(grid, event.pointerId);

    activePointerId = null;
    clearActiveCell();
    telemetry.pointerDrop(event.pointerId, 'cancel');
  };

  const handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    if (!grid.contains(event.relatedTarget as Node | null)) {
      clearActiveCell();
    }
  };

  const setActiveCell = (cell: HTMLButtonElement, index: number) => {
    if (cell === activeCell && index === activeIndex) {
      return;
    }

    if (activeCell) {
      removePressedState(activeCell);
    }

    activeCell = cell;
    activeIndex = index;
    addPressedState(cell);
  };

  const clearActiveCell = () => {
    if (activeCell) {
      removePressedState(activeCell);
    }
    activeCell = null;
    activeIndex = null;
  };

  grid.addEventListener('pointerdown', handlePointerDown);
  grid.addEventListener('pointermove', handlePointerMove);
  grid.addEventListener('pointerup', handlePointerUp);
  grid.addEventListener('pointercancel', handlePointerCancel);
  grid.addEventListener('pointerleave', handlePointerLeave);

  return {
    destroy() {
      grid.removeEventListener('pointerdown', handlePointerDown);
      grid.removeEventListener('pointermove', handlePointerMove);
      grid.removeEventListener('pointerup', handlePointerUp);
      grid.removeEventListener('pointercancel', handlePointerCancel);
      grid.removeEventListener('pointerleave', handlePointerLeave);
    },
  };
}

export function resolveCellFromEvent(grid: HTMLElement, event: PointerEvent): HTMLButtonElement | null {
  const target = event.target as Element | null;
  if (target) {
    const cell = target.closest<HTMLButtonElement>('.cell');
    if (cell && grid.contains(cell)) {
      return cell;
    }
  }
  return resolveCellFromPoint(grid, event.clientX, event.clientY);
}

function resolveCellFromPoint(grid: HTMLElement, x: number, y: number): HTMLButtonElement | null {
  if (typeof document.elementFromPoint === 'function') {
    const element = document.elementFromPoint(x, y);
    if (element) {
      const cell = element.closest<HTMLButtonElement>('.cell');
      if (cell && grid.contains(cell)) {
        return cell;
      }
    }
  }
  return null;
}

function addPressedState(cell: HTMLButtonElement): void {
  cell.classList.add(PRESS_CLASS);
}

function removePressedState(cell: HTMLButtonElement): void {
  cell.classList.remove(PRESS_CLASS);
}

function trySetPointerCapture(element: HTMLElement, pointerId: number): void {
  const node = element as HTMLElement & {
    setPointerCapture?: (pointerId: number) => void;
  };
  try {
    node.setPointerCapture?.(pointerId);
  } catch (error) {
    // ignore pointer capture errors
  }
}

function tryReleasePointerCapture(element: HTMLElement, pointerId: number): void {
  const node = element as HTMLElement & {
    releasePointerCapture?: (pointerId: number) => void;
  };
  try {
    node.releasePointerCapture?.(pointerId);
  } catch (error) {
    // ignore pointer capture errors
  }
}

export function getCellIndex(cell: HTMLButtonElement): number | null {
  const value = cell.dataset.index;
  if (!value) {
    return null;
  }
  const index = Number.parseInt(value, 10);
  return Number.isFinite(index) ? index : null;
}

export function markCellRemembered(cell: HTMLButtonElement): void {
  cell.setAttribute('aria-pressed', 'true');
}

export function resetCellState(cell: HTMLButtonElement): void {
  cell.classList.remove(
    PRESS_CLASS,
    'cell--preview',
    'cell--flash-ok',
    'cell--remembered',
    'cell--fail',
    'cell--remaining'
  );
  cell.setAttribute('aria-pressed', 'false');
  const mark = cell.querySelector<HTMLElement>('.cell__mark');
  if (mark) {
    mark.textContent = '';
    mark.classList.remove('cell__mark--show', 'cell__mark--positive', 'cell__mark--negative');
  }
}


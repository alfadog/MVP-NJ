import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGridInputTelemetry,
  getCellIndex as readCellIndex,
  resolveGridInputFeature,
  resetCellState,
  setupGridInputController,
  type GridActivationResult,
} from '../src/input.js';

function createCell(index: number): HTMLButtonElement {
  const cell = document.createElement('button');
  cell.className = 'cell';
  cell.dataset.index = String(index);
  cell.setAttribute('aria-pressed', 'false');
  const mark = document.createElement('span');
  mark.className = 'cell__mark';
  mark.setAttribute('aria-hidden', 'true');
  cell.append(mark);
  return cell;
}

describe('grid input controller', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', 'http://localhost/');
  });

  it('commits pointer tap once per pointer', async () => {
    const grid = document.createElement('div');
    grid.className = 'grid';
    const first = createCell(0);
    const second = createCell(1);
    grid.append(first, second);
    document.body.append(grid);

    const telemetry = createGridInputTelemetry({ enabled: false });

    const activations: Array<{ cell: HTMLButtonElement; index: number } & { event: PointerEvent }> = [];
    const controller = setupGridInputController({
      grid,
      isInteractive: () => true,
      getCellIndex: readCellIndex,
      telemetry,
      onCellActivate: (cell, index, event) => {
        activations.push({ cell, index, event });
        return 'accepted';
      },
    });

    first.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1,
      bubbles: true,
      composed: true,
      button: 0,
      isPrimary: true,
    }));

    expect(first.classList.contains('cell--pressed')).toBe(true);

    first.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 1,
      bubbles: true,
      composed: true,
      button: 0,
      isPrimary: true,
    }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(activations).toHaveLength(1);
    expect(activations[0]?.cell).toBe(first);
    expect(activations[0]?.index).toBe(0);
    expect(first.classList.contains('cell--pressed')).toBe(false);
    const snapshot = telemetry.snapshot();
    expect(snapshot.started).toBe(1);
    expect(snapshot.committed).toBe(1);
    expect(snapshot.dropped + snapshot.cancels).toBe(0);

    controller.destroy();
  });

  it('tracks target changes on pointer move', async () => {
    const originalElementFromPoint = document.elementFromPoint;

    const grid = document.createElement('div');
    grid.className = 'grid';
    const first = createCell(0);
    const second = createCell(1);
    grid.append(first, second);
    document.body.append(grid);

    const telemetry = createGridInputTelemetry({ enabled: false });
    const handler = vi.fn<[
      HTMLButtonElement,
      number,
      PointerEvent,
      { startedAt: number }
    ], GridActivationResult>(() => 'accepted');

    const controller = setupGridInputController({
      grid,
      isInteractive: () => true,
      getCellIndex: readCellIndex,
      telemetry,
      onCellActivate: handler,
    });

    document.elementFromPoint = (x: number, y: number) => {
      return y < 50 ? first : second;
    };

    first.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 2,
      bubbles: true,
      composed: true,
      button: 0,
      isPrimary: true,
      clientX: 10,
      clientY: 10,
    }));

    grid.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 2,
      bubbles: true,
      composed: true,
      button: 0,
      isPrimary: true,
      clientX: 12,
      clientY: 100,
    }));

    expect(first.classList.contains('cell--pressed')).toBe(false);
    expect(second.classList.contains('cell--pressed')).toBe(true);

    grid.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 2,
      bubbles: true,
      composed: true,
      button: 0,
      isPrimary: true,
      clientX: 14,
      clientY: 100,
    }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toBe(second);
    expect(handler.mock.calls[0]?.[1]).toBe(1);

    controller.destroy();
    document.elementFromPoint = originalElementFromPoint;
  });

  it('drops pointer on cancel without committing', () => {
    const grid = document.createElement('div');
    grid.className = 'grid';
    const first = createCell(0);
    grid.append(first);
    document.body.append(grid);

    const telemetry = createGridInputTelemetry({ enabled: false });
    const handler = vi.fn(() => 'accepted' as GridActivationResult);

    const controller = setupGridInputController({
      grid,
      isInteractive: () => true,
      getCellIndex: readCellIndex,
      telemetry,
      onCellActivate: handler,
    });

    first.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 3,
      bubbles: true,
      composed: true,
      button: 0,
      isPrimary: true,
    }));

    grid.dispatchEvent(new PointerEvent('pointercancel', {
      pointerId: 3,
      bubbles: true,
      composed: true,
      button: 0,
      isPrimary: true,
    }));

    expect(handler).not.toHaveBeenCalled();
    const snapshot = telemetry.snapshot();
    expect(snapshot.cancels).toBe(1);
    expect(first.classList.contains('cell--pressed')).toBe(false);

    controller.destroy();
  });

  it('ignores secondary pointer while primary is active', async () => {
    const grid = document.createElement('div');
    grid.className = 'grid';
    const first = createCell(0);
    const second = createCell(1);
    grid.append(first, second);
    document.body.append(grid);

    const telemetry = createGridInputTelemetry({ enabled: false });
    const handler = vi.fn(() => 'accepted' as GridActivationResult);

    const controller = setupGridInputController({
      grid,
      isInteractive: () => true,
      getCellIndex: readCellIndex,
      telemetry,
      onCellActivate: handler,
    });

    first.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 4,
      bubbles: true,
      composed: true,
      button: 0,
      isPrimary: true,
    }));

    second.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 5,
      bubbles: true,
      composed: true,
      button: 0,
      isPrimary: false,
    }));

    expect(first.classList.contains('cell--pressed')).toBe(true);
    expect(second.classList.contains('cell--pressed')).toBe(false);

    first.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 4,
      bubbles: true,
      composed: true,
      button: 0,
      isPrimary: true,
    }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toBe(first);

    controller.destroy();
  });
});

describe('grid input utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', 'http://localhost/');
  });

  it('resolves feature flags from query and storage', () => {
    window.history.replaceState(null, '', 'http://localhost/?gridInput=legacy&gridInputTelemetry=1');
    const configFromQuery = resolveGridInputFeature(document);
    expect(configFromQuery.mode).toBe('legacy');
    expect(configFromQuery.telemetryEnabled).toBe(true);

    window.history.replaceState(null, '', 'http://localhost/');
    window.localStorage.setItem('grid-input-mode', 'legacy');
    window.localStorage.setItem('grid-input-telemetry', '1');
    const configFromStorage = resolveGridInputFeature(document);
    expect(configFromStorage.mode).toBe('legacy');
    expect(configFromStorage.telemetryEnabled).toBe(true);

    window.localStorage.setItem('grid-input-mode', 'modern');
    window.localStorage.setItem('grid-input-telemetry', '0');
    const configModern = resolveGridInputFeature(document);
    expect(configModern.mode).toBe('modern');
    expect(configModern.telemetryEnabled).toBe(false);
  });

  it('resets cell visual state and aria attributes', () => {
    const cell = createCell(0);
    cell.classList.add('cell--preview', 'cell--flash-ok', 'cell--remembered', 'cell--fail', 'cell--remaining', 'cell--pressed');
    const mark = cell.querySelector<HTMLElement>('.cell__mark');
    if (!mark) {
      throw new Error('Mark not created');
    }
    mark.textContent = '+5';
    mark.classList.add('cell__mark--show', 'cell__mark--positive');
    cell.setAttribute('aria-pressed', 'true');

    resetCellState(cell);

    expect(cell.className).toBe('cell');
    expect(mark.textContent).toBe('');
    expect(mark.classList.contains('cell__mark--show')).toBe(false);
    expect(cell.getAttribute('aria-pressed')).toBe('false');
  });
});

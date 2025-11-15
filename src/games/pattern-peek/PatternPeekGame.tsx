'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Card, Section } from '@telegram-apps/telegram-ui';

import type { GameComponentProps } from '../config';

type Phase = 'idle' | 'showing' | 'recall' | 'finished';

const GRID_SIZE = 3;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const PATTERN_LENGTH = 3;
const REVEAL_DURATION_MS = 1500;

const STATUS_LABELS: Record<Phase, string> = {
  idle: 'Ready',
  showing: 'Memorize the pattern',
  recall: 'Recreate the pattern',
  finished: 'Round complete',
};

function generatePattern(): number[] {
  const pattern: number[] = [];

  while (pattern.length < PATTERN_LENGTH) {
    const candidate = Math.floor(Math.random() * TOTAL_CELLS);

    if (!pattern.includes(candidate)) {
      pattern.push(candidate);
    }
  }

  return pattern;
}

export function PatternPeekGame({ game, session }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [pattern, setPattern] = useState<number[]>([]);
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [roundStartedAt, setRoundStartedAt] = useState<number | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  const startRound = () => {
    if (phase === 'showing' || phase === 'recall') {
      return;
    }

    const newPattern = generatePattern();
    setPattern(newPattern);
    setSelection(new Set());
    setScore(null);
    setFeedback(null);
    setPhase('showing');
    setRoundStartedAt(Date.now());
    session.startGame();

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }

    revealTimeoutRef.current = setTimeout(() => {
      setPhase('recall');
    }, REVEAL_DURATION_MS);
  };

  const toggleCell = (index: number) => {
    if (phase !== 'recall') {
      return;
    }

    setSelection((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  const finishRound = () => {
    if (phase !== 'recall') {
      return;
    }

    const patternSet = new Set(pattern);
    let correctSelected = 0;

    selection.forEach((value) => {
      if (patternSet.has(value)) {
        correctSelected += 1;
      }
    });

    const extra = selection.size - correctSelected;
    const totalPattern = pattern.length;
    const accuracy = totalPattern === 0 ? 0 : correctSelected / totalPattern;
    const penalty = extra * 0.25;
    const normalized = Math.max(0, Math.min(1, accuracy - penalty));
    const computedScore = Math.round(normalized * 100);
    const durationMs = roundStartedAt != null ? Date.now() - roundStartedAt : undefined;
    const missed = Math.max(0, totalPattern - correctSelected);

    session.finishGame({
      score: computedScore,
      durationMs,
      meta: {
        patternSize: totalPattern,
        correctSelected,
        missed,
        extra,
      },
    });

    setScore(computedScore);
    setFeedback(
      computedScore >= 90 ? 'Perfect recall' : computedScore >= 60 ? 'Good job' : 'Keep practicing',
    );
    setPhase('finished');
    setPattern([]);
    setSelection(new Set());
    setRoundStartedAt(null);
  };

  const resetRound = () => {
    setPhase('idle');
    setPattern([]);
    setSelection(new Set());
    setScore(null);
    setFeedback(null);
    setRoundStartedAt(null);
  };

  const renderGrid = (currentPhase: Phase) => {
    if (currentPhase !== 'showing' && currentPhase !== 'recall') {
      return null;
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: 8,
          marginTop: 12,
        }}
      >
        {Array.from({ length: TOTAL_CELLS }, (_, index) => {
          const isInPattern = pattern.includes(index);
          const isSelected = selection.has(index);
          const isHighlighted = currentPhase === 'showing' ? isInPattern : isSelected;

          return (
            <button
              key={index}
              type="button"
              onClick={() => toggleCell(index)}
              disabled={currentPhase !== 'recall'}
              style={{
                height: 56,
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: isHighlighted ? 'rgba(0, 122, 255, 0.85)' : 'rgba(255, 255, 255, 0.08)',
                opacity: currentPhase === 'showing' && !isInPattern ? 0.35 : 1,
                transition: 'background-color 0.2s ease, opacity 0.2s ease',
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Section header={game.title} footer={game.shortDescription}>
        <Card type="plain">
          <Card.Cell subtitle="Status">{STATUS_LABELS[phase]}</Card.Cell>
          {phase === 'idle' && (
            <>
              <Card.Cell subtitle="How to play">
                Remember the highlighted cells. They disappear quickly, so focus and then recreate the pattern
                from memory.
              </Card.Cell>
              <Card.Cell>
                <Button size="l" stretched mode="filled" onClick={startRound}>
                  Start round
                </Button>
              </Card.Cell>
            </>
          )}
          {(phase === 'showing' || phase === 'recall') && (
            <>
              <Card.Cell subtitle={phase === 'showing' ? 'Memorize the pattern' : 'Recreate the pattern'}>
                {phase === 'showing'
                  ? 'Watch the highlighted cells. You will have a moment to memorize them.'
                  : 'Tap the cells you remember, then choose Check pattern.'}
              </Card.Cell>
              <Card.Cell>{renderGrid(phase)}</Card.Cell>
              {phase === 'recall' && (
                <Card.Cell>
                  <Button
                    size="l"
                    stretched
                    mode="filled"
                    onClick={finishRound}
                    disabled={selection.size === 0}
                  >
                    Check pattern
                  </Button>
                </Card.Cell>
              )}
            </>
          )}
          {phase === 'finished' && (
            <>
              <Card.Cell subtitle="Result">Score: {score ?? 0}/100</Card.Cell>
              <Card.Cell subtitle="Feedback">{feedback}</Card.Cell>
              <Card.Cell>
                <Button size="l" stretched mode="filled" onClick={resetRound}>
                  Play again
                </Button>
              </Card.Cell>
            </>
          )}
        </Card>
      </Section>
    </>
  );
}

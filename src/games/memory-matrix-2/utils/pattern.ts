export function createPattern(cellCount: number, patternLength: number): number[] {
  const available = Array.from({ length: cellCount }, (_, index) => index);
  const pattern: number[] = [];

  while (pattern.length < patternLength && available.length) {
    const index = Math.floor(Math.random() * available.length);
    const [value] = available.splice(index, 1);
    pattern.push(value);
  }

  return pattern;
}

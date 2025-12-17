// Helper for deterministic tests
export const createMockRng = (sequence: number[]) => {
  let index = 0;
  return () => {
    if (index >= sequence.length) {
      // Return a neutral value (0.5) if sequence exhausted
      return 0.5;
    }
    return sequence[index++];
  };
};

import { useEffect, useRef } from 'react';

/**
 * Previous Hook
 * Returns the previous value of a variable
 */
export function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export default usePrevious;
import { useEffect } from 'react';

/**
 * On Click Outside Hook
 * Detects clicks outside a ref element
 */
export function useOnClickOutside(ref, callback) {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref?.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
}

export default useOnClickOutside;
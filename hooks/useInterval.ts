import { useEffect, useRef } from "react";

// From Dan Abramov's blog: https://overreacted.io/making-setinterval-declarative-with-react-hooks/

export default function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef<() => void>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => {
      savedCallback.current();
    };

    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

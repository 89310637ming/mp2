import { useEffect, useState } from "react";
import { errorMessage } from "./api";

export function useResource<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
  delay = 0,
) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    attempt: number;
    data?: T;
    error?: string;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      loader(controller.signal).then(
        (data) => {
          if (!controller.signal.aborted) setResult({ key, attempt, data });
        },
        (error) => {
          if (!controller.signal.aborted)
            setResult({ key, attempt, error: errorMessage(error) });
        },
      );
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, loader, attempt, delay]);
  const current =
    result?.key === key && result.attempt === attempt ? result : undefined;
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    retry: () => setAttempt((value) => value + 1),
  };
}

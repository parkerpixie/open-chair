import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
export function useResource<T>(
  loader: (key: string | number) => Promise<T>,
  refreshKey: string | number = 0,
) {
  const loaderRef = useRef(loader);
  useLayoutEffect(() => {
    loaderRef.current = loader;
  });
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    try {
      const result = await loaderRef.current(refreshKey);
      if (request === generation.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (__DEV__) console.error("Read failed", err);
      if (request === generation.current)
        setError("Your records could not be loaded. Please try again.");
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [refreshKey]);
  useFocusEffect(
    useCallback(() => {
      void reload();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void reload();
      });
      let day = new Date().toDateString();
      const timer = setInterval(() => {
        const nextDay = new Date().toDateString();
        if (nextDay !== day) {
          day = nextDay;
          void reload();
        }
      }, 30000);
      return () => {
        generation.current++;
        subscription.remove();
        clearInterval(timer);
      };
    }, [reload]),
  );
  return { data, error, loading, reload };
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      if (__DEV__) console.error("Action failed", err);
      setError(
        err instanceof Error && !/sqlite|database|constraint/i.test(err.message)
          ? err.message
          : "That could not be saved. Please try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, run };
}

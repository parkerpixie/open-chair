import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, AppState, AccessibilityInfo } from "react-native";
import { Button, Card, Copy, Heading } from "../../components/app/ui";
import { useFocusEffect } from "expo-router";
import { palette } from "../../constants/palette";
export function Breathing() {
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useRef(false);
  useFocusEffect(
    useCallback(
      () => () => {
        setElapsed(null);
        scale.stopAnimation();
      },
      [scale],
    ),
  );
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      reduced.current = value;
    });
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        reduced.current = value;
      },
    );
    return () => listener.remove();
  }, []);
  const running = elapsed !== null && elapsed < 36;
  const phase =
    elapsed === null
      ? "Ready when you are"
      : elapsed >= 36
        ? "A moment, completed"
        : elapsed % 12 < 4
          ? "Breathe in"
          : elapsed % 12 < 6
            ? "Hold gently"
            : "Breathe out";
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.min(36, Math.floor((Date.now() - start) / 1000))),
      200,
    );
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") setElapsed(null);
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [running]);
  useEffect(() => {
    const animation = Animated.timing(scale, {
      toValue: phase === "Breathe in" || phase === "Hold gently" ? 1.2 : 1,
      duration: reduced.current
        ? 0
        : phase === "Breathe in"
          ? 4000
          : phase === "Breathe out"
            ? 6000
            : 200,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [phase, scale]);
  return (
    <Card tinted>
      <Heading small>A little breathing room</Heading>
      <Copy>
        In for 4 · hold for 2 · out for 6. Three cycles. Keep it comfortable;
        skip the hold or stop whenever you like.
      </Copy>
      <Animated.View
        style={{
          alignSelf: "center",
          margin: 20,
          width: 110,
          height: 110,
          borderRadius: 55,
          borderWidth: 2,
          borderColor: palette.primary,
          backgroundColor: palette.tint,
          transform: [{ scale }],
        }}
      />
      <Heading small>{phase}</Heading>
      {running && <Copy>Cycle {Math.floor(elapsed! / 12) + 1} of 3</Copy>}
      <Button
        secondary
        label={running ? "Stop breathing guide" : "Begin breathing guide"}
        onPress={() => setElapsed(running ? null : 0)}
      />
    </Card>
  );
}

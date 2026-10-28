import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette as c } from "../../constants/palette";
import { localNoon } from "../../lib/dates";
import { dayTitle, monthCells } from "./calendar";

interface Props {
  month: string;
  selected: string;
  today: string;
  activityDates: ReadonlySet<string>;
  indicatorState: "ready" | "loading" | "error";
  onSelect: (date: string) => void;
  onMove: (amount: number) => void;
  onToday: () => void;
}
export function MonthCalendar({
  month,
  selected,
  today,
  activityDates,
  indicatorState,
  onSelect,
  onMove,
  onToday,
}: Props) {
  const cells = monthCells(month);
  return (
    <View style={styles.calendar}>
      <View style={styles.navigation}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => onMove(-1)}
          style={styles.arrow}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={styles.month}
        >
          {localNoon(month).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => onMove(1)}
          style={styles.arrow}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
      <View style={styles.week}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Text key={day} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.week}>
          {cells.slice(row * 7, row * 7 + 7).map((key, col) =>
            key ? (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: key === selected }}
                accessibilityLabel={`${dayTitle(key)}${key === today ? ", today" : ""}${indicatorState === "ready" ? (activityDates.has(key) ? ", activity recorded" : ", no recorded activity") : indicatorState === "error" ? ", activity unavailable" : ", activity loading"}`}
                onPress={() => onSelect(key)}
                style={({ pressed }) => [
                  styles.day,
                  key === today && styles.today,
                  key === selected && styles.selected,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    key === today && styles.todayNumber,
                    key === selected && { color: c.onPrimary },
                  ]}
                >
                  {localNoon(key).getDate()}
                </Text>
                <View
                  style={[
                    styles.dot,
                    activityDates.has(key) && {
                      backgroundColor:
                        key === selected ? c.onPrimary : c.primary,
                    },
                  ]}
                />
              </Pressable>
            ) : (
              <View key={`blank-${col}`} style={styles.day} />
            ),
          )}
        </View>
      ))}
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          • Recorded activity · Underline: today
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onToday}
          style={styles.todayButton}
        >
          <Text style={styles.todayText}>Today</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  calendar: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    padding: 6,
  },
  navigation: { flexDirection: "row", alignItems: "center", paddingBottom: 8 },
  month: {
    flex: 1,
    textAlign: "center",
    color: c.ink,
    fontSize: 20,
    fontWeight: "600",
  },
  arrow: {
    width: 44,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: c.primary, fontSize: 32 },
  week: { flexDirection: "row" },
  weekday: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 8,
    color: c.muted,
    fontSize: 12,
  },
  day: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  today: { borderColor: c.primary },
  todayNumber: { textDecorationLine: "underline", fontWeight: "700" },
  selected: { backgroundColor: c.primary },
  dayText: { color: c.ink, fontSize: 16 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    backgroundColor: "transparent",
  },
  legend: {
    paddingLeft: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legendText: { color: c.muted, fontSize: 12 },
  todayButton: {
    minHeight: 44,
    minWidth: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  todayText: { fontSize: 14, color: c.primary, fontWeight: "600" },
});

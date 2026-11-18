import { useState } from "react";
import { router } from "expo-router";
import {
  Button,
  Card,
  Copy,
  ErrorMessage,
  Heading,
  Loading,
  Screen,
} from "../../components/app/ui";
import { useRepository } from "../../db/provider";
import { useResource } from "../../lib/hooks";
import { localDateKey } from "../../lib/dates";
import { formatDuration, sleepMinutes, restLabels } from "../sleep/model";
import {
  dayTitle,
  monthRange,
  monthStart,
  selectionInMonth,
  shiftMonth,
} from "./calendar";
import { activitiesForDay } from "./timeline";
import { MonthCalendar } from "./MonthCalendar";
import { DayTimeline } from "./DayTimeline";

function CalendarActivity({
  month,
  selected,
  onSelect,
  onMove,
  onToday,
}: {
  month: string;
  selected: string;
  onSelect: (date: string) => void;
  onMove: (amount: number) => void;
  onToday: () => void;
}) {
  const repository = useRepository();
  const resource = useResource(async () => {
    const range = monthRange(month);
    return {
      dates: await repository.activityDates(range.from, range.to),
      today: localDateKey(),
    };
  });
  return (
    <>
      <MonthCalendar
        month={month}
        selected={selected}
        today={resource.data?.today ?? localDateKey()}
        activityDates={new Set(resource.data?.dates ?? [])}
        indicatorState={
          resource.error ? "error" : resource.loading ? "loading" : "ready"
        }
        onSelect={onSelect}
        onMove={onMove}
        onToday={onToday}
      />
      {resource.loading && <Loading />}
      <ErrorMessage
        message={
          resource.error
            ? "Calendar activity could not be loaded. You can still select a day."
            : null
        }
      />
      {resource.error && (
        <Button
          secondary
          label="Retry calendar activity"
          onPress={() => void resource.reload()}
        />
      )}
    </>
  );
}

function DaySleep({ date }: { date: string }) {
  const repository = useRepository();
  const resource = useResource(() => repository.sleepNights());
  const record = (resource.data ?? []).find(n => n.completed_at && n.wake_date === date);
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorMessage message="Sleep could not be loaded for this day." />;
  if (!record) return null;
  return <Card tinted>
    <Heading small>☾ The night before</Heading>
    <Copy>{formatDuration(sleepMinutes(record.stretches))} asleep across {record.stretches.length} stretch{record.stretches.length === 1 ? "" : "es"}</Copy>
    {record.restfulness !== null && <Copy muted>Rested: {restLabels[record.restfulness - 1]} ({record.restfulness}/5)</Copy>}
    {!!record.subjective_note && <Copy muted>{record.subjective_note}</Copy>}
    <Button secondary label="Open sleep journal" onPress={() => router.push("/sleep")} />
  </Card>;
}

function SelectedDay({ date }: { date: string }) {
  const repository = useRepository();
  const resource = useResource(() => repository.history(date, date));
  return (
    <>
      <Heading small>{dayTitle(date)}</Heading>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <>
          <ErrorMessage message={resource.error} />
          <Button
            secondary
            label="Retry this day"
            onPress={() => void resource.reload()}
          />
        </>
      ) : (
        resource.data && (
          <DayTimeline entries={activitiesForDay(resource.data, date)} />
        )
      )}
    </>
  );
}
export function MyDaysScreen() {
  const [selected, setSelected] = useState(() => localDateKey());
  const month = monthStart(selected);
  return (
    <Screen>
      <Heading>My Days</Heading>
      <Copy muted>
        A place for what you’ve noticed, tried, and wanted to keep.
      </Copy>
      <CalendarActivity
        key={month}
        month={month}
        selected={selected}
        onSelect={setSelected}
        onMove={(amount) =>
          setSelected((date) =>
            selectionInMonth(date, shiftMonth(date, amount)),
          )
        }
        onToday={() => setSelected(localDateKey())}
      />
      {/* Key each request to its calendar date so an older response or error cannot appear under a new heading. */}
      <DaySleep key={"sleep-"+selected} date={selected} />
      <SelectedDay key={selected} date={selected} />
      <Button secondary label="☾ Open my sleep journal" onPress={() => router.push("/sleep")} />
      <Button
        secondary
        label="View patterns"
        onPress={() => router.push("/patterns")}
      />
    </Screen>
  );
}

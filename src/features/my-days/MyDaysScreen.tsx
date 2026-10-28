import { useState } from "react";
import { router } from "expo-router";
import {
  Button,
  Copy,
  ErrorMessage,
  Heading,
  Loading,
  Screen,
} from "../../components/app/ui";
import { useRepository } from "../../db/provider";
import { useResource } from "../../lib/hooks";
import { localDateKey } from "../../lib/dates";
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
      <SelectedDay key={selected} date={selected} />
      <Button
        secondary
        label="View patterns"
        onPress={() => router.push("/patterns")}
      />
    </Screen>
  );
}

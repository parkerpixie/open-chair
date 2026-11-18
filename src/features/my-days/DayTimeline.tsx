import { Card, Copy, Eyebrow } from "../../components/app/ui";
import { activityKey, activityTime, type DayActivity } from "./timeline";
import { CheckInEntry } from "./entries/CheckInEntry";
import { ReflectionEntry } from "./entries/ReflectionEntry";
import { ToolEntry } from "./entries/ToolEntry";
import { TakeawayEntry } from "./entries/TakeawayEntry";
const labels: Record<DayActivity["kind"], string> = {
  "check-in": "Check-in",
  reflection: "Something worth keeping",
  tool: "Completed tool",
  takeaway: "Support takeaway",
};
function EntryContent({ entry }: { entry: DayActivity }) {
  switch (entry.kind) {
    case "check-in":
      return <CheckInEntry record={entry.record} />;
    case "reflection":
      return <ReflectionEntry record={entry.record} />;
    case "tool":
      return <ToolEntry record={entry.record} />;
    case "takeaway":
      return <TakeawayEntry record={entry.record} />;
  }
}
export function DayTimeline({ entries }: { entries: DayActivity[] }) {
  if (!entries.length)
    return (
      <Card>
        <Copy>No Open Chair activity was recorded this day.</Copy>
      </Card>
    );
  return (
    <>
      {entries.map((entry) => (
        <Card key={activityKey(entry)}>
          <Eyebrow>
            {labels[entry.kind]} · {activityTime(entry.record.created_at)}
          </Eyebrow>
          <EntryContent entry={entry} />
        </Card>
      ))}
    </>
  );
}

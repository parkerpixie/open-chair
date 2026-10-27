import { Copy } from "../../../components/app/ui";
import type { CheckIn } from "../../../db/types";
export function CheckInEntry({ record }: { record: CheckIn }) {
  return (
    <>
      <Copy>{record.feelings.map((feeling) => feeling.word).join(" · ")}</Copy>
      {record.intensity !== null && (
        <Copy muted>Intensity {record.intensity} / 5</Copy>
      )}
      {!!record.note && <Copy>{record.note}</Copy>}
    </>
  );
}

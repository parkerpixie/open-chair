import { useState } from "react";
import { Copy, Heading, Screen } from "../../components/app/ui";
import { SupportEditor } from "../../features/supports/SupportEditor";
import { newSupport } from "../../db/repository";
export default function NewSupport() {
  const [initial] = useState(newSupport);
  return (
    <Screen>
      <Heading>Make room for support.</Heading>
      <Copy muted>
        A person, meeting, appointment, or practice that matters to you.
      </Copy>
      <SupportEditor initial={initial} />
    </Screen>
  );
}

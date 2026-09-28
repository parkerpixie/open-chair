import { router } from "expo-router";
import {
  Button,
  Card,
  Copy,
  ErrorMessage,
  Eyebrow,
  Heading,
  Loading,
  Screen,
} from "../../components/app/ui";
import { useRepository } from "../../db/provider";
import { useResource } from "../../lib/hooks";
import { upcoming } from "../../features/supports/schedule";
export default function SupportsScreen() {
  const repository = useRepository();
  const resource = useResource(() => repository.supports());
  const supports = resource.data ?? [];
  return (
    <Screen>
      <Eyebrow>Connection & conditions</Eyebrow>
      <Heading>You don’t grow alone.</Heading>
      <Copy muted>
        Keep the people, places, and practices you want to return to.
      </Copy>
      <Button
        label="Add a support"
        onPress={() => router.push("/support/new")}
      />
      {resource.loading && <Loading />}
      <ErrorMessage message={resource.error} />
      {resource.error && (
        <Button label="Try again" onPress={() => void resource.reload()} />
      )}
      {!resource.loading && !supports.length && (
        <Card tinted>
          <Heading small>Your supports belong here.</Heading>
          <Copy>
            A therapy appointment, a class, a call with a friend. Start with
            what is useful to you.
          </Copy>
        </Card>
      )}
      {!!upcoming(supports).length && (
        <>
          <Heading small>Coming up</Heading>
          {upcoming(supports)
            .slice(0, 5)
            .map(({ support, date }) => (
              <Card key={support.id}>
                <Copy>{support.name}</Copy>
                <Copy muted>
                  {date.toLocaleString(undefined, {
                    weekday: "long",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Copy>
                <Button
                  secondary
                  label="View support"
                  onPress={() =>
                    router.push({
                      pathname: "/support/[id]",
                      params: { id: support.id },
                    })
                  }
                />
              </Card>
            ))}
        </>
      )}
      {!!supports.length && <Heading small>All supports</Heading>}
      {supports.map((support) => (
        <Card key={support.id}>
          <Heading small>
            {support.favorite ? "★ " : ""}
            {support.name}
          </Heading>
          <Copy muted>
            {support.type} · {support.mode}
            {!support.active ? " · Inactive" : ""}
          </Copy>
          <Button
            secondary
            label="Details & takeaways"
            onPress={() =>
              router.push({
                pathname: "/support/[id]",
                params: { id: support.id },
              })
            }
          />
        </Card>
      ))}
    </Screen>
  );
}

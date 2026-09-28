import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { openLocalDatabase } from "./open";
import { Repository } from "./repository";
import { migrate } from "./migrations";
import { Button, Copy, Heading, Loading, Screen } from "../components/app/ui";
const Context = createContext<Repository | null>(null);
export function DatabaseProvider({ children }: PropsWithChildren) {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const db = await openLocalDatabase();
        await migrate(db);
        if (active) setRepository(new Repository(db));
      } catch (err) {
        if (__DEV__) console.error("Database initialization failed", err);
        if (active) setError(true);
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, [attempt]);
  if (error)
    return (
      <Screen>
        <Heading>Your reflections could not be opened.</Heading>
        <Copy>Your existing data has not been cleared. Please try again.</Copy>
        <Button
          label="Try again"
          onPress={() => {
            setError(false);
            setAttempt((n) => n + 1);
          }}
        />
      </Screen>
    );
  if (!repository)
    return (
      <Screen>
        <Heading>Open Chair</Heading>
        <Loading />
      </Screen>
    );
  return <Context value={repository}>{children}</Context>;
}
export function useRepository() {
  const repository = useContext(Context);
  if (!repository) throw new Error("Database provider missing");
  return repository;
}

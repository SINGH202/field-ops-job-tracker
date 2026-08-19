import { useEffect, useState } from "react";
import { BackHandler } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Worker } from "@field-ops/contracts";
import { JobDetailScreen } from "./src/screens/JobDetailScreen";
import { JobListScreen } from "./src/screens/JobListScreen";
import { SignInScreen } from "./src/screens/SignInScreen";

type Route =
  | { name: "signIn" }
  | { name: "jobs"; worker: Worker }
  | { name: "job"; worker: Worker; jobId: string };

function goBack(route: Route, setRoute: (next: Route) => void): boolean {
  switch (route.name) {
    case "job":
      setRoute({ name: "jobs", worker: route.worker });
      return true;
    case "jobs":
      setRoute({ name: "signIn" });
      return true;
    case "signIn":
      return false;
    default: {
      const exhaustive: never = route;
      throw new Error(`Unhandled route: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "signIn" });

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      return goBack(route, setRoute);
    });
    return () => subscription.remove();
  }, [route]);

  let screen;
  switch (route.name) {
    case "signIn":
      screen = <SignInScreen onSelect={(worker) => setRoute({ name: "jobs", worker })} />;
      break;
    case "jobs":
      screen = (
        <JobListScreen
          worker={route.worker}
          onOpenJob={(jobId) => setRoute({ name: "job", worker: route.worker, jobId })}
          onSignOut={() => setRoute({ name: "signIn" })}
        />
      );
      break;
    case "job":
      screen = (
        <JobDetailScreen
          worker={route.worker}
          jobId={route.jobId}
          onBack={() => {
            goBack(route, setRoute);
          }}
        />
      );
      break;
    default: {
      const exhaustive: never = route;
      throw new Error(`Unhandled route: ${JSON.stringify(exhaustive)}`);
    }
  }

  return (
    <>
      <StatusBar style="dark" />
      {screen}
    </>
  );
}

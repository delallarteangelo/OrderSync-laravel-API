import { setupWorker } from "msw/browser";
import { flags } from "@/shared/config/env";
import { browserHandlers, handlers } from "./handlers";

export const worker = setupWorker(...(flags.useMockAuth ? handlers : browserHandlers));

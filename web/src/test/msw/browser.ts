import { setupWorker } from "msw/browser";
import { flags } from "@/shared/config/env";
import { authHandlers } from "./handlers/auth";
import { nonAuthHandlers } from "./handlers";

export const worker = setupWorker(...(flags.useMockAuth ? [...authHandlers, ...nonAuthHandlers] : nonAuthHandlers));

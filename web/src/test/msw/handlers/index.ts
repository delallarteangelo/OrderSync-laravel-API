import { authHandlers, healthHandlers } from "./auth";
import { catalogHandlers } from "./catalog";
import { inventoryHandlers } from "./inventory";
import { ordersHandlers } from "./orders";
import { posHandlers } from "./pos";
import { messagesHandlers } from "./messages";
import { usersHandlers } from "./users";
import { settingsHandlers } from "./settings";
import { reportsHandlers } from "./reports";
import { platformHandlers } from "./platform";
import { paymentsHandlers } from "./payments";

export const nonAuthHandlers = [
  ...healthHandlers,
  ...catalogHandlers,
  ...inventoryHandlers,
  ...ordersHandlers,
  ...posHandlers,
  ...messagesHandlers,
  ...usersHandlers,
  ...settingsHandlers,
  ...reportsHandlers,
  ...platformHandlers,
  ...paymentsHandlers,
];

export const handlers = [...authHandlers, ...nonAuthHandlers];

// Implemented modules use Laravel in normal development. Future-phase modules
// remain mocked until their backend work is approved.
export const browserHandlers = [...usersHandlers, ...settingsHandlers];

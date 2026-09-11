import * as React from "react";

export function draftStorageKey(scope: string): string {
  return `ordersync-message-draft:${scope}`;
}

export function clearMessageDraftsForUser(userId: string): void {
  const marker = `:${userId}:`;
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("ordersync-message-draft:") && key.includes(marker)) {
      localStorage.removeItem(key);
    }
  }
}

export function usePersistentDraft(scope: string): [string, (value: string) => void, () => void] {
  const key = draftStorageKey(scope);
  const [draft, setDraftState] = React.useState(() => localStorage.getItem(key) ?? "");

  React.useEffect(() => {
    setDraftState(localStorage.getItem(key) ?? "");
  }, [key]);

  const setDraft = React.useCallback(
    (value: string) => {
      setDraftState(value);
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    },
    [key],
  );

  const clearDraft = React.useCallback(() => {
    setDraftState("");
    localStorage.removeItem(key);
  }, [key]);

  return [draft, setDraft, clearDraft];
}

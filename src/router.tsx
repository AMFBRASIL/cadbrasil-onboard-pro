import { QueryClient } from "@tanstack/react-query";
import {
  createRouter,
  parseSearchWith,
  stringifySearchWith,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Query string plana (estilo Google Ads / UTM).
 * Evita o default JSON do TanStack que vira utm_id=%22111%22.
 */
const parseSearch = parseSearchWith((value: string) => value);
const stringifySearch = stringifySearchWith((value: unknown) =>
  value == null ? "" : String(value),
);

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    parseSearch,
    stringifySearch,
  });

  return router;
};

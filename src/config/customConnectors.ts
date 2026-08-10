export type CustomConnector = {
  id: string;
  name: string;
  baseUrl: string;
  method: "OAuth 2.0" | "MCP";
  logo: string | null;
  createdAt: number;
};

const STORAGE_KEY = "vedaapex-custom-connectors";
const CONNECTIONS_KEY = "vedaapex-custom-connections";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadCustomConnectors(): CustomConnector[] {
  if (typeof window === "undefined") return [];
  return safeParse<CustomConnector[]>(window.localStorage.getItem(STORAGE_KEY), []);
}

export function saveCustomConnectors(list: CustomConnector[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addCustomConnector(
  data: Omit<CustomConnector, "id" | "createdAt">
): CustomConnector {
  const connector: CustomConnector = {
    ...data,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  saveCustomConnectors([connector, ...loadCustomConnectors()]);
  return connector;
}

export function deleteCustomConnector(id: string) {
  saveCustomConnectors(loadCustomConnectors().filter((c) => c.id !== id));
  const connections = loadCustomConnections();
  if (connections[id]) {
    delete connections[id];
    saveCustomConnections(connections);
  }
}

export function loadCustomConnections(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, string>>(window.localStorage.getItem(CONNECTIONS_KEY), {});
}

export function saveCustomConnections(map: Record<string, string>) {
  window.localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(map));
}

const BASE_URL = "https://api.open5e.com/v1";
const SRD_FILTER = "document__slug=wotc-srd";

export async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${BASE_URL}/${endpoint}/?format=json&limit=50&${SRD_FILTER}`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const data = await res.json();
    results.push(...data.results);
    url = data.next;
  }

  return results;
}

export type MapsRouteStop = {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

// Google Maps multi-stop directions URLs (e.g. .../maps/dir/Stop+One,+Addr/Stop+Two,+Addr/@lat,lng,zoom/data=...)
// carry every stop's name in the path and its coordinates in the `!1d<lng>!2d<lat>` pairs
// buried in the `data=` param -- both are readable directly off the URL, no page fetch needed.
// Single-destination Maps links (only one stop) fall through and get treated as a normal link.
export function parseMapsRouteUrl(rawUrl: string): MapsRouteStop[] | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!/(^|\.)google\.[a-z.]+$/i.test(url.hostname)) return null;

  const match = url.pathname.match(/^\/maps\/dir\/(.+)$/);
  if (!match) return null;

  const stopSegments: string[] = [];
  for (const seg of match[1].split("/").filter(Boolean)) {
    if (seg.startsWith("@") || seg.startsWith("data=")) break;
    stopSegments.push(seg);
  }
  if (stopSegments.length < 2) return null;

  const stops = stopSegments.map((seg) => {
    let decoded = seg.replace(/\+/g, " ");
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // leave partially-decoded string as-is if malformed
    }
    const name = decoded.split(",")[0].trim();
    return { name: name || decoded.trim(), address: decoded.trim() };
  });

  const coordPairs: { lat: number; lng: number }[] = [];
  const coordRegex = /!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = coordRegex.exec(rawUrl)) !== null) {
    coordPairs.push({ lng: parseFloat(m[1]), lat: parseFloat(m[2]) });
  }
  const hasCoords = coordPairs.length === stops.length;

  return stops.map((s, i) => ({
    name: s.name,
    address: s.address,
    lat: hasCoords ? coordPairs[i].lat : null,
    lng: hasCoords ? coordPairs[i].lng : null,
  }));
}

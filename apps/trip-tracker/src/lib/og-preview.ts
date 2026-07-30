import ogs from "open-graph-scraper";

export async function fetchLinkPreview(url: string): Promise<{ photoUrl: string | null; previewTitle: string | null }> {
  try {
    const { error, result } = await ogs({ url, timeout: 5 });
    if (error) return { photoUrl: null, previewTitle: null };
    const image = Array.isArray(result.ogImage) ? result.ogImage[0] : result.ogImage;
    return {
      photoUrl: image?.url ?? null,
      previewTitle: result.ogTitle ?? null,
    };
  } catch (err) {
    console.error(`[og-preview] failed to fetch preview for ${url}:`, err);
    return { photoUrl: null, previewTitle: null };
  }
}

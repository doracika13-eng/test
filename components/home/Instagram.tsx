import { site } from "@/lib/site";

type Media = { id: string; caption?: string; media_url: string; thumbnail_url?: string; permalink: string; media_type: string };

async function getFeed(): Promise<Media[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,thumbnail_url,permalink,media_type&limit=6&access_token=${encodeURIComponent(token)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Media[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

/** Instagram band. Shows the live feed when INSTAGRAM_ACCESS_TOKEN is set; otherwise a link only. */
export async function Instagram() {
  const feed = await getFeed();
  return (
    <section aria-labelledby="ig-title" className="gutter mx-auto max-w-[120rem] py-24 md:py-32">
      <div className="flex flex-col gap-6 border-t border-ink/15 pt-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-4 text-ink/50">Journal</p>
          <h2 id="ig-title" className="editorial text-[clamp(2.4rem,5vw,4.5rem)] leading-none">
            Follow the making of <em className="text-bordeaux">DAMI.</em>
          </h2>
        </div>
        <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-dark self-start md:self-auto" data-cursor="Follow">
          <span className="btn-label">Instagram ↗</span>
        </a>
      </div>
      {feed.length > 0 && (
        <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-6">
          {feed.map((m) => (
            <li key={m.id}>
              <a href={m.permalink} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="zoom-img relative aspect-square overflow-hidden bg-bone">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url} alt={m.caption?.slice(0, 120) || "DAMI on Instagram"} loading="lazy" className="h-full w-full object-cover" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

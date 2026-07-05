import { useNewsListStore } from "@/features/news/presentation/stores/v2/useNewsListStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import SubscribeFormV2 from "@/features/layout/presentation/v2/SubscribeFormV2";
import type { NewsListData } from "@/features/news/domain/entities/news-list-v2";

interface Props {
	data: NewsListData;
	perPage?: number;
}

const STRIPE = "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 10px,#f0ece5 10px,#f0ece5 20px)";
const STRIPE_LG = "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 12px,#f0ece5 12px,#f0ece5 24px)";

const pagerBtn = (active: boolean) =>
	`h-[38px] min-w-[38px] cursor-pointer rounded-lg border font-display text-[14px] ${
		active ? "border-brand bg-brand text-white" : "border-black/15 bg-white text-muted hover:border-brand"
	}`;

/** News list — featured + category filter + search + grid + pagination + sidebar.
 *  React island; category/search/page live in a Zustand store. */
export default function NewsBoard({ data, perPage = 6 }: Props) {
	const { cat, query, page, setCat, setQuery, setPage } = useNewsListStore();
	const tabs = ["All", ...data.categories.map((c) => c.label)];
	const q = query.trim().toLowerCase();

	const filtered = data.articles.filter(
		(a) => (cat === "All" || a.cat === cat) && (!q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)),
	);

	const showFeatured = cat === "All" && !q && page === 1 && data.articles.length > 0;
	const featured = showFeatured ? data.articles[0] : null;
	const pool = showFeatured ? filtered.slice(1) : filtered;

	const totalPages = Math.max(1, Math.ceil(pool.length / perPage));
	const current = Math.min(Math.max(1, page), totalPages);
	const posts = pool.slice((current - 1) * perPage, current * perPage);
	const emptyBody = q ? `Nothing matches “${query}”. Try another search.` : "No articles in this category yet — check back soon.";

	return (
		<>
			{/* CATEGORY FILTER */}
			<section className="border-b border-black/[0.08] bg-panel">
				<div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-8 py-5 max-[960px]:px-6">
					<div className="flex flex-wrap items-center gap-2">
						{tabs.map((t) => (
							<button key={t} type="button" onClick={() => setCat(t)} className={pillClass(cat === t)}>
								{t}
							</button>
						))}
					</div>
					<div className="flex items-center gap-2.5 rounded-lg border border-black/15 bg-white px-4 py-2.5">
						<span className="font-mono text-[13px] text-muted2">⌕</span>
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search news…"
							className="w-[200px] border-none bg-transparent font-body text-[14px] text-ink2 outline-none max-[600px]:w-[130px]"
						/>
					</div>
				</div>
			</section>

			{/* FEATURED */}
			{featured && (
				<section className="mx-auto max-w-[1280px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
					<a
						href={featured.href}
						className="group grid grid-cols-[1.2fr_1fr] overflow-hidden rounded-2xl border border-black/10 bg-white no-underline shadow-[0_1px_2px_rgba(20,16,9,0.04)] hover:border-brand/40 max-[760px]:grid-cols-1"
					>
						{featured.image ? (
							<img src={featured.image} alt={featured.title} className="block min-h-[280px] w-full object-cover" />
						) : (
							<span className="block min-h-[280px]" style={{ background: STRIPE_LG }} />
						)}
						<span className="flex flex-col justify-center p-10 max-[600px]:p-6">
							<span className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-brand">
								<span className="rounded-full bg-brand/10 px-2.5 py-1">Featured</span>
								<span className="text-muted2">{featured.cat}</span>
							</span>
							<span className="font-display text-[clamp(28px,3vw,40px)] uppercase leading-[0.98] text-ink group-hover:text-brand">{featured.title}</span>
							{featured.excerpt && <span className="mt-4 text-[15.5px] leading-[1.6] text-muted">{featured.excerpt}</span>}
							<span className="mt-6 flex items-center gap-3 font-mono text-[11px] text-muted2">
								{featured.date}
								<span className="text-black/20">·</span>
								{featured.read}
							</span>
						</span>
					</a>
				</section>
			)}

			{/* GRID + SIDEBAR */}
			<section className="mx-auto grid max-w-[1280px] grid-cols-[1fr_300px] gap-12 px-8 py-[48px] max-[960px]:grid-cols-1 max-[960px]:gap-10 max-[960px]:px-6">
				<div className="min-w-0">
					{posts.length > 0 ? (
						<>
							<div className="grid grid-cols-2 gap-6 max-[600px]:grid-cols-1">
								{posts.map((p, i) => (
									<a
										key={`${p.href}-${i}`}
										href={p.href}
										className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white no-underline shadow-[0_1px_2px_rgba(20,16,9,0.04)] hover:border-brand/40"
									>
										<span className="relative block aspect-[16/10]" style={p.image ? undefined : { background: STRIPE }}>
											{p.image && <img src={p.image} alt={p.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
											<span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-brand">{p.cat}</span>
										</span>
										<span className="flex flex-1 flex-col p-6 max-[600px]:p-5">
											<span className="font-body text-[19px] font-extrabold leading-[1.22] text-ink2 group-hover:text-brand">{p.title}</span>
											{p.excerpt && <span className="mt-2.5 flex-1 text-[14px] leading-[1.55] text-muted">{p.excerpt}</span>}
											<span className="mt-4 flex items-center gap-2.5 font-mono text-[11px] text-muted2">
												{p.date}
												<span className="text-black/20">·</span>
												{p.read}
											</span>
										</span>
									</a>
								))}
							</div>

							{totalPages > 1 && (
								<div className="mt-10 flex items-center justify-center gap-2">
									<button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className={`${pagerBtn(false)} disabled:cursor-not-allowed disabled:opacity-40`}>
										‹
									</button>
									{Array.from({ length: totalPages }, (_, i) => i + 1).map((pnum) => (
										<button key={pnum} type="button" onClick={() => setPage(pnum)} className={pagerBtn(pnum === current)}>
											{pnum}
										</button>
									))}
									<button type="button" onClick={() => setPage(current + 1)} disabled={current === totalPages} className={`${pagerBtn(false)} disabled:cursor-not-allowed disabled:opacity-40`}>
										›
									</button>
								</div>
							)}
						</>
					) : (
						<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-20 text-center">
							<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-panel font-mono text-[18px] text-muted2">⌕</div>
							<div className="font-display text-[22px] uppercase text-ink">No articles found</div>
							<p className="max-w-[360px] text-[14px] leading-[1.5] text-muted">{emptyBody}</p>
						</div>
					)}
				</div>

				{/* SIDEBAR */}
				<aside className="flex flex-col gap-6">
					{data.categories.length > 0 && (
						<div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
							<div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted2">Categories</div>
							<div className="flex flex-col">
								{data.categories.map((c) => (
									<button
										key={c.label}
										type="button"
										onClick={() => setCat(c.label)}
										className="flex items-center justify-between border-b border-black/[0.06] py-2.5 text-left font-body text-[14px] font-semibold last:border-0 hover:text-brand"
										style={{ color: cat === c.label ? "#e4002b" : "#1a1712" }}
									>
										<span>{c.label}</span>
										<span className="font-mono text-[11px] text-muted2">{c.count}</span>
									</button>
								))}
							</div>
						</div>
					)}

					{data.archives.length > 0 && (
						<div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
							<div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted2">Archives</div>
							<div className="flex flex-col gap-2">
								{data.archives.map((a) => (
									<div key={a.label} className="flex items-center justify-between font-body text-[14px] text-ink2">
										<span>{a.label}</span>
										<span className="font-mono text-[11px] text-muted2">{a.count}</span>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="rounded-2xl border border-black/10 bg-night p-5 text-cream shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
						<div className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted2">Newsletter</div>
						<p className="mb-3 text-[13.5px] leading-[1.5] text-creamdim">Get the latest stories in your inbox.</p>
						<SubscribeFormV2 />
					</div>
				</aside>
			</section>
		</>
	);
}

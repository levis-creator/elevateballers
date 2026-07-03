import { useNewsFilterStore } from "@/features/home/presentation/stores/v2/useNewsFilterStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import type { NewsItem } from "@/features/home/domain/entities/home-v2";

interface Props {
	news: NewsItem[];
	categories: string[];
}

const PLACEHOLDER = "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 10px,#f0ece5 10px,#f0ece5 20px)";

/** Latest News — React island; category filter state lives in a Zustand store. */
export default function LatestNews({ news, categories }: Props) {
	const category = useNewsFilterStore((s) => s.category);
	const setCategory = useNewsFilterStore((s) => s.setCategory);
	const filtered = category === "All" ? news : news.filter((n) => n.cat === category);

	return (
		<section className="mx-auto max-w-[1280px] px-8 py-[72px] max-[960px]:px-6 max-[960px]:py-[52px]">
			<div className="mb-7 flex flex-wrap items-end justify-between gap-6">
				<div>
					<div className="mb-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-brand">From around the league</div>
					<h2 className="font-display text-[38px] uppercase text-ink">Latest News</h2>
				</div>
				<div className="flex flex-wrap gap-2">
					{categories.map((c) => (
						<button key={c} type="button" onClick={() => setCategory(c)} className={pillClass(category === c)}>
							{c}
						</button>
					))}
				</div>
			</div>
			<div className="grid grid-cols-3 gap-5 max-[960px]:grid-cols-2 max-[600px]:grid-cols-1">
				{filtered.map((n) => (
					<a
						key={n.title}
						href={n.url}
						className="flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white text-inherit no-underline shadow-[0_1px_2px_rgba(20,16,9,0.04)] hover:border-brand/40"
					>
						{n.image ? (
							<img src={n.image} alt={n.title} className="aspect-[16/10] w-full object-cover" loading="lazy" />
						) : (
							<div className="flex aspect-[16/10] items-center justify-center" style={{ background: PLACEHOLDER }}>
								<span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#a49a8d]">article image</span>
							</div>
						)}
						<div className="flex flex-1 flex-col p-5">
							<span className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand">{n.cat}</span>
							<h3 className="mb-2.5 font-body text-[18px] font-extrabold leading-[1.25] text-ink2">{n.title}</h3>
							<p className="flex-1 text-[13.5px] leading-[1.55] text-muted">{n.excerpt}</p>
							<span className="mt-3.5 font-mono text-[11px] text-[#a49a8d]">{n.date}</span>
						</div>
					</a>
				))}
			</div>
		</section>
	);
}

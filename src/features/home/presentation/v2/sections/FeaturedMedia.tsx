import { useMediaTabStore } from "@/features/home/presentation/stores/v2/useMediaTabStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import type { MediaItem } from "@/features/home/domain/entities/home-v2";

interface Props {
	media: MediaItem[];
	tabs: string[];
}

const STRIPES = "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 10px,#f0ece5 10px,#f0ece5 20px)";
const AUDIO_BG = "linear-gradient(135deg,#ece7df,#f4f0ea)";

/** Featured Media — React island; active type tab lives in a Zustand store. */
export default function FeaturedMedia({ media, tabs }: Props) {
	const tab = useMediaTabStore((s) => s.tab);
	const setTab = useMediaTabStore((s) => s.setTab);
	const items = tab === "All" ? media : media.filter((m) => m.type === tab);
	const emptyTitle = tab === "All" ? "No featured media yet" : tab === "Audio" ? "No audio clips yet" : "No images yet";
	const emptyBody =
		tab === "All"
			? "Photos, audio and highlights from match days will appear here as the season plays out."
			: `Nothing tagged ${tab.toLowerCase()} right now — check back after the next match day.`;

	return (
		<section className="mx-auto max-w-[1280px] px-8 py-[72px] max-[960px]:px-6 max-[960px]:py-[52px]">
			<div className="mb-7 flex flex-wrap items-end justify-between gap-6">
				<div>
					<div className="mb-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-brand">Visual highlights from across the league</div>
					<h2 className="font-display text-[38px] uppercase text-ink">Featured Media</h2>
				</div>
				<div className="flex gap-2">
					{tabs.map((t) => (
						<button key={t} type="button" onClick={() => setTab(t)} className={pillClass(tab === t)}>
							{t}
						</button>
					))}
				</div>
			</div>
			{items.length > 0 ? (
				<div className="grid grid-cols-4 gap-3.5 max-[600px]:grid-cols-1" style={{ gridAutoRows: "180px" }}>
					{items.map((mi) => (
						<div
							key={mi.label}
							className={`flex items-center justify-center overflow-hidden rounded-xl border border-black/10 ${mi.span ? "col-span-2" : ""}`}
							style={
								mi.image
									? { backgroundImage: `url(${mi.image})`, backgroundSize: "cover", backgroundPosition: "center" }
									: { background: mi.type === "Audio" ? AUDIO_BG : STRIPES }
							}
						>
							{!mi.image && (
								<span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#a49a8d]">{mi.label}</span>
							)}
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-14 text-center">
					<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-panel">
						<div className="relative h-4 w-5 rounded-[3px] border-2 border-[#b3a99c]">
							<div className="absolute left-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[#b3a99c]" />
						</div>
					</div>
					<div className="font-display text-[22px] uppercase text-ink">{emptyTitle}</div>
					<p className="max-w-[360px] text-[14px] leading-[1.5] text-muted">{emptyBody}</p>
				</div>
			)}
		</section>
	);
}

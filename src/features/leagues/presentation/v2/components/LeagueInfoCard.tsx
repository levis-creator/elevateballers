import { useState } from "react";
import { Trophy, Image as ImageIcon } from "lucide-react";
import MediaPickerV2 from "@/features/media/presentation/v2/MediaPickerV2";
import type { LeagueFormErrors, LeagueFormValues } from "@/features/leagues/domain/entities/league-form";
import CardHeader from "./CardHeader";

interface Props {
	values: LeagueFormValues;
	errors: LeagueFormErrors;
	touched: boolean;
	slugPreview: string;
	set: <K extends keyof LeagueFormValues>(key: K, value: LeagueFormValues[K]) => void;
}

export default function LeagueInfoCard({ values, errors, touched, slugPreview, set }: Props) {
	const [pickerOpen, setPickerOpen] = useState(false);

	const statusHint = values.active
		? "Visible on the public site."
		: "Hidden from the public site; still editable here.";

	return (
		<div className="mb-4 overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
			<CardHeader icon={Trophy} title="League Information" subtitle="Core details shown across the site" />

			<div className="grid grid-cols-2 gap-x-5 gap-y-5 p-6 max-[600px]:grid-cols-1">
				<div>
					<label className="eb-lb" htmlFor="league-name">
						League Name <span className="text-[var(--brand)]">*</span>
					</label>
					<input
						id="league-name"
						className="eb-in"
						type="text"
						value={values.name}
						onChange={(e) => set("name", e.target.value)}
						placeholder="e.g. Ballers League"
					/>
					{touched && errors.name && (
						<p className="mt-1.5 font-['Space_Mono'] text-[10.5px] text-[var(--brandsoft)]">{errors.name}</p>
					)}
				</div>

				<div>
					<label className="eb-lb" htmlFor="league-slug">
						Slug
					</label>
					<input
						id="league-slug"
						className="eb-in"
						type="text"
						value={values.slug}
						onChange={(e) => set("slug", e.target.value)}
						placeholder="ballers-league"
					/>
					{touched && errors.slug ? (
						<p className="mt-1.5 font-['Space_Mono'] text-[10.5px] text-[var(--brandsoft)]">{errors.slug}</p>
					) : (
						<p className="mt-1.5 font-['Space_Mono'] text-[10.5px] text-[var(--txm)]">
							elevateballers.com/leagues/<span className="text-[var(--brandsoft)]">{slugPreview}</span>
						</p>
					)}
				</div>

				<div className="col-span-2 max-[600px]:col-span-1">
					<label className="eb-lb" htmlFor="league-desc">
						Description
					</label>
					<textarea
						id="league-desc"
						className="eb-in"
						style={{ minHeight: 96, resize: "vertical", lineHeight: 1.55 }}
						value={values.description}
						onChange={(e) => set("description", e.target.value)}
						placeholder="Short summary of this league…"
					/>
				</div>

				<div>
					<span className="eb-lb">Logo</span>
					<button
						type="button"
						onClick={() => setPickerOpen(true)}
						className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-3 text-left hover:border-[var(--brand)]"
					>
						<span className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-[var(--bord)] bg-[var(--surf)] text-[var(--txm)]">
							{values.logo ? (
								<img src={values.logo} alt="" className="h-full w-full object-cover" />
							) : (
								<ImageIcon className="h-[20px] w-[20px]" />
							)}
						</span>
						<span className="min-w-0 flex-1">
							<span className="block font-['Archivo'] text-[12.5px] font-bold text-[var(--tx)]">
								{values.logo ? "Logo set" : "No logo yet"}
							</span>
							<span className="block truncate font-['Space_Mono'] text-[10.5px] text-[var(--txm)]">
								{values.logo || "Pick from the media library or upload one"}
							</span>
						</span>
						<span className="flex-shrink-0 rounded-md border border-[var(--bord)] bg-[var(--surf)] px-2.5 py-1.5 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--txd)]">
							Choose
						</span>
					</button>
					{values.logo && (
						<button
							type="button"
							onClick={() => set("logo", "")}
							className="mt-1.5 font-['Space_Mono'] text-[10.5px] text-[var(--txm)] hover:text-[var(--brand)]"
						>
							Remove logo
						</button>
					)}
				</div>

				<div>
					<label className="eb-lb" htmlFor="league-status">
						Status
					</label>
					<select
						id="league-status"
						className="eb-in"
						value={values.active ? "active" : "archived"}
						onChange={(e) => set("active", e.target.value === "active")}
					>
						<option value="active">Active</option>
						<option value="archived">Archived</option>
					</select>
					<p className="mt-1.5 flex items-center gap-1.5 font-['Space_Mono'] text-[10.5px] text-[var(--txm)]">
						<span
							className="h-1.5 w-1.5 rounded-full"
							style={{ background: values.active ? "#1f9d55" : "#8a817a" }}
						/>
						{statusHint}
					</p>
				</div>
			</div>

			<MediaPickerV2
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				onSelect={(url) => set("logo", url)}
				title="Select logo"
			/>
		</div>
	);
}

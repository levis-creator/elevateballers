import { Info } from "lucide-react";
import type { SeasonFormErrors, SeasonFormValues } from "@/features/seasons/domain/entities/season-form";
import FormCard, { FieldError, Label } from "./FormCard";

interface Props {
	values: SeasonFormValues;
	errors: SeasonFormErrors;
	touched: boolean;
	slugPreview: string;
	set: <K extends keyof SeasonFormValues>(key: K, value: SeasonFormValues[K]) => void;
}

const INPUT =
	"w-full rounded-lg border bg-[var(--surf2)] px-3.5 py-3 text-[var(--tx)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--brand)]";

export default function SeasonDetailsCard({ values, errors, touched, slugPreview, set }: Props) {
	return (
		<FormCard icon={Info} title="Season Details" subtitle="Name, slug and description">
			<Label required>Season Name</Label>
			<input
				type="text"
				value={values.name}
				onChange={(e) => set("name", e.target.value)}
				placeholder="e.g. 2026 Season"
				className={`${INPUT} font-['Archivo'] text-[14px] ${
					touched && errors.name ? "border-[var(--brand)]" : "border-[var(--bord)]"
				}`}
			/>
			<FieldError message={touched ? errors.name : undefined} />

			<div className="mt-4">
				<Label>Slug</Label>
				<input
					type="text"
					value={values.slug}
					onChange={(e) => set("slug", e.target.value)}
					placeholder="auto-generated-from-name"
					className={`${INPUT} font-['Space_Mono'] text-[13px] ${
						touched && errors.slug ? "border-[var(--brand)]" : "border-[var(--bord)]"
					}`}
				/>
				<FieldError message={touched ? errors.slug : undefined} />
				<p className="mt-1.5 font-['Space_Mono'] text-[11px] text-[var(--txm)]">
					/seasons/<span className="text-[var(--txd)]">{slugPreview}</span> · leave empty to auto-generate
				</p>
			</div>

			<div className="mt-4">
				<Label>Description</Label>
				<textarea
					value={values.description}
					onChange={(e) => set("description", e.target.value)}
					placeholder="Short description of this season…"
					className={`${INPUT} h-[92px] resize-none border-[var(--bord)] font-['Archivo'] text-[13.5px] leading-[1.55]`}
				/>
			</div>
		</FormCard>
	);
}

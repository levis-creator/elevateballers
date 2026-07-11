import { useState, type ComponentType, type ReactNode } from "react";

interface Props {
	id: string;
	label: string;
	icon: ComponentType<any>;
	type?: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	autoComplete?: string;
	disabled?: boolean;
	required?: boolean;
	/** Right-aligned node in the label row (e.g. a "Forgot password?" link). */
	labelRight?: ReactNode;
	/** Trailing control inside the field box (e.g. a show/hide button). */
	rightSlot?: ReactNode;
}

/**
 * Dark, icon-prefixed input used by the admin auth screens. Owns only its own
 * focus visuals (brand ring + icon tint); value/state is lifted to the caller.
 * DRY: shared by the email and password fields.
 */
export default function LoginField({
	id,
	label,
	icon: Icon,
	type = "text",
	value,
	onChange,
	placeholder,
	autoComplete,
	disabled,
	required,
	labelRight,
	rightSlot,
}: Props) {
	const [focused, setFocused] = useState(false);
	const active = focused || value.length > 0;
	const borderColor = focused ? "#e4002b" : value.length ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)";
	const boxShadow = focused ? "0 0 0 3px rgba(228,0,43,0.18)" : "none";
	const iconColor = active ? "#ff5a72" : "#5f574e";

	return (
		<div>
			<div className="mb-2 flex items-baseline justify-between">
				<label htmlFor={id} className="block font-body text-[12px] font-bold uppercase tracking-[0.08em] text-creamdim">
					{label}
				</label>
				{labelRight}
			</div>
			<div className="flex items-center gap-3 rounded-lg border bg-[#16130f] px-4 transition-colors duration-150" style={{ borderColor, boxShadow }}>
				<Icon className="h-[18px] w-[18px] flex-shrink-0" style={{ color: iconColor }} strokeWidth={1.8} aria-hidden />
				<input
					id={id}
					type={type}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					placeholder={placeholder}
					autoComplete={autoComplete}
					disabled={disabled}
					required={required}
					className="w-full border-none bg-transparent py-[15px] font-body text-[15px] text-cream outline-none placeholder:text-[#5f574e] disabled:opacity-60"
				/>
				{rightSlot}
			</div>
		</div>
	);
}

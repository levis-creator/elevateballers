import type { ReactNode } from "react";
import { avatarTint, initials } from "@/lib/avatar";

interface Props {
	/** Stable tint source — an id, email or name. */
	seed: string;
	/** Name the initials are derived from. Defaults to the seed. */
	label?: string;
	/** Logo/photo. Rendered instead of the initials when present. */
	src?: string | null;
	/** Custom fallback (e.g. an icon) in place of initials. */
	fallback?: ReactNode;
	maxInitials?: number;
	/** `soft` = tinted wash + tinted text; `solid` = full-colour + white text. */
	variant?: "soft" | "solid";
	/** Size and shape, e.g. "h-9 w-9 rounded-full". */
	className?: string;
}

/**
 * The one avatar used across the admin v2 modules. Before this, the tint hash
 * was copy-pasted into five components — and had already drifted between them.
 */
export default function EntityAvatar({
	seed,
	label,
	src,
	fallback,
	maxInitials = 2,
	variant = "soft",
	className = "",
}: Props) {
	const tint = avatarTint(seed);
	const style =
		variant === "solid" ? { background: tint, color: "#ffffff" } : { background: `${tint}22`, color: tint };

	return (
		<span
			className={`flex flex-shrink-0 items-center justify-center overflow-hidden font-['Anton'] leading-none ${className}`}
			style={style}
		>
			{src ? (
				<img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
			) : (
				(fallback ?? initials(label ?? seed, maxInitials))
			)}
		</span>
	);
}

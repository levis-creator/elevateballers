import { useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";

interface Props {
	/** Current code (0..length digits). */
	value: string;
	onChange: (code: string) => void;
	length?: number;
	disabled?: boolean;
	autoFocus?: boolean;
}

/**
 * Reusable segmented code input: N single-digit cells with auto-advance,
 * backspace/arrow navigation and paste-to-fill. Self-contained (owns cell refs
 * and focus); the assembled code is lifted to the caller via `onChange`. Not
 * OTP-specific — reusable for any fixed-length numeric code.
 */
export default function OtpInput({ value, onChange, length = 6, disabled, autoFocus }: Props) {
	const refs = useRef<(HTMLInputElement | null)[]>([]);
	const digits = Array.from({ length }, (_, i) => value[i] ?? "");

	const focusCell = (i: number) => {
		const el = refs.current[Math.max(0, Math.min(length - 1, i))];
		el?.focus();
		el?.select();
	};
	const setAt = (i: number, ch: string) => {
		const arr = digits.slice();
		arr[i] = ch;
		onChange(arr.join("").slice(0, length));
	};
	const fill = (str: string, start: number) => {
		const chars = str.replace(/\D/g, "").split("").slice(0, length - start);
		if (!chars.length) return;
		const arr = digits.slice();
		chars.forEach((c, k) => (arr[start + k] = c));
		onChange(arr.join("").slice(0, length));
		setTimeout(() => focusCell(Math.min(start + chars.length, length - 1)), 0);
	};
	const onInput = (i: number, e: ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value.replace(/\D/g, "");
		if (!raw) return setAt(i, "");
		if (raw.length > 1) return fill(raw, i);
		setAt(i, raw[0]);
		if (i < length - 1) focusCell(i + 1);
	};
	const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Backspace" && !digits[i] && i > 0) focusCell(i - 1);
		else if (e.key === "ArrowLeft" && i > 0) {
			e.preventDefault();
			focusCell(i - 1);
		} else if (e.key === "ArrowRight" && i < length - 1) {
			e.preventDefault();
			focusCell(i + 1);
		}
	};
	const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		fill(e.clipboardData.getData("text"), 0);
	};

	return (
		<div className="flex gap-2.5 max-[600px]:gap-2">
			{digits.map((d, i) => (
				<input
					key={i}
					ref={(el) => (refs.current[i] = el)}
					inputMode="numeric"
					maxLength={1}
					value={d}
					onChange={(e) => onInput(i, e)}
					onKeyDown={(e) => onKeyDown(i, e)}
					onPaste={onPaste}
					disabled={disabled}
					autoFocus={autoFocus && i === 0}
					aria-label={`Digit ${i + 1}`}
					className="h-[62px] w-full rounded-lg border bg-[#16130f] text-center font-display text-[30px] text-cream outline-none transition-all duration-150 focus:border-brand focus:[box-shadow:0_0_0_3px_rgba(228,0,43,0.18)] disabled:opacity-60 max-[600px]:h-[54px] max-[600px]:text-[24px]"
					style={{ borderColor: d ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)" }}
				/>
			))}
		</div>
	);
}

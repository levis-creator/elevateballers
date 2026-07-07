import { useState, useEffect, type ComponentType } from "react";
import { PUBLIC_TURNSTILE_SITE_KEY } from "astro:env/client";
import TurnstileWidget from "@/components/TurnstileWidget";
import { isRegistrationOpen, registrationClosedMessage } from "@/lib/registration";
import {
	Users,
	User,
	Shield,
	Mail,
	Phone,
	Trophy,
	CalendarRange,
	MessageSquare,
	Crosshair,
	Hash,
	Ruler,
	Weight,
	AlertCircle,
	Clock,
	Check,
	ChevronDown,
} from "lucide-react";

interface League {
	id: string;
	name: string;
	slug: string;
	active: boolean;
	registrationOpen: boolean;
	registrationOpensAt: string | null;
	registrationClosesAt: string | null;
}
interface Season {
	id: string;
	name: string;
	registrationOpensAt: string | null;
	registrationClosesAt: string | null;
}
interface Team {
	id: string;
	name: string;
}
interface TeamFormData {
	name: string;
	coachName: string;
	contactEmail: string;
	contactPhone: string;
	leagueId: string;
	seasonId: string;
	additionalInfo: string;
}
interface PlayerFormData {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	position: string;
	jerseyNumber: string;
	height: string;
	weight: string;
	teamName: string;
	additionalInfo: string;
}
type TabType = "team" | "player";

const inputCls =
	"w-full rounded-lg border border-black/15 bg-paper2 px-4 py-3 font-body text-[14px] text-ink2 outline-none transition-shadow placeholder:text-muted2/70 focus:border-brand focus:ring-[3px] focus:ring-brand/[0.12] disabled:opacity-60";

function Label({ icon: Icon, children, required }: { icon: ComponentType<any>; children: React.ReactNode; required?: boolean }) {
	return (
		<span className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">
			<Icon className="h-3.5 w-3.5 text-brand" strokeWidth={2} aria-hidden />
			{children}
			{required && <span className="text-brand">*</span>}
		</span>
	);
}

function SelectChevron() {
	return <ChevronDown className="pointer-events-none absolute right-3.5 top-[38px] h-4 w-4 text-muted" aria-hidden />;
}

export default function RegistrationFormV2() {
	const [activeTab, setActiveTab] = useState<TabType>("team");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [leagues, setLeagues] = useState<League[]>([]);
	const [leaguesLoading, setLeaguesLoading] = useState(true);
	const [teams, setTeams] = useState<Team[]>([]);
	const [teamsLoading, setTeamsLoading] = useState(true);
	const [teamTurnstileToken, setTeamTurnstileToken] = useState<string | null>(null);
	const [playerTurnstileToken, setPlayerTurnstileToken] = useState<string | null>(null);
	const [seasons, setSeasons] = useState<Season[]>([]);
	const [seasonsLoading, setSeasonsLoading] = useState(false);
	const [agreed, setAgreed] = useState(false);

	const [teamFormData, setTeamFormData] = useState<TeamFormData>({
		name: "",
		coachName: "",
		contactEmail: "",
		contactPhone: "",
		leagueId: "",
		seasonId: "",
		additionalInfo: "",
	});
	const [playerFormData, setPlayerFormData] = useState<PlayerFormData>({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		position: "",
		jerseyNumber: "",
		height: "",
		weight: "",
		teamName: "",
		additionalInfo: "",
	});

	useEffect(() => {
		const run = async () => {
			try {
				setLeaguesLoading(true);
				const r = await fetch("/api/leagues?active=true");
				if (r.ok) setLeagues(await r.json());
			} catch (err) {
				console.error("Error fetching leagues:", err);
			} finally {
				setLeaguesLoading(false);
			}
		};
		run();
	}, []);

	useEffect(() => {
		const run = async () => {
			try {
				setTeamsLoading(true);
				const r = await fetch("/api/teams?approved=true");
				if (r.ok) setTeams(await r.json());
			} catch (err) {
				console.error("Error fetching teams:", err);
			} finally {
				setTeamsLoading(false);
			}
		};
		run();
	}, []);

	useEffect(() => {
		if (!teamFormData.leagueId) {
			setSeasons([]);
			return;
		}
		let cancelled = false;
		const run = async () => {
			try {
				setSeasonsLoading(true);
				const r = await fetch(`/api/seasons?leagueId=${teamFormData.leagueId}&activeOnly=true`);
				if (r.ok && !cancelled) setSeasons(await r.json());
			} catch (err) {
				console.error("Error fetching seasons:", err);
			} finally {
				if (!cancelled) setSeasonsLoading(false);
			}
		};
		run();
		return () => {
			cancelled = true;
		};
	}, [teamFormData.leagueId]);

	const selectedLeague = leagues.find((l) => l.id === teamFormData.leagueId) ?? null;
	const selectedSeason = seasons.find((s) => s.id === teamFormData.seasonId) ?? null;
	const registrationStatus = selectedLeague ? isRegistrationOpen(selectedLeague, selectedSeason) : { open: true };
	const registrationBlocked = !registrationStatus.open;

	const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setTeamFormData((prev) => ({ ...prev, [name]: value, ...(name === "leagueId" ? { seasonId: "" } : {}) }));
	};
	const handlePlayerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setPlayerFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleTeamSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (registrationBlocked) {
			setError(registrationClosedMessage(registrationStatus));
			return;
		}
		if (!teamTurnstileToken) {
			setError("Please complete the security check before submitting.");
			return;
		}
		setSubmitting(true);
		setError(null);
		setSuccess(null);
		try {
			const response = await fetch("/api/registration/team", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: teamFormData.name.trim(),
					coachName: teamFormData.coachName.trim(),
					contactEmail: teamFormData.contactEmail.trim(),
					contactPhone: teamFormData.contactPhone.trim(),
					leagueId: teamFormData.leagueId || undefined,
					seasonId: teamFormData.seasonId || undefined,
					additionalInfo: teamFormData.additionalInfo.trim() || undefined,
					"cf-turnstile-token": teamTurnstileToken,
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to submit team registration");
			}
			setTeamFormData({ name: "", coachName: "", contactEmail: "", contactPhone: "", leagueId: "", seasonId: "", additionalInfo: "" });
			setTeamTurnstileToken(null);
			setAgreed(false);
			setSuccess("Team and coach registration submitted successfully! We will contact you soon.");
		} catch (err) {
			console.error("Error submitting team registration:", err);
			setError(err instanceof Error ? err.message : "Failed to submit team registration");
		} finally {
			setSubmitting(false);
		}
	};

	const handlePlayerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!playerTurnstileToken) {
			setError("Please complete the security check before submitting.");
			return;
		}
		setSubmitting(true);
		setError(null);
		setSuccess(null);
		try {
			const response = await fetch("/api/registration/player", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					firstName: playerFormData.firstName.trim(),
					lastName: playerFormData.lastName.trim(),
					email: playerFormData.email.trim(),
					phone: playerFormData.phone.trim(),
					position: playerFormData.position.trim(),
					jerseyNumber: playerFormData.jerseyNumber ? parseInt(playerFormData.jerseyNumber) : undefined,
					height: playerFormData.height.trim() || undefined,
					weight: playerFormData.weight.trim() || undefined,
					teamName: playerFormData.teamName.trim() || undefined,
					additionalInfo: playerFormData.additionalInfo.trim() || undefined,
					"cf-turnstile-token": playerTurnstileToken,
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to submit player registration");
			}
			setPlayerFormData({ firstName: "", lastName: "", email: "", phone: "", position: "", jerseyNumber: "", height: "", weight: "", teamName: "", additionalInfo: "" });
			setPlayerTurnstileToken(null);
			setAgreed(false);
			setSuccess("Player registration submitted successfully! We will contact you soon.");
		} catch (err) {
			console.error("Error submitting player registration:", err);
			setError(err instanceof Error ? err.message : "Failed to submit player registration");
		} finally {
			setSubmitting(false);
		}
	};

	const switchTab = (t: TabType) => {
		setActiveTab(t);
		setError(null);
		setSuccess(null);
	};

	const tabBtn = (t: TabType, label: string, Icon: ComponentType<any>) => (
		<button
			type="button"
			onClick={() => switchTab(t)}
			className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-display text-[15px] uppercase tracking-[0.04em] transition-colors ${
				activeTab === t ? "bg-brand text-white" : "text-muted hover:text-ink2"
			}`}
		>
			<Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
			{label}
		</button>
	);

	// --- SUCCESS STATE ---
	if (success) {
		const modeLabel = activeTab === "team" ? "team" : "player";
		return (
			<div className="mx-auto w-full max-w-[560px]">
				<div className="rounded-2xl border border-black/10 bg-white p-9 shadow-[0_1px_2px_rgba(20,16,9,0.04)] max-[600px]:p-6">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1f9d55]/[0.12] text-[#1f9d55]">
						<Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />
					</div>
					<h2 className="mt-5 font-display text-[30px] uppercase text-ink">You're in the queue</h2>
					<p className="mt-3 max-w-[440px] text-[15px] leading-[1.65] text-muted">
						Thanks — your {modeLabel} registration has been received. We review entries within 3 working days and will email
						confirmation and next steps to the address you provided.
					</p>
					<div className="mt-6 flex flex-wrap gap-3">
						<button
							type="button"
							onClick={() => setSuccess(null)}
							className="rounded-lg bg-brand px-6 py-3.5 font-body text-[13px] font-extrabold uppercase tracking-[0.05em] text-white hover:bg-brandlt"
						>
							Register another
						</button>
						<a
							href="/upcoming-fixtures"
							className="rounded-lg border border-black/15 px-6 py-3.5 font-body text-[13px] font-bold uppercase tracking-[0.05em] text-ink2 no-underline hover:border-brand hover:text-brand"
						>
							View fixtures
						</a>
					</div>
				</div>
			</div>
		);
	}

	const canSubmitTeam = !submitting && !!teamTurnstileToken && !registrationBlocked && agreed;
	const canSubmitPlayer = !submitting && !!playerTurnstileToken && agreed;
	const submitCls =
		"col-span-full mt-2 inline-flex items-center justify-center gap-2 justify-self-start rounded-lg bg-brand px-9 py-4 font-body text-[13px] font-extrabold uppercase tracking-[0.05em] text-white transition-colors hover:bg-brandlt disabled:cursor-not-allowed disabled:bg-[#b9b3aa] disabled:opacity-70 max-[600px]:w-full";

	return (
		<div>
			{/* SEGMENTED TABS */}
			<div className="mb-7 inline-flex w-full max-w-[440px] gap-1 rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
				{tabBtn("team", "Team", Users)}
				{tabBtn("player", "Player", User)}
			</div>

			{error && (
				<div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#991b1b]">
					<AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
					<p className="m-0">{error}</p>
				</div>
			)}

			{/* FORM CARD */}
			<div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
				<div className="flex items-center justify-between border-b border-black/[0.07] bg-paper2 px-7 py-5 max-[600px]:px-5">
					<div>
						<h2 className="font-display text-[24px] uppercase text-ink">{activeTab === "team" ? "Team Registration" : "Player Registration"}</h2>
						<p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">
							{activeTab === "team" ? "Register your club for the season" : "Sign up to join a team"}
						</p>
					</div>
					<span className="font-mono text-[11px] uppercase tracking-[0.08em] text-brand max-[600px]:hidden">* required</span>
				</div>

				<div className="p-7 max-[600px]:p-5">
					{/* ================= TEAM ================= */}
					{activeTab === "team" && (
						<form onSubmit={handleTeamSubmit} className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
							<label className="col-span-full block">
								<Label icon={Shield} required>Team Name</Label>
								<input type="text" name="name" value={teamFormData.name} onChange={handleTeamChange} placeholder="Enter team name" required className={inputCls} />
							</label>
							<label className="block">
								<Label icon={User} required>Coach Name</Label>
								<input type="text" name="coachName" value={teamFormData.coachName} onChange={handleTeamChange} placeholder="Enter coach name" required className={inputCls} />
							</label>
							<label className="relative block">
								<Label icon={Trophy}>League</Label>
								<select name="leagueId" value={teamFormData.leagueId} onChange={handleTeamChange} disabled={leaguesLoading} className={`${inputCls} appearance-none pr-10`}>
									<option value="">Select League</option>
									{leagues.map((league) => (
										<option key={league.id} value={league.id}>{league.name}</option>
									))}
								</select>
								<SelectChevron />
							</label>
							<label className="block">
								<Label icon={Mail} required>Contact Email</Label>
								<input type="email" name="contactEmail" value={teamFormData.contactEmail} onChange={handleTeamChange} placeholder="team@email.com" required className={inputCls} />
							</label>
							<label className="block">
								<Label icon={Phone} required>Contact Phone</Label>
								<input type="tel" name="contactPhone" value={teamFormData.contactPhone} onChange={handleTeamChange} placeholder="07xx xxx xxx" required className={inputCls} />
							</label>
							{teamFormData.leagueId && seasons.length > 0 && (
								<label className="relative col-span-full block">
									<Label icon={CalendarRange}>Season</Label>
									<select name="seasonId" value={teamFormData.seasonId} onChange={handleTeamChange} disabled={seasonsLoading} className={`${inputCls} appearance-none pr-10`}>
										<option value="">All / Not season-specific</option>
										{seasons.map((season) => (
											<option key={season.id} value={season.id}>{season.name}</option>
										))}
									</select>
									<SelectChevron />
								</label>
							)}
							<label className="col-span-full block">
								<Label icon={MessageSquare}>Additional Information</Label>
								<textarea name="additionalInfo" value={teamFormData.additionalInfo} onChange={handleTeamChange} placeholder="Any additional information about your team" rows={4} className={`${inputCls} resize-y`} />
							</label>

							{registrationBlocked && (
								<div className="col-span-full flex items-start gap-2.5 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13.5px] text-[#92400e]">
									<Clock className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
									<p className="m-0 font-medium">{registrationClosedMessage(registrationStatus)}</p>
								</div>
							)}
							{!registrationBlocked && (registrationStatus.opensAt || registrationStatus.closesAt) && (
								<div className="col-span-full flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-black/[0.08] bg-paper2 px-4 py-3 font-mono text-[12px]">
									<span className="flex items-center gap-1.5 uppercase tracking-[0.08em] text-brand"><Clock className="h-3.5 w-3.5" aria-hidden />Season registration</span>
									<span className="text-ink2">
										{registrationStatus.opensAt ? new Date(registrationStatus.opensAt).toLocaleString() : "Open now"}
										<span className="mx-1.5 text-muted2">→</span>
										{registrationStatus.closesAt ? new Date(registrationStatus.closesAt).toLocaleString() : "No deadline"}
									</span>
								</div>
							)}

							<div className="col-span-full"><TurnstileWidget siteKey={PUBLIC_TURNSTILE_SITE_KEY} onSuccess={setTeamTurnstileToken} onExpire={() => setTeamTurnstileToken(null)} onError={() => setTeamTurnstileToken(null)} /></div>
							<Consent agreed={agreed} setAgreed={setAgreed} />
							<button type="submit" disabled={!canSubmitTeam} className={submitCls}>
								{submitting ? "Submitting…" : registrationBlocked ? "Registration Closed" : "Submit Registration"}
							</button>
						</form>
					)}

					{/* ================= PLAYER ================= */}
					{activeTab === "player" && (
						<form onSubmit={handlePlayerSubmit} className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
							<label className="block">
								<Label icon={User} required>First Name</Label>
								<input type="text" name="firstName" value={playerFormData.firstName} onChange={handlePlayerChange} placeholder="Enter first name" required className={inputCls} />
							</label>
							<label className="block">
								<Label icon={User} required>Last Name</Label>
								<input type="text" name="lastName" value={playerFormData.lastName} onChange={handlePlayerChange} placeholder="Enter last name" required className={inputCls} />
							</label>
							<label className="block">
								<Label icon={Mail} required>Email</Label>
								<input type="email" name="email" value={playerFormData.email} onChange={handlePlayerChange} placeholder="you@email.com" required className={inputCls} />
							</label>
							<label className="block">
								<Label icon={Phone} required>Phone</Label>
								<input type="tel" name="phone" value={playerFormData.phone} onChange={handlePlayerChange} placeholder="07xx xxx xxx" required className={inputCls} />
							</label>
							<label className="relative block">
								<Label icon={Crosshair} required>Position</Label>
								<select name="position" value={playerFormData.position} onChange={handlePlayerChange} required className={`${inputCls} appearance-none pr-10`}>
									<option value="">Select Position</option>
									<option value="Point Guard">Point Guard</option>
									<option value="Shooting Guard">Shooting Guard</option>
									<option value="Small Forward">Small Forward</option>
									<option value="Power Forward">Power Forward</option>
									<option value="Center">Center</option>
								</select>
								<SelectChevron />
							</label>
							<label className="block">
								<Label icon={Hash}>Jersey Number</Label>
								<input type="number" name="jerseyNumber" value={playerFormData.jerseyNumber} onChange={handlePlayerChange} placeholder="e.g., 23" min="0" max="99" className={inputCls} />
							</label>
							<label className="relative col-span-full block">
								<Label icon={Shield} required>Team</Label>
								<select name="teamName" value={playerFormData.teamName} onChange={handlePlayerChange} disabled={teamsLoading} required className={`${inputCls} appearance-none pr-10`}>
									<option value="">Select Team</option>
									{teams.map((team) => (
										<option key={team.id} value={team.name}>{team.name}</option>
									))}
								</select>
								<SelectChevron />
							</label>
							<label className="block">
								<Label icon={Ruler}>Height</Label>
								<input type="text" name="height" value={playerFormData.height} onChange={handlePlayerChange} placeholder={"e.g., 6'2\""} className={inputCls} />
							</label>
							<label className="block">
								<Label icon={Weight}>Weight</Label>
								<input type="text" name="weight" value={playerFormData.weight} onChange={handlePlayerChange} placeholder="e.g., 82 kg" className={inputCls} />
							</label>
							<label className="col-span-full block">
								<Label icon={MessageSquare}>Additional Information</Label>
								<textarea name="additionalInfo" value={playerFormData.additionalInfo} onChange={handlePlayerChange} placeholder="Any additional information about yourself" rows={4} className={`${inputCls} resize-y`} />
							</label>

							<div className="col-span-full"><TurnstileWidget siteKey={PUBLIC_TURNSTILE_SITE_KEY} onSuccess={setPlayerTurnstileToken} onExpire={() => setPlayerTurnstileToken(null)} onError={() => setPlayerTurnstileToken(null)} /></div>
							<Consent agreed={agreed} setAgreed={setAgreed} />
							<button type="submit" disabled={!canSubmitPlayer} className={submitCls}>
								{submitting ? "Submitting…" : "Submit Registration"}
							</button>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}

function Consent({ agreed, setAgreed }: { agreed: boolean; setAgreed: (v: boolean) => void }) {
	return (
		<label className="col-span-full mt-1 flex cursor-pointer items-start gap-3">
			<input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 accent-brand" />
			<span className="text-[13px] leading-[1.55] text-muted">
				I confirm the details are accurate and agree to the{" "}
				<a href="/rules" className="font-semibold text-ink2 underline underline-offset-2">league rules</a> and code of conduct.
			</span>
		</label>
	);
}

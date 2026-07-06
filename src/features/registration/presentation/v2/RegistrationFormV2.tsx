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
	CheckCircle2,
	AlertCircle,
	Clock,
	Send,
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

// --- shared field styling ---
const inputCls =
	"w-full rounded-lg border border-black/15 bg-paper2 px-3.5 py-3 font-body text-[14px] text-ink2 outline-none transition-colors placeholder:text-muted2/70 focus:border-brand focus:bg-white disabled:opacity-60";

function Label({ icon: Icon, children, required }: { icon: ComponentType<any>; children: React.ReactNode; required?: boolean }) {
	return (
		<span className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">
			<Icon className="h-3.5 w-3.5 text-brand" strokeWidth={2} aria-hidden />
			{children}
			{required && <span className="text-brand">*</span>}
		</span>
	);
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
			setSuccess("Player registration submitted successfully! We will contact you soon.");
		} catch (err) {
			console.error("Error submitting player registration:", err);
			setError(err instanceof Error ? err.message : "Failed to submit player registration");
		} finally {
			setSubmitting(false);
		}
	};

	const tab = (t: TabType, label: string, Icon: ComponentType<any>) => (
		<button
			type="button"
			onClick={() => {
				setActiveTab(t);
				setError(null);
				setSuccess(null);
			}}
			className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-3.5 font-display text-[15px] uppercase tracking-[0.04em] transition-colors ${
				activeTab === t ? "bg-brand text-white" : "bg-paper2 text-muted hover:text-ink2"
			}`}
		>
			<Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
			{label}
		</button>
	);

	return (
		<div className="mx-auto max-w-[760px]">
			{/* Tabs */}
			<div className="mb-6 flex gap-2 rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
				{tab("team", "Team", Users)}
				{tab("player", "Player", User)}
			</div>

			{/* Banners */}
			{success && (
				<div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#6ee7b7] bg-[#ecfdf5] px-4 py-3 text-[14px] text-[#065f46]">
					<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
					<p className="m-0 font-semibold">{success}</p>
				</div>
			)}
			{error && (
				<div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#991b1b]">
					<AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
					<p className="m-0">{error}</p>
				</div>
			)}

			<div className="rounded-2xl border border-black/10 bg-white p-8 shadow-[0_1px_2px_rgba(20,16,9,0.04)] max-[600px]:p-5">
				{/* ================= TEAM ================= */}
				{activeTab === "team" && (
					<form onSubmit={handleTeamSubmit}>
						<h2 className="mb-6 font-display text-[24px] uppercase text-ink">Team Registration</h2>

						<div className="grid gap-5">
							<label className="block">
								<Label icon={Shield} required>Team Name</Label>
								<input type="text" name="name" value={teamFormData.name} onChange={handleTeamChange} placeholder="Enter team name" required className={inputCls} />
							</label>
							<label className="block">
								<Label icon={User} required>Coach Name</Label>
								<input type="text" name="coachName" value={teamFormData.coachName} onChange={handleTeamChange} placeholder="Enter coach name" required className={inputCls} />
							</label>
							<div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
								<label className="block">
									<Label icon={Mail} required>Contact Email</Label>
									<input type="email" name="contactEmail" value={teamFormData.contactEmail} onChange={handleTeamChange} placeholder="team@email.com" required className={inputCls} />
								</label>
								<label className="block">
									<Label icon={Phone} required>Contact Phone</Label>
									<input type="tel" name="contactPhone" value={teamFormData.contactPhone} onChange={handleTeamChange} placeholder="07xx xxx xxx" required className={inputCls} />
								</label>
							</div>
							<label className="block">
								<Label icon={Trophy}>League</Label>
								<select name="leagueId" value={teamFormData.leagueId} onChange={handleTeamChange} disabled={leaguesLoading} className={inputCls}>
									<option value="">Select League</option>
									{leagues.map((league) => (
										<option key={league.id} value={league.id}>{league.name}</option>
									))}
								</select>
							</label>
							{teamFormData.leagueId && seasons.length > 0 && (
								<label className="block">
									<Label icon={CalendarRange}>Season</Label>
									<select name="seasonId" value={teamFormData.seasonId} onChange={handleTeamChange} disabled={seasonsLoading} className={inputCls}>
										<option value="">All / Not season-specific</option>
										{seasons.map((season) => (
											<option key={season.id} value={season.id}>{season.name}</option>
										))}
									</select>
								</label>
							)}

							{registrationBlocked && (
								<div className="flex items-start gap-2.5 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13.5px] text-[#92400e]">
									<Clock className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
									<p className="m-0 font-medium">{registrationClosedMessage(registrationStatus)}</p>
								</div>
							)}
							{!registrationBlocked && registrationStatus.closesAt && (
								<div className="flex items-center gap-2 font-mono text-[12px] text-muted2">
									<Clock className="h-3.5 w-3.5" aria-hidden />
									Registration deadline: {new Date(registrationStatus.closesAt).toLocaleString()}
								</div>
							)}

							<label className="block">
								<Label icon={MessageSquare}>Additional Information</Label>
								<textarea name="additionalInfo" value={teamFormData.additionalInfo} onChange={handleTeamChange} placeholder="Any additional information about your team" rows={4} className={`${inputCls} resize-y`} />
							</label>

							<div className="pt-1"><TurnstileWidget siteKey={PUBLIC_TURNSTILE_SITE_KEY} onSuccess={setTeamTurnstileToken} onExpire={() => setTeamTurnstileToken(null)} onError={() => setTeamTurnstileToken(null)} /></div>

							<button
								type="submit"
								disabled={submitting || !teamTurnstileToken || registrationBlocked}
								className="mt-1 inline-flex items-center justify-center gap-2 self-start rounded-md bg-brand px-8 py-4 font-display text-[15px] uppercase tracking-[0.05em] text-white transition-colors hover:bg-brandlt disabled:cursor-not-allowed disabled:bg-[#b9b3aa] disabled:opacity-70 max-[600px]:w-full"
							>
								<Send className="h-[18px] w-[18px]" aria-hidden />
								{submitting ? "Submitting…" : registrationBlocked ? "Registration Closed" : "Submit Registration"}
							</button>
						</div>
					</form>
				)}

				{/* ================= PLAYER ================= */}
				{activeTab === "player" && (
					<form onSubmit={handlePlayerSubmit}>
						<h2 className="mb-6 font-display text-[24px] uppercase text-ink">Player Registration</h2>

						<div className="grid gap-5">
							<div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
								<label className="block">
									<Label icon={User} required>First Name</Label>
									<input type="text" name="firstName" value={playerFormData.firstName} onChange={handlePlayerChange} placeholder="Enter first name" required className={inputCls} />
								</label>
								<label className="block">
									<Label icon={User} required>Last Name</Label>
									<input type="text" name="lastName" value={playerFormData.lastName} onChange={handlePlayerChange} placeholder="Enter last name" required className={inputCls} />
								</label>
							</div>
							<div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
								<label className="block">
									<Label icon={Mail} required>Email</Label>
									<input type="email" name="email" value={playerFormData.email} onChange={handlePlayerChange} placeholder="you@email.com" required className={inputCls} />
								</label>
								<label className="block">
									<Label icon={Phone} required>Phone</Label>
									<input type="tel" name="phone" value={playerFormData.phone} onChange={handlePlayerChange} placeholder="07xx xxx xxx" required className={inputCls} />
								</label>
							</div>
							<div className="grid grid-cols-3 gap-5 max-[600px]:grid-cols-1">
								<label className="block">
									<Label icon={Crosshair} required>Position</Label>
									<select name="position" value={playerFormData.position} onChange={handlePlayerChange} required className={inputCls}>
										<option value="">Select Position</option>
										<option value="Point Guard">Point Guard</option>
										<option value="Shooting Guard">Shooting Guard</option>
										<option value="Small Forward">Small Forward</option>
										<option value="Power Forward">Power Forward</option>
										<option value="Center">Center</option>
									</select>
								</label>
								<label className="block">
									<Label icon={Hash}>Jersey Number</Label>
									<input type="number" name="jerseyNumber" value={playerFormData.jerseyNumber} onChange={handlePlayerChange} placeholder="e.g., 23" min="0" max="99" className={inputCls} />
								</label>
								<label className="block">
									<Label icon={Shield} required>Team</Label>
									<select name="teamName" value={playerFormData.teamName} onChange={handlePlayerChange} disabled={teamsLoading} required className={inputCls}>
										<option value="">Select Team</option>
										{teams.map((team) => (
											<option key={team.id} value={team.name}>{team.name}</option>
										))}
									</select>
								</label>
							</div>
							<div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
								<label className="block">
									<Label icon={Ruler}>Height</Label>
									<input type="text" name="height" value={playerFormData.height} onChange={handlePlayerChange} placeholder={"e.g., 6'2\""} className={inputCls} />
								</label>
								<label className="block">
									<Label icon={Weight}>Weight</Label>
									<input type="text" name="weight" value={playerFormData.weight} onChange={handlePlayerChange} placeholder="e.g., 82 kg" className={inputCls} />
								</label>
							</div>
							<label className="block">
								<Label icon={MessageSquare}>Additional Information</Label>
								<textarea name="additionalInfo" value={playerFormData.additionalInfo} onChange={handlePlayerChange} placeholder="Any additional information about yourself" rows={4} className={`${inputCls} resize-y`} />
							</label>

							<div className="pt-1"><TurnstileWidget siteKey={PUBLIC_TURNSTILE_SITE_KEY} onSuccess={setPlayerTurnstileToken} onExpire={() => setPlayerTurnstileToken(null)} onError={() => setPlayerTurnstileToken(null)} /></div>

							<button
								type="submit"
								disabled={submitting || !playerTurnstileToken}
								className="mt-1 inline-flex items-center justify-center gap-2 self-start rounded-md bg-brand px-8 py-4 font-display text-[15px] uppercase tracking-[0.05em] text-white transition-colors hover:bg-brandlt disabled:cursor-not-allowed disabled:bg-[#b9b3aa] disabled:opacity-70 max-[600px]:w-full"
							>
								<Send className="h-[18px] w-[18px]" aria-hidden />
								{submitting ? "Submitting…" : "Submit Registration"}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}

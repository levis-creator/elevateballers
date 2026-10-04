import { TONE, type Side } from './tone';
import type { RosterPlayer } from './roster';

interface AvatarProps {
  player: RosterPlayer;
  side: Side;
  /** Size and font classes, e.g. "h-11 w-11 text-[14px]". */
  size: string;
}

/** Player photo from their profile, or initials on the team tint. */
export default function Avatar({ player, side, size }: AvatarProps) {
  return (
    <span
      className={`flex ${size} flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-anton leading-none ${TONE[side].avatar}`}
    >
      {player.photo ? (
        <span
          className="block h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${player.photo}")` }}
        />
      ) : (
        player.initials
      )}
    </span>
  );
}

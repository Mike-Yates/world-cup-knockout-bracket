import { getFlagImageUrl, getTeam } from '../data/teams';
import type { TeamId } from '../types';

export const TeamBadge = ({ teamId, muted = false, compactOnMobile = false }: { teamId: TeamId; muted?: boolean; compactOnMobile?: boolean }) => {
  const team = getTeam(teamId);
  return (
    <span className={`team-badge${muted ? ' team-badge-muted' : ''}${compactOnMobile ? ' team-badge-compact-mobile' : ''}`}>
      <img className="flag" src={getFlagImageUrl(team.countryCode)} alt="" aria-hidden="true" loading="lazy" />
      <span className="team-name">{team.name}</span>
      {compactOnMobile ? (
        <span className="team-code" aria-hidden="true">
          {team.fifaCode}
        </span>
      ) : null}
    </span>
  );
};

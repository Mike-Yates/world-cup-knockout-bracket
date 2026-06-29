import type { Team } from '../types';

export const teams: Team[] = [
  { id: 'germany', name: 'Germany', fifaCode: 'GER', countryCode: 'DE' },
  { id: 'paraguay', name: 'Paraguay', fifaCode: 'PAR', countryCode: 'PY' },
  { id: 'france', name: 'France', fifaCode: 'FRA', countryCode: 'FR' },
  { id: 'sweden', name: 'Sweden', fifaCode: 'SWE', countryCode: 'SE' },
  { id: 'south-africa', name: 'South Africa', fifaCode: 'RSA', countryCode: 'ZA' },
  { id: 'canada', name: 'Canada', fifaCode: 'CAN', countryCode: 'CA' },
  { id: 'netherlands', name: 'Netherlands', fifaCode: 'NED', countryCode: 'NL' },
  { id: 'morocco', name: 'Morocco', fifaCode: 'MAR', countryCode: 'MA' },
  { id: 'portugal', name: 'Portugal', fifaCode: 'POR', countryCode: 'PT' },
  { id: 'croatia', name: 'Croatia', fifaCode: 'CRO', countryCode: 'HR' },
  { id: 'spain', name: 'Spain', fifaCode: 'ESP', countryCode: 'ES' },
  { id: 'austria', name: 'Austria', fifaCode: 'AUT', countryCode: 'AT' },
  { id: 'united-states', name: 'United States', aliases: ['USA', 'United States of America'], fifaCode: 'USA', countryCode: 'US' },
  { id: 'bosnia-and-herzegovina', name: 'Bosnia and Herz.', aliases: ['Bosnia & Herz.', 'Bosnia and Herzegovina', 'Bosnia-Herzegovina'], fifaCode: 'BIH', countryCode: 'BA' },
  { id: 'belgium', name: 'Belgium', fifaCode: 'BEL', countryCode: 'BE' },
  { id: 'senegal', name: 'Senegal', fifaCode: 'SEN', countryCode: 'SN' },
  { id: 'brazil', name: 'Brazil', fifaCode: 'BRA', countryCode: 'BR' },
  { id: 'japan', name: 'Japan', fifaCode: 'JPN', countryCode: 'JP' },
  { id: 'ivory-coast', name: 'Ivory Coast', aliases: ["Cote d'Ivoire", 'Côte d’Ivoire'], fifaCode: 'CIV', countryCode: 'CI' },
  { id: 'norway', name: 'Norway', fifaCode: 'NOR', countryCode: 'NO' },
  { id: 'mexico', name: 'Mexico', fifaCode: 'MEX', countryCode: 'MX' },
  { id: 'ecuador', name: 'Ecuador', fifaCode: 'ECU', countryCode: 'EC' },
  { id: 'england', name: 'England', fifaCode: 'ENG', countryCode: 'GB-ENG' },
  { id: 'dr-congo', name: 'DR Congo', aliases: ['Democratic Republic of the Congo', 'D.R. Congo'], fifaCode: 'COD', countryCode: 'CD' },
  { id: 'argentina', name: 'Argentina', fifaCode: 'ARG', countryCode: 'AR' },
  { id: 'cape-verde', name: 'Cape Verde', fifaCode: 'CPV', countryCode: 'CV' },
  { id: 'australia', name: 'Australia', fifaCode: 'AUS', countryCode: 'AU' },
  { id: 'egypt', name: 'Egypt', fifaCode: 'EGY', countryCode: 'EG' },
  { id: 'switzerland', name: 'Switzerland', fifaCode: 'SUI', countryCode: 'CH' },
  { id: 'algeria', name: 'Algeria', fifaCode: 'ALG', countryCode: 'DZ' },
  { id: 'colombia', name: 'Colombia', fifaCode: 'COL', countryCode: 'CO' },
  { id: 'ghana', name: 'Ghana', fifaCode: 'GHA', countryCode: 'GH' },
];

export const teamsById = Object.fromEntries(teams.map((team) => [team.id, team]));

const normalizeTeamName = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

export const teamIdsByNormalizedName = new Map<string, string>(
  teams.flatMap((team) => [team.name, ...(team.aliases ?? [])].map((name) => [normalizeTeamName(name), team.id])),
);

export const getTeamIdByName = (name: string): string | undefined => teamIdsByNormalizedName.get(normalizeTeamName(name));

export const getTeam = (teamId: string) => {
  const team = teamsById[teamId];
  if (!team) {
    throw new Error(`Unknown team id: ${teamId}`);
  }
  return team;
};

export const getFlagImageUrl = (countryCode: string) => `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;

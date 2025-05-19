
export interface Game {
  id: string;
  title: string;
  date: string;
  location: string | null;
  opponent: string | null;
  team_score: number | null;
  opponent_score: number | null;
  result: string | null;
}

export interface Player {
  id: string;
  name: string;
  jersey_number: number | null;
}

export interface PlayerStat {
  id?: string;
  player_id: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  event_id: string;
}

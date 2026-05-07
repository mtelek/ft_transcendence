export interface PlayerStats {
  wins: number;
  losses: number;
  winRate: number;
  rank: string;
  elo: number;
  percentile: number;
  record1v1: { wins: number; losses: number; winRate: number };
  totalGames: number;
}

export interface MatchEntry {
  id: string;
  mode: string;
  date: string;
  opponent: { name: string; avatar: string };
  result: "WIN" | "LOSS";
  score: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
}

interface LevelNode {
  level: number;
  completed: boolean;
  current: boolean;
}

export interface Progression {
  level: number;
  currentXP: number;
  maxXP: number;
  nextReward: string;
  nextRewardXP: number;
  levels: LevelNode[];
}

export const playerStats: PlayerStats = {
  wins: 125,
  losses: 75,
  winRate: 62,
  rank: "Gold III",
  elo: 1250,
  percentile: 23,
  record1v1: { wins: 125, losses: 75, winRate: 62 },
  totalGames: 200,
};

export const matchHistory: MatchEntry[] = [
  {
    id: "1",
    mode: "1v1",
    date: "May 20, 2024 · 10:45 PM",
    opponent: { name: "PokerKing22", avatar: "/avatars/gentleman.jpg" },
    result: "WIN",
    score: 120,
  },
  {
    id: "2",
    mode: "1v1",
    date: "May 20, 2024 · 09:15 PM",
    opponent: { name: "AceVentura", avatar: "/avatars/lady.jpg" },
    result: "LOSS",
    score: -80,
  },
  {
    id: "3",
    mode: "1v1",
    date: "May 19, 2024 · 11:30 PM",
    opponent: { name: "BluffMaster", avatar: "/avatars/gentleman.jpg" },
    result: "WIN",
    score: 150,
  },
  {
    id: "4",
    mode: "1v1",
    date: "May 19, 2024 · 08:00 PM",
    opponent: { name: "HighRoller77", avatar: "/avatars/lady.jpg" },
    result: "LOSS",
    score: -60,
  },
  {
    id: "5",
    mode: "1v1",
    date: "May 18, 2024 · 10:05 PM",
    opponent: { name: "TheDealer", avatar: "/avatars/gentleman.jpg" },
    result: "WIN",
    score: 200,
  },
];

export const achievements: Achievement[] = [
  {
    id: "1",
    icon: "🏆",
    title: "First Victory",
    description: "Win your first 1v1 game",
    date: "Apr 10, 2024",
    completed: true,
  },
  {
    id: "2",
    icon: "🎯",
    title: "10 Wins",
    description: "Win 10 games",
    date: "Apr 18, 2024",
    completed: true,
  },
  {
    id: "3",
    icon: "🔥",
    title: "Winning Streak",
    description: "Win 5 games in a row",
    date: "May 19, 2024",
    completed: true,
  },
  {
    id: "4",
    icon: "💎",
    title: "High Roller",
    description: "Win a pot of 500+ chips",
    date: "May 17, 2024",
    completed: true,
  },
];

export const progression: Progression = {
  level: 18,
  currentXP: 2450,
  maxXP: 3500,
  nextReward: "Level 19",
  nextRewardXP: 3500,
  levels: [
    { level: 15, completed: true, current: false },
    { level: 16, completed: true, current: false },
    { level: 17, completed: true, current: false },
    { level: 18, completed: false, current: true },
    { level: 19, completed: false, current: false },
    { level: 20, completed: false, current: false },
  ],
};

export type AchievementType = {
  type: string;
  label: string;
  description: string;
  icon: string;
}

export const ALL_ACHIEVEMENTS: AchievementType[] = [

  // ----------------------------------------------------------------
  // FIRST ACTIONS
  // ----------------------------------------------------------------
  { type: "FIRST_GAME",       label: "First Steps",       description: "Play your first game",                   icon: "🎲" },
  { type: "FIRST_GAME_LOSS",  label: "Welcome to Poker",  description: "Lose your first game",                   icon: "🥴" },
  { type: "FIRST_GAME_WIN",        label: "First Blood",       description: "Win your first game",                    icon: "🏆" },

  // ----------------------------------------------------------------
  // WINS
  // ----------------------------------------------------------------
  { type: "WIN_3",            label: "Hat Trick",         description: "Win 3 games",                            icon: "🎩" },
  { type: "WIN_10",           label: "High Roller",       description: "Win 10 games",                           icon: "💰" },
  { type: "WIN_25",           label: "Shark",             description: "Win 25 games",                           icon: "🦈" },
  { type: "WIN_50",           label: "Card Shark",        description: "Win 50 games",                           icon: "🃏" },
  { type: "WIN_100",          label: "Legend",            description: "Win 100 games",                          icon: "👑" },

  // ----------------------------------------------------------------
  // GAMES PLAYED
  // ----------------------------------------------------------------
  { type: "PLAY_10",          label: "Getting Started",   description: "Play 10 games",                          icon: "🎮" },
  { type: "PLAY_50",          label: "Regular",           description: "Play 50 games",                          icon: "🎯" },
  { type: "PLAY_100",         label: "Veteran",           description: "Play 100 games",                         icon: "🎖️" },

  // ----------------------------------------------------------------
  // HANDS PLAYED
  // ----------------------------------------------------------------
  { type: "HANDS_50",         label: "Warmed Up",         description: "Play 50 hands",                          icon: "🔥" },
  { type: "HANDS_250",        label: "Grinding",          description: "Play 250 hands",                         icon: "⚙️" },
  { type: "HANDS_1000",       label: "Marathon",          description: "Play 1,000 hands",                       icon: "🏃" },

  // ----------------------------------------------------------------
  // STREAKS
  // ----------------------------------------------------------------
  { type: "WIN_STREAK_3",     label: "On Fire",           description: "Win 3 games in a row",                   icon: "🔥" }, //missing
  { type: "WIN_STREAK_5",     label: "Unstoppable",       description: "Win 5 games in a row",                   icon: "⚡" }, //missing
  { type: "LOSS_STREAK_3",    label: "Rough Patch",       description: "Lose 3 games in a row",                  icon: "😭" }, //missing

  // ----------------------------------------------------------------
  // SOCIAL
  // ----------------------------------------------------------------
  { type: "FIRST_FRIEND",     label: "Not Alone",         description: "Add your first friend",                  icon: "👯" },
  { type: "FRIEND_5",         label: "Social Butterfly",  description: "Have 5 friends",                         icon: "🦋" },
  { type: "BREAKUP",          label: "Breakup", description: "Remove your first friend",           icon: "💔" },
  { type: "PLAY_FRIEND",      label: "Friendly Game",     description: "Play a game against a friend",           icon: "🤝" }, //missing

  // ----------------------------------------------------------------
  // EXTRA
  // ----------------------------------------------------------------
  { type: "NIGHT_OWL",        label: "Night Owl",         description: "Play a game between midnight and 5am",   icon: "🦉" },
  { type: "EARLY_BIRD",        label: "Early Bird",         description: "Play a game between 6am and 7am",   icon: "🐥" },
];
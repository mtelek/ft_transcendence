export type AchievementType = {
  type: string;
  label: string;
  description: string;
  icon: string;
}

export const ALL_ACHIEVEMENTS: AchievementType[] = [

  // FIRST ACTIONS
  { type: "FIRST_GAME",       label: "First Steps",     description: "Play your first game",          icon: "/achievements/footsteps.png" },
  { type: "FIRST_GAME_LOSS",  label: "The Expert",      description: "Lose your first game",          icon: "/achievements/broken-heart.png" },

  // WIN BASED
  { type: "WIN_1",            label: "First Win",       description: "Win 1 game",                    icon: "/achievements/trophy-cup.png" },
  { type: "WIN_3",            label: "Hat Trick",       description: "Win 3 games",                   icon: "/achievements/jester-hat.png" },
  { type: "WIN_5",            label: "High Roller",     description: "Win 5 games",                   icon: "/achievements/money-stack.png" },
  { type: "WIN_10",           label: "Shark",           description: "Win 10 games",                  icon: "/achievements/shark-fin.png" },
  { type: "WIN_25",           label: "Megalodon",      description: "Win 25 games",                  icon: "/achievements/shark-jaws.png" },

  // POKER SPECIFIC
  { type: "ALL_IN_WIN",       label: "All In",          description: "Win a hand after going all in", icon: "/achievements/coins-pile.png" },
  { type: "COMEBACK",         label: "Comeback Kid",    description: "Win after being below 100 chips", icon: "/achievements/sunrise.png" },
  { type: "ROYAL_FLUSH",      label: "Royal Flush",     description: "Win with a royal flush",        icon: "/achievements/imperial-crown.png" },
  { type: "STRAIGHT_FLUSH",   label: "Straight Flush",  description: "Win with a straight flush",     icon: "/achievements/fire-ace.png" },
  { type: "DOMINATION",       label: "Domination",      description: "Win with all chips (1000→2000)", icon: "/achievements/throne-king.png" },

  // SOCIAL BASED
  { type: "FIRST_FRIEND",     label: "Not Alone",       description: "Add your first friend",         icon: "/achievements/heart-plus.png" },
  { type: "FRIEND_5",         label: "Social Butterfly", description: "Have 5 friends",               icon: "/achievements/butterfly.png" },
  { type: "PLAY_FRIEND",      label: "Friendly Game",   description: "Play against a friend",         icon: "/achievements/shaking-hands.png" },

  // FUN ONES
  { type: "LOSE_3_ROW",       label: "On a Roll",       description: "Lose 3 games in a row",         icon: "/achievements/sad-crab.png" },
  { type: "PLAY_10",          label: "Dedicated",       description: "Play 10 games total",           icon: "/achievements/gamepad.png" },
  { type: "PLAY_50",          label: "Veteran",         description: "Play 50 games total",           icon: "/achievements/medal.png" },

]

/*
export const ALL_ACHIEVEMENTS: AchievementType[] = [

  // FIRST ACTIONS
  { type: "FIRST_GAME",       label: "First Steps",     description: "Play your first game",          icon: "🥇" },
  { type: "FIRST_GAME_LOSS",  label: "The Expert",      description: "Lose your first game",          icon: "🥴" },

  // WIN BASED
  { type: "WIN_1",            label: "First Win",       description: "Win 1 game",                    icon: "🏆" },
  { type: "WIN_3",            label: "Hat Trick",       description: "Win 3 games",                   icon: "🎩" },
  { type: "WIN_5",            label: "High Roller",     description: "Win 5 games",                   icon: "💰" },
  { type: "WIN_10",           label: "Shark",           description: "Win 10 games",                  icon: "🦈" },
  { type: "WIN_25",           label: "Card Shark",      description: "Win 25 games",                  icon: "🃏" },

  // POKER SPECIFIC
  { type: "ALL_IN_WIN",       label: "All In",          description: "Win a hand after going all in", icon: "⚡" },
  { type: "COMEBACK",         label: "Comeback Kid",    description: "Win after being below 100 chips", icon: "🔄" },
  { type: "ROYAL_FLUSH",      label: "Royal Flush",     description: "Win with a royal flush",        icon: "👑" },
  { type: "STRAIGHT_FLUSH",   label: "Straight Flush",  description: "Win with a straight flush",     icon: "🔥" },
  { type: "DOMINATION",       label: "Domination",      description: "Win with all chips (1000→2000)", icon: "💪" },

  // SOCIAL BASED
  { type: "FIRST_FRIEND",     label: "Not Alone",       description: "Add your first friend",         icon: "👯" },
  { type: "FRIEND_5",         label: "Social Butterfly", description: "Have 5 friends",               icon: "🦋" },
  { type: "PLAY_FRIEND",      label: "Friendly Game",   description: "Play against a friend",         icon: "🤝" },

  // FUN ONES
  { type: "LOSE_3_ROW",       label: "On a Roll",       description: "Lose 3 games in a row",         icon: "😭" },
  { type: "PLAY_10",          label: "Dedicated",       description: "Play 10 games total",           icon: "🎮" },
  { type: "PLAY_50",          label: "Veteran",         description: "Play 50 games total",           icon: "🎖️" },

]
*/
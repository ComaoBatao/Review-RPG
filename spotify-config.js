// Feather Lofi // Spotify Web Playback SDK
// O Client ID pode ficar público. NÃO coloques Client Secret neste ficheiro.
export const spotifyConfig = {
  clientId: "0ef23e6e568d485fa9b871ad42cd0e70",

  // Tem de ser IGUAL ao Redirect URI configurado no Spotify Developer Dashboard.
  redirectUri: "https://comaobatao.github.io/Review-RPG/",

  scopes: [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state"
  ]
};

import { firebaseConfig } from "./firebase-config.js";
import { spotifyConfig } from "./spotify-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const state = {
  user: null,
  profile: null,
  campaigns: [],
  episodes: [],
  ratings: [],
  players: [],
  characters: [],
  news: [],
  lofiPlaylists: [],
  users: [],
  selectedCampaignId: null,
  selectedRatingMapCampaignId: null,
  selectedCinemaCampaignId: null,
  selectedCinemaEpisodeId: null,
  selectedPlayerId: null,
  selectedLofiPlaylistId: null,
  lofiPlaying: false,
  spotifyShuffle: false,
  spotifyRepeat: "off",
  spotifyVolume: 0.65,
  spotifyPreviousVolume: 0.65,
  spotifyPlayer: null,
  spotifyDeviceId: "",
  spotifySdkReady: false,
  spotifyAccount: null,
  spotifyCurrentState: null,
  spotifyConnected: false,
  currentView: "archive",
  search: "",
  showAllUsers: false,
  profileUnsubscribe: null,
  usersUnsubscribe: null,
  shareRatingId: new URLSearchParams(location.search).get("share") || null,
  shareHandled: false,
  activeShareContext: null,
  activeShareBlob: null
};

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

const els = {
  authBtn: $("#authBtn"),
  adminBtn: $("#adminBtn"),
  rankingsBtn: $("#rankingsBtn"),
  twitchBtn: $("#twitchBtn"),
  cinemaBtn: $("#cinemaBtn"),
  lofiBtn: $("#lofiBtn"),
  lofiNavBars: $("#lofiNavBars"),
  newsBtn: $("#newsBtn"),
  newsNavDot: $("#newsNavDot"),
  playersBtn: $("#playersBtn"),
  homeLink: $("#homeLink"),
  sessionBadge: $("#sessionBadge"),

  archiveShell: $("#archiveShell"),
  cinemaView: $("#cinemaView"),
  lofiView: $("#lofiView"),
  newsView: $("#newsView"),
  playersView: $("#playersView"),
  rankingsView: $("#rankingsView"),
  liveView: $("#liveView"),

  cinemaCampaignSelect: $("#cinemaCampaignSelect"),
  cinemaEpisodeSelect: $("#cinemaEpisodeSelect"),
  cinemaPlayBtn: $("#cinemaPlayBtn"),
  cinemaEmpty: $("#cinemaEmpty"),
  cinemaScreening: $("#cinemaScreening"),
  cinemaPlayer: $("#cinemaPlayer"),
  cinemaEpisodeCode: $("#cinemaEpisodeCode"),
  cinemaEpisodeTitle: $("#cinemaEpisodeTitle"),
  cinemaYoutubeLink: $("#cinemaYoutubeLink"),
  cinemaPrevBtn: $("#cinemaPrevBtn"),
  cinemaNextBtn: $("#cinemaNextBtn"),
  cinemaPositionText: $("#cinemaPositionText"),

  lofiBackdrop: $("#lofiBackdrop"),
  lofiEmpty: $("#lofiEmpty"),
  lofiExperience: $("#lofiExperience"),
  lofiStationList: $("#lofiStationList"),
  lofiCover: $("#lofiCover"),
  lofiModeLabel: $("#lofiModeLabel"),
  lofiCampaignCode: $("#lofiCampaignCode"),
  lofiStationName: $("#lofiStationName"),
  lofiStationDescription: $("#lofiStationDescription"),
  lofiCampaignName: $("#lofiCampaignName"),
  lofiPrevBtn: $("#lofiPrevBtn"),
  lofiPlayBtn: $("#lofiPlayBtn"),
  lofiPlayIcon: $("#lofiPlayIcon"),
  lofiNextBtn: $("#lofiNextBtn"),
  lofiRandomBtn: $("#lofiRandomBtn"),
  lofiLoopBtn: $("#lofiLoopBtn"),
  lofiMuteBtn: $("#lofiMuteBtn"),
  lofiVolumeIcon: $("#lofiVolumeIcon"),
  lofiVolumeSlider: $("#lofiVolumeSlider"),
  lofiVolumeValue: $("#lofiVolumeValue"),
  lofiControlHint: $("#lofiControlHint"),
  lofiSpotifyLink: $("#lofiSpotifyLink"),
  lofiSpotifyStatus: $("#lofiSpotifyStatus"),
  spotifyConnectPanel: $("#spotifyConnectPanel"),
  spotifyConnectTitle: $("#spotifyConnectTitle"),
  spotifyConnectText: $("#spotifyConnectText"),
  spotifyLoginBtn: $("#spotifyLoginBtn"),
  spotifyLogoutBtn: $("#spotifyLogoutBtn"),
  spotifyAccountLabel: $("#spotifyAccountLabel"),
  lofiTrackTitle: $("#lofiTrackTitle"),
  lofiTrackArtist: $("#lofiTrackArtist"),

  lofiManagePanel: $("#lofiManagePanel"),
  lofiForm: $("#lofiForm"),
  lofiEditId: $("#lofiEditId"),
  lofiFormTitle: $("#lofiFormTitle"),
  lofiCampaignSelect: $("#lofiCampaignSelect"),
  lofiNameInput: $("#lofiNameInput"),
  lofiSpotifyUrlInput: $("#lofiSpotifyUrlInput"),
  lofiCoverUrlInput: $("#lofiCoverUrlInput"),
  lofiBackgroundUrlInput: $("#lofiBackgroundUrlInput"),
  lofiDescriptionInput: $("#lofiDescriptionInput"),
  lofiSaveBtn: $("#lofiSaveBtn"),
  lofiCancelEditBtn: $("#lofiCancelEditBtn"),
  lofiFormMessage: $("#lofiFormMessage"),
  lofiManageList: $("#lofiManageList"),

  latestNewsSection: $("#latestNewsSection"),
  latestNewsCard: $("#latestNewsCard"),
  latestNewsDate: $("#latestNewsDate"),
  latestNewsCategory: $("#latestNewsCategory"),
  latestNewsTitle: $("#latestNewsTitle"),
  latestNewsExcerpt: $("#latestNewsExcerpt"),

  newsFeedMeta: $("#newsFeedMeta"),
  newsFeatured: $("#newsFeatured"),
  newsFeed: $("#newsFeed"),

  newsManagePanel: $("#newsManagePanel"),
  newsForm: $("#newsForm"),
  newsEditId: $("#newsEditId"),
  newsFormTitle: $("#newsFormTitle"),
  newsCategory: $("#newsCategory"),
  newsCampaign: $("#newsCampaign"),
  newsTitleInput: $("#newsTitleInput"),
  newsImageUrl: $("#newsImageUrl"),
  newsBodyInput: $("#newsBodyInput"),
  newsLinkUrl: $("#newsLinkUrl"),
  newsFeaturedInput: $("#newsFeaturedInput"),
  newsSaveBtn: $("#newsSaveBtn"),
  newsCancelEditBtn: $("#newsCancelEditBtn"),
  newsFormMessage: $("#newsFormMessage"),
  newsManageList: $("#newsManageList"),

  newsModal: $("#newsModal"),
  newsModalImage: $("#newsModalImage"),
  newsModalCategory: $("#newsModalCategory"),
  newsModalDate: $("#newsModalDate"),
  newsModalCampaign: $("#newsModalCampaign"),
  newsModalTitle: $("#newsModalTitle"),
  newsModalText: $("#newsModalText"),
  newsModalLink: $("#newsModalLink"),

  playersDirectoryPanel: $("#playersDirectoryPanel"),
  playersDirectoryMeta: $("#playersDirectoryMeta"),
  playersGrid: $("#playersGrid"),
  playerProfilePanel: $("#playerProfilePanel"),
  playersBackBtn: $("#playersBackBtn"),
  playerProfileHero: $("#playerProfileHero"),
  playerProfileAvatar: $("#playerProfileAvatar"),
  playerProfileCode: $("#playerProfileCode"),
  playerProfileName: $("#playerProfileName"),
  playerProfileBio: $("#playerProfileBio"),
  playerProfileStats: $("#playerProfileStats"),
  playerCharactersGrid: $("#playerCharactersGrid"),
  playerCampaignsList: $("#playerCampaignsList"),
  playerEpisodesList: $("#playerEpisodesList"),
  bestEpisodesRanking: $("#bestEpisodesRanking"),
  legendaryRanking: $("#legendaryRanking"),
  mostRatedRanking: $("#mostRatedRanking"),
  ratingMapCampaignSelect: $("#ratingMapCampaignSelect"),
  ratingMapSummary: $("#ratingMapSummary"),
  ratingMapGrid: $("#ratingMapGrid"),
  campaignNav: $("#campaignNav"),
  episodeGrid: $("#episodeGrid"),
  archiveTitle: $("#archiveTitle"),
  archiveCode: $("#archiveCode"),
  archiveDescription: $("#archiveDescription"),
  archiveMeta: $("#archiveMeta"),
  searchInput: $("#searchInput"),

  authModal: $("#authModal"),
  adminModal: $("#adminModal"),
  editEpisodeModal: $("#editEpisodeModal"),
  shareReviewModal: $("#shareReviewModal"),
  shareStoryPreview: $("#shareStoryPreview"),
  shareQrCode: $("#shareQrCode"),
  shareReviewIntro: $("#shareReviewIntro"),
  shareReviewCode: $("#shareReviewCode"),
  shareNativeBtn: $("#shareNativeBtn"),
  shareDownloadBtn: $("#shareDownloadBtn"),
  shareReviewStatus: $("#shareReviewStatus"),

  loginForm: $("#loginForm"),
  loginMessage: $("#loginMessage"),
  emailInput: $("#emailInput"),
  passwordInput: $("#passwordInput"),

  registerForm: $("#registerForm"),
  registerMessage: $("#registerMessage"),
  registerName: $("#registerName"),
  registerEmail: $("#registerEmail"),
  registerPassword: $("#registerPassword"),
  registerPassword2: $("#registerPassword2"),

  episodeForm: $("#episodeForm"),
  episodeCampaign: $("#episodeCampaign"),
  episodeMessage: $("#episodeMessage"),
  episodeImageUrl: $("#episodeImageUrl"),
  episodeYoutubeUrl: $("#episodeYoutubeUrl"),
  episodeParticipantsEditor: $("#episodeParticipantsEditor"),

  campaignForm: $("#campaignForm"),
  campaignMessage: $("#campaignMessage"),
  campaignCoverUrl: $("#campaignCoverUrl"),
  campaignVisible: $("#campaignVisible"),

  archiveManagePanel: $("#archiveManagePanel"),
  archiveManageList: $("#archiveManageList"),

  accessPanel: $("#accessPanel"),
  accessList: $("#accessList"),
  pendingCount: $("#pendingCount"),
  showAllUsersBtn: $("#showAllUsersBtn"),

  editEpisodeForm: $("#editEpisodeForm"),
  editEpisodeId: $("#editEpisodeId"),
  editEpisodeCampaign: $("#editEpisodeCampaign"),
  editEpisodeNumber: $("#editEpisodeNumber"),
  editEpisodeDate: $("#editEpisodeDate"),
  editEpisodeName: $("#editEpisodeName"),
  editEpisodeDuration: $("#editEpisodeDuration"),
  editEpisodeStatus: $("#editEpisodeStatus"),
  editEpisodeSynopsis: $("#editEpisodeSynopsis"),
  editEpisodeImageUrl: $("#editEpisodeImageUrl"),
  editEpisodeYoutubeUrl: $("#editEpisodeYoutubeUrl"),
  editEpisodeParticipantsEditor: $("#editEpisodeParticipantsEditor"),
  editEpisodeMessage: $("#editEpisodeMessage"),

  peopleManagePanel: $("#peopleManagePanel"),
  playerForm: $("#playerForm"),
  playerEditId: $("#playerEditId"),
  playerFormTitle: $("#playerFormTitle"),
  playerNameInput: $("#playerNameInput"),
  playerAvatarInput: $("#playerAvatarInput"),
  playerBannerInput: $("#playerBannerInput"),
  playerBioInput: $("#playerBioInput"),
  playerSaveBtn: $("#playerSaveBtn"),
  playerCancelEditBtn: $("#playerCancelEditBtn"),
  playerFormMessage: $("#playerFormMessage"),
  playerManageList: $("#playerManageList"),

  characterForm: $("#characterForm"),
  characterEditId: $("#characterEditId"),
  characterFormTitle: $("#characterFormTitle"),
  characterNameInput: $("#characterNameInput"),
  characterPlayerSelect: $("#characterPlayerSelect"),
  characterCampaignSelect: $("#characterCampaignSelect"),
  characterImageInput: $("#characterImageInput"),
  characterDescriptionInput: $("#characterDescriptionInput"),
  characterSaveBtn: $("#characterSaveBtn"),
  characterCancelEditBtn: $("#characterCancelEditBtn"),
  characterFormMessage: $("#characterFormMessage"),
  characterManageList: $("#characterManageList"),

  characterModal: $("#characterModal"),
  characterModalHero: $("#characterModalHero"),
  characterModalPortrait: $("#characterModalPortrait"),
  characterModalCode: $("#characterModalCode"),
  characterModalName: $("#characterModalName"),
  characterModalDescription: $("#characterModalDescription"),
  characterModalMeta: $("#characterModalMeta"),
  characterModalEpisodes: $("#characterModalEpisodes"),

  toast: $("#toast"),
  template: $("#episodeTemplate")
};

function configured() {
  return Boolean(
    firebaseConfig?.apiKey &&
    firebaseConfig.apiKey !== "COLOCA_AQUI" &&
    firebaseConfig?.projectId &&
    firebaseConfig.projectId !== "COLOCA_AQUI"
  );
}

function safeText(value, fallback = "—") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeCode(code) {
  return String(code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 8);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function showToast(message) {
  if (!els.toast) return;

  els.toast.textContent = message;
  els.toast.classList.remove("hidden");

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    els.toast.classList.add("hidden");
  }, 3400);
}

function openModal(element) {
  element?.classList.remove("hidden");
}

function closeModal(element) {
  element?.classList.add("hidden");
}

function isAdmin() {
  return state.profile?.role === "admin";
}

function isApprovedReviewer() {
  return (
    state.profile?.role === "reviewer" &&
    state.profile?.status === "approved"
  );
}

function isApproved() {
  return isAdmin() || isApprovedReviewer();
}

function canRate() {
  return Boolean(state.user && isApproved());
}

function safeHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function timestampToMs(value) {
  if (!value) return 0;

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNewEpisode(episode) {
  const created = timestampToMs(episode?.createdAt);
  if (!created) return false;

  const age = Date.now() - created;
  return age >= 0 && age < 2 * 60 * 60 * 1000;
}

function campaignHasNewEpisode(campaignId) {
  return state.episodes.some(
    episode =>
      episode.campaignId === campaignId &&
      isNewEpisode(episode)
  );
}

function switchView(view) {
  state.currentView = view;

  els.archiveShell.classList.toggle("hidden", view !== "archive");
  els.cinemaView.classList.toggle("hidden", view !== "cinema");
  els.lofiView.classList.toggle("hidden", view !== "lofi");
  els.newsView.classList.toggle("hidden", view !== "news");
  els.playersView.classList.toggle("hidden", view !== "players");
  els.rankingsView.classList.toggle("hidden", view !== "rankings");
  els.liveView.classList.toggle("hidden", view !== "live");

  els.rankingsBtn.classList.toggle("active-nav", view === "rankings");
  els.lofiBtn.classList.toggle("active-nav", view === "lofi");
  els.newsBtn.classList.toggle("active-nav", view === "news");
  els.playersBtn.classList.toggle("active-nav", view === "players");
  els.twitchBtn.classList.toggle("active-nav", view === "live");
  els.cinemaBtn.classList.toggle("active-nav", view === "cinema");

  if (view === "rankings") {
    renderRankings();
  }

  if (view === "cinema") {
    renderCinema();
  }

  if (view === "lofi") {
    renderLofiView();
  }

  if (view === "players") {
    renderPlayersView();
  }

  if (view === "news") {
    renderNewsView();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}


function extractYouTubeId(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      const parts = url.pathname.split("/").filter(Boolean);

      if (
        ["embed", "shorts", "live"].includes(parts[0]) &&
        parts[1]
      ) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

function youtubeEmbedUrl(value, autoplay = false) {
  const id = extractYouTubeId(value);
  if (!id) return "";

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1"
  });

  if (autoplay) {
    params.set("autoplay", "1");
  }

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

function cinemaCampaigns() {
  return state.campaigns
    .filter(campaign => isCampaignVisible(campaign))
    .filter(campaign =>
      state.episodes.some(
        episode =>
          episode.campaignId === campaign.id &&
          Boolean(extractYouTubeId(episode.youtubeUrl))
      )
    )
    .sort((a, b) =>
      (a.title || "").localeCompare(
        b.title || "",
        "pt"
      )
    );
}

function cinemaEpisodesForCampaign(campaignId) {
  return state.episodes
    .filter(
      episode =>
        episode.campaignId === campaignId &&
        Boolean(extractYouTubeId(episode.youtubeUrl))
    )
    .sort(
      (a, b) =>
        Number(a.number || 0) -
        Number(b.number || 0)
    );
}

function clearCinemaPlayer() {
  els.cinemaPlayer.src = "about:blank";
  els.cinemaScreening.classList.add("hidden");
}

function renderCinemaCampaignOptions() {
  const campaigns = cinemaCampaigns();
  const previous = state.selectedCinemaCampaignId;

  els.cinemaCampaignSelect.innerHTML = "";

  if (!campaigns.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nenhum arquivo com vídeos";
    els.cinemaCampaignSelect.appendChild(option);

    state.selectedCinemaCampaignId = null;
    return [];
  }

  if (
    !previous ||
    !campaigns.some(
      campaign => campaign.id === previous
    )
  ) {
    state.selectedCinemaCampaignId = campaigns[0].id;
  }

  for (const campaign of campaigns) {
    const option = document.createElement("option");
    option.value = campaign.id;
    option.textContent =
      `${safeText(campaign.code)} — ${safeText(campaign.title)}`;

    els.cinemaCampaignSelect.appendChild(option);
  }

  els.cinemaCampaignSelect.value =
    state.selectedCinemaCampaignId;

  return campaigns;
}

function renderCinemaEpisodeOptions() {
  const episodes =
    state.selectedCinemaCampaignId
      ? cinemaEpisodesForCampaign(
          state.selectedCinemaCampaignId
        )
      : [];

  els.cinemaEpisodeSelect.innerHTML = "";

  if (!episodes.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent =
      "Nenhum episódio com vídeo";

    els.cinemaEpisodeSelect.appendChild(option);

    state.selectedCinemaEpisodeId = null;
    els.cinemaEpisodeSelect.disabled = true;
    els.cinemaPlayBtn.disabled = true;
    els.cinemaEmpty.classList.remove("hidden");
    clearCinemaPlayer();

    return [];
  }

  els.cinemaEpisodeSelect.disabled = false;
  els.cinemaPlayBtn.disabled = false;
  els.cinemaEmpty.classList.add("hidden");

  if (
    !state.selectedCinemaEpisodeId ||
    !episodes.some(
      episode =>
        episode.id ===
        state.selectedCinemaEpisodeId
    )
  ) {
    state.selectedCinemaEpisodeId =
      episodes[0].id;
  }

  for (const episode of episodes) {
    const option =
      document.createElement("option");

    option.value = episode.id;

    option.textContent =
      `EP${String(
        episode.number || 0
      ).padStart(2, "0")} — ${safeText(
        episode.title,
        "Sem título"
      )}`;

    els.cinemaEpisodeSelect.appendChild(
      option
    );
  }

  els.cinemaEpisodeSelect.value =
    state.selectedCinemaEpisodeId;

  return episodes;
}

function renderCinema() {
  const campaigns =
    renderCinemaCampaignOptions();

  if (!campaigns.length) {
    els.cinemaEpisodeSelect.innerHTML =
      `<option>Nenhum episódio disponível</option>`;

    els.cinemaEpisodeSelect.disabled = true;
    els.cinemaPlayBtn.disabled = true;
    els.cinemaEmpty.classList.remove("hidden");
    clearCinemaPlayer();
    return;
  }

  renderCinemaEpisodeOptions();
}

function startCinemaEpisode(
  episodeId = state.selectedCinemaEpisodeId
) {
  if (!episodeId) return;

  const episodes =
    cinemaEpisodesForCampaign(
      state.selectedCinemaCampaignId
    );

  const index =
    episodes.findIndex(
      episode => episode.id === episodeId
    );

  if (index < 0) return;

  const episode = episodes[index];

  const campaign =
    state.campaigns.find(
      item =>
        item.id === episode.campaignId
    );

  const embedUrl =
    youtubeEmbedUrl(
      episode.youtubeUrl,
      true
    );

  if (!embedUrl) {
    showToast(
      "LINK DO YOUTUBE INVÁLIDO."
    );
    return;
  }

  state.selectedCinemaEpisodeId =
    episode.id;

  els.cinemaEpisodeSelect.value =
    episode.id;

  els.cinemaEpisodeCode.textContent =
    `${safeText(
      campaign?.code,
      "ARQ"
    )}-${String(
      episode.number || 0
    ).padStart(3, "0")}`;

  els.cinemaEpisodeTitle.textContent =
    safeText(
      episode.title,
      `Episódio ${episode.number || "?"}`
    );

  els.cinemaYoutubeLink.href =
    safeHttpUrl(episode.youtubeUrl) || "#";

  els.cinemaPlayer.src =
    embedUrl;

  els.cinemaScreening.classList.remove(
    "hidden"
  );

  els.cinemaPrevBtn.disabled =
    index === 0;

  els.cinemaNextBtn.disabled =
    index === episodes.length - 1;

  els.cinemaPrevBtn.dataset.episodeId =
    index > 0
      ? episodes[index - 1].id
      : "";

  els.cinemaNextBtn.dataset.episodeId =
    index < episodes.length - 1
      ? episodes[index + 1].id
      : "";

  els.cinemaPositionText.textContent =
    `${index + 1} / ${episodes.length}`;

  setTimeout(() => {
    els.cinemaScreening.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 80);
}



/* =========================================================
   FEATHER LOFI // SPOTIFY WEB PLAYBACK SDK + PKCE
   ========================================================= */

const SPOTIFY_TOKEN_KEY = "feather_spotify_token_v1";
const SPOTIFY_PKCE_VERIFIER_KEY = "feather_spotify_pkce_verifier";
const SPOTIFY_OAUTH_STATE_KEY = "feather_spotify_oauth_state";
const SPOTIFY_RETURN_VIEW_KEY = "feather_spotify_return_view";

function spotifyClientConfigured() {
  const id = String(spotifyConfig?.clientId || "").trim();
  return Boolean(id && !id.includes("COLOCA_AQUI"));
}

function normalizeSpotifyUrl(value, expectedType = "") {
  const raw = safeHttpUrl(value);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "open.spotify.com") return "";

    const parts = url.pathname.split("/").filter(Boolean);
    if (expectedType && parts[0] !== expectedType) return "";
    return url.href;
  } catch {
    return "";
  }
}

function spotifyEntityId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (raw.startsWith("spotify:")) {
    return raw.split(":").pop() || "";
  }

  try {
    return new URL(raw).pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return "";
  }
}

function spotifyPlaylistUri(value) {
  const id = spotifyEntityId(value);
  return id ? `spotify:playlist:${id}` : "";
}

function sortedLofiPlaylists() {
  return [...state.lofiPlaylists].sort((a, b) => {
    const ca = state.campaigns.find(c => c.id === a.campaignId);
    const cb = state.campaigns.find(c => c.id === b.campaignId);
    const cc = (ca?.title || "").localeCompare(cb?.title || "", "pt");
    return cc || (a.name || "").localeCompare(b.name || "", "pt");
  });
}

function selectedLofiPlaylist() {
  return state.lofiPlaylists.find(item => item.id === state.selectedLofiPlaylistId) || null;
}

function ensureLofiSelection() {
  const items = sortedLofiPlaylists();
  if (!items.length) {
    state.selectedLofiPlaylistId = null;
    return null;
  }

  if (!items.some(item => item.id === state.selectedLofiPlaylistId)) {
    state.selectedLofiPlaylistId = items[0].id;
  }
  return selectedLofiPlaylist();
}

function lofiCampaign(item) {
  return state.campaigns.find(campaign => campaign.id === item?.campaignId) || null;
}

function lofiArtwork(item) {
  const campaign = lofiCampaign(item);
  return safeHttpUrl(item?.coverUrl) || safeHttpUrl(campaign?.coverUrl) || "";
}

function lofiBackground(item) {
  const campaign = lofiCampaign(item);
  return safeHttpUrl(item?.backgroundUrl) || safeHttpUrl(item?.coverUrl) || safeHttpUrl(campaign?.coverUrl) || "";
}

function randomBase64Url(bytes = 64) {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return btoa(String.fromCharCode(...values))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sha256Base64Url(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function readSpotifyToken() {
  try {
    return JSON.parse(localStorage.getItem(SPOTIFY_TOKEN_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSpotifyToken(tokenData) {
  const current = readSpotifyToken() || {};
  const expiresIn = Number(tokenData.expires_in || 3600);
  const data = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || current.refresh_token || "",
    token_type: tokenData.token_type || "Bearer",
    scope: tokenData.scope || current.scope || "",
    expires_at: Date.now() + expiresIn * 1000 - 30000
  };
  localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(data));
  return data;
}

function clearSpotifyToken() {
  localStorage.removeItem(SPOTIFY_TOKEN_KEY);
  sessionStorage.removeItem(SPOTIFY_PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(SPOTIFY_OAUTH_STATE_KEY);
}

async function spotifyRefreshToken(refreshToken) {
  if (!spotifyClientConfigured() || !refreshToken) return null;

  const body = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body
  });

  if (!response.ok) {
    clearSpotifyToken();
    throw new Error("Não foi possível renovar a sessão Spotify.");
  }

  return saveSpotifyToken(await response.json());
}

async function spotifyGetAccessToken() {
  let token = readSpotifyToken();
  if (!token) return "";

  if (Number(token.expires_at || 0) <= Date.now()) {
    token = await spotifyRefreshToken(token.refresh_token);
  }

  return token?.access_token || "";
}

async function spotifyLogin() {
  if (!spotifyClientConfigured()) {
    showToast("SPOTIFY // CONFIGURA O CLIENT ID PRIMEIRO.");
    return;
  }

  const verifier = randomBase64Url(64);
  const challenge = await sha256Base64Url(verifier);
  const oauthState = randomBase64Url(24);

  sessionStorage.setItem(SPOTIFY_PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(SPOTIFY_OAUTH_STATE_KEY, oauthState);
  sessionStorage.setItem(SPOTIFY_RETURN_VIEW_KEY, "lofi");

  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    response_type: "code",
    redirect_uri: spotifyConfig.redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state: oauthState,
    scope: (spotifyConfig.scopes || []).join(" ")
  });

  location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function handleSpotifyOAuthCallback() {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const error = params.get("error");

  if (!code && !error) return false;

  const cleanUrl = new URL(location.href);
  cleanUrl.searchParams.delete("code");
  cleanUrl.searchParams.delete("state");
  cleanUrl.searchParams.delete("error");

  if (error) {
    history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    showToast(`SPOTIFY // ${error.toUpperCase()}`);
    return true;
  }

  const expectedState = sessionStorage.getItem(SPOTIFY_OAUTH_STATE_KEY) || "";
  const returnedState = params.get("state") || "";
  const verifier = sessionStorage.getItem(SPOTIFY_PKCE_VERIFIER_KEY) || "";

  if (!verifier || !expectedState || expectedState !== returnedState) {
    history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    clearSpotifyToken();
    showToast("SPOTIFY // FALHA DE SEGURANÇA NO LOGIN.");
    return true;
  }

  try {
    const body = new URLSearchParams({
      client_id: spotifyConfig.clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: spotifyConfig.redirectUri,
      code_verifier: verifier
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body
    });

    if (!response.ok) {
      throw new Error("Token Spotify recusado.");
    }

    saveSpotifyToken(await response.json());
    sessionStorage.removeItem(SPOTIFY_PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(SPOTIFY_OAUTH_STATE_KEY);

    history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    showToast("SPOTIFY // CONTA LIGADA.");
    return true;
  } catch (error) {
    console.error("[FEATHER] Spotify OAuth:", error);
    clearSpotifyToken();
    history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    showToast("SPOTIFY // NÃO FOI POSSÍVEL CONCLUIR O LOGIN.");
    return true;
  }
}

async function spotifyApi(path, {method = "GET", body = null, query = null} = {}) {
  const token = await spotifyGetAccessToken();
  if (!token) throw new Error("SPOTIFY_LOGIN_REQUIRED");

  const url = new URL(`https://api.spotify.com/v1${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? {"Content-Type": "application/json"} : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 204) return null;

  if (response.status === 401) {
    const current = readSpotifyToken();
    if (current?.refresh_token) {
      await spotifyRefreshToken(current.refresh_token);
    }
    throw new Error("SPOTIFY_RETRY");
  }

  if (!response.ok) {
    let message = `Spotify API ${response.status}`;
    try {
      const data = await response.json();
      message = data?.error?.message || message;
    } catch {}
    throw new Error(message);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function spotifyApiRetry(path, options = {}) {
  try {
    return await spotifyApi(path, options);
  } catch (error) {
    if (error.message === "SPOTIFY_RETRY") {
      return await spotifyApi(path, options);
    }
    throw error;
  }
}

function loadSpotifyWebPlaybackSdk() {
  if (window.Spotify?.Player) return Promise.resolve(window.Spotify);
  if (window.__featherSpotifySdkPromise) return window.__featherSpotifySdkPromise;

  window.__featherSpotifySdkPromise = new Promise((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve(window.Spotify);

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = () => reject(new Error("Não foi possível carregar o Spotify Web Playback SDK."));
    document.head.appendChild(script);
  });

  return window.__featherSpotifySdkPromise;
}

async function spotifyLoadAccount() {
  if (!readSpotifyToken()) {
    state.spotifyAccount = null;
    return;
  }

  try {
    state.spotifyAccount = await spotifyApiRetry("/me");
  } catch (error) {
    console.warn("[FEATHER] Spotify /me:", error);
    state.spotifyAccount = null;
  }
}

function updateSpotifyAuthUi() {
  const token = readSpotifyToken();
  const connected = Boolean(token);

  els.spotifyLoginBtn.classList.toggle("hidden", connected);
  els.spotifyLogoutBtn.classList.toggle("hidden", !connected);

  if (!spotifyClientConfigured()) {
    els.spotifyConnectTitle.textContent = "SPOTIFY AINDA NÃO CONFIGURADO";
    els.spotifyConnectText.textContent = "Abre spotify-config.js e coloca o Client ID da tua app Spotify.";
    els.spotifyLoginBtn.classList.remove("hidden");
    els.spotifyLoginBtn.disabled = true;
    els.spotifyAccountLabel.textContent = "CLIENT ID EM FALTA";
    return;
  }

  els.spotifyLoginBtn.disabled = false;

  if (!connected) {
    els.spotifyConnectTitle.textContent = "LIGA A TUA CONTA SPOTIFY";
    els.spotifyConnectText.textContent = "É necessário Spotify Premium. O login usa OAuth PKCE e não guarda a tua palavra-passe.";
    els.spotifyAccountLabel.textContent = "SPOTIFY NÃO LIGADO";
  } else {
    const name = state.spotifyAccount?.display_name || state.spotifyAccount?.email || "SPOTIFY PREMIUM";
    els.spotifyConnectTitle.textContent = state.spotifyDeviceId ? "SPOTIFY LIGADO" : "A PREPARAR O PLAYER...";
    els.spotifyConnectText.textContent = state.spotifyDeviceId
      ? "Feather Lofi está disponível como dispositivo Spotify Connect neste browser."
      : "A ligar o Web Playback SDK...";
    els.spotifyAccountLabel.textContent = String(name).toUpperCase();
  }
}

function setSpotifyControlsEnabled(enabled) {
  [els.lofiPrevBtn, els.lofiPlayBtn, els.lofiNextBtn, els.lofiRandomBtn, els.lofiLoopBtn, els.lofiMuteBtn, els.lofiVolumeSlider]
    .forEach(element => {
      if (element) element.disabled = !enabled;
    });
}

function updateLofiVolumeUi() {
  const percent = Math.round(Math.max(0, Math.min(1, state.spotifyVolume)) * 100);
  els.lofiVolumeSlider.value = String(percent);
  els.lofiVolumeValue.textContent = `${percent}%`;
  els.lofiVolumeIcon.src = percent === 0 ? "./lofi-icons/mute.svg" : "./lofi-icons/volume.svg";
}

function renderLofiPlaybackState() {
  if (!els.lofiPlayBtn) return;

  els.lofiPlayIcon.src = state.lofiPlaying ? "./lofi-icons/pause.svg" : "./lofi-icons/play.svg";
  els.lofiPlayBtn.classList.toggle("playing", state.lofiPlaying);
  els.lofiPlayBtn.title = state.lofiPlaying ? "Pausar" : "Reproduzir";
  els.lofiPlayBtn.setAttribute("aria-label", els.lofiPlayBtn.title);
  els.lofiRandomBtn.classList.toggle("active", state.spotifyShuffle);
  els.lofiLoopBtn.classList.toggle("active", state.spotifyRepeat !== "off");
  els.lofiNavBars.classList.toggle("playing", state.lofiPlaying);

  els.lofiModeLabel.textContent = state.spotifyRepeat === "track"
    ? "LOOP TRACK"
    : state.spotifyShuffle
      ? "SHUFFLE MODE"
      : "SPOTIFY CONNECT";

  updateLofiVolumeUi();
}

function renderSpotifyTrackState(playerState) {
  state.spotifyCurrentState = playerState || null;
  state.lofiPlaying = Boolean(playerState && !playerState.paused);

  const current = playerState?.track_window?.current_track || null;
  if (current) {
    els.lofiTrackTitle.textContent = current.name || "Faixa sem título";
    els.lofiTrackArtist.textContent = (current.artists || []).map(a => a.name).join(" • ") || "Spotify";
  } else {
    els.lofiTrackTitle.textContent = "Nenhuma música";
    els.lofiTrackArtist.textContent = readSpotifyToken()
      ? "Carrega em Play para iniciar a estação."
      : "Liga o Spotify e carrega em Play.";
  }

  renderLofiPlaybackState();
}

async function initSpotifyPlayer() {
  if (!spotifyClientConfigured() || !readSpotifyToken()) {
    state.spotifyConnected = false;
    state.spotifyDeviceId = "";
    setSpotifyControlsEnabled(false);
    updateSpotifyAuthUi();
    return;
  }

  if (state.spotifyPlayer) {
    updateSpotifyAuthUi();
    return;
  }

  try {
    await spotifyLoadAccount();
    const Spotify = await loadSpotifyWebPlaybackSdk();

    const player = new Spotify.Player({
      name: "Feather Lofi",
      getOAuthToken: async callback => {
        try {
          callback(await spotifyGetAccessToken());
        } catch {
          callback("");
        }
      },
      volume: state.spotifyVolume,
      enableMediaSession: true
    });

    player.addListener("ready", async ({device_id}) => {
      state.spotifyDeviceId = device_id;
      state.spotifyConnected = true;
      els.lofiSpotifyStatus.textContent = "ONLINE";

      try {
        const volume = await player.getVolume();
        if (Number.isFinite(volume)) state.spotifyVolume = volume;
      } catch {}

      setSpotifyControlsEnabled(true);
      updateSpotifyAuthUi();
      renderLofiPlaybackState();
    });

    player.addListener("not_ready", () => {
      state.spotifyConnected = false;
      els.lofiSpotifyStatus.textContent = "OFFLINE";
      setSpotifyControlsEnabled(false);
      updateSpotifyAuthUi();
    });

    player.addListener("player_state_changed", playerState => {
      renderSpotifyTrackState(playerState);
    });

    player.addListener("initialization_error", ({message}) => {
      console.error("[FEATHER] Spotify initialization:", message);
      els.lofiSpotifyStatus.textContent = "ERRO";
      showToast("SPOTIFY // ERRO AO INICIAR O PLAYER.");
    });

    player.addListener("authentication_error", ({message}) => {
      console.error("[FEATHER] Spotify auth:", message);
      clearSpotifyToken();
      els.lofiSpotifyStatus.textContent = "LOGIN EXPIRADO";
      state.spotifyConnected = false;
      updateSpotifyAuthUi();
      setSpotifyControlsEnabled(false);
    });

    player.addListener("account_error", ({message}) => {
      console.error("[FEATHER] Spotify account:", message);
      els.lofiSpotifyStatus.textContent = "PREMIUM NECESSÁRIO";
      showToast("SPOTIFY // ESTA CONTA PRECISA DE PREMIUM.");
    });

    player.addListener("autoplay_failed", () => {
      console.warn("[FEATHER] Spotify autoplay bloqueado pelo browser.");
      els.lofiSpotifyStatus.textContent = "CLICA PLAY NOVAMENTE";
      showToast("SPOTIFY // O BROWSER BLOQUEOU O PRIMEIRO PLAY. CLICA PLAY OUTRA VEZ.");
    });

    player.addListener("playback_error", ({message}) => {
      console.error("[FEATHER] Spotify playback:", message);
      els.lofiSpotifyStatus.textContent = "ERRO DE PLAYBACK";
      showToast(`SPOTIFY // PLAYBACK ERROR${message ? `: ${message}` : ""}`);
    });

    state.spotifyPlayer = player;
    const success = await player.connect();
    if (!success) throw new Error("Spotify Player connect() falhou.");
  } catch (error) {
    console.error("[FEATHER] Spotify Player:", error);
    state.spotifyConnected = false;
    els.lofiSpotifyStatus.textContent = "ERRO";
    setSpotifyControlsEnabled(false);
    updateSpotifyAuthUi();
  }
}

async function spotifyStartSelectedPlaylist() {
  const item = selectedLofiPlaylist();
  const contextUri = spotifyPlaylistUri(item?.spotifyUrl);

  if (!contextUri) {
    showToast("SPOTIFY // LINK DA PLAYLIST INVÁLIDO.");
    return false;
  }

  if (!state.spotifyDeviceId || !state.spotifyPlayer) {
    showToast("SPOTIFY // O DEVICE FEATHER AINDA NÃO ESTÁ PRONTO.");
    return false;
  }

  try {
    // Tem de acontecer diretamente a partir do clique do utilizador para
    // satisfazer as regras de autoplay de browsers como Edge/Chrome/Safari.
    await state.spotifyPlayer.activateElement?.();

    els.lofiSpotifyStatus.textContent = "A INICIAR...";

    // Não fazemos Transfer Playback antes deste pedido. O endpoint de Play
    // já aceita device_id e os endpoints Player não garantem ordem quando
    // disparados em sequência, o que podia deixar o Web Playback SDK online
    // mas sem qualquer faixa carregada.
    await spotifyApiRetry("/me/player/play", {
      method: "PUT",
      query: {device_id: state.spotifyDeviceId},
      body: {context_uri: contextUri, position_ms: 0}
    });

    // O primeiro arranque de um device Web Playback recém-criado pode demorar
    // um instante a refletir o estado. Confirmamos e fazemos um pequeno retry.
    await new Promise(resolve => setTimeout(resolve, 450));

    let current = await state.spotifyPlayer.getCurrentState();

    if (!current) {
      await spotifyApiRetry("/me/player/play", {
        method: "PUT",
        query: {device_id: state.spotifyDeviceId},
        body: {context_uri: contextUri, position_ms: 0}
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      current = await state.spotifyPlayer.getCurrentState();
    }

    if (current?.paused) {
      try {
        await state.spotifyPlayer.resume();
      } catch {}
    }

    els.lofiSpotifyStatus.textContent = "ONLINE";
    return true;
  } catch (error) {
    console.error("[FEATHER] Spotify start playlist:", error);
    els.lofiSpotifyStatus.textContent = "ERRO AO TOCAR";
    showToast(`SPOTIFY // ${error.message || "NÃO FOI POSSÍVEL TOCAR A PLAYLIST."}`);
    return false;
  }
}

async function spotifyTogglePlay() {
  if (!state.spotifyPlayer || !state.spotifyDeviceId) {
    showToast("SPOTIFY // LIGA A TUA CONTA PRIMEIRO.");
    return;
  }

  try {
    // Chamada imediatamente no click para desbloquear áudio no browser.
    await state.spotifyPlayer.activateElement?.();
    const current = await state.spotifyPlayer.getCurrentState();

    if (!current) {
      await spotifyStartSelectedPlaylist();
      return;
    }

    await state.spotifyPlayer.togglePlay();
  } catch (error) {
    console.error("[FEATHER] Spotify toggle:", error);
    els.lofiSpotifyStatus.textContent = "ERRO";
    showToast(`SPOTIFY // ${error.message || "NÃO FOI POSSÍVEL ALTERAR A REPRODUÇÃO."}`);
  }
}

async function spotifyPrevious() {
  if (!state.spotifyPlayer) return;
  try {
    await state.spotifyPlayer.previousTrack();
  } catch (error) {
    console.error(error);
  }
}

async function spotifyNext() {
  if (!state.spotifyPlayer) return;
  try {
    await state.spotifyPlayer.nextTrack();
  } catch (error) {
    console.error(error);
  }
}

async function spotifyToggleShuffle() {
  if (!state.spotifyDeviceId) return;
  const next = !state.spotifyShuffle;

  try {
    await spotifyApiRetry("/me/player/shuffle", {
      method: "PUT",
      query: {state: next, device_id: state.spotifyDeviceId}
    });
    state.spotifyShuffle = next;
    renderLofiPlaybackState();
    showToast(next ? "LOFI // ALEATÓRIO ATIVO." : "LOFI // ALEATÓRIO DESATIVADO.");
  } catch (error) {
    console.error(error);
    showToast("SPOTIFY // NÃO FOI POSSÍVEL ALTERAR O ALEATÓRIO.");
  }
}

async function spotifyToggleRepeat() {
  if (!state.spotifyDeviceId) return;
  const next = state.spotifyRepeat === "track" ? "off" : "track";

  try {
    await spotifyApiRetry("/me/player/repeat", {
      method: "PUT",
      query: {state: next, device_id: state.spotifyDeviceId}
    });
    state.spotifyRepeat = next;
    renderLofiPlaybackState();
    showToast(next === "track" ? "LOFI // LOOP DA MÚSICA ATIVO." : "LOFI // LOOP DESATIVADO.");
  } catch (error) {
    console.error(error);
    showToast("SPOTIFY // NÃO FOI POSSÍVEL ALTERAR O LOOP.");
  }
}

let spotifyVolumeTimer = null;
function setSpotifyVolume(value) {
  const volume = Math.max(0, Math.min(1, Number(value)));
  state.spotifyVolume = volume;
  if (volume > 0) state.spotifyPreviousVolume = volume;
  updateLofiVolumeUi();

  clearTimeout(spotifyVolumeTimer);
  spotifyVolumeTimer = setTimeout(async () => {
    try {
      await state.spotifyPlayer?.setVolume(volume);
    } catch (error) {
      console.error("[FEATHER] Spotify volume:", error);
    }
  }, 45);
}

function toggleSpotifyMute() {
  if (state.spotifyVolume > 0) {
    state.spotifyPreviousVolume = state.spotifyVolume;
    setSpotifyVolume(0);
  } else {
    setSpotifyVolume(state.spotifyPreviousVolume || 0.65);
  }
}

function spotifyLogout() {
  try {
    state.spotifyPlayer?.disconnect();
  } catch {}

  state.spotifyPlayer = null;
  state.spotifyDeviceId = "";
  state.spotifyAccount = null;
  state.spotifyCurrentState = null;
  state.spotifyConnected = false;
  state.lofiPlaying = false;
  state.spotifyShuffle = false;
  state.spotifyRepeat = "off";
  clearSpotifyToken();

  els.lofiSpotifyStatus.textContent = "OFFLINE";
  renderSpotifyTrackState(null);
  updateSpotifyAuthUi();
  setSpotifyControlsEnabled(false);
  showToast("SPOTIFY // CONTA DESLIGADA.");
}

function selectLofiPlaylist(id) {
  if (!state.lofiPlaylists.some(item => item.id === id)) return;
  const wasPlaying = state.lofiPlaying;
  state.selectedLofiPlaylistId = id;
  renderLofiView();

  if (wasPlaying && state.spotifyConnected) {
    spotifyStartSelectedPlaylist();
  }
}

function renderLofiStationList() {
  if (!els.lofiStationList) return;
  const items = sortedLofiPlaylists();
  els.lofiStationList.innerHTML = "";

  for (const item of items) {
    const campaign = lofiCampaign(item);
    const cover = lofiArtwork(item);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lofi-station-card";
    button.classList.toggle("active", item.id === state.selectedLofiPlaylistId);

    const art = document.createElement("div");
    art.className = "lofi-station-art";
    if (cover) {
      const img = document.createElement("img");
      img.src = cover;
      img.alt = "";
      art.appendChild(img);
    } else {
      const fallback = document.createElement("span");
      fallback.textContent = safeText(campaign?.code, "FA").slice(0, 2);
      art.appendChild(fallback);
    }

    const copy = document.createElement("div");
    copy.className = "lofi-station-card-copy";
    const small = document.createElement("small");
    small.textContent = safeText(campaign?.title, "FEATHER STUDIOS");
    const strong = document.createElement("strong");
    strong.textContent = safeText(item.name, "Feather Lofi");
    const meta = document.createElement("span");
    meta.textContent = "SPOTIFY CONNECT";
    copy.append(small, strong, meta);
    button.append(art, copy);
    button.addEventListener("click", () => selectLofiPlaylist(item.id));
    els.lofiStationList.appendChild(button);
  }
}

function renderLofiView() {
  if (!els.lofiView) return;
  const item = ensureLofiSelection();
  const items = sortedLofiPlaylists();

  els.lofiEmpty.classList.toggle("hidden", Boolean(items.length));
  els.lofiExperience.classList.toggle("hidden", !items.length);
  if (!item) {
    els.lofiStationList.innerHTML = "";
    return;
  }

  renderLofiStationList();
  const campaign = lofiCampaign(item);
  const cover = lofiArtwork(item);
  const background = lofiBackground(item);
  const spotifyUrl = normalizeSpotifyUrl(item.spotifyUrl, "playlist");

  els.lofiStationName.textContent = safeText(item.name, "Feather Lofi");
  els.lofiStationDescription.textContent = safeText(item.description, "Playlist oficial selecionada para este arquivo.");
  els.lofiCampaignName.textContent = safeText(campaign?.title, "FEATHER STUDIOS");
  els.lofiCampaignCode.textContent = `${safeText(campaign?.code, "FA")} // AUDIO ARCHIVE`;

  els.lofiCover.innerHTML = "";
  if (cover) {
    const img = document.createElement("img");
    img.src = cover;
    img.alt = safeText(item.name, "Feather Lofi");
    els.lofiCover.appendChild(img);
  } else {
    const fallback = document.createElement("span");
    fallback.textContent = safeText(campaign?.code, "FA").slice(0, 2);
    els.lofiCover.appendChild(fallback);
  }

  els.lofiBackdrop.style.backgroundImage = background
    ? `linear-gradient(180deg,rgba(10,9,8,.50),rgba(10,9,8,.94)),url("${background.replace(/"/g, "%22")}")`
    : "radial-gradient(circle at 70% 10%,rgba(103,72,44,.25),transparent 40%),linear-gradient(180deg,#19140f,#0d0c0a)";

  els.lofiSpotifyLink.href = spotifyUrl || "#";
  els.lofiSpotifyLink.classList.toggle("hidden", !spotifyUrl);

  updateSpotifyAuthUi();
  renderLofiPlaybackState();
  setSpotifyControlsEnabled(Boolean(state.spotifyConnected && state.spotifyDeviceId));

  els.lofiControlHint.textContent = state.spotifyConnected
    ? "PLAYER ONLINE // VOLUME, ANTERIOR, SEGUINTE, ALEATÓRIO E LOOP ATIVOS."
    : readSpotifyToken()
      ? "A PREPARAR O SPOTIFY CONNECT..."
      : "LIGA O SPOTIFY PARA ATIVAR O PLAYER.";

  if (readSpotifyToken() && !state.spotifyPlayer) {
    initSpotifyPlayer();
  }
}

function renderLofiCampaignOptions() {
  if (!els.lofiCampaignSelect) return;
  const current = els.lofiCampaignSelect.value;
  els.lofiCampaignSelect.innerHTML = "";
  const campaigns = [...state.campaigns].sort((a, b) => (a.title || "").localeCompare(b.title || "", "pt"));

  if (!campaigns.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "CRIA PRIMEIRO UM ARQUIVO";
    els.lofiCampaignSelect.appendChild(option);
    els.lofiCampaignSelect.disabled = true;
    return;
  }

  els.lofiCampaignSelect.disabled = false;
  for (const campaign of campaigns) {
    const option = document.createElement("option");
    option.value = campaign.id;
    option.textContent = `${safeText(campaign.code)} — ${safeText(campaign.title)}`;
    els.lofiCampaignSelect.appendChild(option);
  }

  if (current && campaigns.some(c => c.id === current)) els.lofiCampaignSelect.value = current;
}

function resetLofiForm() {
  if (!els.lofiForm) return;
  els.lofiForm.reset();
  els.lofiEditId.value = "";
  els.lofiFormTitle.textContent = "Nova Estação";
  els.lofiSaveBtn.textContent = "CRIAR ESTAÇÃO";
  els.lofiCancelEditBtn.classList.add("hidden");
  els.lofiFormMessage.textContent = "";
  renderLofiCampaignOptions();
}

function editLofiStation(item) {
  renderLofiCampaignOptions();
  els.lofiEditId.value = item.id;
  els.lofiCampaignSelect.value = item.campaignId || "";
  els.lofiNameInput.value = item.name || "";
  els.lofiSpotifyUrlInput.value = item.spotifyUrl || "";
  els.lofiCoverUrlInput.value = item.coverUrl || "";
  els.lofiBackgroundUrlInput.value = item.backgroundUrl || "";
  els.lofiDescriptionInput.value = item.description || "";
  els.lofiFormTitle.textContent = "Editar Estação";
  els.lofiSaveBtn.textContent = "GUARDAR ESTAÇÃO";
  els.lofiCancelEditBtn.classList.remove("hidden");
  els.lofiFormMessage.textContent = "";
  els.lofiManagePanel.scrollIntoView({behavior: "smooth", block: "start"});
}

async function deleteLofiStation(item) {
  if (!isAdmin()) return;
  if (!confirm(`Eliminar a estação "${safeText(item.name)}"?`)) return;

  try {
    await commitDeletes([doc(db, "lofiPlaylists", item.id)]);
    if (els.lofiEditId.value === item.id) resetLofiForm();
    if (state.selectedLofiPlaylistId === item.id) state.selectedLofiPlaylistId = null;
    showToast("LOFI // ESTAÇÃO ELIMINADA.");
  } catch (error) {
    console.error("[FEATHER] Erro ao eliminar estação:", error);
    showToast("ERRO // Não foi possível eliminar a estação.");
  }
}

function renderLofiManagement() {
  if (!isAdmin() || !els.lofiManageList) return;
  renderLofiCampaignOptions();
  const items = sortedLofiPlaylists();
  els.lofiManageList.innerHTML = "";

  if (!items.length) {
    els.lofiManageList.innerHTML = `<div class="people-empty-inline">Nenhuma estação criada.</div>`;
    return;
  }

  for (const item of items) {
    const campaign = lofiCampaign(item);
    const row = document.createElement("div");
    row.className = "lofi-manage-row";
    const copy = document.createElement("div");
    copy.className = "lofi-manage-copy";
    const meta = document.createElement("span");
    meta.textContent = `${safeText(campaign?.code, "FA")} // SPOTIFY SDK`;
    const name = document.createElement("strong");
    name.textContent = safeText(item.name);
    const detail = document.createElement("p");
    detail.textContent = safeText(campaign?.title, "FEATHER STUDIOS");
    copy.append(meta, name, detail);

    const actions = document.createElement("div");
    actions.className = "people-manage-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit";
    edit.textContent = "EDITAR";
    edit.addEventListener("click", () => editLofiStation(item));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete";
    remove.textContent = "ELIMINAR";
    remove.addEventListener("click", () => deleteLofiStation(item));
    actions.append(edit, remove);
    row.append(copy, actions);
    els.lofiManageList.appendChild(row);
  }
}

const NEWS_CATEGORIES = new Set([
  "SISTEMA",
  "TEMPORADA",
  "EPISÓDIO",
  "PARCERIA",
  "EVENTO",
  "PRODUÇÃO",
  "COMUNICADO",
  "OUTRO"
]);

function normalizeNewsCategory(value) {
  const category = String(value || "").trim().toUpperCase();
  return NEWS_CATEGORIES.has(category) ? category : "COMUNICADO";
}

function newsTimeMs(item) {
  return (
    timestampToMs(item?.publishedAt) ||
    timestampToMs(item?.createdAt) ||
    timestampToMs(item?.updatedAt)
  );
}

function formatNewsDate(item) {
  const ms = newsTimeMs(item);
  if (!ms) return "DATA NÃO REGISTADA";

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
    .format(new Date(ms))
    .replace(".", "")
    .toUpperCase();
}

function sortedNews() {
  return [...state.news].sort((a, b) => newsTimeMs(b) - newsTimeMs(a));
}

function newsCampaignLabel(item) {
  if (!item?.campaignId) return "";
  const campaign = state.campaigns.find(c => c.id === item.campaignId);
  return campaign ? `${safeText(campaign.code)} — ${safeText(campaign.title)}` : "";
}

function isRecentNews(item) {
  const ms = newsTimeMs(item);
  if (!ms) return false;
  const age = Date.now() - ms;
  return age >= 0 && age < 48 * 60 * 60 * 1000;
}

function newsExcerpt(text, max = 210) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function applyNewsCategoryClass(element, category) {
  if (!element) return;

  [
    "news-cat-sistema",
    "news-cat-temporada",
    "news-cat-episodio",
    "news-cat-parceria",
    "news-cat-evento",
    "news-cat-producao",
    "news-cat-comunicado",
    "news-cat-outro"
  ].forEach(cls => element.classList.remove(cls));

  const key = normalizeNewsCategory(category)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  element.classList.add(`news-cat-${key}`);
}

function renderNewsNavState() {
  if (!els.newsNavDot) return;
  els.newsNavDot.classList.toggle(
    "hidden",
    !sortedNews().some(isRecentNews)
  );
}

function renderLatestNews() {
  if (!els.latestNewsSection) return;

  const latest = sortedNews()[0];

  if (!latest) {
    els.latestNewsSection.classList.add("hidden");
    renderNewsNavState();
    return;
  }

  els.latestNewsSection.classList.remove("hidden");
  els.latestNewsDate.textContent = formatNewsDate(latest);
  els.latestNewsCategory.textContent = normalizeNewsCategory(latest.category);
  applyNewsCategoryClass(els.latestNewsCategory, latest.category);
  els.latestNewsTitle.textContent = safeText(latest.title, "Novidade RPG");
  els.latestNewsExcerpt.textContent = newsExcerpt(latest.body, 180);

  els.latestNewsCard.onclick = () => {
    switchView("news");
    openNewsModal(latest.id);
  };

  renderNewsNavState();
}

function createNewsCard(item, {featured = false} = {}) {
  const article = document.createElement("article");
  article.className = `news-card${featured ? " featured" : ""}`;

  const image = safeHttpUrl(item.imageUrl);
  const campaignLabel = newsCampaignLabel(item);
  const category = normalizeNewsCategory(item.category);

  if (image) {
    const visual = document.createElement("div");
    visual.className = "news-card-image";
    visual.style.backgroundImage = `linear-gradient(180deg,rgba(8,7,6,.05),rgba(8,7,6,.62)),url("${image.replace(/"/g, "%22")}")`;
    article.appendChild(visual);
  }

  const content = document.createElement("div");
  content.className = "news-card-content";

  const top = document.createElement("div");
  top.className = "news-card-top";

  const badge = document.createElement("span");
  badge.className = "news-category-badge";
  badge.textContent = category;
  applyNewsCategoryClass(badge, category);
  top.appendChild(badge);

  const date = document.createElement("time");
  date.textContent = formatNewsDate(item);
  top.appendChild(date);

  content.appendChild(top);

  if (item.featured) {
    const featuredBadge = document.createElement("span");
    featuredBadge.className = "news-featured-label";
    featuredBadge.textContent = "DESTAQUE";
    content.appendChild(featuredBadge);
  }

  const title = document.createElement("h2");
  title.textContent = safeText(item.title, "Novidade RPG");
  content.appendChild(title);

  if (campaignLabel) {
    const campaign = document.createElement("div");
    campaign.className = "news-card-campaign";
    campaign.textContent = campaignLabel;
    content.appendChild(campaign);
  }

  const excerpt = document.createElement("p");
  excerpt.textContent = newsExcerpt(item.body, featured ? 300 : 190);
  content.appendChild(excerpt);

  const open = document.createElement("button");
  open.type = "button";
  open.className = "news-card-open";
  open.textContent = "LER COMUNICADO →";
  open.addEventListener("click", () => openNewsModal(item.id));
  content.appendChild(open);

  article.appendChild(content);
  return article;
}

function renderNewsView() {
  if (!els.newsFeed) return;

  const items = sortedNews();
  els.newsFeedMeta.textContent = `${items.length} ${items.length === 1 ? "PUBLICAÇÃO" : "PUBLICAÇÕES"}`;

  els.newsFeatured.innerHTML = "";
  els.newsFeatured.classList.add("hidden");
  els.newsFeed.innerHTML = "";

  if (!items.length) {
    els.newsFeed.innerHTML = `
      <div class="news-empty">
        <span>SEM COMUNICADOS</span>
        <p>Quando houver novidades da Feather Studios, aparecem aqui.</p>
      </div>`;
    return;
  }

  const featured = items.find(item => item.featured === true) || null;
  const regularItems = featured ? items.filter(item => item.id !== featured.id) : items;

  if (featured) {
    els.newsFeatured.classList.remove("hidden");
    els.newsFeatured.appendChild(createNewsCard(featured, {featured:true}));
  }

  for (const item of regularItems) {
    els.newsFeed.appendChild(createNewsCard(item));
  }
}

function openNewsModal(newsId) {
  const item = state.news.find(entry => entry.id === newsId);
  if (!item) return;

  const image = safeHttpUrl(item.imageUrl);
  if (image) {
    els.newsModalImage.style.backgroundImage =
      `linear-gradient(180deg,rgba(12,10,8,.06),rgba(12,10,8,.68)),url("${image.replace(/"/g, "%22")}")`;
    els.newsModalImage.classList.remove("hidden");
  } else {
    els.newsModalImage.style.backgroundImage = "";
    els.newsModalImage.classList.add("hidden");
  }

  els.newsModalCategory.textContent = normalizeNewsCategory(item.category);
  applyNewsCategoryClass(els.newsModalCategory, item.category);
  els.newsModalDate.textContent = formatNewsDate(item);
  els.newsModalTitle.textContent = safeText(item.title, "Novidade RPG");

  const campaignLabel = newsCampaignLabel(item);
  els.newsModalCampaign.textContent = campaignLabel;
  els.newsModalCampaign.classList.toggle("hidden", !campaignLabel);

  els.newsModalText.textContent = safeText(item.body, "Sem conteúdo.");

  const link = safeHttpUrl(item.linkUrl);
  els.newsModalLink.classList.toggle("hidden", !link);
  els.newsModalLink.href = link || "#";

  openModal(els.newsModal);
}

function renderNewsCampaignOptions() {
  if (!els.newsCampaign) return;

  const current = els.newsCampaign.value;
  els.newsCampaign.innerHTML = `<option value="">GERAL // FEATHER STUDIOS</option>`;

  for (const campaign of [...state.campaigns].sort((a,b) =>
    (a.title || "").localeCompare(b.title || "", "pt")
  )) {
    const option = document.createElement("option");
    option.value = campaign.id;
    option.textContent = `${safeText(campaign.code)} — ${safeText(campaign.title)}`;
    els.newsCampaign.appendChild(option);
  }

  if (current && state.campaigns.some(c => c.id === current)) {
    els.newsCampaign.value = current;
  }
}

function resetNewsForm() {
  if (!els.newsForm) return;

  els.newsForm.reset();
  els.newsEditId.value = "";
  els.newsCategory.value = "SISTEMA";
  els.newsFormTitle.textContent = "Nova Novidade";
  els.newsSaveBtn.textContent = "PUBLICAR NOVIDADE";
  els.newsCancelEditBtn.classList.add("hidden");
  els.newsFormMessage.textContent = "";
  renderNewsCampaignOptions();
}

function editNews(item) {
  renderNewsCampaignOptions();

  els.newsEditId.value = item.id;
  els.newsCategory.value = normalizeNewsCategory(item.category);
  els.newsCampaign.value = item.campaignId || "";
  els.newsTitleInput.value = item.title || "";
  els.newsImageUrl.value = item.imageUrl || "";
  els.newsBodyInput.value = item.body || "";
  els.newsLinkUrl.value = item.linkUrl || "";
  els.newsFeaturedInput.checked = item.featured === true;

  els.newsFormTitle.textContent = "Editar Novidade";
  els.newsSaveBtn.textContent = "GUARDAR ALTERAÇÕES";
  els.newsCancelEditBtn.classList.remove("hidden");
  els.newsFormMessage.textContent = "";

  els.newsManagePanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function deleteNews(item) {
  if (!isAdmin()) return;

  if (!confirm(`Eliminar a novidade "${safeText(item.title)}"?`)) {
    return;
  }

  try {
    await commitDeletes([doc(db, "news", item.id)]);
    if (els.newsEditId.value === item.id) {
      resetNewsForm();
    }
    showToast("NOVIDADE ELIMINADA.");
  } catch (error) {
    console.error("[FEATHER] Erro ao eliminar novidade:", error);
    showToast("ERRO // Não foi possível eliminar a novidade.");
  }
}

function renderNewsManagement() {
  if (!isAdmin() || !els.newsManageList) return;

  renderNewsCampaignOptions();

  const items = sortedNews();
  els.newsManageList.innerHTML = "";

  if (!items.length) {
    els.newsManageList.innerHTML =
      `<div class="people-empty-inline">Nenhuma novidade publicada.</div>`;
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "news-manage-row";

    const category = normalizeNewsCategory(item.category);
    const campaignLabel = newsCampaignLabel(item);

    row.innerHTML = `
      <div class="news-manage-copy">
        <div class="news-manage-meta">
          <span class="news-category-badge"></span>
          <small>${formatNewsDate(item)}</small>
          ${item.featured ? `<b>DESTAQUE</b>` : ""}
        </div>
        <strong></strong>
        <p>${campaignLabel ? `${campaignLabel} • ` : ""}${newsExcerpt(item.body, 120)}</p>
      </div>

      <div class="people-manage-actions">
        <button type="button" class="edit">EDITAR</button>
        <button type="button" class="delete">ELIMINAR</button>
      </div>`;

    const badge = row.querySelector(".news-category-badge");
    badge.textContent = category;
    applyNewsCategoryClass(badge, category);
    row.querySelector("strong").textContent = safeText(item.title);

    row.querySelector(".edit").addEventListener("click", () => editNews(item));
    row.querySelector(".delete").addEventListener("click", () => deleteNews(item));

    els.newsManageList.appendChild(row);
  }
}

function publishedCampaignMap() {
  return new Map(
    state.campaigns
      .filter(campaign => isCampaignVisible(campaign))
      .map(campaign => [campaign.id, campaign])
  );
}

function getPublishedEpisodeRankingData() {
  const campaignMap = publishedCampaignMap();

  return state.episodes
    .filter(episode => campaignMap.has(episode.campaignId))
    .map(episode => {
      const stats = ratingStats(episode.id);
      const dominantScore = stats.winners.length
        ? Math.max(...stats.winners)
        : 0;

      return {
        episode,
        campaign: campaignMap.get(episode.campaignId),
        stats,
        dominantScore,
        legendaryVotes: stats.counts[6] || 0,
        totalVotes: stats.ratings.length
      };
    });
}

function openEpisodeFromRanking(episode) {
  state.selectedCampaignId = episode.campaignId;
  switchView("archive");
  renderAll();

  setTimeout(() => {
    document
      .querySelector(`[data-episode-id="${episode.id}"]`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
  }, 80);
}

function buildRankingRow(item, position, valueHtml) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ranking-row";

  button.innerHTML = `
    <span class="ranking-position">${String(position).padStart(2, "0")}</span>
    <span class="ranking-info">
      <strong></strong>
      <small></small>
    </span>
    <span class="ranking-value">${valueHtml}</span>
  `;

  button.querySelector(".ranking-info strong").textContent =
    `${item.campaign.code || "ARQ"}-${String(item.episode.number || 0).padStart(3, "0")} — ${item.episode.title || "Sem título"}`;

  button.querySelector(".ranking-info small").textContent =
    `${item.campaign.title || "Arquivo"}${isNewEpisode(item.episode) ? " • NEW EP" : ""}`;

  button.addEventListener("click", () => {
    openEpisodeFromRanking(item.episode);
  });

  return button;
}

function fillRankingList(container, items, formatter) {
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML =
      `<div class="ranking-empty">Ainda não existem dados suficientes.</div>`;
    return;
  }

  items.slice(0, 10).forEach((item, index) => {
    container.appendChild(
      buildRankingRow(
        item,
        index + 1,
        formatter(item)
      )
    );
  });
}


function ratingMapScoreText(stats) {
  if (!stats.ratings.length) return "—";

  if (stats.winners.length > 1) {
    return "≋";
  }

  const score = stats.winners[0];
  return score === 6 ? "✦" : `${score}★`;
}

function ratingMapScoreClass(stats) {
  if (!stats.ratings.length) return "score-none";
  if (stats.winners.length > 1) return "score-tie";

  return `score-${stats.winners[0]}`;
}

function dominantScoreForSummary(stats) {
  if (!stats.ratings.length || !stats.winners.length) return null;

  return stats.winners.length === 1
    ? stats.winners[0]
    : Math.max(...stats.winners);
}

function renderRatingMapCampaignOptions() {
  const campaigns = state.campaigns
    .filter(campaign => isCampaignVisible(campaign))
    .sort((a, b) =>
      (a.title || "").localeCompare(b.title || "", "pt")
    );

  els.ratingMapCampaignSelect.innerHTML = "";

  if (!campaigns.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nenhum arquivo disponível";
    els.ratingMapCampaignSelect.appendChild(option);
    state.selectedRatingMapCampaignId = null;
    return [];
  }

  if (
    !state.selectedRatingMapCampaignId ||
    !campaigns.some(c => c.id === state.selectedRatingMapCampaignId)
  ) {
    state.selectedRatingMapCampaignId = campaigns[0].id;
  }

  for (const campaign of campaigns) {
    const option = document.createElement("option");
    option.value = campaign.id;
    option.textContent = `${safeText(campaign.code)} — ${safeText(campaign.title)}`;
    els.ratingMapCampaignSelect.appendChild(option);
  }

  els.ratingMapCampaignSelect.value = state.selectedRatingMapCampaignId;
  return campaigns;
}

function renderRatingMap() {
  const campaigns = renderRatingMapCampaignOptions();

  if (!campaigns.length) {
    els.ratingMapSummary.innerHTML = "";
    els.ratingMapGrid.innerHTML =
      `<div class="rating-map-empty">Ainda não existem arquivos públicos.</div>`;
    return;
  }

  const campaign = campaigns.find(
    item => item.id === state.selectedRatingMapCampaignId
  ) || campaigns[0];

  if (!campaign) return;

  const episodes = state.episodes
    .filter(episode => episode.campaignId === campaign.id)
    .sort((a, b) => Number(a.number || 0) - Number(b.number || 0));

  const episodeStats = episodes.map(episode => ({
    episode,
    stats: ratingStats(episode.id)
  }));

  const totalRatings = episodeStats.reduce(
    (sum, item) => sum + item.stats.ratings.length,
    0
  );

  const ratedEpisodes = episodeStats.filter(
    item => item.stats.ratings.length > 0
  );

  const legendaryEpisodes = episodeStats.filter(
    item => item.stats.winners.length === 1 &&
      item.stats.winners[0] === 6
  ).length;

  const allDominantScores = ratedEpisodes
    .map(item => dominantScoreForSummary(item.stats))
    .filter(score => score !== null);

  const dominantCounts = {1:0,2:0,3:0,4:0,5:0,6:0};

  for (const score of allDominantScores) {
    dominantCounts[score] += 1;
  }

  const maxDominantCount = Math.max(
    0,
    ...Object.values(dominantCounts)
  );

  let mostCommonDominant = "—";

  if (maxDominantCount > 0) {
    const winners = Object.entries(dominantCounts)
      .filter(([, count]) => count === maxDominantCount)
      .map(([score]) => Number(score));

    mostCommonDominant = winners.length === 1
      ? (winners[0] === 6 ? "✦ LENDÁRIA" : `${winners[0]}★`)
      : `EMPATE // ${winners.map(score => score === 6 ? "✦" : `${score}★`).join(" + ")}`;
  }

  els.ratingMapSummary.innerHTML = `
    <div>
      <span>ARQUIVO</span>
      <strong></strong>
    </div>
    <div>
      <span>EPISÓDIOS</span>
      <strong>${episodes.length}</strong>
    </div>
    <div>
      <span>AVALIAÇÕES</span>
      <strong>${totalRatings}</strong>
    </div>
    <div>
      <span>MAIS COMUM</span>
      <strong>${mostCommonDominant}</strong>
    </div>
    <div>
      <span>LENDÁRIOS</span>
      <strong>${legendaryEpisodes}</strong>
    </div>
  `;

  els.ratingMapSummary.querySelector("div strong").textContent =
    safeText(campaign.title);

  els.ratingMapGrid.innerHTML = "";

  if (!episodes.length) {
    els.ratingMapGrid.innerHTML =
      `<div class="rating-map-empty">Este arquivo ainda não tem episódios.</div>`;
    return;
  }

  const headerRow = document.createElement("div");
  headerRow.className = "rating-map-row rating-map-header-row";

  for (const { episode } of episodeStats) {
    const head = document.createElement("div");
    head.className = "rating-map-episode-head";
    head.textContent = `EP${String(episode.number || 0).padStart(2, "0")}`;

    if (isNewEpisode(episode)) {
      const newMark = document.createElement("span");
      newMark.textContent = "NEW";
      head.appendChild(newMark);
    }

    headerRow.appendChild(head);
  }

  els.ratingMapGrid.appendChild(headerRow);

  const scoreRow = document.createElement("div");
  scoreRow.className = "rating-map-row rating-map-score-row";

  const archiveLabel = document.createElement("div");
  archiveLabel.className = "rating-map-archive-label";
  archiveLabel.textContent = safeText(campaign.code, "ARQ");
  scoreRow.appendChild(archiveLabel);

  for (const { episode, stats } of episodeStats) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className =
      `rating-map-cell ${ratingMapScoreClass(stats)}`;

    const scoreText = ratingMapScoreText(stats);
    cell.innerHTML = `<strong>${scoreText}</strong>`;

    const distributionText = [6,5,4,3,2,1]
      .filter(score => stats.counts[score] > 0)
      .map(score =>
        `${score === 6 ? "✦" : `${score}★`}: ${stats.counts[score]}`
      )
      .join(" • ");

    let title =
      `EP${String(episode.number || 0).padStart(2, "0")} — ${episode.title || "Sem título"}\n`;

    if (!stats.ratings.length) {
      title += "Sem avaliações";
    } else {
      title += `Classificação: ${dominantLabel(stats.winners)}\n`;
      title += `${stats.ratings.length} avaliação${stats.ratings.length === 1 ? "" : "ões"}`;

      if (distributionText) {
        title += `\n${distributionText}`;
      }
    }

    cell.title = title;
    cell.setAttribute("aria-label", title.replaceAll("\n", ". "));

    if (isNewEpisode(episode)) {
      const badge = document.createElement("span");
      badge.className = "rating-map-cell-new";
      badge.textContent = "NEW";
      cell.appendChild(badge);
    }

    cell.addEventListener("click", () => {
      openEpisodeFromRanking(episode);
    });

    scoreRow.appendChild(cell);
  }

  els.ratingMapGrid.appendChild(scoreRow);
}

function renderRankings() {
  const data = getPublishedEpisodeRankingData();

  const best = data
    .filter(item => item.totalVotes > 0)
    .sort((a, b) =>
      b.dominantScore - a.dominantScore ||
      b.totalVotes - a.totalVotes ||
      b.legendaryVotes - a.legendaryVotes
    );

  const legendary = data
    .filter(item => item.legendaryVotes > 0)
    .sort((a, b) =>
      b.legendaryVotes - a.legendaryVotes ||
      b.totalVotes - a.totalVotes
    );

  const mostRated = data
    .filter(item => item.totalVotes > 0)
    .sort((a, b) =>
      b.totalVotes - a.totalVotes ||
      b.dominantScore - a.dominantScore
    );

  fillRankingList(
    els.bestEpisodesRanking,
    best,
    item =>
      `${dominantLabel(item.stats.winners)}<small>${item.totalVotes} relatório${item.totalVotes === 1 ? "" : "s"}</small>`
  );

  fillRankingList(
    els.legendaryRanking,
    legendary,
    item =>
      `✦ ${item.legendaryVotes}<small>${item.totalVotes} total</small>`
  );

  fillRankingList(
    els.mostRatedRanking,
    mostRated,
    item =>
      `${item.totalVotes}<small>${dominantLabel(item.stats.winners)}</small>`
  );

  renderRatingMap();
}

function isCampaignVisible(campaign) {
  return campaign?.visible !== false;
}

function visibleCampaignsForCurrentUser() {
  return state.campaigns.filter(campaign => (
    isAdmin() || isCampaignVisible(campaign)
  ));
}

function ratingsForEpisode(episodeId) {
  return state.ratings.filter(rating => rating.episodeId === episodeId);
}

function myRatingObject(episodeId) {
  if (!state.user) return null;
  const ratingId = `${episodeId}_${state.user.uid}`;
  return state.ratings.find(rating => rating.id === ratingId) || null;
}

function ratingStats(episodeId) {
  const ratings = ratingsForEpisode(episodeId);
  const counts = {1:0,2:0,3:0,4:0,5:0,6:0};

  for (const rating of ratings) {
    if (counts[rating.score] !== undefined) {
      counts[rating.score] += 1;
    }
  }

  const max = Math.max(0, ...Object.values(counts));
  const winners = max === 0
    ? []
    : Object.entries(counts)
        .filter(([, count]) => count === max)
        .map(([score]) => Number(score));

  return { ratings, counts, max, winners };
}

function scoreLabel(score) {
  if (score === 6) return "✦ LENDÁRIA";
  if (!score) return "SEM CLASSIFICAÇÃO";
  return `${"★".repeat(score)} ${score}/6`;
}

function dominantLabel(winners) {
  if (!winners.length) return "SEM CLASSIFICAÇÃO";
  if (winners.length === 1) return scoreLabel(winners[0]);

  return `EMPATE // ${winners
    .map(score => score === 6 ? "✦" : `${score}★`)
    .join(" + ")}`;
}

function renderSession() {
  if (!state.user) {
    els.authBtn.textContent = "IDENTIFICAR-SE";
    els.sessionBadge.textContent = "ACESSO PÚBLICO";
    els.adminBtn.classList.add("hidden");
    return;
  }

  const name =
    state.profile?.displayName ||
    state.user.email ||
    "INVESTIGADOR";

  els.authBtn.textContent = "TERMINAR SESSÃO";

  if (isAdmin()) {
    els.sessionBadge.textContent = `ADMIN // ${name}`;
    els.adminBtn.classList.remove("hidden");
    return;
  }

  els.adminBtn.classList.add("hidden");

  if (state.profile?.status === "approved") {
    els.sessionBadge.textContent = `REVIEWER // ${name}`;
  } else if (state.profile?.status === "rejected") {
    els.sessionBadge.textContent = `ACESSO RECUSADO // ${name}`;
  } else {
    els.sessionBadge.textContent = `PENDENTE // ${name}`;
  }
}

function renderCampaignNav() {
  const query = state.search.toLowerCase().trim();

  const filtered = visibleCampaignsForCurrentUser().filter(campaign => {
    const haystack = `${campaign.title || ""} ${campaign.code || ""}`.toLowerCase();
    return !query || haystack.includes(query);
  });

  els.campaignNav.innerHTML = "";

  if (!filtered.length) {
    const p = document.createElement("p");
    p.className = "form-message";
    p.textContent = state.campaigns.length
      ? "Nenhum arquivo visível corresponde à pesquisa."
      : "Nenhum arquivo criado.";
    els.campaignNav.appendChild(p);
    return;
  }

  for (const campaign of filtered) {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      `campaign-item ${campaign.id === state.selectedCampaignId ? "active" : ""} ` +
      `${isCampaignVisible(campaign) ? "" : "hidden-archive"}`;

    const visibility = !isCampaignVisible(campaign)
      ? `<span class="campaign-visibility">OCULTO</span>`
      : "";

    const newEpisode = campaignHasNewEpisode(campaign.id)
      ? `<span class="new-ep-badge">NEW EP</span>`
      : "";

    button.innerHTML = `
      <span>DOSSIER // ${safeText(campaign.code)}</span>
      <strong></strong>
      ${visibility}
      ${newEpisode}
    `;

    button.querySelector("strong").textContent = safeText(campaign.title);

    button.addEventListener("click", () => {
      state.selectedCampaignId = campaign.id;
      renderAll();

      const section = document.querySelector(".archive-section");
      if (section) {
        window.scrollTo({
          top: section.offsetTop - 70,
          behavior: "smooth"
        });
      }
    });

    els.campaignNav.appendChild(button);
  }
}

function renderAdminCampaignOptions() {
  const selects = [
    els.episodeCampaign,
    els.editEpisodeCampaign
  ].filter(Boolean);

  for (const select of selects) {
    const current = select.value;
    select.innerHTML = "";

    for (const campaign of state.campaigns) {
      const option = document.createElement("option");
      option.value = campaign.id;
      option.textContent =
        `${safeText(campaign.code)} — ${safeText(campaign.title)}` +
        `${isCampaignVisible(campaign) ? "" : " [OCULTO]"}`;
      select.appendChild(option);
    }

    if (current && state.campaigns.some(c => c.id === current)) {
      select.value = current;
    }
  }
}

function renderArchive() {
  const allowedCampaigns = visibleCampaignsForCurrentUser();

  if (
    state.selectedCampaignId &&
    !allowedCampaigns.some(c => c.id === state.selectedCampaignId)
  ) {
    state.selectedCampaignId = null;
  }

  const campaign =
    allowedCampaigns.find(c => c.id === state.selectedCampaignId);

  if (!campaign) {
    els.archiveCode.textContent = "DOSSIER // —";
    els.archiveTitle.textContent = "Seleciona um arquivo";
    els.archiveDescription.textContent = "Os registos disponíveis aparecerão aqui.";
    els.archiveMeta.textContent = "";
    els.episodeGrid.innerHTML = `
      <article class="empty-card">
        <span>SEM DOSSIER SELECIONADO</span>
        <p>Escolhe um arquivo no índice lateral.</p>
      </article>
    `;
    return;
  }

  const episodes = state.episodes
    .filter(episode => episode.campaignId === campaign.id)
    .sort((a,b) => Number(b.number || 0) - Number(a.number || 0));

  els.archiveCode.textContent = `DOSSIER // ${safeText(campaign.code)}`;
  els.archiveTitle.textContent = safeText(campaign.title);
  els.archiveDescription.textContent =
    safeText(campaign.description, "Arquivo de episódios registados.");

  const visibilityText =
    isCampaignVisible(campaign)
      ? "VISÍVEL"
      : "OCULTO";

  els.archiveMeta.innerHTML = `
    REGISTOS: <strong>${episodes.length}</strong><br>
    ARQUIVO: <strong>${visibilityText}</strong>
  `;

  els.episodeGrid.innerHTML = "";

  if (!episodes.length) {
    els.episodeGrid.innerHTML = `
      <article class="empty-card">
        <span>ARQUIVO SEM REGISTOS</span>
        <p>O administrador ainda não publicou episódios neste dossier.</p>
      </article>
    `;
    return;
  }

  for (const episode of episodes) {
    els.episodeGrid.appendChild(buildEpisodeCard(episode, campaign));
  }
}



function playerById(id) {
  return state.players.find(player => player.id === id) || null;
}

function characterById(id) {
  return state.characters.find(character => character.id === id) || null;
}

function normalizedParticipants(episode) {
  return Array.isArray(episode?.participants)
    ? episode.participants
        .map(item => ({
          playerId: String(item?.playerId || ""),
          characterId: String(item?.characterId || "")
        }))
        .filter(item => item.playerId)
    : [];
}

function episodeHasPlayer(episode, playerId) {
  return normalizedParticipants(episode).some(item => item.playerId === playerId);
}

function episodeHasCharacter(episode, characterId) {
  return normalizedParticipants(episode).some(item => item.characterId === characterId);
}

function publicEpisodesForPeople() {
  const allowed = new Set(visibleCampaignsForCurrentUser().map(campaign => campaign.id));
  return state.episodes.filter(episode => allowed.has(episode.campaignId));
}

function playerEpisodes(playerId) {
  return publicEpisodesForPeople().filter(episode => episodeHasPlayer(episode, playerId));
}

function characterEpisodes(characterId) {
  return publicEpisodesForPeople().filter(episode => episodeHasCharacter(episode, characterId));
}

function parseDurationMinutes(value) {
  const text = String(value || "").toLowerCase().trim();
  if (!text) return 0;
  let total = 0;
  const hours = text.match(/(\d+(?:[.,]\d+)?)\s*h/);
  const minutes = text.match(/(\d+)\s*m/);
  if (hours) total += Math.round(Number(hours[1].replace(',', '.')) * 60);
  if (minutes) total += Number(minutes[1]);
  if (!hours && !minutes && /^\d+$/.test(text)) total = Number(text);
  return Number.isFinite(total) ? total : 0;
}

function formatMinutes(total) {
  const minutes = Math.max(0, Math.round(Number(total) || 0));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

function playerInitial(player) {
  return safeText(player?.name, "?").charAt(0).toUpperCase();
}

function playerAvatarHtml(player, className = "") {
  const url = safeHttpUrl(player?.avatarUrl);
  if (url) return `<img class="${className}" src="${url}" alt="${safeText(player?.name, "Player")}">`;
  return `<span class="${className} player-avatar-fallback">${playerInitial(player)}</span>`;
}

function openEpisodeFromPeople(episode) {
  if (!episode) return;
  state.selectedCampaignId = episode.campaignId;
  switchView("archive");
  renderAll();
  setTimeout(() => {
    const card = document.querySelector(`[data-episode-id="${episode.id}"]`);
    if (card) card.scrollIntoView({behavior:"smooth", block:"center"});
  }, 90);
}

function renderPlayersDirectory() {
  els.playersGrid.innerHTML = "";
  const players = [...state.players].sort((a,b) => (a.name || "").localeCompare(b.name || "", "pt"));
  els.playersDirectoryMeta.textContent = `${players.length} PLAYER${players.length === 1 ? "" : "S"}`;

  if (!players.length) {
    els.playersGrid.innerHTML = `<div class="players-empty">Ainda não existem perfis de players.</div>`;
    return;
  }

  for (const player of players) {
    const episodes = playerEpisodes(player.id);
    const campaignIds = new Set(episodes.map(ep => ep.campaignId));
    const chars = state.characters.filter(char => char.playerId === player.id && (!char.campaignId || campaignIds.has(char.campaignId) || isAdmin()));
    const card = document.createElement("button");
    card.type = "button";
    card.className = "player-card";
    const banner = safeHttpUrl(player.bannerUrl);
    if (banner) card.style.setProperty("--player-banner", `url("${banner.replace(/\"/g, '%22')}")`);
    card.innerHTML = `
      <div class="player-card-banner"></div>
      <div class="player-card-body">
        <div class="player-card-avatar">${playerAvatarHtml(player)}</div>
        <div class="player-card-copy">
          <span>PLAYER DOSSIER</span>
          <strong></strong>
          <small>${episodes.length} EP • ${campaignIds.size} RPG${campaignIds.size === 1 ? "" : "S"} • ${chars.length} PERSONAGEN${chars.length === 1 ? "" : "S"}</small>
        </div>
      </div>`;
    card.querySelector("strong").textContent = safeText(player.name, "Player");
    card.addEventListener("click", () => openPlayerProfile(player.id));
    els.playersGrid.appendChild(card);
  }
}

function openPlayerProfile(playerId) {
  state.selectedPlayerId = playerId;
  renderPlayerProfile();
  els.playersDirectoryPanel.classList.add("hidden");
  els.playerProfilePanel.classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
}

function closePlayerProfile() {
  state.selectedPlayerId = null;
  els.playerProfilePanel.classList.add("hidden");
  els.playersDirectoryPanel.classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderPlayerProfile() {
  const player = playerById(state.selectedPlayerId);
  if (!player) {
    closePlayerProfile();
    return;
  }

  const episodes = playerEpisodes(player.id);
  const allowedCampaigns = new Map(visibleCampaignsForCurrentUser().map(c => [c.id, c]));
  const campaignIds = [...new Set(episodes.map(ep => ep.campaignId))];
  const chars = state.characters
    .filter(char => char.playerId === player.id && (!char.campaignId || allowedCampaigns.has(char.campaignId)))
    .sort((a,b) => (a.name || "").localeCompare(b.name || "", "pt"));
  const totalMinutes = episodes.reduce((sum, ep) => sum + parseDurationMinutes(ep.duration), 0);

  const cover = els.playerProfileHero.querySelector(".player-profile-cover");
  const banner = safeHttpUrl(player.bannerUrl);
  cover.style.backgroundImage = banner
    ? `linear-gradient(90deg, rgba(13,12,10,.18), rgba(13,12,10,.72)), url("${banner.replace(/\"/g, '%22')}")`
    : "linear-gradient(135deg,#2a2117,#12100d 55%,#201510)";

  els.playerProfileAvatar.innerHTML = playerAvatarHtml(player);
  els.playerProfileName.textContent = safeText(player.name, "Player");
  els.playerProfileCode.textContent = `PLAYER DOSSIER // ${String(player.id || "").slice(0,6).toUpperCase()}`;
  els.playerProfileBio.textContent = safeText(player.bio, "Sem biografia registada.");

  els.playerProfileStats.innerHTML = `
    <div><span>ARQUIVOS</span><strong>${campaignIds.length}</strong></div>
    <div><span>EPISÓDIOS</span><strong>${episodes.length}</strong></div>
    <div><span>PERSONAGENS</span><strong>${chars.length}</strong></div>
    <div><span>TEMPO EM EPISÓDIOS</span><strong>${formatMinutes(totalMinutes)}</strong></div>`;

  els.playerCharactersGrid.innerHTML = "";
  if (!chars.length) {
    els.playerCharactersGrid.innerHTML = `<div class="people-empty-inline">Nenhuma personagem associada.</div>`;
  } else {
    for (const character of chars) {
      const campaign = state.campaigns.find(c => c.id === character.campaignId);
      const epCount = characterEpisodes(character.id).length;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "player-character-card";
      const image = safeHttpUrl(character.imageUrl);
      btn.innerHTML = `
        <div class="player-character-image">${image ? `<img src="${image}" alt="">` : `<span>${safeText(character.name,"?").charAt(0)}</span>`}</div>
        <div><strong></strong><span>${safeText(campaign?.title, "Sem arquivo")}</span><small>${epCount} EP${epCount === 1 ? "" : "S"}</small></div>`;
      btn.querySelector("strong").textContent = safeText(character.name);
      btn.addEventListener("click", () => openCharacterModal(character.id));
      els.playerCharactersGrid.appendChild(btn);
    }
  }

  els.playerCampaignsList.innerHTML = "";
  if (!campaignIds.length) {
    els.playerCampaignsList.innerHTML = `<div class="people-empty-inline">Ainda não participou em nenhum arquivo publicado.</div>`;
  } else {
    const rows = campaignIds
      .map(id => ({campaign: allowedCampaigns.get(id), count: episodes.filter(ep => ep.campaignId === id).length}))
      .filter(item => item.campaign)
      .sort((a,b) => b.count - a.count);
    for (const item of rows) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "player-campaign-row";
      row.innerHTML = `<span>${safeText(item.campaign.code)}</span><strong></strong><small>${item.count} EP${item.count === 1 ? "" : "S"}</small>`;
      row.querySelector("strong").textContent = safeText(item.campaign.title);
      row.addEventListener("click", () => {
        state.selectedCampaignId = item.campaign.id;
        switchView("archive");
        renderAll();
      });
      els.playerCampaignsList.appendChild(row);
    }
  }

  els.playerEpisodesList.innerHTML = "";
  const sortedEpisodes = [...episodes].sort((a,b) => {
    const ad = String(a.date || ""); const bd = String(b.date || "");
    if (ad !== bd) return bd.localeCompare(ad);
    if (a.campaignId !== b.campaignId) return String(a.campaignId).localeCompare(String(b.campaignId));
    return Number(b.number || 0) - Number(a.number || 0);
  });
  if (!sortedEpisodes.length) {
    els.playerEpisodesList.innerHTML = `<div class="people-empty-inline">Nenhuma participação registada.</div>`;
  } else {
    for (const episode of sortedEpisodes) {
      const campaign = allowedCampaigns.get(episode.campaignId);
      const participant = normalizedParticipants(episode).find(p => p.playerId === player.id);
      const character = characterById(participant?.characterId);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "player-episode-row";
      row.innerHTML = `
        <span class="player-episode-code">${safeText(campaign?.code,"ARQ")}-${String(episode.number || 0).padStart(3,"0")}</span>
        <span class="player-episode-main"><strong></strong><small>${character ? `COMO ${safeText(character.name).toUpperCase()}` : "PERSONAGEM NÃO REGISTADA"}</small></span>
        <span class="player-episode-date">${formatDate(episode.date)}</span>`;
      row.querySelector("strong").textContent = safeText(episode.title, `Episódio ${episode.number || "?"}`);
      row.addEventListener("click", () => openEpisodeFromPeople(episode));
      els.playerEpisodesList.appendChild(row);
    }
  }
}

function renderPlayersView() {
  renderPlayersDirectory();
  if (state.selectedPlayerId && playerById(state.selectedPlayerId)) {
    els.playersDirectoryPanel.classList.add("hidden");
    els.playerProfilePanel.classList.remove("hidden");
    renderPlayerProfile();
  } else {
    els.playersDirectoryPanel.classList.remove("hidden");
    els.playerProfilePanel.classList.add("hidden");
  }
}

function openCharacterModal(characterId) {
  const character = characterById(characterId);
  if (!character) return;

  const player = playerById(character.playerId);
  const campaign = state.campaigns.find(c => c.id === character.campaignId);
  const episodes = characterEpisodes(character.id)
    .sort((a,b) => Number(a.number || 0) - Number(b.number || 0));

  const image = safeHttpUrl(character.imageUrl);

  els.characterModalPortrait.innerHTML = image
    ? `<img src="${image}" alt="${safeText(character.name)}">`
    : `<span>${safeText(character.name, "?").charAt(0)}</span>`;

  els.characterModalCode.textContent =
    `${safeText(campaign?.title, "SEM ARQUIVO").toUpperCase()} // ${safeText(campaign?.code, "ARQ")}`;

  els.characterModalName.textContent = safeText(character.name);
  els.characterModalDescription.textContent =
    safeText(character.description, "Sem descrição registada.");

  const firstEpisode = episodes[0];

  els.characterModalMeta.innerHTML = `
    <div>
      <span>PLAYER</span>
      <strong>${safeText(player?.name, "—")}</strong>
    </div>
    <div>
      <span>ARQUIVO</span>
      <strong>${safeText(campaign?.title, "—")}</strong>
    </div>
    <div>
      <span>PRIMEIRA APARIÇÃO</span>
      <strong>${firstEpisode
        ? `EP${String(firstEpisode.number || 0).padStart(2, "0")}`
        : "—"}</strong>
    </div>`;

  els.characterModalEpisodes.innerHTML = episodes.length
    ? `<span>EPISÓDIOS // ${episodes.length} APARIÇÕES</span>`
    : `<div class="people-empty-inline">Ainda sem aparições registadas.</div>`;

  for (const episode of episodes) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `
      <small>EP${String(episode.number || 0).padStart(2, "0")}</small>
      <strong>${safeText(episode.title, `Episódio ${episode.number || "?"}`)}</strong>`;
    btn.addEventListener("click", () => {
      closeModal(els.characterModal);
      openEpisodeFromPeople(episode);
    });
    els.characterModalEpisodes.appendChild(btn);
  }

  openModal(els.characterModal);
}

function currentParticipantsFromEditor(container) {
  if (!container) return [];
  return [...container.querySelectorAll(".participant-editor-row")]
    .filter(row => row.querySelector("input[type=checkbox]")?.checked)
    .map(row => ({
      playerId: row.dataset.playerId,
      characterId: row.querySelector("select")?.value || ""
    }));
}

function renderParticipantEditor(container, campaignId, participants = []) {
  if (!container) return;
  const selectedMap = new Map((participants || []).map(item => [String(item.playerId), String(item.characterId || "")]));
  container.innerHTML = "";
  const players = [...state.players].sort((a,b) => (a.name||"").localeCompare(b.name||"", "pt"));
  if (!players.length) {
    container.innerHTML = `<div class="participant-editor-empty">Cria primeiro os perfis dos players na aba PLAYERS / PERSONAGENS.</div>`;
    return;
  }
  for (const player of players) {
    const row = document.createElement("div");
    row.className = "participant-editor-row";
    row.dataset.playerId = player.id;
    const checked = selectedMap.has(player.id);
    const chars = state.characters.filter(char => char.playerId === player.id && (!campaignId || char.campaignId === campaignId));
    row.innerHTML = `
      <label class="participant-player-check">
        <input type="checkbox" ${checked ? "checked" : ""} />
        <span class="participant-mini-avatar">${playerAvatarHtml(player)}</span>
        <strong></strong>
      </label>
      <select ${checked ? "" : "disabled"}>
        <option value="">SEM PERSONAGEM / NÃO DEFINIDA</option>
      </select>`;
    row.querySelector("strong").textContent = safeText(player.name);
    const select = row.querySelector("select");
    for (const character of chars) {
      const option = document.createElement("option");
      option.value = character.id;
      option.textContent = character.name;
      select.appendChild(option);
    }
    if (selectedMap.get(player.id) && chars.some(char => char.id === selectedMap.get(player.id))) {
      select.value = selectedMap.get(player.id);
    }
    row.querySelector("input").addEventListener("change", event => {
      select.disabled = !event.target.checked;
    });
    container.appendChild(row);
  }
}

function refreshCreateParticipantEditor() {
  const current = currentParticipantsFromEditor(els.episodeParticipantsEditor);
  renderParticipantEditor(els.episodeParticipantsEditor, els.episodeCampaign.value, current);
}

function renderPeopleAdminOptions() {
  if (!els.characterPlayerSelect || !els.characterCampaignSelect) return;
  const currentPlayer = els.characterPlayerSelect.value;
  const currentCampaign = els.characterCampaignSelect.value;
  els.characterPlayerSelect.innerHTML = "";
  for (const player of [...state.players].sort((a,b)=>(a.name||"").localeCompare(b.name||"","pt"))) {
    const option = document.createElement("option"); option.value = player.id; option.textContent = player.name; els.characterPlayerSelect.appendChild(option);
  }
  if (currentPlayer && state.players.some(p => p.id === currentPlayer)) els.characterPlayerSelect.value = currentPlayer;
  els.characterCampaignSelect.innerHTML = "";
  for (const campaign of state.campaigns) {
    const option = document.createElement("option"); option.value = campaign.id; option.textContent = `${safeText(campaign.code)} — ${safeText(campaign.title)}`; els.characterCampaignSelect.appendChild(option);
  }
  if (currentCampaign && state.campaigns.some(c => c.id === currentCampaign)) els.characterCampaignSelect.value = currentCampaign;
  els.characterSaveBtn.disabled = !state.players.length || !state.campaigns.length;
}

function resetPlayerForm() {
  els.playerForm.reset(); els.playerEditId.value = ""; els.playerFormTitle.textContent = "Novo Player"; els.playerSaveBtn.textContent = "CRIAR PLAYER"; els.playerCancelEditBtn.classList.add("hidden"); els.playerFormMessage.textContent = "";
}

function resetCharacterForm() {
  els.characterForm.reset(); els.characterEditId.value = ""; els.characterFormTitle.textContent = "Nova Personagem"; els.characterSaveBtn.textContent = "CRIAR PERSONAGEM"; els.characterCancelEditBtn.classList.add("hidden"); els.characterFormMessage.textContent = ""; renderPeopleAdminOptions();
}

function editPlayer(player) {
  els.playerEditId.value = player.id; els.playerNameInput.value = player.name || ""; els.playerAvatarInput.value = player.avatarUrl || ""; els.playerBannerInput.value = player.bannerUrl || ""; els.playerBioInput.value = player.bio || ""; els.playerFormTitle.textContent = "Editar Player"; els.playerSaveBtn.textContent = "GUARDAR PLAYER"; els.playerCancelEditBtn.classList.remove("hidden");
}

function editCharacter(character) {
  renderPeopleAdminOptions(); els.characterEditId.value = character.id; els.characterNameInput.value = character.name || ""; els.characterPlayerSelect.value = character.playerId || ""; els.characterCampaignSelect.value = character.campaignId || ""; els.characterImageInput.value = character.imageUrl || ""; els.characterDescriptionInput.value = character.description || ""; els.characterFormTitle.textContent = "Editar Personagem"; els.characterSaveBtn.textContent = "GUARDAR PERSONAGEM"; els.characterCancelEditBtn.classList.remove("hidden");
}

function renderPeopleManagement() {
  if (!isAdmin()) return;
  renderPeopleAdminOptions();
  els.playerManageList.innerHTML = "";
  for (const player of [...state.players].sort((a,b)=>(a.name||"").localeCompare(b.name||"","pt"))) {
    const row = document.createElement("div"); row.className = "people-manage-row";
    row.innerHTML = `<div class="people-manage-avatar">${playerAvatarHtml(player)}</div><div class="people-manage-copy"><strong></strong><small>${playerEpisodes(player.id).length} EP • ${state.characters.filter(c=>c.playerId===player.id).length} PERSONAGENS</small></div><div class="people-manage-actions"><button type="button" class="edit">EDITAR</button><button type="button" class="delete">ELIMINAR</button></div>`;
    row.querySelector("strong").textContent = player.name; row.querySelector(".edit").addEventListener("click",()=>editPlayer(player)); row.querySelector(".delete").addEventListener("click",()=>deletePlayer(player)); els.playerManageList.appendChild(row);
  }
  if (!state.players.length) els.playerManageList.innerHTML = `<div class="people-empty-inline">Nenhum player criado.</div>`;

  els.characterManageList.innerHTML = "";
  for (const character of [...state.characters].sort((a,b)=>(a.name||"").localeCompare(b.name||"","pt"))) {
    const player = playerById(character.playerId); const campaign = state.campaigns.find(c=>c.id===character.campaignId); const image = safeHttpUrl(character.imageUrl);
    const row = document.createElement("div"); row.className = "people-manage-row";
    row.innerHTML = `<div class="people-manage-avatar character">${image?`<img src="${image}" alt="">`:`<span>${safeText(character.name,"?").charAt(0)}</span>`}</div><div class="people-manage-copy"><strong></strong><small>${safeText(player?.name,"SEM PLAYER")} • ${safeText(campaign?.code,"SEM RPG")}</small></div><div class="people-manage-actions"><button type="button" class="edit">EDITAR</button><button type="button" class="delete">ELIMINAR</button></div>`;
    row.querySelector("strong").textContent = character.name; row.querySelector(".edit").addEventListener("click",()=>editCharacter(character)); row.querySelector(".delete").addEventListener("click",()=>deleteCharacter(character)); els.characterManageList.appendChild(row);
  }
  if (!state.characters.length) els.characterManageList.innerHTML = `<div class="people-empty-inline">Nenhuma personagem criada.</div>`;
}

async function deleteCharacter(character) {
  if (!isAdmin() || !confirm(`Eliminar a personagem "${character.name}"?\n\nAs participações dos players serão mantidas, mas deixam de indicar esta personagem.`)) return;
  try {
    const affected = state.episodes.filter(ep => episodeHasCharacter(ep, character.id));
    for (const episode of affected) {
      const participants = normalizedParticipants(episode).map(item => item.characterId === character.id ? {...item, characterId:""} : item);
      await updateDoc(doc(db,"episodes",episode.id), {participants, updatedAt:serverTimestamp(), updatedBy:state.user.uid});
    }
    await commitDeletes([doc(db,"characters",character.id)]);
    showToast("PERSONAGEM ELIMINADA.");
  } catch(error) { console.error(error); showToast("ERRO // Não foi possível eliminar a personagem."); }
}

async function deletePlayer(player) {
  if (!isAdmin()) return;
  const eps = state.episodes.filter(ep => episodeHasPlayer(ep, player.id));
  const chars = state.characters.filter(char => char.playerId === player.id);
  if (!confirm(`Eliminar o player "${player.name}"?\n\nIsto remove ${chars.length} personagem(ns) associada(s) e a participação em ${eps.length} episódio(s).`)) return;
  try {
    for (const episode of eps) {
      const participants = normalizedParticipants(episode).filter(item => item.playerId !== player.id);
      await updateDoc(doc(db,"episodes",episode.id), {participants, updatedAt:serverTimestamp(), updatedBy:state.user.uid});
    }
    await commitDeletes([...chars.map(char=>doc(db,"characters",char.id)), doc(db,"players",player.id)]);
    if (state.selectedPlayerId === player.id) state.selectedPlayerId = null;
    showToast("PLAYER ELIMINADO.");
  } catch(error) { console.error(error); showToast("ERRO // Não foi possível eliminar o player."); }
}

function renderEpisodeParticipants(node, episode) {
  const wrap = node.querySelector(".episode-participants");
  const list = node.querySelector(".episode-participants-list");
  const participants = normalizedParticipants(episode).filter(item => playerById(item.playerId));
  if (!wrap || !list || !participants.length) return;
  wrap.classList.remove("hidden"); list.innerHTML = "";
  for (const item of participants) {
    const player = playerById(item.playerId); const character = characterById(item.characterId);
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "episode-participant-chip";
    btn.innerHTML = `<span class="episode-participant-avatar">${playerAvatarHtml(player)}</span><span><strong></strong><small></small></span>`;
    btn.querySelector("strong").textContent = safeText(player.name); btn.querySelector("small").textContent = character ? safeText(character.name) : "Player";
    btn.addEventListener("click", () => { switchView("players"); openPlayerProfile(player.id); });
    list.appendChild(btn);
  }
}

function reviewShareUrl(ratingId) {
  const url = new URL(location.href);
  url.hash = "";
  url.search = "";
  url.searchParams.set("share", ratingId);
  return url.href;
}

function shareContextForRating(rating) {
  if (!rating) return null;

  const episode = state.episodes.find(item => item.id === rating.episodeId);
  if (!episode) return null;

  const campaign = state.campaigns.find(item => item.id === episode.campaignId);
  if (!campaign || (!isCampaignVisible(campaign) && !isAdmin())) return null;

  return { rating, episode, campaign };
}

function wrapCanvasText(ctx, text, maxWidth) {
  const clean = String(text || "").trim();
  if (!clean) return [];

  const words = clean.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width <= maxWidth || !current) {
      current = attempt;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function drawTrackedText(ctx, text, x, y, spacing = 4) {
  let cursor = x;
  for (const char of String(text || "")) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
}

async function createStoryCard(context) {
  const { rating, episode, campaign } = context;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#171410");
  bg.addColorStop(.5, "#0f0e0c");
  bg.addColorStop(1, "#090807");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grain / dossier lines
  ctx.globalAlpha = .13;
  ctx.strokeStyle = "#c6ab70";
  ctx.lineWidth = 1;
  for (let y = 110; y < 1810; y += 48) {
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(1010, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // red evidence stripe
  ctx.fillStyle = "#8f2d29";
  ctx.fillRect(0, 0, 18, canvas.height);

  ctx.strokeStyle = "#534838";
  ctx.lineWidth = 3;
  ctx.strokeRect(62, 62, 956, 1796);

  // header
  ctx.fillStyle = "#d7c299";
  ctx.font = "700 28px ui-monospace, Consolas, monospace";
  drawTrackedText(ctx, "FEATHER ARCHIVE", 100, 150, 5);

  ctx.fillStyle = "#756958";
  ctx.font = "700 18px ui-monospace, Consolas, monospace";
  drawTrackedText(ctx, "RELATÓRIO DE INVESTIGADOR // STORY", 100, 198, 3);

  ctx.strokeStyle = "#564b3a";
  ctx.beginPath();
  ctx.moveTo(100, 240);
  ctx.lineTo(980, 240);
  ctx.stroke();

  // campaign / episode
  ctx.fillStyle = "#a23a32";
  ctx.font = "800 22px ui-monospace, Consolas, monospace";
  drawTrackedText(ctx, safeText(campaign.code, "ARQ"), 100, 335, 5);

  ctx.fillStyle = "#f0e4cf";
  ctx.font = "500 68px Georgia, serif";
  const campaignLines = wrapCanvasText(ctx, safeText(campaign.title), 820).slice(0, 2);
  let y = 420;
  for (const line of campaignLines) {
    ctx.fillText(line, 100, y);
    y += 78;
  }

  ctx.fillStyle = "#8f8575";
  ctx.font = "700 21px ui-monospace, Consolas, monospace";
  const epCode = `${safeText(campaign.code, "ARQ")}-${String(episode.number || 0).padStart(3, "0")}`;
  drawTrackedText(ctx, epCode, 100, y + 26, 3);

  ctx.fillStyle = "#d6c7ad";
  ctx.font = "500 38px Georgia, serif";
  const titleLines = wrapCanvasText(ctx, safeText(episode.title, "Sem título"), 820).slice(0, 2);
  y += 88;
  for (const line of titleLines) {
    ctx.fillText(line, 100, y);
    y += 48;
  }

  // score block
  const scoreTop = 710;
  ctx.fillStyle = rating.score === 6 ? "#c99a45" : "#b5483e";
  ctx.fillRect(100, scoreTop, 880, 235);

  ctx.fillStyle = "#140f0b";
  ctx.font = "800 24px ui-monospace, Consolas, monospace";
  drawTrackedText(ctx, "CLASSIFICAÇÃO", 145, scoreTop + 60, 4);

  ctx.font = "700 92px Georgia, serif";
  ctx.fillText(rating.score === 6 ? "✦ LENDÁRIA" : `${"★".repeat(rating.score || 0)}`, 145, scoreTop + 160);

  if (rating.score !== 6) {
    ctx.font = "800 25px ui-monospace, Consolas, monospace";
    ctx.fillText(`${rating.score}/6`, 820, scoreTop + 158);
  }

  // review quote
  ctx.fillStyle = "#8f8575";
  ctx.font = "700 20px ui-monospace, Consolas, monospace";
  drawTrackedText(ctx, "OPINIÃO REGISTADA", 100, 1055, 4);

  const reason = String(rating.reason || "").trim() || "Classificação registada sem comentário escrito.";
  ctx.fillStyle = "#eee3d1";
  ctx.font = "500 42px Georgia, serif";
  const reviewLines = wrapCanvasText(ctx, `“${reason}”`, 820).slice(0, 10);
  y = 1135;
  for (const line of reviewLines) {
    ctx.fillText(line, 100, y);
    y += 58;
  }

  // reviewer footer
  const footerY = 1690;
  ctx.strokeStyle = "#564b3a";
  ctx.beginPath();
  ctx.moveTo(100, footerY - 55);
  ctx.lineTo(980, footerY - 55);
  ctx.stroke();

  ctx.fillStyle = "#b74b42";
  ctx.font = "800 20px ui-monospace, Consolas, monospace";
  drawTrackedText(ctx, "RELATÓRIO POR", 100, footerY, 4);

  ctx.fillStyle = "#f0e4cf";
  ctx.font = "500 48px Georgia, serif";
  ctx.fillText(safeText(rating.displayName, "Investigador"), 100, footerY + 70);

  ctx.fillStyle = "#746959";
  ctx.font = "700 17px ui-monospace, Consolas, monospace";
  drawTrackedText(ctx, "FEATHER STUDIOS // FEATHER ARCHIVE", 100, 1810, 3);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Não foi possível gerar a imagem."));
    }, "image/png", 0.96);
  });
}

async function prepareShareReview(context, { fromQr = false } = {}) {
  if (!context) return;

  state.activeShareContext = context;
  state.activeShareBlob = null;

  const { rating, episode, campaign } = context;
  const shareUrl = reviewShareUrl(rating.id);

  els.shareReviewCode.textContent =
    `${safeText(campaign.code, "ARQ")}-${String(episode.number || 0).padStart(3, "0")} // ${safeText(rating.displayName, "INVESTIGADOR")}`;

  els.shareReviewIntro.textContent = fromQr
    ? "O teu Story Card está pronto. Partilha-o através do menu do telemóvel e escolhe Instagram Stories."
    : "Digitaliza o código com o telemóvel para preparar esta review para os Stories.";

  els.shareReviewStatus.textContent = "A preparar Story Card...";
  els.shareQrCode.innerHTML = "";

  if (window.QRCode) {
    new window.QRCode(els.shareQrCode, {
      text: shareUrl,
      width: 210,
      height: 210,
      colorDark: "#15120e",
      colorLight: "#f1e7d4",
      correctLevel: window.QRCode.CorrectLevel.M
    });
  } else {
    els.shareQrCode.textContent = "QR indisponível";
  }

  const canvas = await createStoryCard(context);
  els.shareStoryPreview.src = canvas.toDataURL("image/png");
  state.activeShareBlob = await canvasToBlob(canvas);
  els.shareReviewStatus.textContent = "Story Card pronto // 1080 × 1920";

  openModal(els.shareReviewModal);

  if (fromQr) {
    document.body.classList.add("share-opened-from-qr");
  }
}

async function openShareReview(ratingId, options = {}) {
  const rating = state.ratings.find(item => item.id === ratingId);
  const context = shareContextForRating(rating);

  if (!context) {
    if (options.fromQr) showToast("REVIEW NÃO ENCONTRADA OU INDISPONÍVEL.");
    return false;
  }

  await prepareShareReview(context, options);
  return true;
}

async function nativeShareReview() {
  const context = state.activeShareContext;
  const blob = state.activeShareBlob;
  if (!context || !blob) return;

  const fileName = `feather-review-${safeText(context.campaign.code, "arquivo").toLowerCase()}-ep${String(context.episode.number || 0).padStart(2, "0")}.png`;
  const file = new File([blob], fileName, { type: "image/png" });
  const shareData = {
    title: "Feather Archive — Review",
    text: `${safeText(context.campaign.title)} — EP${String(context.episode.number || 0).padStart(2, "0")}`,
    files: [file]
  };

  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share(shareData);
      els.shareReviewStatus.textContent = "Partilha aberta. Escolhe Instagram / Stories no teu telemóvel.";
    } else {
      downloadShareReview();
      els.shareReviewStatus.textContent = "O navegador não suporta partilha direta. Guardámos o Story Card para poderes publicar no Instagram.";
    }
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error("[FEATHER] Falha ao partilhar review:", error);
      els.shareReviewStatus.textContent = "Não foi possível abrir a partilha. Podes guardar o Story Card manualmente.";
    }
  }
}

function downloadShareReview() {
  const context = state.activeShareContext;
  const blob = state.activeShareBlob;
  if (!context || !blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feather-review-${safeText(context.campaign.code, "arquivo").toLowerCase()}-ep${String(context.episode.number || 0).padStart(2, "0")}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function maybeOpenSharedReview() {
  if (state.shareHandled || !state.shareRatingId) return;
  if (!state.ratings.length || !state.episodes.length || !state.campaigns.length) return;

  const opened = await openShareReview(state.shareRatingId, { fromQr: true });
  state.shareHandled = true;

  if (!opened) {
    const url = new URL(location.href);
    url.searchParams.delete("share");
    history.replaceState({}, "", url.href);
  }
}

function buildEpisodeCard(episode, campaign) {
  const node = els.template.content.cloneNode(true);
  const card = node.querySelector(".episode-card");
  const img = node.querySelector(".episode-image");

  card.dataset.episodeId = episode.id;

  const code =
    `${safeText(campaign.code, "ARQ")}-` +
    `${String(episode.number || 0).padStart(3, "0")}`;

  const fallbackImage =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="500">
        <rect width="100%" height="100%" fill="#191713"/>
        <text x="50%" y="50%" fill="#6f6658" font-family="monospace"
          font-size="30" text-anchor="middle">${code}</text>
      </svg>
    `);

  img.src = episode.imageUrl || fallbackImage;
  img.alt = `Imagem do episódio ${episode.number || ""}`;

  img.onerror = () => {
    img.onerror = null;
    img.src = fallbackImage;
  };

  node.querySelector(".episode-status").textContent =
    safeText(episode.status, "ARQUIVADO");

  const newBadge = node.querySelector(".episode-new-badge");
  if (isNewEpisode(episode)) {
    newBadge.classList.remove("hidden");
  }

  node.querySelector(".episode-file-number").textContent = code;

  node.querySelector(".episode-kicker").textContent =
    `REGISTO Nº ${String(episode.number || 0).padStart(2, "0")}`;

  node.querySelector(".episode-title").textContent =
    safeText(episode.title, `Episódio ${episode.number || "?"}`);

  node.querySelector(".episode-synopsis").textContent =
    safeText(episode.synopsis, "Sem resumo registado.");

  const youtubeLink = safeHttpUrl(episode.youtubeUrl);
  const youtubeButton = node.querySelector(".episode-youtube");

  if (youtubeLink) {
    youtubeButton.href = youtubeLink;
    youtubeButton.classList.remove("hidden");
  }

  node.querySelector(".episode-date").textContent =
    formatDate(episode.date);

  node.querySelector(".episode-duration").textContent =
    safeText(episode.duration);

  renderEpisodeParticipants(node, episode);

  const stats = ratingStats(episode.id);

  node.querySelector(".episode-votes").textContent =
    String(stats.ratings.length);

  node.querySelector(".dominant-rating").textContent =
    dominantLabel(stats.winners);

  node.querySelector(".rating-caption").textContent =
    stats.ratings.length
      ? `${stats.max} voto${stats.max === 1 ? "" : "s"} na classificação dominante`
      : "Ainda não existem avaliações.";

  const distribution = node.querySelector(".distribution");
  const maxCount = Math.max(1, ...Object.values(stats.counts));

  for (const score of [6,5,4,3,2,1]) {
    const row = document.createElement("div");
    row.className = "dist-row";

    const percentage =
      (stats.counts[score] / maxCount) * 100;

    row.innerHTML = `
      <span class="dist-label">
        ${score === 6 ? "✦ LENDÁRIA" : `${"★".repeat(score)} ${score}`}
      </span>
      <span class="dist-track">
        <span class="dist-fill" style="width:${percentage}%"></span>
      </span>
      <span class="dist-count">${stats.counts[score]}</span>
    `;

    distribution.appendChild(row);
  }

  const mine = myRatingObject(episode.id);
  const myScore = mine?.score ?? null;

  const hint = node.querySelector(".vote-hint");
  const reasonInput = node.querySelector(".rating-reason-input");
  const saveReasonBtn = node.querySelector(".save-reason-btn");
  const shareReviewBtn = node.querySelector(".share-review-btn");

  reasonInput.value = mine?.reason || "";

  if (!state.user) {
    hint.textContent = "Identificação necessária para avaliar.";
  } else if (!isApproved()) {
    hint.textContent =
      state.profile?.status === "rejected"
        ? "Acesso recusado pelo administrador."
        : "Pedido pendente de aprovação.";
  } else if (myScore) {
    hint.textContent =
      `Avaliação atual: ${myScore === 6 ? "LENDÁRIA" : `${myScore}/6`}`;
  } else {
    hint.textContent = "Seleciona uma classificação.";
  }

  const buttons = node.querySelector(".rating-buttons");

  for (let score = 1; score <= 6; score += 1) {
    const button = document.createElement("button");
    button.type = "button";

    button.className =
      `rating-btn ${score === 6 ? "legendary" : ""} ` +
      `${myScore === score ? "active" : ""}`;

    button.title =
      score === 6
        ? "Estrela Lendária (6)"
        : `${score} estrela${score === 1 ? "" : "s"}`;

    button.textContent = score === 6 ? "✦" : "★";
    button.disabled = !canRate();

    button.addEventListener("click", async () => {
      await submitRating(
        episode.id,
        score,
        reasonInput.value
      );
    });

    buttons.appendChild(button);
  }

  reasonInput.disabled = !canRate();
  saveReasonBtn.disabled = !canRate();

  if (mine?.score && shareReviewBtn) {
    shareReviewBtn.classList.remove("hidden");
    shareReviewBtn.addEventListener("click", async () => {
      await openShareReview(mine.id);
    });
  }

  saveReasonBtn.addEventListener("click", async () => {
    const current = myRatingObject(episode.id);

    if (!current?.score) {
      showToast("ESCOLHE PRIMEIRO UMA NOTA.");
      return;
    }

    await submitRating(
      episode.id,
      current.score,
      reasonInput.value
    );
  });

  if (!state.user) {
    card.querySelector(".your-report")?.addEventListener("click", event => {
      if (!event.target.closest("textarea")) {
        openModal(els.authModal);
      }
    });
  }

  const communityList =
    node.querySelector(".community-reviews-list");

  const reviewsWithReason =
    stats.ratings
      .filter(rating => String(rating.reason || "").trim())
      .sort((a,b) => {
        const aTime = a.updatedAt?.seconds || 0;
        const bTime = b.updatedAt?.seconds || 0;
        return bTime - aTime;
      });

  if (!reviewsWithReason.length) {
    communityList.innerHTML = `
      <div class="no-review-reasons">
        Ainda ninguém escreveu o motivo da sua nota.
      </div>
    `;
  } else {
    for (const rating of reviewsWithReason) {
      const entry = document.createElement("article");
      entry.className = "review-entry";

      const name =
        rating.displayName ||
        "Investigador";

      entry.innerHTML = `
        <div class="review-entry-head">
          <strong></strong>
          <span class="review-score"></span>
        </div>
        <p></p>
      `;

      entry.querySelector("strong").textContent = name;
      entry.querySelector(".review-score").textContent =
        rating.score === 6
          ? "✦ LENDÁRIA"
          : `${"★".repeat(rating.score || 0)} ${rating.score || "?"}/6`;

      entry.querySelector("p").textContent =
        rating.reason || "";

      communityList.appendChild(entry);
    }
  }

  const adminActions =
    card.querySelector(".episode-admin-actions");

  if (isAdmin() && adminActions) {
    adminActions.classList.remove("hidden");

    adminActions.querySelector(".edit")?.addEventListener("click", () => {
      openEditEpisode(episode);
    });

    adminActions.querySelector(".delete")?.addEventListener("click", () => {
      deleteEpisode(episode);
    });
  }

  return node;
}

function openEditEpisode(episode) {
  if (!isAdmin()) return;

  renderAdminCampaignOptions();

  els.editEpisodeId.value = episode.id;
  els.editEpisodeCampaign.value = episode.campaignId || "";
  els.editEpisodeNumber.value = Number(episode.number || 1);
  els.editEpisodeDate.value = episode.date || "";
  els.editEpisodeName.value = episode.title || "";
  els.editEpisodeDuration.value = episode.duration || "";
  els.editEpisodeStatus.value = episode.status || "ARQUIVADO";
  els.editEpisodeSynopsis.value = episode.synopsis || "";
  els.editEpisodeImageUrl.value = episode.imageUrl || "";
  els.editEpisodeYoutubeUrl.value = episode.youtubeUrl || "";
  renderParticipantEditor(els.editEpisodeParticipantsEditor, episode.campaignId, normalizedParticipants(episode));
  els.editEpisodeMessage.textContent = "";

  openModal(els.editEpisodeModal);
}

async function commitDeletes(refs) {
  const chunkSize = 400;

  for (let i = 0; i < refs.length; i += chunkSize) {
    const batch = writeBatch(db);

    for (const ref of refs.slice(i, i + chunkSize)) {
      batch.delete(ref);
    }

    await batch.commit();
  }
}

async function deleteEpisode(episode) {
  if (!isAdmin()) return;

  const label =
    episode.title ||
    `Episódio ${episode.number || "?"}`;

  const confirmed = window.confirm(
    `Eliminar "${label}"?\n\nIsto também elimina as avaliações deste episódio e não pode ser desfeito.`
  );

  if (!confirmed) return;

  try {
    showToast("A ELIMINAR EPISÓDIO...");

    const refs = [
      ...ratingsForEpisode(episode.id)
        .map(rating => doc(db, "ratings", rating.id)),
      doc(db, "episodes", episode.id)
    ];

    await commitDeletes(refs);
    showToast("EPISÓDIO ELIMINADO.");
  } catch (error) {
    console.error("[FEATHER] Erro ao eliminar episódio:", error);
    showToast("ERRO // Não foi possível eliminar o episódio.");
  }
}

async function deleteCampaign(campaign) {
  if (!isAdmin()) return;

  const relatedEpisodes =
    state.episodes.filter(
      episode => episode.campaignId === campaign.id
    );

  const relatedEpisodeIds =
    new Set(
      relatedEpisodes.map(episode => episode.id)
    );

  const relatedRatings =
    state.ratings.filter(
      rating => relatedEpisodeIds.has(rating.episodeId)
    );

  const confirmed = window.confirm(
    `Eliminar o arquivo "${campaign.title}"?\n\n` +
    `Isto vai eliminar ${relatedEpisodes.length} episódio(s) e ` +
    `${relatedRatings.length} avaliação(ões).\n\n` +
    `Esta ação não pode ser desfeita.`
  );

  if (!confirmed) return;

  try {
    showToast("A ELIMINAR ARQUIVO...");

    const relatedCharacters = state.characters.filter(character => character.campaignId === campaign.id);

    const refs = [
      ...relatedRatings.map(rating => doc(db, "ratings", rating.id)),
      ...relatedEpisodes.map(episode => doc(db, "episodes", episode.id)),
      ...relatedCharacters.map(character => doc(db, "characters", character.id)),
      doc(db, "campaigns", campaign.id)
    ];

    await commitDeletes(refs);

    if (state.selectedCampaignId === campaign.id) {
      state.selectedCampaignId = null;
    }

    showToast("ARQUIVO ELIMINADO.");
  } catch (error) {
    console.error("[FEATHER] Erro ao eliminar arquivo:", error);
    showToast("ERRO // Não foi possível eliminar o arquivo.");
  }
}

async function toggleCampaignVisibility(campaign) {
  if (!isAdmin()) return;

  try {
    const nextVisible =
      !isCampaignVisible(campaign);

    await updateDoc(
      doc(db, "campaigns", campaign.id),
      {
        visible: nextVisible,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      }
    );

    showToast(
      nextVisible
        ? "ARQUIVO AGORA ESTÁ VISÍVEL."
        : "ARQUIVO OCULTADO DO SITE."
    );
  } catch (error) {
    console.error("[FEATHER] Erro ao alterar visibilidade:", error);
    showToast("ERRO // Não foi possível alterar a visibilidade.");
  }
}

function renderArchiveManagement() {
  if (!isAdmin()) return;

  els.archiveManageList.innerHTML = "";

  if (!state.campaigns.length) {
    els.archiveManageList.innerHTML =
      `<div class="empty-access">Nenhum arquivo criado.</div>`;
    return;
  }

  const sorted =
    [...state.campaigns].sort(
      (a,b) =>
        (a.title || "").localeCompare(
          b.title || "",
          "pt"
        )
    );

  for (const campaign of sorted) {
    const row =
      document.createElement("div");

    row.className =
      "archive-manage-row";

    row.innerHTML = `
      <div class="archive-manage-main">
        <strong></strong>
        <small></small>
      </div>

      <div class="archive-manage-actions">
        <button class="archive-manage-btn visibility" type="button"></button>
        <button class="archive-manage-btn delete" type="button">ELIMINAR</button>
      </div>
    `;

    row.querySelector("strong").textContent =
      `${safeText(campaign.code)} — ${safeText(campaign.title)}`;

    row.querySelector("small").textContent =
      isCampaignVisible(campaign)
        ? "ESTADO: VISÍVEL"
        : "ESTADO: OCULTO";

    const visibilityBtn =
      row.querySelector(".visibility");

    visibilityBtn.textContent =
      isCampaignVisible(campaign)
        ? "OCULTAR"
        : "TORNAR VISÍVEL";

    visibilityBtn.addEventListener("click", () => {
      toggleCampaignVisibility(campaign);
    });

    row.querySelector(".delete").addEventListener("click", () => {
      deleteCampaign(campaign);
    });

    els.archiveManageList.appendChild(row);
  }
}

function renderAccessList() {
  if (!isAdmin()) return;

  const pending =
    state.users.filter(
      user =>
        user.role !== "admin" &&
        (user.status || "pending") === "pending"
    );

  const list =
    state.showAllUsers
      ? state.users.filter(user => user.role !== "admin")
      : pending;

  els.pendingCount.textContent =
    String(pending.length);

  els.pendingCount.classList.toggle(
    "hidden",
    pending.length === 0
  );

  els.showAllUsersBtn.textContent =
    state.showAllUsers
      ? "VER PENDENTES"
      : "VER TODOS";

  els.accessList.innerHTML = "";

  if (!list.length) {
    els.accessList.innerHTML = `
      <div class="empty-access">
        ${
          state.showAllUsers
            ? "Nenhuma conta Reviewer criada."
            : "Nenhum pedido pendente. Tudo limpo. ✅"
        }
      </div>
    `;
    return;
  }

  const sorted =
    [...list].sort(
      (a,b) =>
        (a.displayName || "").localeCompare(
          b.displayName || "",
          "pt"
        )
    );

  for (const user of sorted) {
    const status =
      user.status || "pending";

    const row =
      document.createElement("div");

    row.className =
      "access-row";

    row.innerHTML = `
      <div class="access-identity">
        <strong></strong>
        <small></small>
        <span class="access-status ${status}">
          ${
            status === "approved"
              ? "APROVADO"
              : status === "rejected"
                ? "RECUSADO"
                : "PENDENTE"
          }
        </span>
      </div>

      <div class="access-actions"></div>
    `;

    row.querySelector("strong").textContent =
      safeText(user.displayName, "Sem nome");

    row.querySelector("small").textContent =
      safeText(user.email, `UID: ${user.id}`);

    const actions =
      row.querySelector(".access-actions");

    if (status !== "approved") {
      const approve =
        document.createElement("button");

      approve.type = "button";
      approve.className =
        "access-action approve";
      approve.textContent =
        "APROVAR";

      approve.addEventListener("click", () => {
        updateAccess(
          user.id,
          "approved"
        );
      });

      actions.appendChild(approve);
    }

    if (status !== "rejected") {
      const reject =
        document.createElement("button");

      reject.type = "button";
      reject.className =
        "access-action reject";
      reject.textContent =
        "RECUSAR";

      reject.addEventListener("click", () => {
        updateAccess(
          user.id,
          "rejected"
        );
      });

      actions.appendChild(reject);
    }

    els.accessList.appendChild(row);
  }
}

function renderAll() {
  const available =
    visibleCampaignsForCurrentUser();

  if (
    !state.selectedCampaignId &&
    available.length
  ) {
    state.selectedCampaignId =
      available[0].id;
  }

  renderSession();
  renderCampaignNav();
  renderAdminCampaignOptions();
  renderArchive();
  renderArchiveManagement();
  renderAccessList();
  renderPeopleManagement();
  renderLofiManagement();
  renderNewsManagement();
  renderLatestNews();
  renderNewsView();
  renderLofiView();
  renderRankings();
  renderPlayersView();

  if (state.currentView === "cinema") {
    renderCinema();
  }

  maybeOpenSharedReview();
}

function startProfileListener(user) {
  if (state.profileUnsubscribe) {
    state.profileUnsubscribe();
    state.profileUnsubscribe = null;
  }

  if (!user) {
    state.profile = null;
    startUsersListener();
    renderAll();
    return;
  }

  state.profileUnsubscribe =
    onSnapshot(
      doc(db, "users", user.uid),
      snapshot => {
        state.profile =
          snapshot.exists()
            ? snapshot.data()
            : null;

        console.log(
          "[FEATHER] PERFIL:",
          state.profile
        );

        startUsersListener();
        renderAll();
      },
      error => {
        console.error(
          "[FEATHER] Erro ao ler perfil:",
          error
        );

        state.profile = null;
        startUsersListener();
        renderAll();

        showToast(
          "ERRO AO LER PERFIL // Abre F12 → Console"
        );
      }
    );
}

function startUsersListener() {
  if (state.usersUnsubscribe) {
    state.usersUnsubscribe();
    state.usersUnsubscribe = null;
  }

  if (!isAdmin()) {
    state.users = [];
    return;
  }

  state.usersUnsubscribe =
    onSnapshot(
      collection(db, "users"),
      snapshot => {
        state.users =
          snapshot.docs.map(
            item => ({
              id: item.id,
              ...item.data()
            })
          );

        renderAccessList();
      },
      error => {
        console.error(
          "[FEATHER] Erro ao ler utilizadores:",
          error
        );

        showToast(
          "ERRO // Não foi possível ler os pedidos de acesso."
        );
      }
    );
}

async function updateAccess(userId, status) {
  if (!isAdmin()) return;

  try {
    await updateDoc(
      doc(db, "users", userId),
      {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: state.user.uid
      }
    );

    showToast(
      status === "approved"
        ? "ACESSO APROVADO // REVIEWER ATIVO"
        : "PEDIDO DE ACESSO RECUSADO"
    );
  } catch (error) {
    console.error(
      "[FEATHER] Erro ao atualizar acesso:",
      error
    );

    showToast(
      "ERRO // Não foi possível alterar o acesso."
    );
  }
}

async function submitRating(episodeId, score, reason = "") {
  if (!state.user) {
    openModal(els.authModal);
    return;
  }

  if (!canRate()) {
    showToast(
      state.profile?.status === "rejected"
        ? "ACESSO RECUSADO // Não podes avaliar."
        : "PEDIDO PENDENTE // Aguarda aprovação do administrador."
    );
    return;
  }

  const cleanReason =
    String(reason || "")
      .trim()
      .slice(0, 800);

  const displayName =
    state.profile?.displayName ||
    state.user.email ||
    "Investigador";

  try {
    const ratingId =
      `${episodeId}_${state.user.uid}`;

    await setDoc(
      doc(db, "ratings", ratingId),
      {
        episodeId,
        score,
        reason: cleanReason,
        displayName,
        updatedAt: serverTimestamp()
      }
    );

    showToast(
      cleanReason
        ? "AVALIAÇÃO E MOTIVO GUARDADOS."
        : score === 6
          ? "CLASSIFICAÇÃO LENDÁRIA GUARDADA ✦"
          : `AVALIAÇÃO ATUALIZADA // ${score}/6`
    );
  } catch (error) {
    console.error(
      "[FEATHER] Erro ao guardar avaliação:",
      error
    );

    showToast(
      "ERRO // Não foi possível guardar a avaliação."
    );
  }
}



els.ratingMapCampaignSelect.addEventListener("change", () => {
  state.selectedRatingMapCampaignId = els.ratingMapCampaignSelect.value || null;
  renderRatingMap();
});


els.cinemaBtn.addEventListener("click", () => {
  switchView("cinema");
});

els.lofiBtn.addEventListener("click", () => {
  switchView("lofi");
});

els.newsBtn.addEventListener("click", () => {
  switchView("news");
});

els.cinemaCampaignSelect.addEventListener("change", () => {
  state.selectedCinemaCampaignId =
    els.cinemaCampaignSelect.value || null;

  state.selectedCinemaEpisodeId = null;

  clearCinemaPlayer();
  renderCinemaEpisodeOptions();
});

els.cinemaEpisodeSelect.addEventListener("change", () => {
  state.selectedCinemaEpisodeId =
    els.cinemaEpisodeSelect.value || null;

  clearCinemaPlayer();
});

els.cinemaPlayBtn.addEventListener("click", () => {
  startCinemaEpisode();
});

els.cinemaPrevBtn.addEventListener("click", () => {
  const id =
    els.cinemaPrevBtn.dataset.episodeId;

  if (id) {
    startCinemaEpisode(id);
  }
});

els.cinemaNextBtn.addEventListener("click", () => {
  const id =
    els.cinemaNextBtn.dataset.episodeId;

  if (id) {
    startCinemaEpisode(id);
  }
});

els.homeLink.addEventListener("click", event => {
  event.preventDefault();
  switchView("archive");
});

els.playersBtn.addEventListener("click", () => {
  state.selectedPlayerId = null;
  switchView("players");
});

els.playersBackBtn.addEventListener("click", closePlayerProfile);

els.rankingsBtn.addEventListener("click", () => {
  switchView("rankings");
});

els.twitchBtn.addEventListener("click", () => {
  switchView("live");
});

$$(".returnArchiveBtn").forEach(button => {
  button.addEventListener("click", () => {
    switchView("archive");
  });
});

els.authBtn.addEventListener("click", async () => {
  if (!configured()) {
    showToast(
      "CONFIGURA PRIMEIRO O firebase-config.js"
    );
    return;
  }

  if (state.user) {
    await signOut(auth);
  } else {
    openModal(els.authModal);
  }
});

els.adminBtn.addEventListener("click", () => {
  state.showAllUsers = false;
  renderArchiveManagement();
  renderAccessList();
  renderPeopleManagement();
  refreshCreateParticipantEditor();
  openModal(els.adminModal);
});

els.loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  els.loginMessage.textContent =
    "A autenticar...";

  try {
    await signInWithEmailAndPassword(
      auth,
      els.emailInput.value.trim(),
      els.passwordInput.value
    );

    els.loginMessage.textContent = "";
    els.loginForm.reset();
    closeModal(els.authModal);

    showToast(
      "IDENTIFICAÇÃO CONFIRMADA."
    );
  } catch (error) {
    console.error(
      "[FEATHER] Erro de login:",
      error
    );

    els.loginMessage.textContent =
      "Credenciais inválidas ou acesso indisponível.";
  }
});

els.registerForm.addEventListener("submit", async event => {
  event.preventDefault();

  const displayName =
    els.registerName.value.trim();

  const email =
    els.registerEmail.value.trim();

  const password =
    els.registerPassword.value;

  const password2 =
    els.registerPassword2.value;

  if (displayName.length < 2) {
    els.registerMessage.textContent =
      "Escolhe um nick com pelo menos 2 caracteres.";
    return;
  }

  if (password !== password2) {
    els.registerMessage.textContent =
      "As palavras-passe não são iguais.";
    return;
  }

  els.registerMessage.textContent =
    "A criar identificação...";

  try {
    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await setDoc(
      doc(
        db,
        "users",
        credential.user.uid
      ),
      {
        displayName,
        email,
        role: "reviewer",
        status: "pending",
        createdAt: serverTimestamp()
      }
    );

    els.registerForm.reset();
    els.registerMessage.textContent = "";
    closeModal(els.authModal);

    showToast(
      "PEDIDO ENVIADO // Aguarda aprovação do administrador."
    );
  } catch (error) {
    console.error(
      "[FEATHER] Erro ao criar conta:",
      error
    );

    if (
      error.code ===
      "auth/email-already-in-use"
    ) {
      els.registerMessage.textContent =
        "Já existe uma conta com esse email.";
    } else if (
      error.code ===
      "auth/weak-password"
    ) {
      els.registerMessage.textContent =
        "A palavra-passe é demasiado fraca.";
    } else {
      els.registerMessage.textContent =
        "Não foi possível criar a identificação.";
    }
  }
});

$$("[data-auth-tab]").forEach(tab => {
  tab.addEventListener("click", () => {
    $$("[data-auth-tab]").forEach(
      item =>
        item.classList.toggle(
          "active",
          item === tab
        )
    );

    const login =
      tab.dataset.authTab === "login";

    els.loginForm.classList.toggle(
      "hidden",
      !login
    );

    els.registerForm.classList.toggle(
      "hidden",
      login
    );
  });
});

els.searchInput.addEventListener("input", () => {
  state.search =
    els.searchInput.value;
  renderCampaignNav();
});


els.shareNativeBtn?.addEventListener("click", nativeShareReview);
els.shareDownloadBtn?.addEventListener("click", downloadShareReview);

$$("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    closeModal(
      document.getElementById(
        button.dataset.close
      )
    );
  });
});

$$(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

$$("[data-tab]").forEach(tab => {
  tab.addEventListener("click", () => {
    $$("[data-tab]").forEach(
      item =>
        item.classList.toggle(
          "active",
          item === tab
        )
    );

    const selected =
      tab.dataset.tab;

    els.episodeForm.classList.toggle(
      "hidden",
      selected !== "episode"
    );

    els.campaignForm.classList.toggle(
      "hidden",
      selected !== "campaign"
    );

    els.archiveManagePanel.classList.toggle(
      "hidden",
      selected !== "archives"
    );

    els.peopleManagePanel.classList.toggle(
      "hidden",
      selected !== "people"
    );

    els.lofiManagePanel.classList.toggle(
      "hidden",
      selected !== "lofi"
    );

    els.newsManagePanel.classList.toggle(
      "hidden",
      selected !== "news"
    );

    els.accessPanel.classList.toggle(
      "hidden",
      selected !== "access"
    );

    if (selected === "archives") {
      renderArchiveManagement();
    }

    if (selected === "people") {
      renderPeopleManagement();
    }

    if (selected === "lofi") {
      renderLofiManagement();
    }

    if (selected === "news") {
      renderNewsManagement();
    }

    if (selected === "access") {
      renderAccessList();
    }
  });
});

els.episodeCampaign.addEventListener("change", () => {
  const current = currentParticipantsFromEditor(els.episodeParticipantsEditor);
  renderParticipantEditor(els.episodeParticipantsEditor, els.episodeCampaign.value, current);
});

els.editEpisodeCampaign.addEventListener("change", () => {
  const current = currentParticipantsFromEditor(els.editEpisodeParticipantsEditor);
  renderParticipantEditor(els.editEpisodeParticipantsEditor, els.editEpisodeCampaign.value, current);
});

els.playerCancelEditBtn.addEventListener("click", resetPlayerForm);
els.characterCancelEditBtn.addEventListener("click", resetCharacterForm);

els.playerForm.addEventListener("submit", async event => {
  event.preventDefault(); if (!isAdmin()) return;
  const name = els.playerNameInput.value.trim(); if (!name) return;
  const data = {name, avatarUrl:els.playerAvatarInput.value.trim(), bannerUrl:els.playerBannerInput.value.trim(), bio:els.playerBioInput.value.trim().slice(0,500), updatedAt:serverTimestamp(), updatedBy:state.user.uid};
  try {
    if (els.playerEditId.value) await updateDoc(doc(db,"players",els.playerEditId.value), data);
    else await addDoc(collection(db,"players"), {...data, createdAt:serverTimestamp(), createdBy:state.user.uid});
    resetPlayerForm(); showToast("PLAYER GUARDADO.");
  } catch(error) { console.error(error); els.playerFormMessage.textContent = error.message || "Não foi possível guardar o player."; }
});

els.characterForm.addEventListener("submit", async event => {
  event.preventDefault(); if (!isAdmin()) return;
  const name = els.characterNameInput.value.trim(); const playerId = els.characterPlayerSelect.value; const campaignId = els.characterCampaignSelect.value;
  if (!name || !playerId || !campaignId) { els.characterFormMessage.textContent = "Preenche nome, player e arquivo."; return; }
  const data = {name, playerId, campaignId, imageUrl:els.characterImageInput.value.trim(), description:els.characterDescriptionInput.value.trim().slice(0,700), updatedAt:serverTimestamp(), updatedBy:state.user.uid};
  try {
    if (els.characterEditId.value) await updateDoc(doc(db,"characters",els.characterEditId.value), data);
    else await addDoc(collection(db,"characters"), {...data, createdAt:serverTimestamp(), createdBy:state.user.uid});
    resetCharacterForm(); showToast("PERSONAGEM GUARDADA.");
  } catch(error) { console.error(error); els.characterFormMessage.textContent = error.message || "Não foi possível guardar a personagem."; }
});



els.spotifyLoginBtn.addEventListener("click", spotifyLogin);
els.spotifyLogoutBtn.addEventListener("click", spotifyLogout);

els.lofiPlayBtn.addEventListener("click", spotifyTogglePlay);
els.lofiPrevBtn.addEventListener("click", spotifyPrevious);
els.lofiNextBtn.addEventListener("click", spotifyNext);
els.lofiRandomBtn.addEventListener("click", spotifyToggleShuffle);
els.lofiLoopBtn.addEventListener("click", spotifyToggleRepeat);
els.lofiMuteBtn.addEventListener("click", toggleSpotifyMute);

els.lofiVolumeSlider.addEventListener("input", event => {
  setSpotifyVolume(Number(event.target.value) / 100);
});

els.lofiCancelEditBtn.addEventListener("click", resetLofiForm);

els.lofiForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isAdmin()) return;

  const campaignId = els.lofiCampaignSelect.value;
  const name = els.lofiNameInput.value.trim();
  const spotifyUrl = normalizeSpotifyUrl(els.lofiSpotifyUrlInput.value, "playlist");

  if (!campaignId || !name || !spotifyUrl) {
    els.lofiFormMessage.textContent = "Escolhe o RPG, dá um nome à estação e usa um link válido de playlist Spotify.";
    return;
  }

  const data = {
    campaignId,
    name: name.slice(0, 80),
    spotifyUrl,
    coverUrl: els.lofiCoverUrlInput.value.trim(),
    backgroundUrl: els.lofiBackgroundUrlInput.value.trim(),
    description: els.lofiDescriptionInput.value.trim().slice(0, 500),
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  };

  try {
    els.lofiFormMessage.textContent = els.lofiEditId.value ? "A guardar estação..." : "A criar estação...";

    if (els.lofiEditId.value) {
      await updateDoc(doc(db, "lofiPlaylists", els.lofiEditId.value), data);
      showToast("LOFI // ESTAÇÃO ATUALIZADA.");
    } else {
      await addDoc(collection(db, "lofiPlaylists"), {
        ...data,
        createdAt: serverTimestamp(),
        createdBy: state.user.uid
      });
      showToast("LOFI // ESTAÇÃO CRIADA.");
    }

    resetLofiForm();
  } catch (error) {
    console.error("[FEATHER] Erro ao guardar estação:", error);
    els.lofiFormMessage.textContent = error.message || "Não foi possível guardar a estação.";
  }
});

els.newsCancelEditBtn.addEventListener("click", resetNewsForm);

els.newsForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isAdmin()) return;

  const title = els.newsTitleInput.value.trim();
  const body = els.newsBodyInput.value.trim();

  if (!title || !body) {
    els.newsFormMessage.textContent = "Preenche o título e o comunicado.";
    return;
  }

  const data = {
    category: normalizeNewsCategory(els.newsCategory.value),
    campaignId: els.newsCampaign.value || "",
    title: title.slice(0, 120),
    imageUrl: els.newsImageUrl.value.trim(),
    body: body.slice(0, 5000),
    linkUrl: els.newsLinkUrl.value.trim(),
    featured: els.newsFeaturedInput.checked,
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  };

  try {
    els.newsFormMessage.textContent =
      els.newsEditId.value ? "A guardar alterações..." : "A publicar novidade...";

    if (els.newsEditId.value) {
      await updateDoc(
        doc(db, "news", els.newsEditId.value),
        data
      );

      showToast("NOVIDADE ATUALIZADA.");
    } else {
      await addDoc(
        collection(db, "news"),
        {
          ...data,
          publishedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          createdBy: state.user.uid
        }
      );

      showToast("NOVIDADE PUBLICADA.");
    }

    resetNewsForm();
  } catch (error) {
    console.error("[FEATHER] Erro ao guardar novidade:", error);
    els.newsFormMessage.textContent =
      error.message || "Não foi possível guardar a novidade.";
  }
});

els.showAllUsersBtn.addEventListener("click", () => {
  state.showAllUsers =
    !state.showAllUsers;

  renderAccessList();
});

els.campaignForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!isAdmin()) return;

  const code =
    normalizeCode(
      $("#campaignCodeInput").value
    );

  const title =
    $("#campaignTitleInput")
      .value
      .trim();

  if (!code || !title) {
    els.campaignMessage.textContent =
      "Preenche o código e o nome do arquivo.";
    return;
  }

  try {
    els.campaignMessage.textContent =
      "A criar arquivo...";

    const ref =
      await addDoc(
        collection(db, "campaigns"),
        {
          code,
          title,
          description:
            $("#campaignDescriptionInput")
              .value
              .trim(),
          coverUrl:
            els.campaignCoverUrl
              .value
              .trim(),
          visible:
            els.campaignVisible.checked,
          createdAt:
            serverTimestamp(),
          createdBy:
            state.user.uid
        }
      );

    state.selectedCampaignId =
      ref.id;

    els.campaignForm.reset();
    els.campaignVisible.checked = true;
    els.campaignMessage.textContent = "";

    showToast(
      `ARQUIVO ${code} CRIADO.`
    );
  } catch (error) {
    console.error(
      "[FEATHER] Erro ao criar arquivo:",
      error
    );

    els.campaignMessage.textContent =
      error.message ||
      "Não foi possível criar o arquivo.";
  }
});

els.episodeForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!isAdmin()) return;

  if (!els.episodeCampaign.value) {
    els.episodeMessage.textContent =
      "Cria primeiro um arquivo.";
    return;
  }

  try {
    els.episodeMessage.textContent =
      "A publicar registo...";

    await addDoc(
      collection(db, "episodes"),
      {
        campaignId:
          els.episodeCampaign.value,
        number:
          Number($("#episodeNumber").value),
        title:
          $("#episodeTitleInput")
            .value
            .trim(),
        date:
          $("#episodeDate").value,
        duration:
          $("#episodeDuration")
            .value
            .trim(),
        status:
          $("#episodeStatus").value,
        imageUrl:
          els.episodeImageUrl
            .value
            .trim(),
        youtubeUrl:
          els.episodeYoutubeUrl
            .value
            .trim(),
        synopsis:
          $("#episodeSynopsis")
            .value
            .trim(),
        participants:
          currentParticipantsFromEditor(els.episodeParticipantsEditor),
        createdAt:
          serverTimestamp(),
        createdBy:
          state.user.uid
      }
    );

    els.episodeForm.reset();
    renderAdminCampaignOptions();
    renderParticipantEditor(els.episodeParticipantsEditor, els.episodeCampaign.value, []);
    els.episodeMessage.textContent = "";

    showToast(
      "NOVO REGISTO PUBLICADO."
    );
  } catch (error) {
    console.error(
      "[FEATHER] Erro ao publicar episódio:",
      error
    );

    els.episodeMessage.textContent =
      error.message ||
      "Não foi possível publicar o episódio.";
  }
});

els.editEpisodeForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!isAdmin()) return;

  const episodeId =
    els.editEpisodeId.value;

  const current =
    state.episodes.find(
      item => item.id === episodeId
    );

  if (!current) {
    els.editEpisodeMessage.textContent =
      "O episódio já não existe.";
    return;
  }

  try {
    els.editEpisodeMessage.textContent =
      "A guardar alterações...";

    await updateDoc(
      doc(db, "episodes", episodeId),
      {
        campaignId:
          els.editEpisodeCampaign.value,
        number:
          Number(
            els.editEpisodeNumber.value
          ),
        title:
          els.editEpisodeName
            .value
            .trim(),
        date:
          els.editEpisodeDate.value,
        duration:
          els.editEpisodeDuration
            .value
            .trim(),
        status:
          els.editEpisodeStatus.value,
        synopsis:
          els.editEpisodeSynopsis
            .value
            .trim(),
        imageUrl:
          els.editEpisodeImageUrl
            .value
            .trim(),
        youtubeUrl:
          els.editEpisodeYoutubeUrl
            .value
            .trim(),
        participants:
          currentParticipantsFromEditor(els.editEpisodeParticipantsEditor),
        updatedAt:
          serverTimestamp(),
        updatedBy:
          state.user.uid
      }
    );

    els.editEpisodeMessage.textContent = "";
    closeModal(els.editEpisodeModal);

    showToast(
      "EPISÓDIO ATUALIZADO."
    );
  } catch (error) {
    console.error(
      "[FEATHER] Erro ao editar episódio:",
      error
    );

    els.editEpisodeMessage.textContent =
      error.message ||
      "Não foi possível guardar as alterações.";
  }
});

function startPublicListeners() {
  onSnapshot(
    collection(db, "campaigns"),
    snapshot => {
      state.campaigns =
        snapshot.docs.map(
          item => ({
            id: item.id,
            ...item.data()
          })
        );

      state.campaigns.sort(
        (a,b) =>
          (a.title || "")
            .localeCompare(
              b.title || "",
              "pt"
            )
      );

      renderAll();
    },
    error => {
      console.error(
        "[FEATHER] Erro ao ler arquivos:",
        error
      );
    }
  );

  onSnapshot(
    collection(db, "episodes"),
    snapshot => {
      state.episodes =
        snapshot.docs.map(
          item => ({
            id: item.id,
            ...item.data()
          })
        );

      renderAll();
    },
    error => {
      console.error(
        "[FEATHER] Erro ao ler episódios:",
        error
      );
    }
  );

  onSnapshot(
    collection(db, "players"),
    snapshot => {
      state.players = snapshot.docs.map(item => ({id:item.id, ...item.data()}));
      state.players.sort((a,b)=>(a.name||"").localeCompare(b.name||"","pt"));
      renderAll();
      refreshCreateParticipantEditor();
    },
    error => console.error("[FEATHER] Erro ao ler players:", error)
  );

  onSnapshot(
    collection(db, "characters"),
    snapshot => {
      state.characters = snapshot.docs.map(item => ({id:item.id, ...item.data()}));
      state.characters.sort((a,b)=>(a.name||"").localeCompare(b.name||"","pt"));
      renderAll();
      refreshCreateParticipantEditor();
    },
    error => console.error("[FEATHER] Erro ao ler personagens:", error)
  );

  onSnapshot(
    collection(db, "lofiPlaylists"),
    snapshot => {
      const previousSelected = state.selectedLofiPlaylistId;

      state.lofiPlaylists = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

      ensureLofiSelection();

      renderAll();
    },
    error => {
      console.error(
        "[FEATHER] Erro ao ler Feather Lofi:",
        error
      );
    }
  );

  onSnapshot(
    collection(db, "news"),
    snapshot => {
      state.news = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

      renderAll();
    },
    error => {
      console.error(
        "[FEATHER] Erro ao ler novidades:",
        error
      );
    }
  );

  onSnapshot(
    collection(db, "ratings"),
    snapshot => {
      state.ratings =
        snapshot.docs.map(
          item => ({
            id: item.id,
            ...item.data()
          })
        );

      renderAll();
    },
    error => {
      console.error(
        "[FEATHER] Erro ao ler avaliações:",
        error
      );
    }
  );
}

if (configured()) {
  switchView("archive");
  startPublicListeners();

  // Spotify OAuth callback is independent from Firebase auth.
handleSpotifyOAuthCallback().then(async handled => {
  if (handled && sessionStorage.getItem(SPOTIFY_RETURN_VIEW_KEY) === "lofi") {
    sessionStorage.removeItem(SPOTIFY_RETURN_VIEW_KEY);
    switchView("lofi");
  }
  if (readSpotifyToken()) {
    await spotifyLoadAccount();
    updateSpotifyAuthUi();
    initSpotifyPlayer();
  } else {
    updateSpotifyAuthUi();
    setSpotifyControlsEnabled(false);
  }
});

onAuthStateChanged(auth, user => {
    state.user = user;
    state.profile = null;

    renderAll();
    startProfileListener(user);
  });
} else {
  renderAll();

  showToast(
    "SITE EM MODO DE CONFIGURAÇÃO // Preenche firebase-config.js"
  );
}


// Atualiza automaticamente os badges NEW EP quando passam as 2 horas.
setInterval(() => {
  renderCampaignNav();
  renderArchive();
  renderLatestNews();
  renderNewsView();
  renderRankings();
}, 60 * 1000);

import { firebaseConfig } from "./firebase-config.js";

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
  users: [],
  selectedCampaignId: null,
  selectedRatingMapCampaignId: null,
  currentView: "archive",
  search: "",
  showAllUsers: false,
  profileUnsubscribe: null,
  usersUnsubscribe: null
};

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

const els = {
  authBtn: $("#authBtn"),
  adminBtn: $("#adminBtn"),
  rankingsBtn: $("#rankingsBtn"),
  twitchBtn: $("#twitchBtn"),
  homeLink: $("#homeLink"),
  sessionBadge: $("#sessionBadge"),

  archiveShell: $("#archiveShell"),
  rankingsView: $("#rankingsView"),
  liveView: $("#liveView"),
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
  editEpisodeMessage: $("#editEpisodeMessage"),

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
  els.rankingsView.classList.toggle("hidden", view !== "rankings");
  els.liveView.classList.toggle("hidden", view !== "live");

  els.rankingsBtn.classList.toggle("active-nav", view === "rankings");
  els.twitchBtn.classList.toggle("active-nav", view === "live");

  if (view === "rankings") {
    renderRankings();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
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

  const archiveHeader = document.createElement("div");
  archiveHeader.className = "rating-map-corner";
  archiveHeader.textContent = safeText(campaign.code, "ARQ");
  headerRow.appendChild(archiveHeader);

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

    const refs = [
      ...relatedRatings.map(rating => doc(db, "ratings", rating.id)),
      ...relatedEpisodes.map(episode => doc(db, "episodes", episode.id)),
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
  renderRankings();
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

els.homeLink.addEventListener("click", event => {
  event.preventDefault();
  switchView("archive");
});

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

    els.accessPanel.classList.toggle(
      "hidden",
      selected !== "access"
    );

    if (selected === "archives") {
      renderArchiveManagement();
    }

    if (selected === "access") {
      renderAccessList();
    }
  });
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
        createdAt:
          serverTimestamp(),
        createdBy:
          state.user.uid
      }
    );

    els.episodeForm.reset();
    renderAdminCampaignOptions();
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
  renderRankings();
}, 60 * 1000);

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
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
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
  search: "",
  showAllUsers: false,
  usersUnsubscribe: null
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const els = {
  authBtn: $("#authBtn"),
  adminBtn: $("#adminBtn"),
  sessionBadge: $("#sessionBadge"),
  campaignNav: $("#campaignNav"),
  episodeGrid: $("#episodeGrid"),
  archiveTitle: $("#archiveTitle"),
  archiveCode: $("#archiveCode"),
  archiveDescription: $("#archiveDescription"),
  archiveMeta: $("#archiveMeta"),
  searchInput: $("#searchInput"),
  authModal: $("#authModal"),
  adminModal: $("#adminModal"),
  loginForm: $("#loginForm"),
  registerForm: $("#registerForm"),
  loginMessage: $("#loginMessage"),
  registerMessage: $("#registerMessage"),
  emailInput: $("#emailInput"),
  passwordInput: $("#passwordInput"),
  registerName: $("#registerName"),
  registerEmail: $("#registerEmail"),
  registerPassword: $("#registerPassword"),
  registerPassword2: $("#registerPassword2"),
  episodeForm: $("#episodeForm"),
  campaignForm: $("#campaignForm"),
  accessPanel: $("#accessPanel"),
  accessList: $("#accessList"),
  pendingCount: $("#pendingCount"),
  showAllUsersBtn: $("#showAllUsersBtn"),
  episodeCampaign: $("#episodeCampaign"),
  episodeMessage: $("#episodeMessage"),
  campaignMessage: $("#campaignMessage"),
  toast: $("#toast"),
  template: $("#episodeTemplate")
};

function configured() {
  return firebaseConfig.apiKey && firebaseConfig.apiKey !== "COLOCA_AQUI";
}

function safeText(value, fallback = "—") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeCode(code) {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit", month: "2-digit", year: "numeric"
  }).format(date);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => els.toast.classList.add("hidden"), 3400);
}

function openModal(el) { el.classList.remove("hidden"); }
function closeModal(el) { el.classList.add("hidden"); }
function isAdmin() { return state.profile?.role === "admin"; }
function isApproved() { return isAdmin() || state.profile?.status === "approved"; }
function canRate() { return Boolean(state.user && isApproved()); }

function ratingsForEpisode(episodeId) {
  return state.ratings.filter(r => r.episodeId === episodeId);
}

function myRating(episodeId) {
  if (!state.user) return null;
  const id = `${episodeId}_${state.user.uid}`;
  return state.ratings.find(r => r.id === id)?.score ?? null;
}

function ratingStats(episodeId) {
  const ratings = ratingsForEpisode(episodeId);
  const counts = {1:0,2:0,3:0,4:0,5:0,6:0};
  for (const r of ratings) if (counts[r.score] !== undefined) counts[r.score]++;
  const max = Math.max(0, ...Object.values(counts));
  const winners = max === 0 ? [] :
    Object.entries(counts).filter(([, count]) => count === max).map(([score]) => Number(score));
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
  return `EMPATE // ${winners.map(s => s === 6 ? "✦" : `${s}★`).join(" + ")}`;
}

function renderCampaignNav() {
  const query = state.search.toLowerCase().trim();
  const filtered = state.campaigns.filter(c => {
    const haystack = `${c.title || ""} ${c.code || ""}`.toLowerCase();
    return !query || haystack.includes(query);
  });

  els.campaignNav.innerHTML = "";
  if (!filtered.length) {
    const p = document.createElement("p");
    p.className = "form-message";
    p.textContent = state.campaigns.length ? "Nenhum arquivo corresponde à pesquisa." : "Nenhum arquivo criado.";
    els.campaignNav.appendChild(p);
    return;
  }

  for (const campaign of filtered) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `campaign-item ${campaign.id === state.selectedCampaignId ? "active" : ""}`;
    button.innerHTML = `<span>DOSSIER // ${safeText(campaign.code)}</span><strong></strong>`;
    button.querySelector("strong").textContent = safeText(campaign.title);
    button.addEventListener("click", () => {
      state.selectedCampaignId = campaign.id;
      renderAll();
      window.scrollTo({ top: document.querySelector(".archive-section").offsetTop - 70, behavior: "smooth" });
    });
    els.campaignNav.appendChild(button);
  }
}

function renderAdminCampaignOptions() {
  els.episodeCampaign.innerHTML = "";
  for (const campaign of state.campaigns) {
    const option = document.createElement("option");
    option.value = campaign.id;
    option.textContent = `${safeText(campaign.code)} — ${safeText(campaign.title)}`;
    els.episodeCampaign.appendChild(option);
  }
}

function renderArchive() {
  const campaign = state.campaigns.find(c => c.id === state.selectedCampaignId);

  if (!campaign) {
    els.archiveCode.textContent = "DOSSIER // —";
    els.archiveTitle.textContent = "Seleciona um arquivo";
    els.archiveDescription.textContent = "Os registos disponíveis aparecerão aqui.";
    els.archiveMeta.textContent = "";
    els.episodeGrid.innerHTML = `<article class="empty-card"><span>SEM DOSSIER SELECIONADO</span><p>Escolhe um arquivo no índice lateral.</p></article>`;
    return;
  }

  const episodes = state.episodes
    .filter(e => e.campaignId === campaign.id)
    .sort((a,b) => Number(b.number || 0) - Number(a.number || 0));

  els.archiveCode.textContent = `DOSSIER // ${safeText(campaign.code)}`;
  els.archiveTitle.textContent = safeText(campaign.title);
  els.archiveDescription.textContent = safeText(campaign.description, "Arquivo de episódios registados.");
  els.archiveMeta.innerHTML = `REGISTOS: <strong>${episodes.length}</strong><br>ACESSO: <strong>${state.user ? (isApproved() ? "AUTORIZADO" : "PENDENTE") : "PÚBLICO"}</strong>`;
  els.episodeGrid.innerHTML = "";

  if (!episodes.length) {
    els.episodeGrid.innerHTML = `<article class="empty-card"><span>ARQUIVO SEM REGISTOS</span><p>O administrador ainda não publicou episódios neste dossier.</p></article>`;
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
  const code = `${safeText(campaign.code, "ARQ")}-${String(episode.number || 0).padStart(3, "0")}`;

  img.src = episode.imageUrl || "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"><rect width="100%" height="100%" fill="#191713"/><text x="50%" y="50%" fill="#6f6658" font-family="monospace" font-size="30" text-anchor="middle">${code}</text></svg>`
  );
  img.alt = `Imagem do episódio ${episode.number || ""}`;
  img.onerror = () => {
    img.onerror = null;
    img.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"><rect width="100%" height="100%" fill="#191713"/><text x="50%" y="50%" fill="#6f6658" font-family="monospace" font-size="30" text-anchor="middle">IMAGEM INDISPONÍVEL</text></svg>`
    );
  };

  node.querySelector(".episode-status").textContent = safeText(episode.status, "ARQUIVADO");
  node.querySelector(".episode-file-number").textContent = code;
  node.querySelector(".episode-kicker").textContent = `REGISTO Nº ${String(episode.number || 0).padStart(2, "0")}`;
  node.querySelector(".episode-title").textContent = safeText(episode.title, `Episódio ${episode.number || "?"}`);
  node.querySelector(".episode-synopsis").textContent = safeText(episode.synopsis, "Sem resumo registado.");
  node.querySelector(".episode-date").textContent = formatDate(episode.date);
  node.querySelector(".episode-duration").textContent = safeText(episode.duration);

  const stats = ratingStats(episode.id);
  node.querySelector(".episode-votes").textContent = String(stats.ratings.length);
  node.querySelector(".dominant-rating").textContent = dominantLabel(stats.winners);
  node.querySelector(".rating-caption").textContent = stats.ratings.length
    ? `${stats.max} voto${stats.max === 1 ? "" : "s"} na classificação dominante`
    : "Ainda não existem relatórios de avaliação.";

  const distribution = node.querySelector(".distribution");
  const maxCount = Math.max(1, ...Object.values(stats.counts));
  for (const score of [6,5,4,3,2,1]) {
    const row = document.createElement("div");
    row.className = "dist-row";
    const percentage = (stats.counts[score] / maxCount) * 100;
    row.innerHTML = `
      <span class="dist-label">${score === 6 ? "✦ LENDÁRIA" : `${"★".repeat(score)} ${score}`}</span>
      <span class="dist-track"><span class="dist-fill" style="width:${percentage}%"></span></span>
      <span class="dist-count">${stats.counts[score]}</span>
    `;
    distribution.appendChild(row);
  }

  const myScore = myRating(episode.id);
  const hint = node.querySelector(".vote-hint");

  if (!state.user) {
    hint.textContent = "Identificação necessária para avaliar.";
  } else if (!isApproved()) {
    hint.textContent = state.profile?.status === "rejected"
      ? "Acesso recusado pelo administrador."
      : "Pedido pendente de aprovação.";
  } else if (myScore) {
    hint.textContent = `Avaliação atual: ${myScore === 6 ? "LENDÁRIA" : `${myScore}/6`}`;
  } else {
    hint.textContent = "Seleciona uma classificação.";
  }

  const buttons = node.querySelector(".rating-buttons");
  for (let score = 1; score <= 6; score++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `rating-btn ${score === 6 ? "legendary" : ""} ${myScore === score ? "active" : ""}`;
    button.title = score === 6 ? "Estrela Lendária (6)" : `${score} estrela${score === 1 ? "" : "s"}`;
    button.textContent = score === 6 ? "✦" : "★";
    button.disabled = !canRate();
    button.setAttribute("aria-label", button.title);
    button.addEventListener("click", () => submitRating(episode.id, score));
    buttons.appendChild(button);
  }

  if (!state.user) {
    card.querySelector(".your-report").addEventListener("click", () => openModal(els.authModal));
  }

  return node;
}

function renderSession() {
  if (!state.user) {
    els.authBtn.textContent = "IDENTIFICAR-SE";
    els.sessionBadge.textContent = "ACESSO PÚBLICO";
    els.adminBtn.classList.add("hidden");
    return;
  }

  const name = state.profile?.displayName || state.user.email || "INVESTIGADOR";
  els.authBtn.textContent = "TERMINAR SESSÃO";

  if (isAdmin()) {
    els.sessionBadge.textContent = `ADMIN // ${name}`;
    els.adminBtn.classList.remove("hidden");
  } else if (state.profile?.status === "approved") {
    els.sessionBadge.textContent = `REVIEWER // ${name}`;
    els.adminBtn.classList.add("hidden");
  } else if (state.profile?.status === "rejected") {
    els.sessionBadge.textContent = `ACESSO RECUSADO // ${name}`;
    els.adminBtn.classList.add("hidden");
  } else {
    els.sessionBadge.textContent = `PENDENTE // ${name}`;
    els.adminBtn.classList.add("hidden");
  }
}

function renderAccessList() {
  if (!isAdmin()) return;

  const pending = state.users.filter(u => u.role !== "admin" && (u.status || "pending") === "pending");
  const list = state.showAllUsers
    ? state.users.filter(u => u.role !== "admin")
    : pending;

  els.pendingCount.textContent = String(pending.length);
  els.pendingCount.classList.toggle("hidden", pending.length === 0);
  els.showAllUsersBtn.textContent = state.showAllUsers ? "VER PENDENTES" : "VER TODOS";
  els.accessList.innerHTML = "";

  if (!list.length) {
    els.accessList.innerHTML = `<div class="empty-access">${state.showAllUsers ? "Nenhuma conta Reviewer criada." : "Nenhum pedido pendente. Tudo limpo. ✅"}</div>`;
    return;
  }

  for (const user of list.sort((a,b) => (a.displayName || "").localeCompare(b.displayName || "", "pt"))) {
    const row = document.createElement("div");
    row.className = "access-row";

    const status = user.status || "pending";
    row.innerHTML = `
      <div class="access-identity">
        <strong></strong>
        <small></small>
        <span class="access-status ${status}">${status === "approved" ? "APROVADO" : status === "rejected" ? "RECUSADO" : "PENDENTE"}</span>
      </div>
      <div class="access-actions"></div>
    `;

    row.querySelector("strong").textContent = safeText(user.displayName, "Sem nome");
    row.querySelector("small").textContent = safeText(user.email, `UID: ${user.id}`);

    const actions = row.querySelector(".access-actions");

    if (status !== "approved") {
      const approve = document.createElement("button");
      approve.type = "button";
      approve.className = "access-action approve";
      approve.textContent = "APROVAR";
      approve.addEventListener("click", () => updateAccess(user.id, "approved"));
      actions.appendChild(approve);
    }

    if (status !== "rejected") {
      const reject = document.createElement("button");
      reject.type = "button";
      reject.className = "access-action reject";
      reject.textContent = "RECUSAR";
      reject.addEventListener("click", () => updateAccess(user.id, "rejected"));
      actions.appendChild(reject);
    }

    els.accessList.appendChild(row);
  }
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

  state.usersUnsubscribe = onSnapshot(collection(db, "users"), snap => {
    state.users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAccessList();
  }, error => {
    console.error(error);
    showToast("ERRO // Não foi possível ler os pedidos de acesso.");
  });
}

async function updateAccess(userId, status) {
  if (!isAdmin()) return;

  try {
    await updateDoc(doc(db, "users", userId), {
      status,
      reviewedAt: serverTimestamp(),
      reviewedBy: state.user.uid
    });

    showToast(status === "approved" ? "ACESSO APROVADO // REVIEWER ATIVO" : "PEDIDO DE ACESSO RECUSADO");
  } catch (error) {
    console.error(error);
    showToast("ERRO // Não foi possível alterar o acesso.");
  }
}

function renderAll() {
  if (!state.selectedCampaignId && state.campaigns.length) {
    state.selectedCampaignId = state.campaigns[0].id;
  }
  renderSession();
  renderCampaignNav();
  renderAdminCampaignOptions();
  renderArchive();
  renderAccessList();
}

async function loadProfile(user) {
  if (!user) return null;
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? snap.data() : null;
}

async function submitRating(episodeId, score) {
  if (!state.user) {
    openModal(els.authModal);
    return;
  }

  if (!canRate()) {
    showToast(state.profile?.status === "rejected"
      ? "ACESSO RECUSADO // Não podes avaliar."
      : "PEDIDO PENDENTE // Aguarda aprovação do administrador.");
    return;
  }

  try {
    const ratingId = `${episodeId}_${state.user.uid}`;
    await setDoc(doc(db, "ratings", ratingId), {
      episodeId,
      score,
      updatedAt: serverTimestamp()
    });
    showToast(score === 6 ? "RELATÓRIO ATUALIZADO // CLASSIFICAÇÃO LENDÁRIA ✦" : `RELATÓRIO ATUALIZADO // ${score}/6`);
  } catch (error) {
    console.error(error);
    showToast("ERRO // Não foi possível registar a avaliação.");
  }
}

els.authBtn.addEventListener("click", async () => {
  if (!configured()) {
    showToast("CONFIGURA PRIMEIRO O firebase-config.js");
    return;
  }
  if (state.user) await signOut(auth);
  else openModal(els.authModal);
});

els.adminBtn.addEventListener("click", () => {
  state.showAllUsers = false;
  renderAccessList();
  openModal(els.adminModal);
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.loginMessage.textContent = "A autenticar...";

  try {
    await signInWithEmailAndPassword(auth, els.emailInput.value.trim(), els.passwordInput.value);
    els.loginMessage.textContent = "";
    els.loginForm.reset();
    closeModal(els.authModal);
    showToast("IDENTIFICAÇÃO CONFIRMADA.");
  } catch (error) {
    console.error(error);
    els.loginMessage.textContent = "Credenciais inválidas ou acesso indisponível.";
  }
});

els.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const displayName = els.registerName.value.trim();
  const email = els.registerEmail.value.trim();
  const password = els.registerPassword.value;
  const password2 = els.registerPassword2.value;

  if (displayName.length < 2) {
    els.registerMessage.textContent = "Escolhe um nick com pelo menos 2 caracteres.";
    return;
  }

  if (password !== password2) {
    els.registerMessage.textContent = "As palavras-passe não são iguais.";
    return;
  }

  els.registerMessage.textContent = "A criar identificação...";

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    const profile = {
      displayName,
      email,
      role: "reviewer",
      status: "pending",
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", credential.user.uid), profile);

    state.user = credential.user;
    state.profile = { displayName, email, role: "reviewer", status: "pending" };
    renderAll();

    els.registerForm.reset();
    els.registerMessage.textContent = "";
    closeModal(els.authModal);
    showToast("PEDIDO ENVIADO // Aguarda aprovação do administrador.");
  } catch (error) {
    console.error(error);
    if (error.code === "auth/email-already-in-use") {
      els.registerMessage.textContent = "Já existe uma conta com esse email.";
    } else if (error.code === "auth/weak-password") {
      els.registerMessage.textContent = "A palavra-passe é demasiado fraca.";
    } else {
      els.registerMessage.textContent = "Não foi possível criar a identificação.";
    }
  }
});

$$("[data-auth-tab]").forEach(tab => {
  tab.addEventListener("click", () => {
    $$("[data-auth-tab]").forEach(t => t.classList.toggle("active", t === tab));
    const login = tab.dataset.authTab === "login";
    els.loginForm.classList.toggle("hidden", !login);
    els.registerForm.classList.toggle("hidden", login);
  });
});

els.searchInput.addEventListener("input", () => {
  state.search = els.searchInput.value;
  renderCampaignNav();
});

$$("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeModal(document.getElementById(button.dataset.close)));
});

$$(".modal").forEach(modal => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

$$("[data-tab]").forEach(tab => {
  tab.addEventListener("click", () => {
    $$("[data-tab]").forEach(t => t.classList.toggle("active", t === tab));

    const selected = tab.dataset.tab;
    els.episodeForm.classList.toggle("hidden", selected !== "episode");
    els.campaignForm.classList.toggle("hidden", selected !== "campaign");
    els.accessPanel.classList.toggle("hidden", selected !== "access");

    if (selected === "access") renderAccessList();
  });
});

els.showAllUsersBtn.addEventListener("click", () => {
  state.showAllUsers = !state.showAllUsers;
  renderAccessList();
});

els.campaignForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;

  const code = normalizeCode($("#campaignCodeInput").value);
  const title = $("#campaignTitleInput").value.trim();
  if (!code || !title) return;

  els.campaignMessage.textContent = "A criar arquivo...";

  try {
    const ref = await addDoc(collection(db, "campaigns"), {
      code,
      title,
      description: $("#campaignDescriptionInput").value.trim(),
      coverUrl: $("#campaignCoverInput").value.trim(),
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });

    state.selectedCampaignId = ref.id;
    els.campaignForm.reset();
    els.campaignMessage.textContent = "";
    showToast(`ARQUIVO ${code} CRIADO.`);
  } catch (error) {
    console.error(error);
    els.campaignMessage.textContent = "Não foi possível criar o arquivo.";
  }
});

els.episodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;

  if (!els.episodeCampaign.value) {
    els.episodeMessage.textContent = "Cria primeiro um arquivo.";
    return;
  }

  els.episodeMessage.textContent = "A publicar registo...";

  try {
    await addDoc(collection(db, "episodes"), {
      campaignId: els.episodeCampaign.value,
      number: Number($("#episodeNumber").value),
      title: $("#episodeTitleInput").value.trim(),
      date: $("#episodeDate").value,
      duration: $("#episodeDuration").value.trim(),
      status: $("#episodeStatus").value,
      imageUrl: $("#episodeImage").value.trim(),
      synopsis: $("#episodeSynopsis").value.trim(),
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });

    els.episodeForm.reset();
    renderAdminCampaignOptions();
    els.episodeMessage.textContent = "";
    showToast("NOVO REGISTO PUBLICADO.");
  } catch (error) {
    console.error(error);
    els.episodeMessage.textContent = "Não foi possível publicar o episódio.";
  }
});

if (configured()) {
  onSnapshot(collection(db, "campaigns"), snap => {
    state.campaigns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.campaigns.sort((a,b) => (a.title || "").localeCompare(b.title || "", "pt"));
    renderAll();
  }, error => {
    console.error(error);
    showToast("ERRO AO LER ARQUIVOS // Verifica as regras do Firestore.");
  });

  onSnapshot(collection(db, "episodes"), snap => {
    state.episodes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAll();
  });

  onSnapshot(collection(db, "ratings"), snap => {
    state.ratings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAll();
  });

  onAuthStateChanged(auth, async user => {
    state.user = user;
    state.profile = await loadProfile(user);
    startUsersListener();
    renderAll();
  });
} else {
  renderAll();
  showToast("SITE EM MODO DE CONFIGURAÇÃO // Preenche firebase-config.js");
}

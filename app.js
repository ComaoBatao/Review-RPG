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
  deleteDoc,
  addDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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
  usersUnsubscribe: null,
  profileUnsubscribe: null
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
  episodeImageFile: $("#episodeImageFile"),
  episodeImagePreviewWrap: $("#episodeImagePreviewWrap"),
  episodeImagePreview: $("#episodeImagePreview"),
  clearEpisodeImage: $("#clearEpisodeImage"),
  campaignCoverFile: $("#campaignCoverFile"),
  campaignCoverPreviewWrap: $("#campaignCoverPreviewWrap"),
  campaignCoverPreview: $("#campaignCoverPreview"),
  clearCampaignCover: $("#clearCampaignCover"),
  editEpisodeModal: $("#editEpisodeModal"),
  editEpisodeForm: $("#editEpisodeForm"),
  editEpisodeId: $("#editEpisodeId"),
  editEpisodeCampaign: $("#editEpisodeCampaign"),
  editEpisodeNumber: $("#editEpisodeNumber"),
  editEpisodeDate: $("#editEpisodeDate"),
  editEpisodeName: $("#editEpisodeName"),
  editEpisodeDuration: $("#editEpisodeDuration"),
  editEpisodeStatus: $("#editEpisodeStatus"),
  editEpisodeSynopsis: $("#editEpisodeSynopsis"),
  editEpisodeImageFile: $("#editEpisodeImageFile"),
  editEpisodeImagePreviewWrap: $("#editEpisodeImagePreviewWrap"),
  editEpisodeImagePreview: $("#editEpisodeImagePreview"),
  clearEditEpisodeImage: $("#clearEditEpisodeImage"),
  editEpisodeMessage: $("#editEpisodeMessage"),
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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
]);

function validateImageFile(file) {
  if (!file) return null;

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("A imagem tem de ser PNG, JPG, WEBP ou GIF.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("A imagem não pode ultrapassar 5 MB.");
  }

  return file;
}

function cleanFileName(name) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "imagem";

  return `${base}${ext}`;
}

function storageErrorMessage(error) {
  const code = error?.code || "";

  if (code === "storage/unauthorized") {
    return "O Firebase Storage recusou o upload. Confirma Storage → Regras → Publicar.";
  }

  if (code === "storage/bucket-not-found") {
    return "O bucket do Firebase Storage não foi encontrado. Confirma se o Storage está ativado neste projeto.";
  }

  if (code === "storage/retry-limit-exceeded" || code === "storage/timeout") {
    return "O upload demorou demasiado e foi cancelado. Tenta novamente.";
  }

  if (code === "storage/canceled") {
    return "O upload foi cancelado.";
  }

  if (code.startsWith("storage/")) {
    return `Falha no Firebase Storage (${code}).`;
  }

  return error?.message || "Não foi possível enviar a imagem.";
}

async function uploadAdminImage(file, folder, onProgress = () => {}) {
  if (!file) return { url: "", path: "" };
  if (!isAdmin()) throw new Error("Apenas o Admin pode enviar imagens.");

  validateImageFile(file);

  const fileName = cleanFileName(file.name);
  const path = `uploads/${folder}/${Date.now()}-${fileName}`;
  const ref = storageRef(storage, path);

  return await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: state.user.uid
      }
    });

    let idleTimer = null;

    const resetTimeout = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        const error = new Error("O upload não avançou durante demasiado tempo.");
        error.code = "storage/timeout";
        try { task.cancel(); } catch {}
        reject(error);
      }, 30000);
    };

    resetTimeout();

    task.on(
      "state_changed",
      snapshot => {
        resetTimeout();
        const percent = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress(percent);
      },
      error => {
        clearTimeout(idleTimer);
        reject(error);
      },
      async () => {
        clearTimeout(idleTimer);
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, path });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

function setImagePreview(fileInput, wrap, img) {
  const file = fileInput.files?.[0] || null;

  if (!file) {
    img.removeAttribute("src");
    wrap.classList.add("hidden");
    return;
  }

  try {
    validateImageFile(file);
  } catch (error) {
    fileInput.value = "";
    img.removeAttribute("src");
    wrap.classList.add("hidden");
    showToast(`IMAGEM INVÁLIDA // ${error.message}`);
    return;
  }

  if (img.dataset.objectUrl) {
    URL.revokeObjectURL(img.dataset.objectUrl);
  }

  const objectUrl = URL.createObjectURL(file);
  img.dataset.objectUrl = objectUrl;
  img.src = objectUrl;
  wrap.classList.remove("hidden");
}

function clearImageInput(fileInput, wrap, img) {
  fileInput.value = "";

  if (img.dataset.objectUrl) {
    URL.revokeObjectURL(img.dataset.objectUrl);
    delete img.dataset.objectUrl;
  }

  img.removeAttribute("src");
  wrap.classList.add("hidden");
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
  const selects = [els.episodeCampaign, els.editEpisodeCampaign].filter(Boolean);

  for (const select of selects) {
    select.innerHTML = "";

    for (const campaign of state.campaigns) {
      const option = document.createElement("option");
      option.value = campaign.id;
      option.textContent = `${safeText(campaign.code)} — ${safeText(campaign.title)}`;
      select.appendChild(option);
    }
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

  const adminActions = card.querySelector(".episode-admin-actions");
  if (isAdmin() && adminActions) {
    adminActions.classList.remove("hidden");

    adminActions.querySelector(".edit").addEventListener("click", () => {
      openEditEpisode(episode);
    });

    adminActions.querySelector(".delete").addEventListener("click", () => {
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
  els.editEpisodeMessage.textContent = "";

  clearImageInput(
    els.editEpisodeImageFile,
    els.editEpisodeImagePreviewWrap,
    els.editEpisodeImagePreview
  );

  openModal(els.editEpisodeModal);
}

async function deleteEpisode(episode) {
  if (!isAdmin()) return;

  const label = episode.title || `Episódio ${episode.number || "?"}`;
  const confirmed = window.confirm(
    `Eliminar "${label}"?\n\nIsto também elimina as avaliações deste episódio e não pode ser desfeito.`
  );

  if (!confirmed) return;

  try {
    showToast("A ELIMINAR EPISÓDIO...");

    const batch = writeBatch(db);

    for (const rating of ratingsForEpisode(episode.id)) {
      batch.delete(doc(db, "ratings", rating.id));
    }

    batch.delete(doc(db, "episodes", episode.id));
    await batch.commit();

    if (episode.imagePath) {
      try {
        await deleteObject(storageRef(storage, episode.imagePath));
      } catch (error) {
        console.warn("[FEATHER] O episódio foi apagado, mas não foi possível apagar a imagem do Storage:", error);
      }
    }

    showToast("EPISÓDIO ELIMINADO.");
  } catch (error) {
    console.error("[FEATHER] Erro ao eliminar episódio:", error);
    showToast(error?.code === "permission-denied"
      ? "SEM PERMISSÃO // Atualiza as Firestore Rules."
      : "ERRO // Não foi possível eliminar o episódio.");
  }
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

  const profileRef = doc(db, "users", user.uid);

  state.profileUnsubscribe = onSnapshot(profileRef, snap => {
    state.profile = snap.exists() ? snap.data() : null;

    console.log("[FEATHER] Auth UID:", user.uid);
    console.log("[FEATHER] Perfil encontrado:", snap.exists());
    console.log("[FEATHER] Perfil:", state.profile);

    startUsersListener();
    renderAll();
  }, error => {
    console.error("[FEATHER] Erro ao ler perfil do Firestore:", error);
    state.profile = null;
    startUsersListener();
    renderAll();
    showToast("ERRO AO LER PERFIL // Abre F12 → Console.");
  });
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

els.episodeImageFile.addEventListener("change", () => {
  setImagePreview(els.episodeImageFile, els.episodeImagePreviewWrap, els.episodeImagePreview);
});

els.clearEpisodeImage.addEventListener("click", () => {
  clearImageInput(els.episodeImageFile, els.episodeImagePreviewWrap, els.episodeImagePreview);
});

els.campaignCoverFile.addEventListener("change", () => {
  setImagePreview(els.campaignCoverFile, els.campaignCoverPreviewWrap, els.campaignCoverPreview);
});

els.clearCampaignCover.addEventListener("click", () => {
  clearImageInput(els.campaignCoverFile, els.campaignCoverPreviewWrap, els.campaignCoverPreview);
});

els.editEpisodeImageFile.addEventListener("change", () => {
  setImagePreview(
    els.editEpisodeImageFile,
    els.editEpisodeImagePreviewWrap,
    els.editEpisodeImagePreview
  );
});

els.clearEditEpisodeImage.addEventListener("click", () => {
  clearImageInput(
    els.editEpisodeImageFile,
    els.editEpisodeImagePreviewWrap,
    els.editEpisodeImagePreview
  );
});

els.campaignForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;

  const code = normalizeCode($("#campaignCodeInput").value);
  const title = $("#campaignTitleInput").value.trim();
  if (!code || !title) return;

  const coverFile = els.campaignCoverFile.files?.[0] || null;

  try {
    validateImageFile(coverFile);
    els.campaignMessage.textContent = coverFile
      ? "A enviar imagem de capa..."
      : "A criar arquivo...";

    const coverUpload = coverFile
      ? await uploadAdminImage(coverFile, "campaigns", percent => {
          els.campaignMessage.textContent = `A enviar imagem de capa... ${percent}%`;
        })
      : { url: "", path: "" };

    els.campaignMessage.textContent = "A criar arquivo...";

    const ref = await addDoc(collection(db, "campaigns"), {
      code,
      title,
      description: $("#campaignDescriptionInput").value.trim(),
      coverUrl: coverUpload.url,
      coverPath: coverUpload.path,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });

    state.selectedCampaignId = ref.id;
    els.campaignForm.reset();
    clearImageInput(els.campaignCoverFile, els.campaignCoverPreviewWrap, els.campaignCoverPreview);
    els.campaignMessage.textContent = "";
    showToast(`ARQUIVO ${code} CRIADO.`);
  } catch (error) {
    console.error("[FEATHER] Erro ao criar arquivo:", error);
    els.campaignMessage.textContent = error?.code?.startsWith?.("storage/")
      ? storageErrorMessage(error)
      : (error.message || "Não foi possível criar o arquivo.");
  }
});

els.episodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;

  if (!els.episodeCampaign.value) {
    els.episodeMessage.textContent = "Cria primeiro um arquivo.";
    return;
  }

  const imageFile = els.episodeImageFile.files?.[0] || null;

  try {
    validateImageFile(imageFile);
    els.episodeMessage.textContent = imageFile
      ? "A enviar banner do episódio..."
      : "A publicar registo...";

    const imageUpload = imageFile
      ? await uploadAdminImage(imageFile, "episodes", percent => {
          els.episodeMessage.textContent = `A enviar banner do episódio... ${percent}%`;
        })
      : { url: "", path: "" };

    els.episodeMessage.textContent = "A publicar registo...";

    await addDoc(collection(db, "episodes"), {
      campaignId: els.episodeCampaign.value,
      number: Number($("#episodeNumber").value),
      title: $("#episodeTitleInput").value.trim(),
      date: $("#episodeDate").value,
      duration: $("#episodeDuration").value.trim(),
      status: $("#episodeStatus").value,
      imageUrl: imageUpload.url,
      imagePath: imageUpload.path,
      synopsis: $("#episodeSynopsis").value.trim(),
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });

    els.episodeForm.reset();
    clearImageInput(els.episodeImageFile, els.episodeImagePreviewWrap, els.episodeImagePreview);
    renderAdminCampaignOptions();
    els.episodeMessage.textContent = "";
    showToast("NOVO REGISTO PUBLICADO.");
  } catch (error) {
    console.error("[FEATHER] Erro ao publicar episódio:", error);
    els.episodeMessage.textContent = error?.code?.startsWith?.("storage/")
      ? storageErrorMessage(error)
      : (error.message || "Não foi possível publicar o episódio.");
  }
});

els.editEpisodeForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isAdmin()) return;

  const episodeId = els.editEpisodeId.value;
  const current = state.episodes.find(item => item.id === episodeId);

  if (!current) {
    els.editEpisodeMessage.textContent = "O episódio já não existe.";
    return;
  }

  const newImageFile = els.editEpisodeImageFile.files?.[0] || null;

  try {
    validateImageFile(newImageFile);

    let imageUrl = current.imageUrl || "";
    let imagePath = current.imagePath || "";

    if (newImageFile) {
      els.editEpisodeMessage.textContent = "A enviar novo banner...";

      const upload = await uploadAdminImage(
        newImageFile,
        "episodes",
        percent => {
          els.editEpisodeMessage.textContent = `A enviar novo banner... ${percent}%`;
        }
      );

      const oldImagePath = imagePath;
      imageUrl = upload.url;
      imagePath = upload.path;

      if (oldImagePath) {
        try {
          await deleteObject(storageRef(storage, oldImagePath));
        } catch (error) {
          console.warn("[FEATHER] Não foi possível apagar o banner antigo:", error);
        }
      }
    }

    els.editEpisodeMessage.textContent = "A guardar alterações...";

    await updateDoc(doc(db, "episodes", episodeId), {
      campaignId: els.editEpisodeCampaign.value,
      number: Number(els.editEpisodeNumber.value),
      title: els.editEpisodeName.value.trim(),
      date: els.editEpisodeDate.value,
      duration: els.editEpisodeDuration.value.trim(),
      status: els.editEpisodeStatus.value,
      synopsis: els.editEpisodeSynopsis.value.trim(),
      imageUrl,
      imagePath,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });

    els.editEpisodeMessage.textContent = "";
    closeModal(els.editEpisodeModal);
    showToast("EPISÓDIO ATUALIZADO.");
  } catch (error) {
    console.error("[FEATHER] Erro ao editar episódio:", error);
    els.editEpisodeMessage.textContent = error?.code?.startsWith?.("storage/")
      ? storageErrorMessage(error)
      : (error.message || "Não foi possível guardar as alterações.");
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

  onAuthStateChanged(auth, user => {
    state.user = user;
    state.profile = null;

    console.log("[FEATHER] Estado de autenticação:", user ? user.email : "sem sessão");

    // Atualiza imediatamente o estado visual e, depois,
    // acompanha users/{UID} em tempo real.
    renderAll();
    startProfileListener(user);
  });
} else {
  renderAll();
  showToast("SITE EM MODO DE CONFIGURAÇÃO // Preenche firebase-config.js");
}

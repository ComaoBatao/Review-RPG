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

  profileUnsubscribe: null,

  usersUnsubscribe: null

};


const $ = (selector) =>
  document.querySelector(selector);


const $$ = (selector) =>
  [...document.querySelectorAll(selector)];


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

  campaignForm: $("#campaignForm"),

  campaignMessage: $("#campaignMessage"),

  accessPanel: $("#accessPanel"),

  accessList: $("#accessList"),

  pendingCount: $("#pendingCount"),

  showAllUsersBtn: $("#showAllUsersBtn"),

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


  const date =
    new Date(`${value}T12:00:00`);


  if (Number.isNaN(date.getTime())) {

    return value;

  }


  return new Intl.DateTimeFormat(

    "pt-PT",

    {

      day: "2-digit",

      month: "2-digit",

      year: "numeric"

    }

  ).format(date);

}


function showToast(message) {

  if (!els.toast) return;


  els.toast.textContent =
    message;


  els.toast.classList.remove(
    "hidden"
  );


  clearTimeout(
    showToast._timer
  );


  showToast._timer =
    setTimeout(() => {

      els.toast.classList.add(
        "hidden"
      );

    }, 3400);

}


function openModal(element) {

  element?.classList.remove(
    "hidden"
  );

}


function closeModal(element) {

  element?.classList.add(
    "hidden"
  );

}


function isAdmin() {

  return (
    state.profile?.role ===
    "admin"
  );

}


function isApprovedReviewer() {

  return (

    state.profile?.role ===
      "reviewer"

    &&

    state.profile?.status ===
      "approved"

  );

}


function isApproved() {

  return (
    isAdmin() ||
    isApprovedReviewer()
  );

}


function canRate() {

  return Boolean(

    state.user &&

    isApproved()

  );

}


function ratingsForEpisode(
  episodeId
) {

  return state.ratings.filter(

    (rating) =>
      rating.episodeId ===
      episodeId

  );

}


function myRating(
  episodeId
) {

  if (!state.user) {

    return null;

  }


  const ratingId =
    `${episodeId}_${state.user.uid}`;


  return (

    state.ratings.find(

      (rating) =>
        rating.id ===
        ratingId

    )?.score ?? null

  );

}


function ratingStats(
  episodeId
) {

  const ratings =
    ratingsForEpisode(
      episodeId
    );


  const counts = {

    1: 0,

    2: 0,

    3: 0,

    4: 0,

    5: 0,

    6: 0

  };


  for (
    const rating
    of ratings
  ) {

    if (
      counts[
        rating.score
      ] !== undefined
    ) {

      counts[
        rating.score
      ] += 1;

    }

  }


  const max =
    Math.max(
      0,
      ...Object.values(
        counts
      )
    );


  const winners =

    max === 0

      ? []

      : Object.entries(
          counts
        )

          .filter(

            ([, count]) =>
              count === max

          )

          .map(

            ([score]) =>
              Number(score)

          );


  return {

    ratings,

    counts,

    max,

    winners

  };

}


function scoreLabel(
  score
) {

  if (
    score === 6
  ) {

    return "✦ LENDÁRIA";

  }


  if (!score) {

    return "SEM CLASSIFICAÇÃO";

  }


  return (
    `${"★".repeat(score)} ${score}/6`
  );

}


function dominantLabel(
  winners
) {

  if (
    !winners.length
  ) {

    return "SEM CLASSIFICAÇÃO";

  }


  if (
    winners.length === 1
  ) {

    return scoreLabel(
      winners[0]
    );

  }


  return (

    `EMPATE // ${

      winners

        .map(

          (score) =>

            score === 6

              ? "✦"

              : `${score}★`

        )

        .join(" + ")

    }`

  );

}


function renderSession() {

  if (!state.user) {

    els.authBtn.textContent =
      "IDENTIFICAR-SE";


    els.sessionBadge.textContent =
      "ACESSO PÚBLICO";


    els.adminBtn.classList.add(
      "hidden"
    );


    return;

  }


  const name =

    state.profile?.displayName

    ||

    state.user.email

    ||

    "INVESTIGADOR";


  els.authBtn.textContent =
    "TERMINAR SESSÃO";


  if (
    isAdmin()
  ) {

    els.sessionBadge.textContent =
      `ADMIN // ${name}`;


    els.adminBtn.classList.remove(
      "hidden"
    );


    return;

  }


  els.adminBtn.classList.add(
    "hidden"
  );


  if (

    state.profile?.status ===
    "approved"

  ) {

    els.sessionBadge.textContent =
      `REVIEWER // ${name}`;

  }

  else if (

    state.profile?.status ===
    "rejected"

  ) {

    els.sessionBadge.textContent =
      `ACESSO RECUSADO // ${name}`;

  }

  else {

    els.sessionBadge.textContent =
      `PENDENTE // ${name}`;

  }

}


function renderCampaignNav() {

  const query =
    state.search
      .toLowerCase()
      .trim();


  const filtered =
    state.campaigns.filter(

      (campaign) => {

        const haystack =

          `${
            campaign.title || ""
          } ${
            campaign.code || ""
          }`

            .toLowerCase();


        return (

          !query ||

          haystack.includes(
            query
          )

        );

      }

    );


  els.campaignNav.innerHTML =
    "";


  if (
    !filtered.length
  ) {

    const p =
      document.createElement(
        "p"
      );


    p.className =
      "form-message";


    p.textContent =

      state.campaigns.length

        ? "Nenhum arquivo corresponde à pesquisa."

        : "Nenhum arquivo criado.";


    els.campaignNav.appendChild(
      p
    );


    return;

  }


  for (
    const campaign
    of filtered
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =

      `campaign-item ${

        campaign.id ===
        state.selectedCampaignId

          ? "active"

          : ""

      }`;


    button.innerHTML = `

      <span>
        DOSSIER //
        ${safeText(
          campaign.code
        )}
      </span>

      <strong></strong>

    `;


    button
      .querySelector(
        "strong"
      )
      .textContent =
        safeText(
          campaign.title
        );


    button.addEventListener(

      "click",

      () => {

        state.selectedCampaignId =
          campaign.id;


        renderAll();


        const archiveSection =
          document.querySelector(
            ".archive-section"
          );


        if (
          archiveSection
        ) {

          window.scrollTo({

            top:
              archiveSection
                .offsetTop
              - 70,

            behavior:
              "smooth"

          });

        }

      }

    );


    els.campaignNav.appendChild(
      button
    );

  }

}


function renderAdminCampaignOptions() {

  els.episodeCampaign.innerHTML =
    "";


  if (
    !state.campaigns.length
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      "";


    option.textContent =
      "Cria primeiro um arquivo";


    els.episodeCampaign.appendChild(
      option
    );


    return;

  }


  for (
    const campaign
    of state.campaigns
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      campaign.id;


    option.textContent =

      `${safeText(
        campaign.code
      )} — ${safeText(
        campaign.title
      )}`;


    els.episodeCampaign.appendChild(
      option
    );

  }

}


function renderArchive() {

  const campaign =
    state.campaigns.find(

      (item) =>
        item.id ===
        state.selectedCampaignId

    );


  if (
    !campaign
  ) {

    els.archiveCode.textContent =
      "DOSSIER // —";


    els.archiveTitle.textContent =
      "Seleciona um arquivo";


    els.archiveDescription.textContent =
      "Os registos disponíveis aparecerão aqui.";


    els.archiveMeta.textContent =
      "";


    els.episodeGrid.innerHTML = `

      <article class="empty-card">

        <span>
          SEM DOSSIER SELECIONADO
        </span>

        <p>
          Escolhe um arquivo no índice lateral.
        </p>

      </article>

    `;


    return;

  }


  const episodes =

    state.episodes

      .filter(

        (episode) =>
          episode.campaignId ===
          campaign.id

      )

      .sort(

        (a, b) =>

          Number(
            b.number || 0
          )

          -

          Number(
            a.number || 0
          )

      );


  els.archiveCode.textContent =

    `DOSSIER // ${safeText(
      campaign.code
    )}`;


  els.archiveTitle.textContent =

    safeText(
      campaign.title
    );


  els.archiveDescription.textContent =

    safeText(

      campaign.description,

      "Arquivo de episódios registados."

    );


  let accessText =
    "PÚBLICO";


  if (
    state.user
  ) {

    accessText =
      isApproved()

        ? "AUTORIZADO"

        : "PENDENTE";

  }


  els.archiveMeta.innerHTML = `

    REGISTOS:
    <strong>
      ${episodes.length}
    </strong>

    <br>

    ACESSO:
    <strong>
      ${accessText}
    </strong>

  `;


  els.episodeGrid.innerHTML =
    "";


  if (
    !episodes.length
  ) {

    els.episodeGrid.innerHTML = `

      <article class="empty-card">

        <span>
          ARQUIVO SEM REGISTOS
        </span>

        <p>
          O administrador ainda não publicou episódios neste dossier.
        </p>

      </article>

    `;


    return;

  }


  for (
    const episode
    of episodes
  ) {

    els.episodeGrid.appendChild(

      buildEpisodeCard(
        episode,
        campaign
      )

    );

  }

}


function buildEpisodeCard(
  episode,
  campaign
) {

  const node =
    els.template
      .content
      .cloneNode(true);


  const card =
    node.querySelector(
      ".episode-card"
    );


  const img =
    node.querySelector(
      ".episode-image"
    );


  const code =

    `${safeText(
      campaign.code,
      "ARQ"
    )}-${

      String(
        episode.number || 0
      )

        .padStart(
          3,
          "0"
        )

    }`;


  const fallbackImage =

    "data:image/svg+xml;charset=UTF-8,"

    +

    encodeURIComponent(`

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="900"
        height="500"
      >

        <rect
          width="100%"
          height="100%"
          fill="#191713"
        />

        <text
          x="50%"
          y="50%"
          fill="#6f6658"
          font-family="monospace"
          font-size="30"
          text-anchor="middle"
        >
          ${code}
        </text>

      </svg>

    `);


  img.src =
    episode.imageUrl
    ||
    fallbackImage;


  img.alt =
    `Imagem do episódio ${
      episode.number || ""
    }`;


  img.onerror = () => {

    img.onerror =
      null;


    img.src =
      fallbackImage;

  };


  node
    .querySelector(
      ".episode-status"
    )
    .textContent =

      safeText(
        episode.status,
        "ARQUIVADO"
      );


  node
    .querySelector(
      ".episode-file-number"
    )
    .textContent =
      code;


  node
    .querySelector(
      ".episode-kicker"
    )
    .textContent =

      `REGISTO Nº ${

        String(
          episode.number || 0
        )

          .padStart(
            2,
            "0"
          )

      }`;


  node
    .querySelector(
      ".episode-title"
    )
    .textContent =

      safeText(

        episode.title,

        `Episódio ${
          episode.number || "?"
        }`

      );


  node
    .querySelector(
      ".episode-synopsis"
    )
    .textContent =

      safeText(

        episode.synopsis,

        "Sem resumo registado."

      );


  node
    .querySelector(
      ".episode-date"
    )
    .textContent =

      formatDate(
        episode.date
      );


  node
    .querySelector(
      ".episode-duration"
    )
    .textContent =

      safeText(
        episode.duration
      );


  const stats =
    ratingStats(
      episode.id
    );


  node
    .querySelector(
      ".episode-votes"
    )
    .textContent =

      String(
        stats.ratings.length
      );


  node
    .querySelector(
      ".dominant-rating"
    )
    .textContent =

      dominantLabel(
        stats.winners
      );


  node
    .querySelector(
      ".rating-caption"
    )
    .textContent =

      stats.ratings.length

        ? `${
            stats.max
          } voto${
            stats.max === 1
              ? ""
              : "s"
          } na classificação dominante`

        : "Ainda não existem relatórios de avaliação.";


  const distribution =
    node.querySelector(
      ".distribution"
    );


  const maxCount =
    Math.max(

      1,

      ...Object.values(
        stats.counts
      )

    );


  for (
    const score
    of [6, 5, 4, 3, 2, 1]
  ) {

    const row =
      document.createElement(
        "div"
      );


    row.className =
      "dist-row";


    const percentage =

      (
        stats.counts[
          score
        ]
        /
        maxCount
      )

      * 100;


    const label =

      score === 6

        ? "✦ LENDÁRIA"

        : `${"★".repeat(
            score
          )} ${score}`;


    row.innerHTML = `

      <span class="dist-label">
        ${label}
      </span>

      <span class="dist-track">

        <span
          class="dist-fill"
          style="width:${percentage}%"
        ></span>

      </span>

      <span class="dist-count">
        ${stats.counts[score]}
      </span>

    `;


    distribution.appendChild(
      row
    );

  }


  const myScore =
    myRating(
      episode.id
    );


  const hint =
    node.querySelector(
      ".vote-hint"
    );


  if (
    !state.user
  ) {

    hint.textContent =
      "Identificação necessária para avaliar.";

  }

  else if (
    !isApproved()
  ) {

    hint.textContent =

      state.profile?.status ===
      "rejected"

        ? "Acesso recusado pelo administrador."

        : "Pedido pendente de aprovação.";

  }

  else if (
    myScore
  ) {

    hint.textContent =

      `Avaliação atual: ${

        myScore === 6

          ? "LENDÁRIA"

          : `${myScore}/6`

      }`;

  }

  else {

    hint.textContent =
      "Seleciona uma classificação.";

  }


  const buttons =
    node.querySelector(
      ".rating-buttons"
    );


  for (
    let score = 1;
    score <= 6;
    score += 1
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =

      `rating-btn ${

        score === 6

          ? "legendary"

          : ""

      } ${

        myScore === score

          ? "active"

          : ""

      }`;


    button.title =

      score === 6

        ? "Estrela Lendária (6)"

        : `${score} estrela${
            score === 1
              ? ""
              : "s"
          }`;


    button.textContent =

      score === 6

        ? "✦"

        : "★";


    button.disabled =
      !canRate();


    button.setAttribute(

      "aria-label",

      button.title

    );


    button.addEventListener(

      "click",

      () => {

        submitRating(
          episode.id,
          score
        );

      }

    );


    buttons.appendChild(
      button
    );

  }


  if (
    !state.user
  ) {

    card
      .querySelector(
        ".your-report"
      )
      ?.addEventListener(

        "click",

        () => {

          openModal(
            els.authModal
          );

        }

      );

  }


  return node;

}


function renderAccessList() {

  if (
    !isAdmin()
  ) {

    return;

  }


  const pending =

    state.users.filter(

      (user) =>

        user.role !==
          "admin"

        &&

        (
          user.status ||
          "pending"
        ) ===
          "pending"

    );


  const list =

    state.showAllUsers

      ? state.users.filter(

          (user) =>
            user.role !==
            "admin"

        )

      : pending;


  els.pendingCount.textContent =
    String(
      pending.length
    );


  els.pendingCount
    .classList
    .toggle(

      "hidden",

      pending.length === 0

    );


  els.showAllUsersBtn.textContent =

    state.showAllUsers

      ? "VER PENDENTES"

      : "VER TODOS";


  els.accessList.innerHTML =
    "";


  if (
    !list.length
  ) {

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

      (a, b) =>

        (
          a.displayName || ""
        )

          .localeCompare(

            b.displayName || "",

            "pt"

          )

    );


  for (
    const user
    of sorted
  ) {

    const status =
      user.status ||
      "pending";


    const row =
      document.createElement(
        "div"
      );


    row.className =
      "access-row";


    row.innerHTML = `

      <div class="access-identity">

        <strong></strong>

        <small></small>

        <span
          class="access-status ${status}"
        >

          ${

            status ===
            "approved"

              ? "APROVADO"

              : status ===
                "rejected"

                ? "RECUSADO"

                : "PENDENTE"

          }

        </span>

      </div>

      <div
        class="access-actions"
      ></div>

    `;


    row
      .querySelector(
        "strong"
      )
      .textContent =

        safeText(

          user.displayName,

          "Sem nome"

        );


    row
      .querySelector(
        "small"
      )
      .textContent =

        safeText(

          user.email,

          `UID: ${user.id}`

        );


    const actions =
      row.querySelector(
        ".access-actions"
      );


    if (
      status !==
      "approved"
    ) {

      const approve =
        document.createElement(
          "button"
        );


      approve.type =
        "button";


      approve.className =
        "access-action approve";


      approve.textContent =
        "APROVAR";


      approve.addEventListener(

        "click",

        () => {

          updateAccess(

            user.id,

            "approved"

          );

        }

      );


      actions.appendChild(
        approve
      );

    }


    if (
      status !==
      "rejected"
    ) {

      const reject =
        document.createElement(
          "button"
        );


      reject.type =
        "button";


      reject.className =
        "access-action reject";


      reject.textContent =
        "RECUSAR";


      reject.addEventListener(

        "click",

        () => {

          updateAccess(

            user.id,

            "rejected"

          );

        }

      );


      actions.appendChild(
        reject
      );

    }


    els.accessList.appendChild(
      row
    );

  }

}


function startProfileListener(
  user
) {

  if (
    state.profileUnsubscribe
  ) {

    state.profileUnsubscribe();

    state.profileUnsubscribe =
      null;

  }


  if (
    !user
  ) {

    state.profile =
      null;


    startUsersListener();

    renderAll();

    return;

  }


  const profileRef =
    doc(

      db,

      "users",

      user.uid

    );


  console.log(

    "[HORXS] A procurar perfil:",

    `users/${user.uid}`

  );


  state.profileUnsubscribe =

    onSnapshot(

      profileRef,

      (snapshot) => {

        console.log(

          "[HORXS] UID AUTENTICADO:",

          user.uid

        );


        console.log(

          "[HORXS] PERFIL EXISTE:",

          snapshot.exists()

        );


        if (
          snapshot.exists()
        ) {

          state.profile =
            snapshot.data();


          console.log(

            "[HORXS] DADOS DO PERFIL:",

            state.profile

          );


          console.log(

            "[HORXS] ROLE:",

            state.profile?.role

          );

        }

        else {

          state.profile =
            null;


          console.warn(

            "[HORXS] NÃO FOI ENCONTRADO O DOCUMENTO:",

            `users/${user.uid}`

          );

        }


        startUsersListener();

        renderAll();

      },


      (error) => {

        console.error(

          "[HORXS] ERRO AO LER PERFIL:",

          error

        );


        state.profile =
          null;


        startUsersListener();

        renderAll();


        showToast(

          "ERRO AO LER PERFIL // Abre F12 → Console"

        );

      }

    );

}


function startUsersListener() {

  if (
    state.usersUnsubscribe
  ) {

    state.usersUnsubscribe();

    state.usersUnsubscribe =
      null;

  }


  if (
    !isAdmin()
  ) {

    state.users =
      [];

    return;

  }


  state.usersUnsubscribe =

    onSnapshot(

      collection(
        db,
        "users"
      ),


      (snapshot) => {

        state.users =

          snapshot.docs.map(

            (item) => ({

              id:
                item.id,

              ...item.data()

            })

          );


        console.log(

          "[HORXS] Utilizadores carregados:",

          state.users.length

        );


        renderAccessList();

      },


      (error) => {

        console.error(

          "[HORXS] Erro ao ler utilizadores:",

          error

        );


        showToast(

          "ERRO // Não foi possível ler os pedidos de acesso."

        );

      }

    );

}


async function updateAccess(
  userId,
  status
) {

  if (
    !isAdmin()
  ) {

    showToast(
      "ACESSO NEGADO // Apenas Admin."
    );

    return;

  }


  try {

    await updateDoc(

      doc(
        db,
        "users",
        userId
      ),

      {

        status,

        reviewedAt:
          serverTimestamp(),

        reviewedBy:
          state.user.uid

      }

    );


    showToast(

      status ===
      "approved"

        ? "ACESSO APROVADO // REVIEWER ATIVO"

        : "PEDIDO DE ACESSO RECUSADO"

    );

  }

  catch (
    error
  ) {

    console.error(

      "[HORXS] Erro ao atualizar acesso:",

      error

    );


    showToast(

      "ERRO // Não foi possível alterar o acesso."

    );

  }

}


async function submitRating(
  episodeId,
  score
) {

  if (
    !state.user
  ) {

    openModal(
      els.authModal
    );

    return;

  }


  if (
    !canRate()
  ) {

    showToast(

      state.profile?.status ===
      "rejected"

        ? "ACESSO RECUSADO // Não podes avaliar."

        : "PEDIDO PENDENTE // Aguarda aprovação do administrador."

    );


    return;

  }


  try {

    const ratingId =
      `${episodeId}_${state.user.uid}`;


    await setDoc(

      doc(
        db,
        "ratings",
        ratingId
      ),

      {

        episodeId,

        score,

        updatedAt:
          serverTimestamp()

      }

    );


    showToast(

      score === 6

        ? "RELATÓRIO ATUALIZADO // CLASSIFICAÇÃO LENDÁRIA ✦"

        : `RELATÓRIO ATUALIZADO // ${score}/6`

    );

  }

  catch (
    error
  ) {

    console.error(

      "[HORXS] Erro ao avaliar:",

      error

    );


    showToast(

      "ERRO // Não foi possível registar a avaliação."

    );

  }

}


function renderAll() {

  if (

    !state.selectedCampaignId

    &&

    state.campaigns.length

  ) {

    state.selectedCampaignId =
      state.campaigns[0].id;

  }


  renderSession();

  renderCampaignNav();

  renderAdminCampaignOptions();

  renderArchive();

  renderAccessList();

}


els.authBtn.addEventListener(

  "click",

  async () => {

    if (
      !configured()
    ) {

      showToast(

        "CONFIGURA PRIMEIRO O firebase-config.js"

      );

      return;

    }


    if (
      state.user
    ) {

      try {

        await signOut(
          auth
        );


        showToast(
          "SESSÃO TERMINADA."
        );

      }

      catch (
        error
      ) {

        console.error(

          "[HORXS] Erro ao terminar sessão:",

          error

        );

      }

    }

    else {

      openModal(
        els.authModal
      );

    }

  }

);


els.loginForm.addEventListener(

  "submit",

  async (
    event
  ) => {

    event.preventDefault();


    els.loginMessage.textContent =
      "A autenticar...";


    try {

      await signInWithEmailAndPassword(

        auth,

        els.emailInput
          .value
          .trim(),

        els.passwordInput
          .value

      );


      els.loginMessage.textContent =
        "";


      els.loginForm.reset();


      closeModal(
        els.authModal
      );


      showToast(
        "IDENTIFICAÇÃO CONFIRMADA."
      );

    }

    catch (
      error
    ) {

      console.error(

        "[HORXS] Erro de login:",

        error

      );


      els.loginMessage.textContent =

        "Credenciais inválidas ou acesso indisponível.";

    }

  }

);


els.registerForm.addEventListener(

  "submit",

  async (
    event
  ) => {

    event.preventDefault();


    const displayName =
      els.registerName
        .value
        .trim();


    const email =
      els.registerEmail
        .value
        .trim();


    const password =
      els.registerPassword
        .value;


    const password2 =
      els.registerPassword2
        .value;


    if (
      displayName.length < 2
    ) {

      els.registerMessage.textContent =

        "Escolhe um nick com pelo menos 2 caracteres.";


      return;

    }


    if (
      password !==
      password2
    ) {

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


      const profile = {

        displayName,

        email,

        role:
          "reviewer",

        status:
          "pending",

        createdAt:
          serverTimestamp()

      };


      await setDoc(

        doc(

          db,

          "users",

          credential.user.uid

        ),

        profile

      );


      state.profile = {

        displayName,

        email,

        role:
          "reviewer",

        status:
          "pending"

      };


      renderAll();


      els.registerForm.reset();


      els.registerMessage.textContent =
        "";


      closeModal(
        els.authModal
      );


      showToast(

        "PEDIDO ENVIADO // Aguarda aprovação do administrador."

      );

    }

    catch (
      error
    ) {

      console.error(

        "[HORXS] Erro ao criar conta:",

        error

      );


      if (

        error.code ===
        "auth/email-already-in-use"

      ) {

        els.registerMessage.textContent =

          "Já existe uma conta com esse email.";

      }

      else if (

        error.code ===
        "auth/weak-password"

      ) {

        els.registerMessage.textContent =

          "A palavra-passe é demasiado fraca.";

      }

      else if (

        error.code ===
        "auth/invalid-email"

      ) {

        els.registerMessage.textContent =

          "O email introduzido não é válido.";

      }

      else {

        els.registerMessage.textContent =

          "Não foi possível criar a identificação.";

      }

    }

  }

);


$$(
  "[data-auth-tab]"
).forEach(

  (tab) => {

    tab.addEventListener(

      "click",

      () => {

        $$(
          "[data-auth-tab]"
        ).forEach(

          (item) => {

            item.classList.toggle(

              "active",

              item === tab

            );

          }

        );


        const isLogin =

          tab.dataset.authTab ===
          "login";


        els.loginForm
          .classList
          .toggle(

            "hidden",

            !isLogin

          );


        els.registerForm
          .classList
          .toggle(

            "hidden",

            isLogin

          );


        els.loginMessage.textContent =
          "";


        els.registerMessage.textContent =
          "";

      }

    );

  }

);


els.adminBtn.addEventListener(

  "click",

  () => {

    if (
      !isAdmin()
    ) {

      showToast(

        "ACESSO NEGADO // Apenas Admin."

      );

      return;

    }


    state.showAllUsers =
      false;


    renderAccessList();


    openModal(
      els.adminModal
    );

  }

);


$$(
  "[data-tab]"
).forEach(

  (tab) => {

    tab.addEventListener(

      "click",

      () => {

        $$(
          "[data-tab]"
        ).forEach(

          (item) => {

            item.classList.toggle(

              "active",

              item === tab

            );

          }

        );


        const selected =
          tab.dataset.tab;


        els.episodeForm
          .classList
          .toggle(

            "hidden",

            selected !==
            "episode"

          );


        els.campaignForm
          .classList
          .toggle(

            "hidden",

            selected !==
            "campaign"

          );


        els.accessPanel
          .classList
          .toggle(

            "hidden",

            selected !==
            "access"

          );


        if (
          selected ===
          "access"
        ) {

          renderAccessList();

        }

      }

    );

  }

);


els.showAllUsersBtn.addEventListener(

  "click",

  () => {

    state.showAllUsers =
      !state.showAllUsers;


    renderAccessList();

  }

);


els.searchInput.addEventListener(

  "input",

  () => {

    state.search =
      els.searchInput.value;


    renderCampaignNav();

  }

);


$$(
  "[data-close]"
).forEach(

  (button) => {

    button.addEventListener(

      "click",

      () => {

        closeModal(

          document.getElementById(

            button.dataset.close

          )

        );

      }

    );

  }

);


$$(
  ".modal"
).forEach(

  (modal) => {

    modal.addEventListener(

      "click",

      (
        event
      ) => {

        if (
          event.target ===
          modal
        ) {

          closeModal(
            modal
          );

        }

      }

    );

  }

);


els.campaignForm.addEventListener(

  "submit",

  async (
    event
  ) => {

    event.preventDefault();


    if (
      !isAdmin()
    ) {

      showToast(

        "ACESSO NEGADO // Apenas Admin."

      );

      return;

    }


    const code =

      normalizeCode(

        $("#campaignCodeInput")
          .value

      );


    const title =

      $("#campaignTitleInput")
        .value
        .trim();


    if (
      !code ||
      !title
    ) {

      els.campaignMessage.textContent =

        "Preenche o código e o nome do arquivo.";


      return;

    }


    els.campaignMessage.textContent =
      "A criar arquivo...";


    try {

      const ref =

        await addDoc(

          collection(
            db,
            "campaigns"
          ),

          {

            code,

            title,

            description:

              $("#campaignDescriptionInput")
                .value
                .trim(),

            coverUrl:

              $("#campaignCoverInput")
                .value
                .trim(),

            createdAt:
              serverTimestamp(),

            createdBy:
              state.user.uid

          }

        );


      state.selectedCampaignId =
        ref.id;


      els.campaignForm.reset();


      els.campaignMessage.textContent =
        "";


      showToast(

        `ARQUIVO ${code} CRIADO.`

      );

    }

    catch (
      error
    ) {

      console.error(

        "[HORXS] Erro ao criar arquivo:",

        error

      );


      els.campaignMessage.textContent =

        "Não foi possível criar o arquivo.";

    }

  }

);


els.episodeForm.addEventListener(

  "submit",

  async (
    event
  ) => {

    event.preventDefault();


    if (
      !isAdmin()
    ) {

      showToast(

        "ACESSO NEGADO // Apenas Admin."

      );

      return;

    }


    if (
      !els.episodeCampaign.value
    ) {

      els.episodeMessage.textContent =

        "Cria primeiro um arquivo.";


      return;

    }


    const number =

      Number(

        $("#episodeNumber")
          .value

      );


    const title =

      $("#episodeTitleInput")
        .value
        .trim();


    if (

      !Number.isFinite(
        number
      )

      ||

      number < 1

      ||

      !title

    ) {

      els.episodeMessage.textContent =

        "Preenche o número e o título do episódio.";


      return;

    }


    els.episodeMessage.textContent =

      "A publicar registo...";


    try {

      await addDoc(

        collection(
          db,
          "episodes"
        ),

        {

          campaignId:
            els.episodeCampaign.value,

          number,

          title,

          date:
            $("#episodeDate").value,

          duration:
            $("#episodeDuration")
              .value
              .trim(),

          status:
            $("#episodeStatus").value,

          imageUrl:
            $("#episodeImage")
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


      els.episodeMessage.textContent =
        "";


      showToast(

        "NOVO REGISTO PUBLICADO."

      );

    }

    catch (
      error
    ) {

      console.error(

        "[HORXS] Erro ao publicar episódio:",

        error

      );


      els.episodeMessage.textContent =

        "Não foi possível publicar o episódio.";

    }

  }

);


function startPublicListeners() {

  onSnapshot(

    collection(
      db,
      "campaigns"
    ),


    (
      snapshot
    ) => {

      state.campaigns =

        snapshot.docs.map(

          (item) => ({

            id:
              item.id,

            ...item.data()

          })

        );


      state.campaigns.sort(

        (a, b) =>

          (
            a.title || ""
          )

            .localeCompare(

              b.title || "",

              "pt"

            )

      );


      if (

        state.selectedCampaignId

        &&

        !state.campaigns.some(

          (item) =>

            item.id ===
            state.selectedCampaignId

        )

      ) {

        state.selectedCampaignId =
          null;

      }


      renderAll();

    },


    (
      error
    ) => {

      console.error(

        "[HORXS] Erro ao ler arquivos:",

        error

      );


      showToast(

        "ERRO AO LER ARQUIVOS // Verifica o Firestore."

      );

    }

  );


  onSnapshot(

    collection(
      db,
      "episodes"
    ),


    (
      snapshot
    ) => {

      state.episodes =

        snapshot.docs.map(

          (item) => ({

            id:
              item.id,

            ...item.data()

          })

        );


      renderAll();

    },


    (
      error
    ) => {

      console.error(

        "[HORXS] Erro ao ler episódios:",

        error

      );


      showToast(

        "ERRO AO LER EPISÓDIOS // Verifica o Firestore."

      );

    }

  );


  onSnapshot(

    collection(
      db,
      "ratings"
    ),


    (
      snapshot
    ) => {

      state.ratings =

        snapshot.docs.map(

          (item) => ({

            id:
              item.id,

            ...item.data()

          })

        );


      renderAll();

    },


    (
      error
    ) => {

      console.error(

        "[HORXS] Erro ao ler avaliações:",

        error

      );


      showToast(

        "ERRO AO LER AVALIAÇÕES // Verifica o Firestore."

      );

    }

  );

}


if (
  configured()
) {

  console.log(
    "[HORXS] Firebase configurado."
  );


  console.log(

    "[HORXS] Project ID:",

    firebaseConfig.projectId

  );


  startPublicListeners();


  onAuthStateChanged(

    auth,

    (
      user
    ) => {

      state.user =
        user;


      state.profile =
        null;


      console.log(

        "[HORXS] ESTADO DE AUTENTICAÇÃO:",

        user
          ? user.email
          : "SEM SESSÃO"

      );


      if (
        user
      ) {

        console.log(

          "[HORXS] FIREBASE AUTH UID:",

          user.uid

        );

      }


      renderAll();


      startProfileListener(
        user
      );

    }

  );

}

else {

  console.error(

    "[HORXS] firebase-config.js não está configurado."

  );


  renderAll();


  showToast(

    "SITE EM MODO DE CONFIGURAÇÃO // Preenche firebase-config.js"

  );

}

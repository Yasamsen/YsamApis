"use strict";

/*
|--------------------------------------------------------------------------
| Yasam API Frontend
|--------------------------------------------------------------------------
| - Load API otomatis dari /api
| - Search API
| - Copy endpoint
| - Dark/light mode
| - Responsive mobile menu
|--------------------------------------------------------------------------
*/


/* =========================================================
   ELEMENTS
========================================================= */

const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

const themeBtn = document.getElementById("themeBtn");

const apiList = document.getElementById("apiList");
const apiTemplate = document.getElementById("apiTemplate");

const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");

const totalApi = document.getElementById("totalApi");
const onlineApi = document.getElementById("onlineApi");
const apiStatus = document.getElementById("apiStatus");
const lastUpdate = document.getElementById("lastUpdate");

const heroStatus = document.getElementById("heroStatus");
const year = document.getElementById("year");


/* =========================================================
   STATE
========================================================= */

let apiData = [];


/* =========================================================
   YEAR
========================================================= */

if (year) {
  year.textContent = new Date().getFullYear();
}


/* =========================================================
   MOBILE MENU
========================================================= */

if (menuBtn && navMenu) {

  menuBtn.addEventListener("click", () => {

    const isOpen = navMenu.classList.toggle("open");

    menuBtn.classList.toggle("open", isOpen);

    menuBtn.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

  });


  navMenu.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

      navMenu.classList.remove("open");

      menuBtn.classList.remove("open");

      menuBtn.setAttribute(
        "aria-expanded",
        "false"
      );

    });

  });

}


/* =========================================================
   THEME
========================================================= */

function setTheme(theme) {

  if (theme === "dark") {

    document.documentElement.classList.add("dark");

    if (themeBtn) {
      themeBtn.textContent = "☀️";
    }

  } else {

    document.documentElement.classList.remove("dark");

    if (themeBtn) {
      themeBtn.textContent = "🌙";
    }

  }

}


function loadTheme() {

  const savedTheme =
    localStorage.getItem("yasam-theme");

  if (savedTheme) {

    setTheme(savedTheme);

    return;

  }


  const prefersDark =
    window.matchMedia &&
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;


  setTheme(
    prefersDark ? "dark" : "light"
  );

}


if (themeBtn) {

  themeBtn.addEventListener("click", () => {

    const isDark =
      document.documentElement.classList.contains("dark");

    const nextTheme =
      isDark ? "light" : "dark";

    setTheme(nextTheme);

    localStorage.setItem(
      "yasam-theme",
      nextTheme
    );

  });

}


loadTheme();


/* =========================================================
   FETCH API
========================================================= */

async function loadApis() {

  try {

    setApiLoading(true);


    const response =
      await fetch("/api", {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        cache: "no-store"
      });


    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    if (!data || !Array.isArray(data.apis)) {

      throw new Error(
        "Format response API tidak valid"
      );

    }


    apiData = data.apis;


    updateStats(data);

    renderApis(apiData);

    setApiOnline(true);


  } catch (error) {

    console.error(
      "Gagal mengambil daftar API:",
      error
    );


    apiData = [];

    updateStats({
      total: 0,
      apis: []
    });

    setApiOnline(false);

    showApiError();

  }

}


/* =========================================================
   LOADING
========================================================= */

function setApiLoading(loading) {

  if (!apiList) {
    return;
  }


  if (loading) {

    apiList.innerHTML = `
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <span>Loading API...</span>
      </div>
    `;

  }

}


/* =========================================================
   UPDATE STATS
========================================================= */

function updateStats(data) {

  const total =
    Number(data.total) ||
    (Array.isArray(data.apis)
      ? data.apis.length
      : 0);


  if (totalApi) {
    totalApi.textContent = total;
  }


  if (onlineApi) {
    onlineApi.textContent = total;
  }


  if (apiStatus) {
    apiStatus.textContent = "Online";
  }


  if (lastUpdate) {

    lastUpdate.textContent =
      new Date().toLocaleTimeString(
        "id-ID",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

  }

}

/* =========================================================
   API ONLINE STATUS
========================================================= */

function setApiOnline(online) {

  if (heroStatus) {

    heroStatus.textContent =
      online
        ? "API Online"
        : "API Offline";

  }


  if (apiStatus) {

    apiStatus.textContent =
      online
        ? "Online"
        : "Offline";

  }

}


/* =========================================================
   API ERROR
========================================================= */

function showApiError() {

  if (!apiList) {
    return;
  }


  apiList.innerHTML = `
    <div class="error-card">
      <div class="error-icon">!</div>

      <h3>Gagal memuat API</h3>

      <p>
        Tidak dapat mengambil daftar API.
      </p>

      <button
        class="btn btn-primary retry-btn"
        type="button"
      >
        Coba Lagi
      </button>
    </div>
  `;


  const retry =
    apiList.querySelector(".retry-btn");


  retry?.addEventListener(
    "click",
    loadApis
  );

}


/* =========================================================
   RENDER API
========================================================= */

function renderApis(apis) {

  if (!apiList) {
    return;
  }


  apiList.innerHTML = "";


  if (!apis.length) {

    emptyState?.classList.remove(
      "hidden"
    );

    return;

  }


  emptyState?.classList.add(
    "hidden"
  );


  apis.forEach(api => {

    const card =
      apiTemplate.content
        .cloneNode(true);


    const article =
      card.querySelector(".api-card");


    const name =
      card.querySelector(".api-name");


    const description =
      card.querySelector(".api-description");


    const endpoint =
      card.querySelector(".endpoint-url");


    const method =
      card.querySelector(".method-badge");


    const icon =
      card.querySelector(".api-card-icon");


    const copyBtn =
      card.querySelector(".copy-btn");


    const docs =
      card.querySelector(".view-docs");


    const apiName =
      api.name ||
      "Unnamed API";


    const apiDescription =
      api.description ||
      "No description";


    const apiEndpoint =
      api.endpoint ||
      "#";


    const apiMethod =
      (
        api.method ||
        "GET"
      ).toUpperCase();


    name.textContent =
      apiName;


    description.textContent =
      apiDescription;


    endpoint.textContent =
      apiEndpoint;


    method.textContent =
      apiMethod;


    icon.textContent =
      apiName
        .trim()
        .charAt(0)
        .toUpperCase() ||
      "A";


    method.classList.add(
      `method-${apiMethod.toLowerCase()}`
    );


    if (docs) {

      docs.href =
        `/docs#${encodeURIComponent(
          apiEndpoint
        )}`;

    }


    if (copyBtn) {

      copyBtn.addEventListener(
        "click",
        async () => {

          await copyText(
            apiEndpoint,
            copyBtn
          );

        }
      );

    }


    apiList.appendChild(card);

  });

}


/* =========================================================
   SEARCH
========================================================= */

if (searchInput) {

  searchInput.addEventListener(
    "input",
    event => {

      const query =
        event.target.value
          .trim()
          .toLowerCase();


      if (!query) {

        renderApis(apiData);

        return;

      }


      const filtered =
        apiData.filter(api => {

          const name =
            String(
              api.name || ""
            ).toLowerCase();


          const description =
            String(
              api.description || ""
            ).toLowerCase();


          const endpoint =
            String(
              api.endpoint || ""
            ).toLowerCase();


          const method =
            String(
              api.method || ""
            ).toLowerCase();


          return (
            name.includes(query) ||
            description.includes(query) ||
            endpoint.includes(query) ||
            method.includes(query)
          );

        });


      renderApis(filtered);

    }
  );

}


/* =========================================================
   COPY TEXT
========================================================= */

async function copyText(text, button) {

  try {

    await navigator.clipboard.writeText(
      text
    );


    const oldText =
      button.textContent;


    button.textContent =
      "Copied!";


    button.classList.add(
      "copied"
    );


    setTimeout(() => {

      button.textContent =
        oldText;

      button.classList.remove(
        "copied"
      );

    }, 1500);


  } catch (error) {

    console.error(
      "Copy failed:",
      error
    );


    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.value = text;

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";


    document.body.appendChild(
      textarea
    );


    textarea.select();


    try {

      document.execCommand(
        "copy"
      );

      button.textContent =
        "Copied!";

    } catch {

      button.textContent =
        "Failed";

    }


    textarea.remove();


    setTimeout(() => {

      button.textContent =
        "Copy";

    }, 1500);

  }

}


/* =========================================================
   CLOSE MENU WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      !navMenu ||
      !menuBtn
    ) {
      return;
    }


    if (
      navMenu.classList.contains("open") &&
      !navMenu.contains(event.target) &&
      !menuBtn.contains(event.target)
    ) {

      navMenu.classList.remove(
        "open"
      );

      menuBtn.classList.remove(
        "open"
      );

      menuBtn.setAttribute(
        "aria-expanded",
        "false"
      );

    }

  }
);


/* =========================================================
   START
========================================================= */

loadApis();
"use strict";

/* =========================================================
GLOBAL ELEMENTS
========================================================= */

const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");
const themeBtn = document.getElementById("themeBtn");

const year = document.getElementById("year");

/* =========================================================
GLOBAL STATE
========================================================= */

let apiData = [];
let selectedApi = null;

/* =========================================================
YEAR
========================================================= */

if (year) {
year.textContent = new Date().getFullYear();
}

/* =========================================================
MOBILE NAVBAR
========================================================= */

if (menuBtn && navMenu) {

menuBtn.addEventListener("click", () => {

const open =
  navMenu.classList.toggle("open");

menuBtn.classList.toggle(
  "open",
  open
);

menuBtn.setAttribute(
  "aria-expanded",
  String(open)
);

});

navMenu
.querySelectorAll("a")
.forEach(link => {

  link.addEventListener(
    "click",
    () => {

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
  );

});

}

/* =========================================================
THEME
========================================================= */

function setTheme(theme) {

if (theme === "dark") {

document.documentElement
  .classList.add("dark");

if (themeBtn) {
  themeBtn.textContent = "☀️";
}

} else {

document.documentElement
  .classList.remove("dark");

if (themeBtn) {
  themeBtn.textContent = "🌙";
}

}

}

function loadTheme() {

const saved =
localStorage.getItem(
"yasam-theme"
);

if (saved) {

setTheme(saved);

return;

}

const dark =
window.matchMedia &&
window.matchMedia(
"(prefers-color-scheme: dark)"
).matches;

setTheme(
dark ? "dark" : "light"
);

}

if (themeBtn) {

themeBtn.addEventListener(
"click",
() => {

  const dark =
    document.documentElement
      .classList
      .contains("dark");


  const theme =
    dark ? "light" : "dark";


  setTheme(theme);

  localStorage.setItem(
    "yasam-theme",
    theme
  );

}

);

}

loadTheme();

/* =========================================================
COPY
========================================================= */

async function copyText(
text,
button
) {

try {

await navigator
  .clipboard
  .writeText(text);


if (button) {

  const old =
    button.textContent;

  button.textContent =
    "Copied!";

  button.classList.add(
    "copied"
  );


  setTimeout(() => {

    button.textContent =
      old;

    button.classList.remove(
      "copied"
    );

  }, 1400);

}

} catch {

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

document.execCommand("copy");

textarea.remove();


if (button) {

  button.textContent =
    "Copied!";

  setTimeout(() => {

    button.textContent =
      "Copy";

  }, 1400);

}

}

}

/* =========================================================
DOCUMENTATION DETECTION
========================================================= */

const isDocsPage =
document.body.classList.contains(
"docs-page"
);

/* =========================================================
FETCH API LIST
========================================================= */

async function fetchApis() {

const response =
await fetch(
"/api",
{
headers: {
Accept:
"application/json"
},
cache: "no-store"
}
);

if (!response.ok) {

throw new Error(
  `HTTP ${response.status}`
);

}

const data =
await response.json();

if (
!data ||
!Array.isArray(data.apis)
) {

throw new Error(
  "Invalid API response"
);

}

apiData =
data.apis;

return data;

}

/* =========================================================
HOMEPAGE
========================================================= */

if (!isDocsPage) {

const apiList =
document.getElementById(
"apiList"
);

const apiTemplate =
document.getElementById(
"apiTemplate"
);

const searchInput =
document.getElementById(
"searchInput"
);

const emptyState =
document.getElementById(
"emptyState"
);

function renderHomeApis(
list
) {

if (!apiList || !apiTemplate) {
  return;
}


apiList.innerHTML = "";


if (!list.length) {

  emptyState?.classList.remove(
    "hidden"
  );

  return;

}


emptyState?.classList.add(
  "hidden"
);


list.forEach(api => {

  const card =
    apiTemplate.content
      .cloneNode(true);


  const name =
    card.querySelector(
      ".api-name"
    );


  const description =
    card.querySelector(
      ".api-description"
    );


  const endpoint =
    card.querySelector(
      ".endpoint-url"
    );


  const method =
    card.querySelector(
      ".method-badge"
    );


  const icon =
    card.querySelector(
      ".api-card-icon"
    );


  const copy =
    card.querySelector(
      ".copy-btn"
    );


  const docs =
    card.querySelector(
      ".view-docs"
    );


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
    String(
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
      .charAt(0)
      .toUpperCase();


  method.classList.add(
    `method-${apiMethod.toLowerCase()}`
  );


  if (docs) {

    docs.href =
      `/docs#${encodeURIComponent(
        apiEndpoint
      )}`;

  }


  copy?.addEventListener(
    "click",
    () =>
      copyText(
        apiEndpoint,
        copy
      )
  );


  apiList.appendChild(card);

});

}

async function initHome() {

try {

  const data =
    await fetchApis();


  renderHomeApis(
    data.apis
  );


  const total =
    data.apis.length;


  const totalElement =
    document.getElementById(
      "totalApi"
    );


  const onlineElement =
    document.getElementById(
      "onlineApi"
    );


  const statusElement =
    document.getElementById(
      "apiStatus"
    );


  const updateElement =
    document.getElementById(
      "lastUpdate"
    );


  const heroStatus =
    document.getElementById(
      "heroStatus"
    );


  if (totalElement) {
    totalElement.textContent =
      total;
  }


  if (onlineElement) {
    onlineElement.textContent =
      total;
  }


  if (statusElement) {
    statusElement.textContent =
      "Online";
  }


  if (heroStatus) {
    heroStatus.textContent =
      "API Online";
  }


  if (updateElement) {

    updateElement.textContent =
      new Date()
        .toLocaleTimeString(
          "id-ID",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );

  }


} catch (error) {

  console.error(error);


  if (apiList) {

    apiList.innerHTML = `
      <div class="error-card">
        <div class="error-icon">!</div>
        <h3>Gagal memuat API</h3>
        <p>
          Server API tidak dapat dihubungi.
        </p>
        <button
          class="btn btn-primary retry-btn"
          type="button"
        >
          Coba Lagi
        </button>
      </div>
    `;


    apiList
      .querySelector(
        ".retry-btn"
      )
      ?.addEventListener(
        "click",
        initHome
      );

  }

}

}

searchInput?.addEventListener(
"input",
event => {

  const query =
    event.target.value
      .trim()
      .toLowerCase();


  if (!query) {

    renderHomeApis(
      apiData
    );

    return;

  }


  renderHomeApis(
    apiData.filter(api => {

      return [
        api.name,
        api.description,
        api.endpoint,
        api.method
      ]
        .map(value =>
          String(
            value || ""
          ).toLowerCase()
        )
        .some(value =>
          value.includes(query)
        );

    })
  );

}

);

initHome();

}

/* =========================================================
DOCUMENTATION
========================================================= */

if (isDocsPage) {

const sidebar =
document.getElementById(
"apiSidebar"
);

const sidebarCount =
document.getElementById(
"sidebarCount"
);

const docsSearch =
document.getElementById(
"docsSearch"
);

const docsSearchMobile =
document.getElementById(
"docsSearchMobile"
);

const docsEmpty =
document.getElementById(
"docsEmpty"
);

const documentation =
document.getElementById(
"apiDocumentation"
);

const docMethod =
document.getElementById(
"docMethod"
);

const docName =
document.getElementById(
"docName"
);

const docDescription =
document.getElementById(
"docDescription"
);

const docEndpoint =
document.getElementById(
"docEndpoint"
);

const tryMethod =
document.getElementById(
"tryMethod"
);

const tryUrl =
document.getElementById(
"tryUrl"
);

const responseExample =
document.getElementById(
"responseExample"
);

const parametersContainer =
document.getElementById(
"parametersContainer"
);

const copyEndpointBtn =
document.getElementById(
"copyEndpointBtn"
);

const docUrlCopy =
document.getElementById(
"docUrlCopy"
);

const copyResponseBtn =
document.getElementById(
"copyResponseBtn"
);

const tryApiBtn =
document.getElementById(
"tryApiBtn"
);

const sendRequestBtn =
document.getElementById(
"sendRequestBtn"
);

const tryResult =
document.getElementById(
"tryResult"
);

const responseCode =
document.getElementById(
"responseCode"
);

const mobileApiButton =
document.getElementById(
"mobileApiButton"
);

const mobileSelectedApi =
document.getElementById(
"mobileSelectedApi"
);

const mobileApiList =
document.getElementById(
"mobileApiList"
);

/* =======================================================
PARAMETER DETECTION
======================================================= */

function getParameters(api) {

if (
  Array.isArray(
    api.parameters
  )
) {

  return api.parameters;

}


if (
  api.params &&
  typeof api.params ===
    "object"
) {

  return Object.entries(
    api.params
  ).map(
    ([name, value]) => ({
      name,
      type:
        typeof value ===
        "string"
          ? value
          : "string",
      required: false,
      description: ""
    })
  );

}


const endpoint =
  String(
    api.endpoint || ""
  );


const found =
  endpoint.match(
    /[?&]([a-zA-Z0-9_]+)=/g
  );


if (!found) {
  return [];
}


return found.map(item => {

  const name =
    item
      .replace(
        /^[?&]/,
        ""
      )
      .replace(
        /=/,
        ""
      );


  return {
    name,
    type: "string",
    required: false,
    description: ""
  };

});

}

/* =======================================================
RENDER SIDEBAR
======================================================= */

function renderSidebar(
list
) {

if (!sidebar) {
  return;
}


sidebar.innerHTML = "";


if (
  sidebarCount
) {

  sidebarCount.textContent =
    list.length;

}


list.forEach(api => {

  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "api-sidebar-item";


  button.dataset.endpoint =
    api.endpoint || "";


  button.innerHTML = `
    <span class="sidebar-method">
      ${escapeHtml(
        String(
          api.method ||
          "GET"
        ).toUpperCase()
      )}
    </span>

    <span class="sidebar-name">
      ${escapeHtml(
        api.name ||
        api.endpoint ||
        "API"
      )}
    </span>
  `;


  button.addEventListener(
    "click",
    () => {

      selectApi(api);

    }
  );


  sidebar.appendChild(
    button
  );

});

}

/* =======================================================
MOBILE API LIST
======================================================= */

function renderMobileList(
list
) {

if (!mobileApiList) {
  return;
}


mobileApiList.innerHTML = "";


list.forEach(api => {

  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "mobile-api-item";


  button.innerHTML = `
    <span>
      ${escapeHtml(
        api.name ||
        api.endpoint ||
        "API"
      )}
    </span>

    <small>
      ${escapeHtml(
        String(
          api.method ||
          "GET"
        ).toUpperCase()
      )}
    </small>
  `;


  button.addEventListener(
    "click",
    () => {

      selectApi(api);

      mobileApiList
        .classList.remove(
          "open"
        );

    }
  );


  mobileApiList.appendChild(
    button
  );

});

}

/* =======================================================
SELECT API
======================================================= */

function selectApi(api) {

if (!api) {
  return;
}


selectedApi =
  api;


docsEmpty?.classList.add(
  "hidden"
);


documentation?.classList.remove(
  "hidden"
);


const method =
  String(
    api.method ||
    "GET"
  ).toUpperCase();


const endpoint =
  api.endpoint ||
  "/";


if (docMethod) {

  docMethod.textContent =
    method;

}


if (docName) {

  docName.textContent =
    api.name ||
    endpoint;

}


if (docDescription) {

  docDescription.textContent =
    api.description ||
    "Tidak ada deskripsi.";

}


if (docEndpoint) {

  docEndpoint.textContent =
    endpoint;

}


if (tryMethod) {

  tryMethod.textContent =
    method;

}


if (tryUrl) {

  tryUrl.value =
    buildAbsoluteUrl(
      endpoint
    );

}


renderParameters(
  getParameters(api)
);


renderResponse(
  api
);


document
  .querySelectorAll(
    ".api-sidebar-item"
  )
  .forEach(item => {

    item.classList.toggle(
      "selected",
      item.dataset.endpoint ===
        endpoint
    );

  });


if (
  mobileSelectedApi
) {

  mobileSelectedApi.textContent =
    api.name ||
    endpoint;

}


tryResult?.classList.add(
  "hidden"
);


if (
  window.innerWidth <=
  700
) {

  documentation?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}

}

/* =======================================================
PARAMETERS
======================================================= */

function renderParameters(
parameters
) {

if (!parametersContainer) {
  return;
}


parametersContainer.innerHTML = "";


if (!parameters.length) {

  parametersContainer.innerHTML = `
    <div class="no-parameters">
      Endpoint ini tidak memiliki
      parameter yang terdeteksi.
    </div>
  `;

  return;

}


const table =
  document.createElement(
    "div"
  );


table.className =
  "parameter-table";


table.innerHTML = `
  <div class="parameter-row parameter-head">
    <div>Name</div>
    <div>Type</div>
    <div>Required</div>
    <div>Description</div>
  </div>
`;


parameters.forEach(parameter => {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    "parameter-row";


  row.innerHTML = `
    <div>
      <code>
        ${escapeHtml(
          parameter.name ||
          "parameter"
        )}
      </code>
    </div>

    <div>
      ${escapeHtml(
        parameter.type ||
        "string"
      )}
    </div>

    <div>
      ${
        parameter.required
          ? '<span class="required">Yes</span>'
          : '<span class="optional">No</span>'
      }
    </div>

    <div>
      ${escapeHtml(
        parameter.description ||
        "-"
      )}
    </div>
  `;


  table.appendChild(
    row
  );

});


parametersContainer.appendChild(
  table
);

}

/* =======================================================
RESPONSE
======================================================= */

function renderResponse(api) {

let example;


if (
  api.responseExample !==
  undefined
) {

  example =
    api.responseExample;

} else {

  example = {
    success: true,
    message:
      "Request berhasil",
    data: {}
  };

}


if (responseExample) {

  responseExample.textContent =
    JSON.stringify(
      example,
      null,
      2
    );

}

}

/* =======================================================
TRY API
======================================================= */

async function sendRequest() {

if (!selectedApi) {
  return;
}


const url =
  tryUrl?.value.trim();


if (!url) {
  return;
}


if (tryResult) {

  tryResult.classList.remove(
    "hidden"
  );

}


if (responseCode) {

  responseCode.textContent =
    "Loading...";

}


try {

  const response =
    await fetch(
      url,
      {
        method:
          String(
            selectedApi.method ||
            "GET"
          ).toUpperCase(),
        headers: {
          Accept:
            "application/json"
        }
      }
    );


  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  let result;


  if (
    contentType.includes(
      "application/json"
    )
  ) {

    result =
      await response.json();

  } else {

    result =
      await response.text();

  }


  if (responseCode) {

    responseCode.textContent =
      typeof result ===
        "string"
        ? result
        : JSON.stringify(
            result,
            null,
            2
          );

  }

} catch (error) {

  if (responseCode) {

    responseCode.textContent =
      JSON.stringify(
        {
          success: false,
          error:
            error.message
        },
        null,
        2
      );

  }

}

}

sendRequestBtn?.addEventListener(
"click",
sendRequest
);

tryApiBtn?.addEventListener(
"click",
() => {

  document
    .querySelector(
      ".try-box"
    )
    ?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  tryUrl?.focus();

}

);

/* =======================================================
COPY BUTTONS
======================================================= */

copyEndpointBtn?.addEventListener(
"click",
() => {

  if (!selectedApi) {
    return;
  }


  copyText(
    buildAbsoluteUrl(
      selectedApi.endpoint
    ),
    copyEndpointBtn
  );

}

);

docUrlCopy?.addEventListener(
"click",
() => {

  if (!selectedApi) {
    return;
  }


  copyText(
    buildAbsoluteUrl(
      selectedApi.endpoint
    ),
    docUrlCopy
  );

}

);

copyResponseBtn?.addEventListener(
"click",
() => {

  copyText(
    responseExample?.textContent ||
      "{}",
    copyResponseBtn
  );

}

);

/* =======================================================
SEARCH
======================================================= */

function filterApis(query) {

query =
  query
    .trim()
    .toLowerCase();


if (!query) {
  return apiData;
}


return apiData.filter(
  api => {

    return [
      api.name,
      api.description,
      api.endpoint,
      api.method
    ]
      .map(value =>
        String(
          value || ""
        ).toLowerCase()
      )
      .some(value =>
        value.includes(query)
      );

  }
);

}

docsSearch?.addEventListener(
"input",
event => {

  const list =
    filterApis(
      event.target.value
    );


  renderSidebar(list);

  renderMobileList(list);

}

);

docsSearchMobile?.addEventListener(
"input",
event => {

  const list =
    filterApis(
      event.target.value
    );


  renderSidebar(list);

  renderMobileList(list);

}

);

/* =======================================================
MOBILE SELECTOR
======================================================= */

mobileApiButton?.addEventListener(
"click",
() => {

  mobileApiList?.classList.toggle(
    "open"
  );

}

);

/* =======================================================
HELPERS
======================================================= */

function buildAbsoluteUrl(
endpoint
) {

if (!endpoint) {
  return "";
}


if (
  endpoint.startsWith(
    "http://"
  ) ||
  endpoint.startsWith(
    "https://"
  )
) {

  return endpoint;

}


return (
  window.location.origin +
  (
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`
  )
);

}

function escapeHtml(
value
) {

return String(
  value ?? ""
)
  .replace(
    /&/g,
    "&amp;"
  )
  .replace(
    /</g,
    "&lt;"
  )
  .replace(
    />/g,
    "&gt;"
  )
  .replace(
    /"/g,
    "&quot;"
  )
  .replace(
    /'/g,
    "&#039;"
  );

}

/* =======================================================
INIT DOCS
======================================================= */

async function initDocs() {

try {

  const data =
    await fetchApis();


  renderSidebar(
    data.apis
  );


  renderMobileList(
    data.apis
  );


  /*
   * Open API from URL hash
   */

  const hash =
    decodeURIComponent(
      window.location.hash
        .replace(
          /^#/,
          ""
        )
    );


  if (hash) {

    const found =
      data.apis.find(
        api =>
          api.endpoint ===
          hash
      );


    if (found) {

      selectApi(found);

      return;

    }

  }


  /*
   * Automatically select first API
   */

  if (data.apis.length) {

    selectApi(
      data.apis[0]
    );

  }

} catch (error) {

  console.error(
    "Documentation error:",
    error
  );


  if (sidebar) {

    sidebar.innerHTML = `
      <div class="docs-error">
        Gagal memuat API.
      </div>
    `;

  }

}

}

initDocs();

}
(() => {

  "use strict";

  const $ = (selector) => document.querySelector(selector);

  let apis = [];


  /* =========================================================
     ESCAPE HTML
     ========================================================= */

  function esc(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  }


  /* =========================================================
     COPY
     ========================================================= */

  function copy(text, button) {

    if (!text) return;

    const original = button ? button.textContent : "";

    if (navigator.clipboard) {

      navigator.clipboard
        .writeText(text)
        .then(() => {

          if (!button) return;

          button.textContent = "Copied!";

          setTimeout(() => {
            button.textContent = original;
          }, 1000);

        })
        .catch(() => {

          prompt("Copy:", text);

        });

    } else {

      prompt("Copy:", text);

    }

  }


  /* =========================================================
     THEME
     ========================================================= */

  function theme() {

    const saved = localStorage.getItem("theme");

    if (saved === "light") {

      document.documentElement.dataset.theme = "light";

    }

    const button = $("#theme");

    if (!button) return;

    button.textContent =
      document.documentElement.dataset.theme === "light"
        ? "☀"
        : "☾";


    button.onclick = () => {

      const isLight =
        document.documentElement.dataset.theme === "light";

      document.documentElement.dataset.theme =
        isLight ? "" : "light";

      localStorage.setItem(
        "theme",
        isLight ? "dark" : "light"
      );

      button.textContent =
        isLight ? "☾" : "☀";

    };

  }


  /* =========================================================
     FILTER
     ========================================================= */

  function filter(query) {

    query = String(query || "").toLowerCase().trim();

    const result = apis.filter((api) => {

      return (
        String(api.name || "")
          .toLowerCase()
          .includes(query) ||

        String(api.endpoint || "")
          .toLowerCase()
          .includes(query) ||

        String(api.description || "")
          .toLowerCase()
          .includes(query)
      );

    });


    renderHome(result);
    renderDocs(result);

  }


  /* =========================================================
     HOME API GRID
     ========================================================= */

  function renderHome(list) {

    const grid = $("#grid");

    if (!grid) return;


    if (!list.length) {

      grid.innerHTML = `
        <div class="empty">
          API tidak ditemukan.
        </div>
      `;

      return;

    }


    grid.innerHTML = list.map((api) => {

      return `
        <article class="card">

          <div>

            <span class="method">
              ${esc(api.method || "GET")}
            </span>

            <button
              class="copy"
              data-copy="${esc(api.endpoint || "")}"
              type="button"
            >
              Copy
            </button>

          </div>

          <h3>
            ${esc(api.name || "Unnamed API")}
          </h3>

          <p>
            ${esc(api.description || "")}
          </p>

          <code>
            ${esc(api.endpoint || "")}
          </code>

          <a
            href="/docs#${encodeURIComponent(api.endpoint || "")}"
          >
            View documentation →
          </a>

        </article>
      `;

    }).join("");


    grid
      .querySelectorAll(".copy")
      .forEach((button) => {

        button.onclick = () => {

          copy(
            button.dataset.copy,
            button
          );

        };

      });

  }


  /* =========================================================
     PARAMETERS
     ========================================================= */

  function param(api) {

    const rows =
      Object.entries(api.parameters || {});


    if (!rows.length) {

      return `
        <p class="muted">
          Tidak ada parameter.
        </p>
      `;

    }


    return `
      <div class="params">

        <div class="prow head">

          <span>Name</span>
          <span>Type</span>
          <span>Required</span>
          <span>Description</span>

        </div>

        ${rows.map(([name, parameter]) => {

          parameter = parameter || {};

          return `
            <div class="prow">

              <code>
                ${esc(name)}
              </code>

              <span>
                ${esc(parameter.type || "string")}
              </span>

              <span>
                ${parameter.required ? "Yes" : "No"}
              </span>

              <span>
                ${esc(parameter.description || "")}
              </span>

            </div>
          `;

        }).join("")}

      </div>
    `;

  }


  /* =========================================================
     DOCUMENTATION
     ========================================================= */

  function renderDocs(list) {

    const docs = $("#docs");
    const side = $("#side");


    if (!docs) return;


    /* -------------------------
       SIDEBAR
       ------------------------- */

    if (side) {

      if (!list.length) {

        side.innerHTML = `
          <p class="muted">
            API tidak ditemukan.
          </p>
        `;

      } else {

        side.innerHTML = list.map((api) => {

          return `
            <a
              href="#${encodeURIComponent(api.endpoint || "")}"
            >

              <span class="method mini">
                ${esc(api.method || "GET")}
              </span>

              <span>
                ${esc(api.name || "Unnamed API")}
              </span>

            </a>
          `;

        }).join("");

      }

    }


    /* -------------------------
       DOCUMENTATION CONTENT
       ------------------------- */

    if (!list.length) {

      docs.innerHTML = `
        <div class="empty">
          API tidak ditemukan.
        </div>
      `;

      return;

    }


    docs.innerHTML = list.map((api) => {

      const request =
        api.example?.request ||
        api.endpoint ||
        "";

      const response =
        api.example?.response ||
        {
          success: true
        };


      return `
        <article
          class="doc"
          id="${encodeURIComponent(api.endpoint || "")}"
        >

          <div class="dochead">

            <div class="doc-info">

              <div class="endpoint-line">

                <span class="method">
                  ${esc(api.method || "GET")}
                </span>

                <code>
                  ${esc(api.endpoint || "")}
                </code>

              </div>

              <h2>
                ${esc(api.name || "Unnamed API")}
              </h2>

              <p>
                ${esc(api.description || "")}
              </p>

            </div>


            <div class="doc-actions">

              <button
                class="btn copydoc"
                data-copy="${esc(api.endpoint || "")}"
                type="button"
              >
                Copy
              </button>

              <button
                class="btn primary try"
                type="button"
              >
                Try API
              </button>

            </div>

          </div>


          <h3>
            Parameters
          </h3>

          ${param(api)}


          <div class="examples">

            <div>

              <h3>
                Example Request
              </h3>

              <pre>${esc(request)}</pre>

            </div>


            <div>

              <h3>
                Example Response
              </h3>

              <pre>${esc(
                JSON.stringify(
                  response,
                  null,
                  2
                )
              )}</pre>

            </div>

          </div>


          <div
            class="trybox"
            hidden
          >

            <div class="tryrow">

              <input
                type="text"
                value="${esc(request)}"
                autocomplete="off"
                spellcheck="false"
              >

              <button
                class="btn primary run"
                type="button"
              >
                Send Request
              </button>

            </div>


            <pre class="out">Ready.</pre>

          </div>

        </article>
      `;

    }).join("");


    /* =========================================================
       COPY DOCUMENTATION
       ========================================================= */

    docs
      .querySelectorAll(".copydoc")
      .forEach((button) => {

        button.onclick = () => {

          copy(
            button.dataset.copy,
            button
          );

        };

      });


    /* =========================================================
       TRY API BUTTON
       ========================================================= */

    docs
      .querySelectorAll(".try")
      .forEach((button) => {

        button.onclick = () => {

          const doc =
            button.closest(".doc");

          if (!doc) return;

          const box =
            doc.querySelector(".trybox");

          if (!box) return;

          box.hidden = !box.hidden;

        };

      });


    /* =========================================================
       SEND REQUEST
       ========================================================= */

    docs
      .querySelectorAll(".run")
      .forEach((button) => {

        button.onclick = async () => {

          const box =
            button.closest(".trybox");

          if (!box) return;

          const input =
            box.querySelector("input");

          const output =
            box.querySelector(".out");


          if (!input || !output) return;


          const value =
            input.value.trim();


          if (!value) {

            output.textContent =
              "Request URL kosong.";

            return;

          }


          output.textContent =
            "Loading...";


          try {

            const start =
              performance.now();


            const url =
              new URL(
                value,
                location.origin
              );


            const response =
              await fetch(url.href);


            const text =
              await response.text();


            let result;


            try {

              result =
                JSON.stringify(
                  JSON.parse(text),
                  null,
                  2
                );

            } catch {

              result = text;

            }


            const elapsed =
              Math.round(
                performance.now() - start
              );


            output.textContent =
              `HTTP ${response.status} • ${elapsed} ms\n\n${result}`;

          } catch (error) {

            output.textContent =
              "Request failed: " +
              error.message;

          }

        };

      });

  }


  /* =========================================================
     LOAD API
     ========================================================= */

  async function load() {

    try {

      const start =
        performance.now();


      const response =
        await fetch("/api");


      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }


      const data =
        await response.json();


      apis =
        Array.isArray(data.apis)
          ? data.apis
          : [];


      const total = $("#total");
      const online = $("#online");
      const time = $("#time");


      if (total) {

        total.textContent =
          apis.length;

      }


      if (online) {

        online.textContent =
          apis.length;

      }


      if (time) {

        time.textContent =
          Math.round(
            performance.now() - start
          ) + "ms";

      }


      renderHome(apis);
      renderDocs(apis);


    } catch (error) {

      const grid = $("#grid");
      const docs = $("#docs");


      if (grid) {

        grid.innerHTML = `
          <div class="empty">

            Gagal memuat API.

            <button
              type="button"
              onclick="location.reload()"
            >
              Retry
            </button>

          </div>
        `;

      }


      if (docs) {

        docs.innerHTML = `
          <div class="empty">
            Gagal memuat dokumentasi.
          </div>
        `;

      }

      console.error(
        "Yasam API:",
        error
      );

    }

  }


  /* =========================================================
     SEARCH
     ========================================================= */

  const search =
    $("#search");


  if (search) {

    search.addEventListener(
      "input",
      (event) => {

        filter(
          event.target.value
        );

      }
    );

  }


  /* =========================================================
     YEAR
     ========================================================= */

  const year =
    $("#year");


  if (year) {

    year.textContent =
      new Date().getFullYear();

  }


  /* =========================================================
     INITIALIZE
     ========================================================= */

  theme();
  load();


})();
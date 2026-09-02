(() => {

  const $ = selector => document.querySelector(selector);

  let apis = [];


  /* =========================================================
     ESCAPE HTML
     ========================================================= */

  function esc(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  /* =========================================================
     COPY
     ========================================================= */

  function copy(text, button) {

    if (!button) return;

    navigator.clipboard
      ?.writeText(text)
      .then(() => {

        const oldText = button.textContent;

        button.textContent = "Copied!";

        setTimeout(() => {
          button.textContent = oldText;
        }, 1000);

      })
      .catch(() => {

        prompt("Copy:", text);

      });

  }


  /* =========================================================
     THEME
     ========================================================= */

  function theme() {

    const saved = localStorage.getItem("theme");

    if (saved === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }


    const button = $("#theme");

    if (!button) return;


    function updateIcon() {

      const light =
        document.documentElement.dataset.theme === "light";

      button.textContent = light ? "☀" : "☾";

    }


    updateIcon();


    button.onclick = () => {

      const light =
        document.documentElement.dataset.theme === "light";


      if (light) {

        delete document.documentElement.dataset.theme;

        localStorage.setItem("theme", "dark");

      } else {

        document.documentElement.dataset.theme = "light";

        localStorage.setItem("theme", "light");

      }


      updateIcon();

    };

  }


  /* =========================================================
     FILTER
     ========================================================= */

  function filter(query) {

    query = String(query || "").toLowerCase().trim();


    const result = apis.filter(api => {

      return (

        String(api.name || "")
          .toLowerCase()
          .includes(query)

        ||

        String(api.endpoint || "")
          .toLowerCase()
          .includes(query)

        ||

        String(api.description || "")
          .toLowerCase()
          .includes(query)

        ||

        String(api.method || "")
          .toLowerCase()
          .includes(query)

      );

    });


    renderHome(result);

    renderDocs(result);

  }


  /* =========================================================
     HOME API CARDS
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


    grid.innerHTML = list.map(api => {

      return `
        <article class="card">

          <div>
            <span class="method">
              ${esc(api.method || "GET")}
            </span>

            <button
              class="copy"
              type="button"
              data-copy="${esc(api.endpoint || "")}"
            >
              Copy
            </button>
          </div>

          <h3>
            ${esc(api.name || "Unnamed API")}
          </h3>

          <p>
            ${esc(api.description || "No description")}
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
      .forEach(button => {

        button.onclick = () => {

          copy(
            button.dataset.copy || "",
            button
          );

        };

      });

  }


  /* =========================================================
     PARAMETERS
     ========================================================= */

  function param(api) {

    const parameters =
      api.parameters &&
      typeof api.parameters === "object"
        ? Object.entries(api.parameters)
        : [];


    if (!parameters.length) {

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

        ${parameters.map(([name, parameter]) => {

          parameter =
            parameter &&
            typeof parameter === "object"
              ? parameter
              : {};


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


    if (side) {

      if (!list.length) {

        side.innerHTML = `
          <div class="muted side-empty">
            API tidak ditemukan.
          </div>
        `;

      } else {

        side.innerHTML = list.map(api => {

          return `
            <a
              href="#${encodeURIComponent(api.endpoint || "")}"
            >

              <span class="method mini">
                ${esc(api.method || "GET")}
              </span>

              <span class="side-name">
                ${esc(api.name || "Unnamed API")}
              </span>

            </a>
          `;

        }).join("");

      }

    }


    if (!list.length) {

      docs.innerHTML = `
        <div class="empty">
          Dokumentasi API tidak ditemukan.
        </div>
      `;

      return;

    }


    docs.innerHTML = list.map(api => {

      const request =
        api.example?.request ||
        api.endpoint ||
        "";


      const response =
        api.example?.response ||
        {
          success: true
        };


      const endpoint =
        api.endpoint ||
        "";


      const encodedId =
        encodeURIComponent(endpoint);


      return `

        <article
          class="doc"
          id="${encodedId}"
        >

          <div class="dochead">

            <div class="doc-info">

              <div class="endpoint-line">

                <span class="method">
                  ${esc(api.method || "GET")}
                </span>

                <code>
                  ${esc(endpoint)}
                </code>

              </div>


              <h2>
                ${esc(api.name || "Unnamed API")}
              </h2>


              <p>
                ${esc(api.description || "No description")}
              </p>

            </div>


            <div class="doc-actions">

              <button
                class="btn copydoc"
                type="button"
                data-copy="${esc(endpoint)}"
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
                JSON.stringify(response, null, 2)
              )}</pre>

            </div>

          </div>


          <div class="trybox" hidden>

            <div class="tryrow">

              <input
                type="text"
                value="${esc(request)}"
                aria-label="API request"
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


    /* =======================================================
       COPY DOC
       ======================================================= */

    docs
      .querySelectorAll(".copydoc")
      .forEach(button => {

        button.onclick = () => {

          copy(
            button.dataset.copy || "",
            button
          );

        };

      });


    /* =======================================================
       TRY API
       ======================================================= */

    docs
      .querySelectorAll(".try")
      .forEach(button => {

        button.onclick = () => {

          const article =
            button.closest(".doc");

          if (!article) return;


          const box =
            article.querySelector(".trybox");

          if (!box) return;


          box.hidden = !box.hidden;

        };

      });


    /* =======================================================
       SEND REQUEST
       ======================================================= */

    docs
      .querySelectorAll(".run")
      .forEach(button => {

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

            const url =
              new URL(
                value,
                location.origin
              );


            const start =
              performance.now();


            const response =
              await fetch(url);


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
        await fetch("/api", {
          cache: "no-store"
        });


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


      if ($("#total")) {

        $("#total").textContent =
          apis.length;

      }


      if ($("#online")) {

        $("#online").textContent =
          apis.length;

      }


      if ($("#time")) {

        $("#time").textContent =
          Math.round(
            performance.now() - start
          ) + "ms";

      }


      renderHome(apis);

      renderDocs(apis);


    } catch (error) {

      console.error(error);


      if ($("#grid")) {

        $("#grid").innerHTML = `
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


      if ($("#docs")) {

        $("#docs").innerHTML = `
          <div class="empty">
            Gagal memuat dokumentasi.
          </div>
        `;

      }


      if ($("#side")) {

        $("#side").innerHTML = `
          <div class="muted">
            Gagal memuat API.
          </div>
        `;

      }

    }

  }


  /* =========================================================
     SEARCH
     ========================================================= */

  const search = $("#search");

  if (search) {

    search.addEventListener(
      "input",
      event => {

        filter(event.target.value);

      }
    );

  }


  /* =========================================================
     YEAR
     ========================================================= */

  const year = $("#year");

  if (year) {

    year.textContent =
      new Date().getFullYear();

  }


  /* =========================================================
     THEME
     ========================================================= */

  theme();


  /* =========================================================
     LOAD
     ========================================================= */

  load();


})();
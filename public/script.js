(() => {

  "use strict";


  /* ======================================================
     HELPER
     ====================================================== */

  const $ = selector =>
    document.querySelector(selector);


  let apis = [];



  /* ======================================================
     ESCAPE HTML
     ====================================================== */

  function esc(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }



  /* ======================================================
     COPY
     ====================================================== */

  async function copy(text, button) {

    if (!button) return;


    const old =
      button.textContent;


    try {

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {

        await navigator.clipboard.writeText(text);

      } else {

        const textarea =
          document.createElement("textarea");

        textarea.value = text;

        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

      }


      button.textContent =
        "Copied!";


      setTimeout(() => {

        button.textContent =
          old;

      }, 1000);


    } catch {

      prompt(
        "Copy:",
        text
      );

    }

  }



  /* ======================================================
     THEME
     ====================================================== */

  function initTheme() {

    const saved =
      localStorage.getItem("theme");


    if (saved === "light") {

      document.documentElement
        .setAttribute(
          "data-theme",
          "light"
        );

    } else {

      document.documentElement
        .removeAttribute(
          "data-theme"
        );

    }


    const button =
      $("#theme");


    if (!button) return;


    function update() {

      const light =
        document.documentElement
          .getAttribute("data-theme")
          === "light";


      button.textContent =
        light ? "☀" : "☾";

    }


    update();


    button.addEventListener(
      "click",
      () => {

        const light =
          document.documentElement
            .getAttribute("data-theme")
            === "light";


        if (light) {

          document.documentElement
            .removeAttribute(
              "data-theme"
            );

          localStorage.setItem(
            "theme",
            "dark"
          );

        } else {

          document.documentElement
            .setAttribute(
              "data-theme",
              "light"
            );

          localStorage.setItem(
            "theme",
            "light"
          );

        }


        update();

      }
    );

  }



  /* ======================================================
     SEARCH FILTER
     ====================================================== */

  function filter(query) {

    const q =
      String(query || "")
        .trim()
        .toLowerCase();


    const result =
      apis.filter(api => {

        const name =
          String(api.name || "")
            .toLowerCase();

        const endpoint =
          String(api.endpoint || "")
            .toLowerCase();

        const description =
          String(api.description || "")
            .toLowerCase();

        const method =
          String(api.method || "")
            .toLowerCase();


        return (
          name.includes(q) ||
          endpoint.includes(q) ||
          description.includes(q) ||
          method.includes(q)
        );

      });


    renderHome(result);

    renderDocs(result);

  }



  /* ======================================================
     HOME API GRID
     ====================================================== */

  function renderHome(list) {

    const grid =
      $("#grid");


    if (!grid) return;


    if (!list.length) {

      grid.innerHTML = `
        <div class="empty">
          API tidak ditemukan.
        </div>
      `;

      return;

    }


    grid.innerHTML =
      list.map(api => {

        const endpoint =
          api.endpoint || "";


        return `

          <article class="card">

            <div>

              <span class="method">
                ${esc(api.method || "GET")}
              </span>


              <button
                class="copy"
                type="button"
                data-copy="${esc(endpoint)}"
              >
                Copy
              </button>

            </div>


            <h3>
              ${esc(
                api.name ||
                "Unnamed API"
              )}
            </h3>


            <p>
              ${esc(
                api.description ||
                "No description"
              )}
            </p>


            <code>
              ${esc(endpoint)}
            </code>


            <a
              href="/docs#${encodeURIComponent(endpoint)}"
            >
              View documentation →
            </a>

          </article>

        `;

      }).join("");


    grid
      .querySelectorAll(".copy")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            copy(
              button.dataset.copy || "",
              button
            );

          }
        );

      });

  }



  /* ======================================================
     PARAMETER TABLE
     ====================================================== */

  function renderParameters(api) {

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

      <div class="params-wrap">

        <div class="params">

          <div class="prow head">

            <span>Name</span>

            <span>Type</span>

            <span>Required</span>

            <span>Description</span>

          </div>


          ${parameters.map(
            ([name, value]) => {

              const parameter =
                value &&
                typeof value === "object"
                  ? value
                  : {};


              return `

                <div class="prow">

                  <code>
                    ${esc(name)}
                  </code>

                  <span>
                    ${esc(
                      parameter.type ||
                      "string"
                    )}
                  </span>

                  <span>
                    ${
                      parameter.required
                        ? "Yes"
                        : "No"
                    }
                  </span>

                  <span>
                    ${esc(
                      parameter.description ||
                      ""
                    )}
                  </span>

                </div>

              `;

            }
          ).join("")}

        </div>

      </div>

    `;

  }



  /* ======================================================
     API SIDEBAR
     ====================================================== */

  function createApiLinks(list) {

    if (!list.length) {

      return `
        <div class="side-empty">
          API tidak ditemukan.
        </div>
      `;

    }


    return list.map(api => {

      const endpoint =
        api.endpoint || "";


      return `

        <a
          href="#${encodeURIComponent(endpoint)}"
        >

          <span class="method mini">
            ${esc(
              api.method || "GET"
            )}
          </span>

          <span class="side-name">
            ${esc(
              api.name ||
              "Unnamed API"
            )}
          </span>

        </a>

      `;

    }).join("");

  }



  /* ======================================================
     DOCUMENTATION
     ====================================================== */

  function renderDocs(list) {

    const docs =
      $("#docs");


    const side =
      $("#side");


    const mobileSide =
      $("#mobileSide");


    if (!docs) return;



    /* SIDEBAR */

    if (side) {

      side.innerHTML =
        createApiLinks(list);

    }


    /* MOBILE SIDEBAR */

    if (mobileSide) {

      mobileSide.innerHTML =
        createApiLinks(list);

    }



    /* EMPTY */

    if (!list.length) {

      docs.innerHTML = `

        <div class="empty">

          Dokumentasi API tidak ditemukan.

        </div>

      `;

      return;

    }



    /* DOCS */

    docs.innerHTML =
      list.map(api => {

        const endpoint =
          api.endpoint || "";


        const request =
          api.example?.request ||
          endpoint;


        const response =
          api.example?.response ||
          {
            success: true
          };


        const id =
          encodeURIComponent(endpoint);


        return `

          <article
            class="doc"
            id="${id}"
          >


            <div class="dochead">


              <div class="doc-info">


                <div class="endpoint-line">


                  <span class="method">

                    ${esc(
                      api.method ||
                      "GET"
                    )}

                  </span>


                  <div class="endpoint-scroll">

                    <code>
                      ${esc(endpoint)}
                    </code>

                  </div>


                </div>



                <h2>

                  ${esc(
                    api.name ||
                    "Unnamed API"
                  )}

                </h2>



                <p>

                  ${esc(
                    api.description ||
                    "No description"
                  )}

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


            ${renderParameters(api)}



            <div class="examples">


              <div class="example-box">

                <h3>
                  Example Request
                </h3>


                <pre>${esc(request)}</pre>

              </div>



              <div class="example-box">

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



    /* ====================================================
       COPY BUTTONS
       ==================================================== */

    docs
      .querySelectorAll(".copydoc")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            copy(
              button.dataset.copy || "",
              button
            );

          }
        );

      });



    /* ====================================================
       TRY BUTTONS
       ==================================================== */

    docs
      .querySelectorAll(".try")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const article =
              button.closest(".doc");


            if (!article) return;


            const box =
              article.querySelector(
                ".trybox"
              );


            if (!box) return;


            box.hidden =
              !box.hidden;

          }
        );

      });



    /* ====================================================
       RUN BUTTONS
       ==================================================== */

    docs
      .querySelectorAll(".run")
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            const box =
              button.closest(
                ".trybox"
              );


            if (!box) return;


            const input =
              box.querySelector(
                "input"
              );


            const output =
              box.querySelector(
                ".out"
              );


            if (!input || !output) {
              return;
            }


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

                result =
                  text;

              }


              const elapsed =
                Math.round(
                  performance.now() -
                  start
                );


              output.textContent =
                `HTTP ${response.status} • ${elapsed} ms\n\n${result}`;


            } catch (error) {

              output.textContent =
                "Request failed: " +
                error.message;

            }

          }
        );

      });

  }



  /* ======================================================
     LOAD API
     ====================================================== */

  async function load() {

    try {

      const start =
        performance.now();


      const response =
        await fetch(
          "/api",
          {
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


      apis =
        Array.isArray(data.apis)
          ? data.apis
          : [];


      /* HOME STATS */

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
            performance.now() -
            start
          ) + "ms";

      }


      renderHome(apis);

      renderDocs(apis);


    } catch (error) {

      console.error(
        "Yasam API:",
        error
      );


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

          <div class="side-empty">

            Gagal memuat API.

          </div>

        `;

      }


      if ($("#mobileSide")) {

        $("#mobileSide").innerHTML = `

          <div class="side-empty">

            Gagal memuat API.

          </div>

        `;

      }

    }

  }



  /* ======================================================
     SEARCH DESKTOP
     ====================================================== */

  const search =
    $("#search");


  if (search) {

    search.addEventListener(
      "input",
      event => {

        filter(
          event.target.value
        );

      }
    );

  }



  /* ======================================================
     SEARCH MOBILE
     ====================================================== */

  const mobileSearch =
    $("#mobileSearch");


  if (mobileSearch) {

    mobileSearch.addEventListener(
      "input",
      event => {

        filter(
          event.target.value
        );

      }
    );

  }



  /* ======================================================
     YEAR
     ====================================================== */

  const year =
    $("#year");


  if (year) {

    year.textContent =
      new Date().getFullYear();

  }



  /* ======================================================
     INIT
     ====================================================== */

  initTheme();

  load();


})();
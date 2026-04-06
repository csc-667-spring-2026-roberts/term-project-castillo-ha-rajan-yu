"use strict";
(() => {
  // src/client/lobby.ts
  function main() {
    console.log("Lobby client loaded");
    const gamesList = document.getElementById("games-list");
    const currentUserEmail = gamesList.dataset.currentEmail ?? "";
    const currentUserIsAdmin = gamesList.dataset.isAdmin === "true";
    const createBtn = document.getElementById("create-game");
    const refreshBtn = document.getElementById("refresh-games");
    const m8LastAction = document.getElementById("m8-last-action");
    const m8FetchCount = document.getElementById("m8-fetch-count");
    const m8DomCount = document.getElementById("m8-dom-count");
    const m8LastUpdate = document.getElementById("m8-last-update");
    let fetchCount = 0;
    let domUpdateCount = 0;
    function markAction(message) {
      if (m8LastAction) m8LastAction.textContent = message;
    }
    function markFetch() {
      fetchCount += 1;
      if (m8FetchCount) m8FetchCount.textContent = String(fetchCount);
    }
    function markDomUpdate() {
      domUpdateCount += 1;
      if (m8DomCount) m8DomCount.textContent = String(domUpdateCount);
      if (m8LastUpdate) m8LastUpdate.textContent = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    }
    async function loadGames() {
      try {
        markAction("Fetching /api/games (GET)");
        markFetch();
        const res = await fetch("/api/games");
        const data = await res.json();
        const games = data.games;
        gamesList.textContent = "";
        if (games.length === 0) {
          const emptyTemplate = document.getElementById("empty-template");
          if (emptyTemplate instanceof HTMLTemplateElement) {
            gamesList.appendChild(emptyTemplate.content.cloneNode(true));
          }
          markDomUpdate();
          markAction("DOM updated from empty-template (no page reload)");
          return;
        }
        const template = document.getElementById("game-template");
        if (!(template instanceof HTMLTemplateElement)) return;
        games.forEach((game) => {
          const clone = template.content.cloneNode(true);
          const title = clone.querySelector(".game-title");
          const playersEl = clone.querySelector(".game-players");
          const joinBtn = clone.querySelector(".join-btn");
          const deleteBtn = clone.querySelector(".delete-btn");
          if (!title || !playersEl || !joinBtn) return;
          title.textContent = "Monopoly Game #" + String(game.id);
          playersEl.textContent = String(game.player_count) + " / 4 players";
          joinBtn.addEventListener("click", () => {
            void (async () => {
              try {
                markAction("Joining game via /api/games/:id/join (POST)");
                markFetch();
                const joinRes = await fetch("/api/games/" + String(game.id) + "/join", {
                  method: "POST"
                });
                if (!joinRes.ok) {
                  markAction("Join failed (check Network tab)");
                  return;
                }
                window.location.href = "/games/" + String(game.id);
              } catch (err) {
                console.error("Error joining game:", err);
                markAction("Join request errored (check console/network)");
              }
            })();
          });
          if (deleteBtn) {
            if (!currentUserIsAdmin && game.creator_email !== currentUserEmail) {
              deleteBtn.remove();
            } else {
              deleteBtn.addEventListener("click", () => {
                void (async () => {
                  try {
                    markAction("Deleting game via /api/games/:id (DELETE)");
                    markFetch();
                    const deleteRes = await fetch("/api/games/" + String(game.id), {
                      method: "DELETE"
                    });
                    if (!deleteRes.ok) {
                      markAction("Delete failed (check Network tab)");
                      return;
                    }
                    await loadGames();
                  } catch (err) {
                    console.error("Error deleting game:", err);
                    markAction("Delete request errored (check console/network)");
                  }
                })();
              });
            }
          }
          gamesList.appendChild(clone);
        });
        markDomUpdate();
        markAction("DOM updated from game-template (no page reload)");
      } catch (err) {
        console.error("Error loading games:", err);
        const errorTemplate = document.getElementById("error-template");
        if (errorTemplate instanceof HTMLTemplateElement) {
          gamesList.appendChild(errorTemplate.content.cloneNode(true));
        }
        markDomUpdate();
        markAction("DOM updated from error-template");
      }
    }
    refreshBtn?.addEventListener("click", () => {
      void loadGames();
    });
    createBtn.addEventListener("click", () => {
      void (async () => {
        try {
          markAction("Creating game via /api/games (POST)");
          markFetch();
          const res = await fetch("/api/games", { method: "POST" });
          if (!res.ok) {
            console.error("Failed to create game");
            markAction("Create failed (check Network tab)");
            return;
          }
          await loadGames();
        } catch (err) {
          console.error("Error creating game:", err);
          markAction("Create request errored (check console/network)");
        }
      })();
    });
    void loadGames();
  }
  main();
})();
//# sourceMappingURL=lobby.js.map

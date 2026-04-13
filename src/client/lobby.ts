type Game = {
  id: number;
  player_count: number;
  creator_email: string;
};

type GamesResponse = {
  games: Game[];
};

// M12+ placeholder (intentionally disabled): board constants.
// const TOKENS = ["🎩", "🚗", "🐕", "⛵"] as const;
// const SPACES = [
//   "Go", "Mediterranean Ave", "Community Chest", "Baltic Ave", "Income Tax",
//   "Reading Railroad", "Oriental Ave", "Chance", "Vermont Ave", "Connecticut Ave",
//   "Jail", "St. Charles Place", "Electric Company", "States Ave", "Virginia Ave",
//   "Pennsylvania Railroad", "St. James Place", "Community Chest", "Tennessee Ave", "New York Ave",
//   "Free Parking", "Kentucky Ave", "Chance", "Indiana Ave", "Illinois Ave",
//   "B&O Railroad", "Atlantic Ave", "Ventnor Ave", "Water Works", "Marvin Gardens",
//   "Go To Jail", "Pacific Ave", "North Carolina Ave", "Community Chest", "Pennsylvania Ave",
//   "Short Line Railroad", "Chance", "Park Place", "Luxury Tax", "Boardwalk",
// ] as const;

// M12+ placeholder (intentionally disabled): Monopoly gameplay demo logic.
// Do not enable until game-logic milestone.
// type Player = { name: string; token: string; position: number; balance: number };
// const players: Player[] = [
//   { name: "You", token: TOKENS[0], position: 0, balance: 1500 },
//   { name: "CPU 1", token: TOKENS[1], position: 0, balance: 1500 },
// ];
// let currentPlayer = 0;
// function rollDie(): number {
//   return Math.floor(Math.random() * 6) + 1;
// }
// function renderDemo(): void {
//   // Gameplay UI intentionally disabled until M12+.
// }

// ── Game lobby ────────────────────────────────────────────────────────────────

// eslint-disable-next-line max-lines-per-function
function main(): void {
  console.log("Lobby client loaded");
  // M12+ placeholder: gameplay renderer intentionally disabled.
  // renderDemo();

  const gamesList = document.getElementById("games-list") as HTMLElement;
  const currentUserEmail = gamesList.dataset.currentEmail ?? "";
  const currentUserIsAdmin = gamesList.dataset.isAdmin === "true";
  const createBtn = document.getElementById("create-game") as HTMLButtonElement;
  const refreshBtn = document.getElementById("refresh-games") as HTMLButtonElement | null;
  const m8LastAction = document.getElementById("m8-last-action");
  const m8FetchCount = document.getElementById("m8-fetch-count");
  const m8DomCount = document.getElementById("m8-dom-count");
  const m8LastUpdate = document.getElementById("m8-last-update");

  // M8 Demo instrumentation: these counters are for presentation visibility,
  // not required for core game functionality.
  let fetchCount = 0;
  let domUpdateCount = 0;

  function markAction(message: string): void {
    if (m8LastAction) m8LastAction.textContent = message;
  }

  function markFetch(): void {
    fetchCount += 1;
    if (m8FetchCount) m8FetchCount.textContent = String(fetchCount);
  }

  function markDomUpdate(): void {
    domUpdateCount += 1;
    if (m8DomCount) m8DomCount.textContent = String(domUpdateCount);
    if (m8LastUpdate) m8LastUpdate.textContent = new Date().toLocaleTimeString();
  }

  //render games added so both fethc responses and SSe messages can reuse
  //the same DOM update logic aka makes it cleaner
  function renderGames(games: Game[]): void {
    gamesList.textContent = "";

    if (games.length === 0) {
      const emptyTemplate = document.getElementById("empty-template");
      if (emptyTemplate instanceof HTMLTemplateElement) {
        gamesList.appendChild(emptyTemplate.content.cloneNode(true));
      }
      markDomUpdate();
      return;
    }

    const template = document.getElementById("game-template");
    if (!(template instanceof HTMLTemplateElement)) return;

    games.forEach((game: Game) => {
      const clone = template.content.cloneNode(true) as DocumentFragment;

      const title = clone.querySelector(".game-title");
      const playersEl = clone.querySelector(".game-players");
      const joinBtn = clone.querySelector(".join-btn");
      const deleteBtn = clone.querySelector(".delete-btn");

      if (!title || !playersEl || !joinBtn) return;

      title.textContent = "Monopoly Game #" + String(game.id);
      playersEl.textContent = String(game.player_count) + " / 4 players";

      joinBtn.addEventListener("click", () => {
        void (async (): Promise<void> => {
          try {
            markAction("Joining game via /api/games/:id/join (POST)");
            markFetch();

            const joinRes = await fetch("/api/games/" + String(game.id) + "/join", {
              method: "POST",
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
            void (async (): Promise<void> => {
              try {
                markAction("Deleting game via /api/games/:id (DELETE)");
                markFetch();

                const deleteRes = await fetch("/api/games/" + String(game.id), {
                  method: "DELETE",
                });

                if (!deleteRes.ok) {
                  markAction("Delete failed (check Network tab)");
                  return;
                }

                // M9: let SSE refresh all subscribed clients.
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
  }

  //loadGames now only fetches and hands data to renderGames
   
  async function loadGames(): Promise<void> {
    try {
      // M8 Demo marker: this is the GET request to show in Network tab.
      markAction("Fetching /api/games (GET)");
      markFetch();
      const res = await fetch("/api/games");
      const data = (await res.json()) as GamesResponse;

      renderGames(data.games);

      markAction("DOM updated from empty-template (no page reload)");
    } catch (err) {
      console.error("Error loading games:", err);
      gamesList.textContent = "";

      const errorTemplate = document.getElementById("error-template");
      if (errorTemplate instanceof HTMLTemplateElement) {
        gamesList.appendChild(errorTemplate.content.cloneNode(true));
      }
      markDomUpdate();
      markAction("DOM updated from error-template");
    }
  }

  refreshBtn?.addEventListener("click", () => {
    // M8 Demo marker: manual GET trigger for live demo.
    void loadGames();
  });

  createBtn.addEventListener("click", (): void => {
    void (async (): Promise<void> => {
      try {
        // M8 Demo marker: this is the POST request to show in Network tab.
        markAction("Creating game via /api/games (POST)");
        markFetch();
        const res = await fetch("/api/games", { method: "POST" });
        if (!res.ok) {
          console.error("Failed to create game");
          markAction("Create failed (check Network tab)");
          return;
        }
      } catch (err) {
        console.error("Error creating game:", err);
        markAction("Create request errored (check console/network)");
      }
    })();
  });

  //subscribes browser to lobby updates
  const eventSource = new EventSource("/api/events?channel=lobby");

  eventSource.addEventListener("connected", () => {
    markAction("Connected to SSE lobby channel");
  });

  eventSource.addEventListener("games:update", (event: MessageEvent<string>): void => {
    const data = JSON.parse(event.data) as GamesResponse;
    renderGames(data.games);
    markAction("Updated from SSE (no reload)");
  });

  eventSource.onerror = (): void => {
    markAction("SSE connection lost/retrying...");
  };

  void loadGames();
}

main();

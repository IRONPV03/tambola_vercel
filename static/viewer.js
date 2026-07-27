// =========================================
// DOM ELEMENTS
// =========================================

const gameInput = document.getElementById("gameInput");
const joinBtn = document.getElementById("joinBtn");

const connectedGame = document.getElementById("connectedGame");
const statusText = document.getElementById("status");

const currentNumber = document.getElementById("currentNumber");
const currentCall = document.getElementById("currentCall");

const drawnCount = document.getElementById("drawnCount");
const remainingCount = document.getElementById("remainingCount");

const historyContainer = document.getElementById("history");

const toast = document.getElementById("toast");


// =========================================
// GLOBAL VARIABLES
// =========================================

let gameId = "";

let pollingInterval = null;

let lastAnnouncedNumber = null;


// =========================================
// TOAST
// =========================================

function showToast(message, success = true) {

    toast.innerText = message;

    toast.className = success
        ? "toast success"
        : "toast error";

    toast.style.display = "block";

    setTimeout(() => {

        toast.style.display = "none";

    }, 2500);

}


// =========================================
// SPEECH
// =========================================

function speak(text) {

    if (!window.speechSynthesis)
        return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.rate = 0.9;

    speech.pitch = 1;

    speech.volume = 1;

    window.speechSynthesis.speak(speech);

}


// =========================================
// HISTORY
// =========================================

function updateHistory(numbers) {

    historyContainer.innerHTML = "";

    [...numbers]
        .reverse()
        .forEach(number => {

            const chip = document.createElement("div");

            chip.className = "historyItem";

            chip.innerText = number;

            historyContainer.appendChild(chip);

        });

}


// =========================================
// BOARD
// =========================================

function clearBoard() {

    for (let i = 1; i <= 90; i++) {

        const cell = document.getElementById("cell-" + i);

        if (!cell)
            continue;

        cell.classList.remove("drawn");

        cell.classList.remove("current");

    }

}


function updateBoard(drawn, current) {

    clearBoard();

    drawn.forEach(number => {

        const cell = document.getElementById("cell-" + number);

        if (cell)
            cell.classList.add("drawn");

    });

    if (current !== null) {

        const currentCell = document.getElementById("cell-" + current);

        if (currentCell)
            currentCell.classList.add("current");

    }

}


// =========================================
// UPDATE UI
// =========================================

function updateUI(game) {

    drawnCount.innerText = game.drawn.length;

    remainingCount.innerText = game.remaining;

    updateHistory(game.drawn);

    updateBoard(game.drawn, game.current);

    if (game.current === null) {

        currentNumber.innerText = "--";

        currentCall.innerText = "Waiting for host...";

        return;

    }

    currentNumber.innerText = game.current;

    currentCall.innerText = game.call;

    if (lastAnnouncedNumber !== game.current) {

        lastAnnouncedNumber = game.current;

        speak(
            "Number " +
            game.current +
            ". " +
            game.call
        );

    }

    if (game.remaining === 0) {

        showToast("Game Over!");

    }

}
// =========================================
// FETCH CURRENT GAME STATE
// =========================================

async function fetchState() {

    if (gameId === "")
        return;

    try {

        const response = await fetch("/state/" + gameId);

        if (!response.ok) {

            statusText.innerText = "Game not found";

            stopPolling();

            return;

        }

        const game = await response.json();

        statusText.innerText = "Connected";

        updateUI(game);

    }
    catch (err) {

        console.error(err);

        statusText.innerText = "Connection Lost";

    }

}



// =========================================
// JOIN GAME
// =========================================

async function joinGame() {

    let enteredId = gameInput.value.trim().toUpperCase();

    if (enteredId === "") {

        showToast("Enter Game ID", false);

        return;

    }

    gameId = enteredId;

    connectedGame.innerText = gameId;

    statusText.innerText = "Connecting...";

    localStorage.setItem(
        "tambola_viewer_game",
        gameId
    );

    await fetchState();

    startPolling();

    showToast("Joined Game");

}



// =========================================
// START POLLING
// =========================================

function startPolling() {

    stopPolling();

    pollingInterval = setInterval(() => {

        fetchState();

    }, 1000);

}



// =========================================
// STOP POLLING
// =========================================

function stopPolling() {

    if (pollingInterval) {

        clearInterval(pollingInterval);

        pollingInterval = null;

    }

}



// =========================================
// TAB VISIBILITY OPTIMIZATION
// =========================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (gameId === "")
            return;

        if (document.hidden) {

            stopPolling();

        }
        else {

            fetchState();

            startPolling();

        }

    }
);
// =========================================
// RESTORE PREVIOUS GAME
// =========================================

function restorePreviousGame() {

    // If user opened /game/<GAME_ID>
    if (typeof GAME_ID !== "undefined" && GAME_ID !== "") {

        gameId = GAME_ID.toUpperCase();

        gameInput.value = gameId;

        connectedGame.innerText = gameId;

        fetchState();

        startPolling();

        return;
    }

    // Otherwise restore from local storage

    const savedGame =
        localStorage.getItem("tambola_viewer_game");

    if (!savedGame)
        return;

    gameId = savedGame;

    gameInput.value = gameId;

    connectedGame.innerText = gameId;

    fetchState();

    startPolling();

}



// =========================================
// LEAVE PAGE CLEANLY
// =========================================

window.addEventListener(
    "beforeunload",
    () => {

        stopPolling();

        if (window.speechSynthesis) {

            window.speechSynthesis.cancel();

        }

    }
);



// =========================================
// ENTER KEY SUPPORT
// =========================================

gameInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            joinGame();

        }

    }
);



// =========================================
// BUTTON EVENTS
// =========================================

joinBtn.addEventListener(
    "click",
    joinGame
);



// =========================================
// INITIALIZE
// =========================================

restorePreviousGame();
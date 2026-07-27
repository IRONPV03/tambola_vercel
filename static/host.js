// ================================
// DOM ELEMENTS
// ================================

const createBtn = document.getElementById("createGame");
const drawBtn = document.getElementById("drawBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyLink");

const gameIdElement = document.getElementById("gameId");
const shareLink = document.getElementById("shareLink");

const currentNumber = document.getElementById("currentNumber");
const currentCall = document.getElementById("currentCall");

const drawnCount = document.getElementById("drawnCount");
const remainingCount = document.getElementById("remainingCount");

const historyContainer = document.getElementById("history");
const toast = document.getElementById("toast");


// ================================
// GLOBAL VARIABLES
// ================================

let gameId = "";
let hostToken = "";


// ================================
// TOAST
// ================================

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


// ================================
// SPEECH
// ================================

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


// ================================
// HISTORY
// ================================

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


// ================================
// BOARD
// ================================

function clearBoard() {

    for (let i = 1; i <= 90; i++) {

        const cell = document.getElementById("cell-" + i);

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


// ================================
// UPDATE SCREEN
// ================================

function updateUI(game) {

    if (game.current === null) {

        currentNumber.innerText = "--";

        currentCall.innerText = "Waiting...";

    } else {

        currentNumber.innerText = game.current;

        currentCall.innerText = game.call;

        speak(
            "Number " +
            game.current +
            ". " +
            game.call
        );

    }

    drawnCount.innerText = game.drawn.length;

    remainingCount.innerText = game.remaining;

    updateHistory(game.drawn);

    updateBoard(
        game.drawn,
        game.current
    );

    if (game.remaining === 0) {

        showToast("Game Over!");

    }

}

// ================================
// CREATE GAME
// ================================

async function createGame() {

    try {

        const response = await fetch("/create", {
            method: "POST"
        });

        const data = await response.json();

        if (data.error) {

            showToast(data.error, false);

            return;

        }

        gameId = data.game_id;
        hostToken = data.host_token;

        localStorage.setItem("tambola_game_id", gameId);
        localStorage.setItem("tambola_host_token", hostToken);

        gameIdElement.innerText = gameId;

        const link =
            window.location.origin +
            "/game/" +
            gameId;

        shareLink.value = link;

        currentNumber.innerText = "--";
        currentCall.innerText = "Waiting for first draw...";

        drawnCount.innerText = "0";
        remainingCount.innerText = "90";

        historyContainer.innerHTML = "";

        clearBoard();

        showToast("Game Created Successfully");

    }
    catch (err) {

        console.error(err);

        showToast("Unable to create game", false);

    }

}


// ================================
// DRAW NUMBER
// ================================

async function drawNumber() {

    if (gameId === "") {

        showToast("Please create a game first.", false);

        return;

    }

    try {

        const response = await fetch("/draw", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                game_id: gameId,

                host_token: hostToken

            })

        });

        const data = await response.json();

        if (data.error) {

            showToast(data.error, false);

            return;

        }

        if (data.message) {

            showToast(data.message);

            return;

        }

        updateUI(data);

    }

    catch (err) {

        console.error(err);

        showToast("Unable to contact server", false);

    }

}


// ================================
// RESET GAME
// ================================

async function resetGame() {

    if (gameId === "") {

        showToast("No active game", false);

        return;

    }

    const confirmReset = confirm(
        "Reset this Tambola game?"
    );

    if (!confirmReset)
        return;

    try {

        const response = await fetch("/reset", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                game_id: gameId,

                host_token: hostToken

            })

        });

        const data = await response.json();

        if (data.error) {

            showToast(data.error, false);

            return;

        }

        currentNumber.innerText = "--";
        currentCall.innerText = "Waiting for first draw...";

        drawnCount.innerText = "0";
        remainingCount.innerText = "90";

        historyContainer.innerHTML = "";

        clearBoard();

        showToast("Game Reset Successfully");

    }

    catch (err) {

        console.error(err);

        showToast("Reset failed", false);

    }

}

// ================================
// COPY SHARE LINK
// ================================

async function copyShareLink() {

    if (shareLink.value.trim() === "") {

        showToast("Create a game first.", false);

        return;

    }

    try {

        await navigator.clipboard.writeText(shareLink.value);

        showToast("Link copied to clipboard!");

    }
    catch (err) {

        console.error(err);

        showToast("Unable to copy link.", false);

    }

}


// ================================
// LOAD PREVIOUS GAME
// ================================

async function restorePreviousGame() {

    const savedGameId = localStorage.getItem("tambola_game_id");
    const savedToken = localStorage.getItem("tambola_host_token");

    if (!savedGameId || !savedToken)
        return;

    gameId = savedGameId;
    hostToken = savedToken;

    gameIdElement.innerText = gameId;

    shareLink.value =
        window.location.origin +
        "/game/" +
        gameId;

    try {

        const response = await fetch("/state/" + gameId);

        if (!response.ok)
            return;

        const game = await response.json();

        updateUI(game);

    }
    catch (err) {

        console.error(err);

    }

}


// ================================
// EVENT LISTENERS
// ================================

createBtn.addEventListener(
    "click",
    createGame
);

drawBtn.addEventListener(
    "click",
    drawNumber
);

resetBtn.addEventListener(
    "click",
    resetGame
);

copyBtn.addEventListener(
    "click",
    copyShareLink
);


// ================================
// INITIALIZE
// ================================

restorePreviousGame();
// ==== Navigation Logic ====
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

// Global navigate function to allow inline onclick handlers in HTML
window.navigate = function(targetId) {
    // 1. Show target page, hide others
    pages.forEach(page => {
        if (page.id === targetId) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });

    // 2. Update active visual state for top navbar
    navBtns.forEach(btn => {
        if (btn.dataset.target === targetId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Attach event listeners to top navbar buttons
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navigate(btn.dataset.target);
    });
});

// ==== Pomodoro Timer Logic ====
const DEFAULT_MINUTES = 25;
let timerSeconds = DEFAULT_MINUTES * 60;
let timerInterval = null;
let isRunning = false;

// DOM Elements
const timeDisplay = document.getElementById('time-display');
const timerStatus = document.getElementById('timer-status');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

function updateDisplay() {
    const min = Math.floor(timerSeconds / 60);
    const sec = timerSeconds % 60;
    timeDisplay.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (isRunning) return;
    if (timerSeconds <= 0) return; // Prevent start if time is 0

    isRunning = true;
    timerStatus.textContent = 'Focusing...';
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    timerInterval = setInterval(() => {
        timerSeconds--;
        updateDisplay();

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            timerStatus.textContent = 'Session Complete!';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;

    clearInterval(timerInterval);
    isRunning = false;
    timerStatus.textContent = 'Paused';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    timerSeconds = DEFAULT_MINUTES * 60;
    timerStatus.textContent = 'Ready to focus';
    updateDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Timer event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Initialize display on load
updateDisplay();

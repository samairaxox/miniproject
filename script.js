// ==== State and LocalStorage ====
let focusSessions = 0;
let isDarkMode = false;
let notesContent = "";
let tasks = {
    todo: [],
    inProgress: [],
    done: []
};

function saveData() {
    localStorage.setItem('prohub_tasks', JSON.stringify(tasks));
    localStorage.setItem('prohub_focusSessions', focusSessions);
    localStorage.setItem('prohub_darkMode', isDarkMode);
    localStorage.setItem('prohub_notes', notesContent);
}

function loadData() {
    const savedTasks = localStorage.getItem('prohub_tasks');
    if (savedTasks) {
        Object.assign(tasks, JSON.parse(savedTasks));
    }
    focusSessions = parseInt(localStorage.getItem('prohub_focusSessions')) || 0;
    isDarkMode = localStorage.getItem('prohub_darkMode') === 'true';
    notesContent = localStorage.getItem('prohub_notes') || '';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    const notesTextarea = document.getElementById('notes-textarea');
    if (notesTextarea) {
        notesTextarea.value = notesContent;
    }
}

// ==== Live Stats & Focus Garden ====
function updateLiveStats() {
    const statTasksDone = document.getElementById('stat-tasks-done');
    const statTasksPending = document.getElementById('stat-tasks-pending');
    const statFocusTime = document.getElementById('stat-focus-time');

    if (statTasksDone) {
        statTasksDone.textContent = tasks.done.length;
    }
    if (statTasksPending) {
        statTasksPending.textContent = tasks.todo.length + tasks.inProgress.length;
    }
    if (statFocusTime) {
        const totalFocusMins = focusSessions * 25;
        const hours = Math.floor(totalFocusMins / 60);
        const mins = totalFocusMins % 60;
        statFocusTime.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
}

function updateFocusGarden() {
    const gardenVisual = document.getElementById('garden-visual');
    if (!gardenVisual) return;

    let plantEmoji = '';
    if (focusSessions === 0) {
        plantEmoji = '';
    } else if (focusSessions <= 2) {
        plantEmoji = '🌱';
    } else if (focusSessions <= 4) {
        plantEmoji = '🌿';
    } else {
        plantEmoji = '🌳';
    }
    
    // Smooth transition logic (animation scale)
    gardenVisual.style.transform = 'scale(0.8)';
    gardenVisual.style.opacity = '0.5';
    setTimeout(() => {
        gardenVisual.textContent = plantEmoji;
        gardenVisual.style.transform = 'scale(1)';
        gardenVisual.style.opacity = '1';
    }, 200);
}

// ==== Setup Theme Toggle & Notes ====
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        saveData();
    });
}

const notesTextarea = document.getElementById('notes-textarea');
if (notesTextarea) {
    notesTextarea.addEventListener('input', (e) => {
        notesContent = e.target.value;
        saveData();
    });
}

// ==== Navigation Logic ====
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

window.navigate = function(targetId) {
    pages.forEach(page => {
        if (page.id === targetId) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });

    navBtns.forEach(btn => {
        if (btn.dataset.target === targetId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navigate(btn.dataset.target);
    });
});

// ==== Pomodoro Timer Logic ====
const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;
let isBreak = false;
let timerSeconds = FOCUS_MINUTES * 60;
let timerInterval = null;
let isRunning = false;

const timeDisplay = document.getElementById('time-display');
const timerStatus = document.getElementById('timer-status');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

function updateDisplay() {
    const min = Math.floor(timerSeconds / 60);
    const sec = timerSeconds % 60;
    timeDisplay.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    
    const progressFill = document.getElementById('timer-progress');
    if (progressFill) {
        const totalSeconds = isBreak ? (BREAK_MINUTES * 60) : (FOCUS_MINUTES * 60);
        const progress = ((totalSeconds - timerSeconds) / totalSeconds) * 100;
        progressFill.style.width = `${progress}%`;
    }
}

function playAlarm() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 1);
    } catch(e) {
        console.log("Audio alert skipped");
    }
}

function startTimer() {
    if (isRunning) return;
    if (timerSeconds <= 0) return;

    isRunning = true;
    timerStatus.textContent = isBreak ? 'Taking a break...' : 'Focusing...';
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    timerInterval = setInterval(() => {
        timerSeconds--;
        updateDisplay();

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            playAlarm();
            
            if (!isBreak) {
                focusSessions++;
                saveData();
                updateFocusGarden();
                updateLiveStats();
                timerStatus.textContent = 'Focus Complete! Take a break.';
                isBreak = true;
                timerSeconds = BREAK_MINUTES * 60;
                setTimeout(() => alert('Break time!'), 100);
            } else {
                timerStatus.textContent = 'Break Complete! Ready to focus.';
                isBreak = false;
                timerSeconds = FOCUS_MINUTES * 60;
                setTimeout(() => alert('Back to focus!'), 100);
            }
            updateDisplay();
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
    isBreak = false;
    timerSeconds = FOCUS_MINUTES * 60;
    timerStatus.textContent = 'Ready to focus';
    updateDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// ==== Workspace Task Logic ====
const addTaskBtn = document.getElementById('add-task-btn');
const modalOverlay = document.getElementById('task-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const taskForm = document.getElementById('task-form');

const listTodo = document.getElementById('list-todo');
const listInProgress = document.getElementById('list-inProgress');
const listDone = document.getElementById('list-done');

let draggedTaskId = null;
let draggedTaskStatus = null;

const columnsNodes = {
    todo: listTodo,
    inProgress: listInProgress,
    done: listDone
};

for (const [status, container] of Object.entries(columnsNodes)) {
    if (!container) continue;

    container.addEventListener('dragover', e => {
        e.preventDefault(); 
        container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
    });

    container.addEventListener('drop', e => {
        e.preventDefault();
        container.classList.remove('drag-over');
        
        if (draggedTaskId && draggedTaskStatus !== status) {
            const taskIndex = tasks[draggedTaskStatus].findIndex(t => t.id === draggedTaskId);
            if (taskIndex > -1) {
                const [task] = tasks[draggedTaskStatus].splice(taskIndex, 1);
                tasks[status].push(task);
                saveData();
                renderTasks();
                updateLiveStats();
                
                // Animation for Completed Task
                if (status === 'done') {
                    const cards = container.querySelectorAll('.task-card');
                    const lastCard = Array.from(cards).find(c => c.dataset.id === task.id);
                    if (lastCard) lastCard.classList.add('task-done-animation');
                }
            }
        }
    });
}

function openModal() { modalOverlay.classList.add('active'); }
function closeModal() {
    modalOverlay.classList.remove('active');
    taskForm.reset();
}

addTaskBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const priority = document.getElementById('task-priority').value;

    const newTask = {
        id: Date.now().toString(),
        title,
        description: desc,
        priority
    };

    tasks.todo.push(newTask);
    saveData();
    renderTasks();
    updateLiveStats();
    closeModal();
});

// Search Tasks Logic
let currentSearchQuery = "";
const searchTasksInput = document.getElementById('search-tasks-input');
if(searchTasksInput) {
    searchTasksInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase();
        renderTasks();
    });
}

function renderTasks() {
    for (const [status, container] of Object.entries(columnsNodes)) {
        if (!container) continue;
        container.innerHTML = '';
        
        const columnTasks = tasks[status].filter(task => 
            task.title.toLowerCase().includes(currentSearchQuery)
        );

        if (columnTasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks found</div>';
            continue;
        }

        columnTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-card';
            taskEl.draggable = true;
            taskEl.dataset.id = task.id;
            
            taskEl.addEventListener('dragstart', () => {
                taskEl.classList.add('dragging');
                draggedTaskId = task.id;
                draggedTaskStatus = status;
            });
            
            taskEl.addEventListener('dragend', () => {
                taskEl.classList.remove('dragging');
                draggedTaskId = null;
                draggedTaskStatus = null;
            });
            
            taskEl.innerHTML = `
                <div class="task-header">
                    <h3 class="task-title">${task.title}</h3>
                    <span class="task-priority badge priority-${task.priority}">${task.priority}</span>
                </div>
                ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
            `;
            container.appendChild(taskEl);
        });
    }
}

// ==== Smart Task Generator ====
const smartGoalInput = document.getElementById('smart-goal-input');
const generateTasksBtn = document.getElementById('generate-tasks-btn');

if (generateTasksBtn) {
    generateTasksBtn.addEventListener('click', () => {
        const goal = smartGoalInput.value.toLowerCase();
        if (!goal) return;

        let generated = [];
        if (goal.includes('project')) {
            generated = [
                { title: 'Research idea', priority: 'Medium' },
                { title: 'Design UI', priority: 'High' },
                { title: 'Build frontend', priority: 'High' },
                { title: 'Test app', priority: 'Medium' }
            ];
        } else if (goal.includes('study')) {
            generated = [
                { title: 'Revise concepts', priority: 'High' },
                { title: 'Practice questions', priority: 'High' },
                { title: 'Mock test', priority: 'Medium' },
                { title: 'Analyze mistakes', priority: 'High' }
            ];
        } else {
            alert("Please include 'project' or 'study' in your goal to get suggestions.");
            return;
        }

        generated.forEach((item, index) => {
            tasks.todo.push({
                id: Date.now().toString() + '-' + index,
                title: item.title,
                description: `Generated for goal: ${smartGoalInput.value}`,
                priority: item.priority
            });
        });

        smartGoalInput.value = '';
        saveData();
        renderTasks();
        updateLiveStats();
    });
}

// ==== Initialize All Data ====
loadData();
updateDisplay();
renderTasks();
updateLiveStats();
updateFocusGarden();

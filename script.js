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

// ==== Workspace Task Logic ====
const tasks = {
    todo: [],
    inProgress: [],
    done: []
};

// DOM Elements
const addTaskBtn = document.getElementById('add-task-btn');
const modalOverlay = document.getElementById('task-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const taskForm = document.getElementById('task-form');

const listTodo = document.getElementById('list-todo');
const listInProgress = document.getElementById('list-inProgress');
const listDone = document.getElementById('list-done');

// Drag and drop state
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
                renderTasks();
            }
        }
    });
}

function openModal() {
    modalOverlay.classList.add('active');
}

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
    renderTasks();
    closeModal();
});

function renderTasks() {
    const columns = {
        todo: listTodo,
        inProgress: listInProgress,
        done: listDone
    };

    for (const [status, container] of Object.entries(columns)) {
        if (!container) continue; // safety check
        
        container.innerHTML = '';
        
        const columnTasks = tasks[status];
        if (columnTasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks yet</div>';
            continue;
        }

        columnTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-card';
            taskEl.draggable = true;
            
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

// Initial render
renderTasks();

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
        renderTasks();
    });
}

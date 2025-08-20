let tasks = [];
let currentFilter = 'all';
let currentPriority = 'medium';
let editingTask = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    updateStats();
    renderTasks();
    
    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Priority selector
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPriority = this.dataset.priority;
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });

    // Enter key for adding tasks
    document.getElementById('task-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Auto-save on page unload
    window.addEventListener('beforeunload', saveTasks);
}

function addTask() {
    const input = document.getElementById('task-input');
    const taskText = input.value.trim();

    if (taskText === '') {
        input.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => input.style.animation = '', 500);
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        priority: currentPriority,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    if (editingTask) {
        const index = tasks.findIndex(t => t.id === editingTask);
        tasks[index].text = taskText;
        tasks[index].priority = currentPriority;
        editingTask = null;
        input.placeholder = "What needs to be done?";
    } else {
        tasks.unshift(task);
    }

    input.value = '';
    saveTasks();
    updateStats();
    renderTasks();

    // Reset priority to medium after adding
    document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.priority-btn.medium').classList.add('active');
    currentPriority = 'medium';
}

function deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    taskElement.style.animation = 'taskSlideOut 0.3s ease-in-out forwards';
    
    setTimeout(() => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        updateStats();
        renderTasks();
    }, 300);
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    
    saveTasks();
    updateStats();
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    const input = document.getElementById('task-input');
    
    input.value = task.text;
    input.focus();
    input.placeholder = "Edit your task...";
    
    // Set priority
    document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.priority-btn.${task.priority}`).classList.add('active');
    currentPriority = task.priority;
    
    editingTask = id;
}

function clearCompleted() {
    const completedTasks = document.querySelectorAll('.task-item.completed');
    
    completedTasks.forEach(task => {
        task.style.animation = 'taskSlideOut 0.3s ease-in-out forwards';
    });

    setTimeout(() => {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        updateStats();
        renderTasks();
    }, 300);
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    let filteredTasks = tasks;

    // Apply filters
    switch(currentFilter) {
        case 'pending':
            filteredTasks = tasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter(task => task.completed);
            break;
        case 'high':
            filteredTasks = tasks.filter(task => task.priority === 'high');
            break;
    }

    // Sort by priority and creation date
    filteredTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">No tasks found. Add one above!</div>';
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => `
        <li class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-content">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
                <div class="task-info">
                    <div class="task-text">${task.text}</div>
                    <div class="task-time">${formatTime(task.createdAt)}</div>
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn" onclick="editTask(${task.id})" title="Edit">✏️</button>
                <button class="action-btn delete-btn" onclick="deleteTask(${task.id})" title="Delete">🗑️</button>
            </div>
        </li>
    `).join('');
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    document.getElementById('total-tasks').textContent = total;
    document.getElementById('completed-tasks').textContent = completed;
    document.getElementById('pending-tasks').textContent = pending;

    // Animate stats update
    document.querySelectorAll('.stat-number').forEach(el => {
        el.style.animation = 'none';
        setTimeout(() => el.style.animation = 'pulse 0.5s ease', 10);
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

function saveTasks() {
    // Store in memory only (no localStorage)
    window.todoTasks = tasks;
}

function loadTasks() {
    // Load from memory (no localStorage)
    tasks = window.todoTasks || [];
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes taskSlideOut {
        to { 
            opacity: 0; 
            transform: translateX(-100%) scale(0.8); 
            filter: blur(5px);
        }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);
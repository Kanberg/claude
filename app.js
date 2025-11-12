// ===== ОСНОВНОЕ ПРИЛОЖЕНИЕ =====

// Глобальные переменные
const APP = {
    version: '1.0.0',
    currentUser: null,
    settings: {},
    projects: [],
    currentProject: null
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🐍 SuperPython Editor загружен!');
    
    initializeApp();
    loadUserData();
    setupEventListeners();
    checkForSharedCode();
});

// Инициализация приложения
function initializeApp() {
    // Загрузка настроек
    APP.settings = loadSettings() || getDefaultSettings();
    applySettings(APP.settings);
    
    // Загрузка проектов
    APP.projects = loadProjectsList() || [];
    
    // Проверка авторизации
    const savedUser = localStorage.getItem('pythonEditorUser');
    if (savedUser) {
        APP.currentUser = JSON.parse(savedUser);
        updateUserUI();
    }
}

// Настройки по умолчанию
function getDefaultSettings() {
    return {
        theme: 'dark',
        fontSize: 14,
        fontFamily: "'Consolas', monospace",
        autoSave: true,
        livePreview: false,
        autoComplete: true,
        lineNumbers: true,
        tabSize: 4,
        targetFPS: 60,
        canvasResolution: '800x600',
        showHitboxes: false
    };
}

// Применение настроек
function applySettings(settings) {
    document.documentElement.style.setProperty('--editor-font-size', settings.fontSize + 'px');
    document.documentElement.style.setProperty('--editor-font-family', settings.fontFamily);
    
    if (settings.theme === 'light') {
        document.body.classList.add('theme-light');
    }
}

// ===== РАБОТА С ПОЛЬЗОВАТЕЛЕМ =====
function loadUserData() {
    const userData = localStorage.getItem('pythonEditorUser');
    if (userData) {
        APP.currentUser = JSON.parse(userData);
        updateUserUI();
    }
}

function updateUserUI() {
    const userNameElements = document.querySelectorAll('#userName');
    const userAvatarElements = document.querySelectorAll('#userAvatar');
    
    if (APP.currentUser) {
        userNameElements.forEach(el => {
            el.textContent = APP.currentUser.name;
        });
        
        userAvatarElements.forEach(el => {
            el.textContent = APP.currentUser.name.charAt(0).toUpperCase();
        });
    }
}

function login(username, email) {
    APP.currentUser = {
        id: generateId(),
        name: username,
        email: email,
        avatar: username.charAt(0).toUpperCase(),
        createdAt: new Date().toISOString(),
        projects: []
    };
    
    localStorage.setItem('pythonEditorUser', JSON.stringify(APP.currentUser));
    updateUserUI();
    
    return APP.currentUser;
}

function logout() {
    APP.currentUser = null;
    localStorage.removeItem('pythonEditorUser');
    updateUserUI();
    window.location.href = 'index.html';
}

// ===== УПРАВЛЕНИЕ ПРОЕКТАМИ =====
function createNewProject() {
    const projectName = prompt('Название проекта:', 'Новый проект');
    if (!projectName) return;
    
    const project = {
        id: generateId(),
        name: projectName,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: {
            'main.py': '# Главный файл\nprint("Hello, World!")\n'
        },
        assets: [],
        settings: {}
    };
    
    APP.projects.push(project);
    saveProjectsList();
    
    // Переход к редактору
    localStorage.setItem('currentProject', project.id);
    window.location.href = 'editor.html';
}

function loadProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;
    
    APP.projects = loadProjectsList() || [];
    
    if (APP.projects.length === 0) {
        projectsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <h3>У вас пока нет проектов</h3>
                <p style="color: var(--text-secondary); margin: 1rem 0;">
                    Создайте свой первый проект и начните программировать!
                </p>
                <button class="btn btn-primary" onclick="createNewProject()">
                    ➕ Создать проект
                </button>
            </div>
        `;
        return;
    }
    
    projectsGrid.innerHTML = APP.projects.map(project => `
        <div class="project-card" onclick="openProject('${project.id}')">
            <div class="project-preview">🎮</div>
            <div class="project-info">
                <h3 class="project-title">${escapeHtml(project.name)}</h3>
                <p class="project-description">
                    ${project.description || 'Без описания'}
                </p>
                <div class="project-meta">
                    <span>📅 ${formatDate(project.updatedAt)}</span>
                    <span>📄 ${Object.keys(project.files).length} файлов</span>
                </div>
                <div class="project-actions">
                    <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); openProject('${project.id}')">
                        Открыть
                    </button>
                    <button class="btn btn-small btn-outline" onclick="event.stopPropagation(); deleteProject('${project.id}')">
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openProject(projectId) {
    localStorage.setItem('currentProject', projectId);
    window.location.href = 'editor.html';
}

function deleteProject(projectId) {
    if (!confirm('Удалить проект? Это действие нельзя отменить.')) return;
    
    APP.projects = APP.projects.filter(p => p.id !== projectId);
    saveProjectsList();
    loadProjects();
}

// ===== ШАБЛОНЫ ИГР =====
const GAME_TEMPLATES = {
    snake: {
        name: 'Snake Game',
        description: 'Классическая игра змейка',
        files: {
            'main.py': `# Игра Snake
import game

# Настройки
WIDTH = 800
HEIGHT = 600
CELL_SIZE = 20

# Инициализация игры
game.init(WIDTH, HEIGHT, "Snake Game")

# Змейка
snake = {
    'body': [(400, 300), (380, 300), (360, 300)],
    'direction': (CELL_SIZE, 0),
    'grow': False
}

# Еда
food = {
    'x': 200,
    'y': 200
}

score = 0

# Игровой цикл
while game.running:
    # Обработка событий
    for event in game.events():
        if event.type == 'keydown':
            if event.key == 'up' and snake['direction'][1] != CELL_SIZE:
                snake['direction'] = (0, -CELL_SIZE)
            elif event.key == 'down' and snake['direction'][1] != -CELL_SIZE:
                snake['direction'] = (0, CELL_SIZE)
            elif event.key == 'left' and snake['direction'][0] != CELL_SIZE:
                snake['direction'] = (-CELL_SIZE, 0)
            elif event.key == 'right' and snake['direction'][0] != -CELL_SIZE:
                snake['direction'] = (CELL_SIZE, 0)
    
    # Движение змейки
    head = snake['body'][0]
    new_head = (head[0] + snake['direction'][0], head[1] + snake['direction'][1])
    
    # Проверка столкновений
    if (new_head[0] < 0 or new_head[0] >= WIDTH or 
        new_head[1] < 0 or new_head[1] >= HEIGHT or
        new_head in snake['body']):
        print(f"Game Over! Score: {score}")
        game.stop()
        break
    
    snake['body'].insert(0, new_head)
    
    # Проверка еды
    if new_head[0] == food['x'] and new_head[1] == food['y']:
        score += 10
        snake['grow'] = True
        # Новая еда
        import random
        food['x'] = random.randint(0, WIDTH // CELL_SIZE - 1) * CELL_SIZE
        food['y'] = random.randint(0, HEIGHT // CELL_SIZE - 1) * CELL_SIZE
    
    if not snake['grow']:
        snake['body'].pop()
    else:
        snake['grow'] = False
    
    # Отрисовка
    game.clear((20, 30, 50))
    
    # Рисуем змейку
    for segment in snake['body']:
        game.rect(segment[0], segment[1], CELL_SIZE - 2, CELL_SIZE - 2, (50, 200, 50))
    
    # Рисуем еду
    game.rect(food['x'], food['y'], CELL_SIZE - 2, CELL_SIZE - 2, (200, 50, 50))
    
    # Счёт
    game.text(f"Score: {score}", 10, 10, (255, 255, 255), 20)
    
    game.update(10)  # 10 FPS

print("Thanks for playing!")
`
        }
    },
    
    platformer: {
        name: 'Platformer',
        description: '2D платформер',
        files: {
            'main.py': `# 2D Platformer
import game

WIDTH = 800
HEIGHT = 600

game.init(WIDTH, HEIGHT, "Platformer")

# Игрок
player = {
    'x': 100,
    'y': 400,
    'width': 40,
    'height': 40,
    'velocity_x': 0,
    'velocity_y': 0,
    'on_ground': False,
    'speed': 5,
    'jump_power': 15
}

# Платформы
platforms = [
    {'x': 0, 'y': 550, 'width': 800, 'height': 50},
    {'x': 200, 'y': 450, 'width': 150, 'height': 20},
    {'x': 450, 'y': 350, 'width': 150, 'height': 20},
    {'x': 100, 'y': 250, 'width': 100, 'height': 20}
]

gravity = 0.8

while game.running:
    # События
    for event in game.events():
        if event.type == 'keydown':
            if event.key == 'space' and player['on_ground']:
                player['velocity_y'] = -player['jump_power']
    
    # Управление
    keys = game.get_keys()
    player['velocity_x'] = 0
    
    if keys['left']:
        player['velocity_x'] = -player['speed']
    if keys['right']:
        player['velocity_x'] = player['speed']
    
    # Физика
    player['velocity_y'] += gravity
    player['x'] += player['velocity_x']
    player['y'] += player['velocity_y']
    
    # Проверка платформ
    player['on_ground'] = False
    
    for platform in platforms:
        if (player['x'] + player['width'] > platform['x'] and
            player['x'] < platform['x'] + platform['width'] and
            player['y'] + player['height'] > platform['y'] and
            player['y'] < platform['y'] + platform['height']):
            
            # Столкновение сверху
            if player['velocity_y'] > 0:
                player['y'] = platform['y'] - player['height']
                player['velocity_y'] = 0
                player['on_ground'] = True
    
    # Границы экрана
    if player['x'] < 0:
        player['x'] = 0
    if player['x'] + player['width'] > WIDTH:
        player['x'] = WIDTH - player['width']
    if player['y'] > HEIGHT:
        player['y'] = 400
        player['velocity_y'] = 0
    
    # Отрисовка
    game.clear((135, 206, 235))  # Небо
    
    # Платформы
    for platform in platforms:
        game.rect(platform['x'], platform['y'], 
                 platform['width'], platform['height'], (100, 100, 100))
    
    # Игрок
    game.rect(player['x'], player['y'], 
             player['width'], player['height'], (50, 150, 250))
    
    # Инструкция
    game.text("Arrows to move, Space to jump", 10, 10, (255, 255, 255), 16)
    
    game.update(60)

print("Game closed!")
`
        }
    },
    
    shooter: {
        name: 'Space Shooter',
        description: 'Космический шутер',
        files: {
            'main.py': `# Space Shooter
import game
import random

WIDTH = 800
HEIGHT = 600

game.init(WIDTH, HEIGHT, "Space Shooter")

# Игрок
player = {
    'x': WIDTH // 2,
    'y': HEIGHT - 60,
    'width': 40,
    'height': 40,
    'speed': 7
}

# Пули
bullets = []

# Враги
enemies = []
enemy_spawn_timer = 0

score = 0

def create_enemy():
    return {
        'x': random.randint(0, WIDTH - 30),
        'y': -30,
        'width': 30,
        'height': 30,
        'speed': random.randint(2, 5)
    }

while game.running:
    # События
    for event in game.events():
        if event.type == 'keydown':
            if event.key == 'space':
                bullets.append({
                    'x': player['x'] + player['width'] // 2 - 2,
                    'y': player['y'],
                    'width': 4,
                    'height': 15,
                    'speed': 10
                })
    
    # Управление
    keys = game.get_keys()
    if keys['left'] and player['x'] > 0:
        player['x'] -= player['speed']
    if keys['right'] and player['x'] < WIDTH - player['width']:
        player['x'] += player['speed']
    
    # Пули
    for bullet in bullets[:]:
        bullet['y'] -= bullet['speed']
        if bullet['y'] < 0:
            bullets.remove(bullet)
    
    # Враги
    enemy_spawn_timer += 1
    if enemy_spawn_timer > 30:
        enemies.append(create_enemy())
        enemy_spawn_timer = 0
    
    for enemy in enemies[:]:
        enemy['y'] += enemy['speed']
        if enemy['y'] > HEIGHT:
            enemies.remove(enemy)
        
        # Столкновение с пулями
        for bullet in bullets[:]:
            if (bullet['x'] + bullet['width'] > enemy['x'] and
                bullet['x'] < enemy['x'] + enemy['width'] and
                bullet['y'] < enemy['y'] + enemy['height'] and
                bullet['y'] + bullet['height'] > enemy['y']):
                if bullet in bullets:
                    bullets.remove(bullet)
                if enemy in enemies:
                    enemies.remove(enemy)
                score += 10
        
        # Столкновение с игроком
        if (player['x'] + player['width'] > enemy['x'] and
            player['x'] < enemy['x'] + enemy['width'] and
            player['y'] + player['height'] > enemy['y'] and
            player['y'] < enemy['y'] + enemy['height']):
            print(f"Game Over! Score: {score}")
            game.stop()
    
    # Отрисовка
    game.clear((10, 10, 30))
    
    # Игрок
    game.rect(player['x'], player['y'], 
             player['width'], player['height'], (50, 150, 250))
    
    # Пули
    for bullet in bullets:
        game.rect(bullet['x'], bullet['y'], 
                 bullet['width'], bullet['height'], (255, 255, 100))
    
    # Враги
    for enemy in enemies:
        game.rect(enemy['x'], enemy['y'], 
                 enemy['width'], enemy['height'], (200, 50, 50))
    
    # UI
    game.text(f"Score: {score}", 10, 10, (255, 255, 255), 20)
    game.text("Space to shoot", 10, 35, (200, 200, 200), 16)
    
    game.update(60)

print(f"Final Score: {score}")
`
        }
    },
    
    puzzle: {
        name: 'Puzzle Game',
        description: 'Головоломка',
        files: {
            'main.py': `# Puzzle Game - 2048
import game
import random

WIDTH = 600
HEIGHT = 700
GRID_SIZE = 4
CELL_SIZE = 120
PADDING = 10

game.init(WIDTH, HEIGHT, "2048 Puzzle")

# Сетка
grid = [[0 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]

# Цвета для плиток
COLORS = {
    0: (205, 193, 180),
    2: (238, 228, 218),
    4: (237, 224, 200),
    8: (242, 177, 121),
    16: (245, 149, 99),
    32: (246, 124, 95),
    64: (246, 94, 59),
    128: (237, 207, 114),
    256: (237, 204, 97),
    512: (237, 200, 80),
    1024: (237, 197, 63),
    2048: (237, 194, 46)
}

score = 0

def add_random_tile():
    empty = [(i, j) for i in range(GRID_SIZE) for j in range(GRID_SIZE) if grid[i][j] == 0]
    if empty:
        i, j = random.choice(empty)
        grid[i][j] = 2 if random.random() < 0.9 else 4

def move_left():
    global score
    moved = False
    for i in range(GRID_SIZE):
        # Сжатие
        row = [x for x in grid[i] if x != 0]
        # Слияние
        j = 0
        while j < len(row) - 1:
            if row[j] == row[j + 1]:
                row[j] *= 2
                score += row[j]
                row.pop(j + 1)
                moved = True
            j += 1
        # Заполнение
        row += [0] * (GRID_SIZE - len(row))
        if grid[i] != row:
            moved = True
        grid[i] = row
    return moved

# Добавляем стартовые плитки
add_random_tile()
add_random_tile()

while game.running:
    moved = False
    
    for event in game.events():
        if event.type == 'keydown':
            if event.key == 'left':
                moved = move_left()
            elif event.key == 'right':
                # Поворот, движение, обратный поворот
                for row in grid:
                    row.reverse()
                moved = move_left()
                for row in grid:
                    row.reverse()
            elif event.key == 'up':
                # Транспонирование, движение, обратно
                grid[:] = list(map(list, zip(*grid)))
                moved = move_left()
                grid[:] = list(map(list, zip(*grid)))
            elif event.key == 'down':
                grid[:] = list(map(list, zip(*grid)))
                for row in grid:
                    row.reverse()
                moved = move_left()
                for row in grid:
                    row.reverse()
                grid[:] = list(map(list, zip(*grid)))
    
    if moved:
        add_random_tile()
    
    # Отрисовка
    game.clear((250, 248, 239))
    
    # Счёт
    game.text(f"Score: {score}", 20, 20, (119, 110, 101), 32)
    
    # Сетка
    start_y = 100
    for i in range(GRID_SIZE):
        for j in range(GRID_SIZE):
            x = PADDING + j * (CELL_SIZE + PADDING)
            y = start_y + i * (CELL_SIZE + PADDING)
            
            value = grid[i][j]
            color = COLORS.get(value, (60, 58, 50))
            
            game.rect(x, y, CELL_SIZE, CELL_SIZE, color)
            
            if value > 0:
                text_color = (119, 110, 101) if value < 8 else (249, 246, 242)
                size = 48 if value < 100 else (40 if value < 1000 else 32)
                game.text(str(value), x + CELL_SIZE // 2, y + CELL_SIZE // 2, 
                         text_color, size, center=True)
    
    game.text("Use arrow keys", 20, HEIGHT - 40, (119, 110, 101), 20)
    
    game.update(30)
`
        }
    }
};

function loadTemplate(templateName) {
    const template = GAME_TEMPLATES[templateName];
    if (!template) return;
    
    const project = {
        id: generateId(),
        name: template.name,
        description: template.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: template.files,
        assets: [],
        settings: {}
    };
    
    APP.projects.push(project);
    saveProjectsList();
    
    localStorage.setItem('currentProject', project.id);
    window.location.href = 'editor.html';
}

// ===== УТИЛИТЫ =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    if (days < 7) return `${days} дн. назад`;
    
    return date.toLocaleDateString('ru-RU');
}

function checkForSharedCode() {
    const params = new URLSearchParams(window.location.search);
    const sharedCode = params.get('code');
    
    if (sharedCode) {
        try {
            const code = decodeURIComponent(atob(sharedCode));
            localStorage.setItem('sharedCode', code);
            window.location.href = 'editor.html';
        } catch (e) {
            console.error('Ошибка загрузки кода:', e);
        }
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Переключение табов настроек
    document.querySelectorAll('.settings-menu li').forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            document.querySelectorAll('.settings-menu li').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabName + '-panel')?.classList.add('active');
        });
    });
}

console.log('✅ App.js загружен')                  

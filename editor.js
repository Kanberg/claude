// ===== РЕДАКТОР КОДА =====

let currentFile = 'main.py';
let autoSaveInterval = null;
let lineNumbersUpdateTimer = null;

// Инициализация редактора
function initEditor() {
    console.log('🎨 Инициализация редактора...');
    
    const projectId = localStorage.getItem('currentProject');
    if (projectId) {
        APP.currentProject = loadProject(projectId);
        if (APP.currentProject) {
            loadProjectIntoEditor(APP.currentProject);
        }
    }
    
    // Проверка шаренного кода
    const sharedCode = localStorage.getItem('sharedCode');
    if (sharedCode) {
        document.getElementById('codeEditor').value = sharedCode;
        localStorage.removeItem('sharedCode');
    }
    
    setupEditorEvents();
    updateLineNumbers();
    loadEditorSettings();
    
    // Автосохранение каждые 30 секунд
    if (APP.settings.autoSave) {
        autoSaveInterval = setInterval(() => {
            if (APP.currentProject) {
                saveCurrentFile();
                saveProject(APP.currentProject);
                console.log('💾 Автосохранение...');
            }
        }, 30000);
    }
}

// Загрузка проекта в редактор
function loadProjectIntoEditor(project) {
    document.getElementById('projectName').value = project.name;
    
    // Загружаем список файлов
    const fileList = document.getElementById('fileList');
    if (fileList) {
        fileList.innerHTML = Object.keys(project.files).map(filename => `
            <li class="file-item ${filename === currentFile ? 'active' : ''}" 
                data-file="${filename}"
                onclick="switchFile('${filename}')">
                <span class="file-icon">🐍</span>
                <span>${filename}</span>
            </li>
        `).join('');
    }
    
    // Загружаем код текущего файла
    if (project.files[currentFile]) {
        document.getElementById('codeEditor').value = project.files[currentFile];
        updateLineNumbers();
        updateStats();
    }
}

// Переключение между файлами
function switchFile(filename) {
    saveCurrentFile();
    
    currentFile = filename;
    const code = APP.currentProject.files[filename] || '';
    document.getElementById('codeEditor').value = code;
    
    // Обновляем UI
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.toggle('active', item.dataset.file === filename);
    });
    
    updateLineNumbers();
    updateStats();
}

// Сохранение текущего файла
function saveCurrentFile() {
    if (APP.currentProject) {
        const code = document.getElementById('codeEditor').value;
        APP.currentProject.files[currentFile] = code;
    }
}

// Создание нового файла
function createFile() {
    const filename = prompt('Название файла:', 'new_file.py');
    if (!filename) return;
    
    if (!APP.currentProject) {
        APP.currentProject = {
            id: generateId(),
            name: 'Новый проект',
            files: {},
            createdAt: new Date().toISOString()
        };
    }
    
    APP.currentProject.files[filename] = '# ' + filename + '\n\n';
    loadProjectIntoEditor(APP.currentProject);
    switchFile(filename);
    saveProject(APP.currentProject);
}

// Настройка событий редактора
function setupEditorEvents() {
    const editor = document.getElementById('codeEditor');
    if (!editor) return;
    
    // Обновление при вводе
    editor.addEventListener('input', () => {
        updateLineNumbers();
        updateStats();
        updateCursorPosition();
        
        if (APP.settings.livePreview) {
            clearTimeout(window.livePreviewTimer);
            window.livePreviewTimer = setTimeout(() => {
                runGame();
            }, 1500);
        }
    });
    
    // Обработка Tab
    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const spaces = ' '.repeat(APP.settings.tabSize || 4);
            
            editor.value = editor.value.substring(0, start) + spaces + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + spaces.length;
        }
        
        // Ctrl+S для сохранения
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveProject(APP.currentProject);
            showNotification('💾 Проект сохранён!', 'success');
        }
        
        // Ctrl+Enter для запуска
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            runGame();
        }
    });
    
    // Позиция курсора
    editor.addEventListener('click', updateCursorPosition);
    editor.addEventListener('keyup', updateCursorPosition);
}

// Обновление номеров строк
function updateLineNumbers() {
    const editor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    
    if (!editor || !lineNumbers) return;
    
    const lines = editor.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    
    // Синхронизация прокрутки
    lineNumbers.scrollTop = editor.scrollTop;
}

// Обновление статистики
function updateStats() {
    const editor = document.getElementById('codeEditor');
    if (!editor) return;
    
    const code = editor.value;
    const lines = code.split('\n').length;
    
    const totalLinesEl = document.getElementById('totalLines');
    if (totalLinesEl) {
        totalLinesEl.textContent = lines;
    }
}

// Обновление позиции курсора
function updateCursorPosition() {
    const editor = document.getElementById('codeEditor');
    if (!editor) return;
    
    const pos = editor.selectionStart;
    const textBeforeCursor = editor.value.substring(0, pos);
    const lines = textBeforeCursor.split('\n');
    
    const currentLine = lines.length;
    const currentCol = lines[lines.length - 1].length + 1;
    
    const lineEl = document.getElementById('currentLine');
    const colEl = document.getElementById('currentCol');
    
    if (lineEl) lineEl.textContent = currentLine;
    if (colEl) colEl.textContent = currentCol;
}

// Применение настроек редактора
function loadEditorSettings() {
    const editor = document.getElementById('codeEditor');
    if (!editor) return;
    
    editor.style.fontSize = APP.settings.fontSize + 'px';
    editor.style.fontFamily = APP.settings.fontFamily;
    editor.style.tabSize = APP.settings.tabSize;
}

// Сохранение настроек редактора
function saveEditorSettings() {
    APP.settings = {
        ...APP.settings,
        theme: document.getElementById('editorTheme')?.value,
        fontSize: parseInt(document.getElementById('fontSize')?.value),
        fontFamily: document.getElementById('fontFamily')?.value,
        autoSave: document.getElementById('autoSave')?.checked,
        livePreview: document.getElementById('livePreview')?.checked,
        autoComplete: document.getElementById('autoComplete')?.checked,
        lineNumbers: document.getElementById('lineNumbers')?.checked,
        tabSize: parseInt(document.getElementById('tabSize')?.value),
        targetFPS: parseInt(document.getElementById('targetFPS')?.value),
        canvasResolution: document.getElementById('canvasResolution')?.value,
        showHitboxes: document.getElementById('showHitboxes')?.checked
    };
    
    saveSettings(APP.settings);
    loadEditorSettings();
    
    showNotification('✅ Настройки сохранены!', 'success');
    toggleSettings();
}

// Переключение настроек
function toggleSettings() {
    const modal = document.getElementById('editorSettingsModal');
    if (modal) {
        modal.classList.toggle('active');
    }
}

// Полноэкранный режим
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : 'var(--primary)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Загрузка шаблона
function loadTemplate(templateName) {
    const template = GAME_TEMPLATES[templateName];
    if (!template) return;
    
    if (!APP.currentProject) {
        APP.currentProject = {
            id: generateId(),
            name: template.name,
            description: template.description,
            files: {},
            createdAt: new Date().toISOString()
        };
    }
    
    APP.currentProject.files = { ...template.files };
    loadProjectIntoEditor(APP.currentProject);
    saveProject(APP.currentProject);
    
    showNotification(`📚 Шаблон "${template.name}" загружен!`, 'success');
}

// Сохранение проекта
function saveProject(project) {
    if (!project) return false;
    
    saveCurrentFile();
    
    project.name = document.getElementById('projectName')?.value || project.name;
    
    const success = window.saveProject ? window.saveProject(project) : false;
    
    if (success) {
        showNotification('💾 Проект сохранён!', 'success');
    }
    
    return success;
}

// Загрузка ресурса
function uploadAsset() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            if (!APP.currentProject.assets) {
                APP.currentProject.assets = [];
            }
            
            APP.currentProject.assets.push({
                name: file.name,
                data: event.target.result,
                type: file.type
            });
            
            saveProject(APP.currentProject);
            showNotification(`📎 Ресурс "${file.name}" добавлен!`, 'success');
        };
        
        reader.readAsDataURL(file);
    };
    
    input.click();
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
} else {
    initEditor();
}

// Синхронизация прокрутки номеров строк
document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    
    if (editor && lineNumbers) {
        editor.addEventListener('scroll', () => {
            lineNumbers.scrollTop = editor.scrollTop;
        });
    }
});

console.log('✅ Editor.js загружен');

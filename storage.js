// ===== РАБОТА С ХРАНИЛИЩЕМ =====

// Сохранение настроек
function saveSettings(settings) {
    try {
        localStorage.setItem('pythonEditorSettings', JSON.stringify(settings));
        return true;
    } catch (e) {
        console.error('Ошибка сохранения настроек:', e);
        return false;
    }
}

// Загрузка настроек
function loadSettings() {
    try {
        const data = localStorage.getItem('pythonEditorSettings');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Ошибка загрузки настроек:', e);
        return null;
    }
}

// Сохранение списка проектов
function saveProjectsList() {
    try {
        localStorage.setItem('pythonEditorProjects', JSON.stringify(APP.projects));
        return true;
    } catch (e) {
        console.error('Ошибка сохранения проектов:', e);
        return false;
    }
}

// Загрузка списка проектов
function loadProjectsList() {
    try {
        const data = localStorage.getItem('pythonEditorProjects');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Ошибка загрузки проектов:', e);
        return [];
    }
}

// Сохранение проекта
function saveProject(project) {
    try {
        const index = APP.projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
            APP.projects[index] = project;
        } else {
            APP.projects.push(project);
        }
        
        project.updatedAt = new Date().toISOString();
        saveProjectsList();
        
        // Также сохраняем отдельно для быстрого доступа
        localStorage.setItem(`project_${project.id}`, JSON.stringify(project));
        
        return true;
    } catch (e) {
        console.error('Ошибка сохранения проекта:', e);
        return false;
    }
}

// Загрузка проекта
function loadProject(projectId) {
    try {
        // Сначала пробуем загрузить из быстрого кэша
        let data = localStorage.getItem(`project_${projectId}`);
        if (data) {
            return JSON.parse(data);
        }
        
        // Если нет, ищем в списке
        return APP.projects.find(p => p.id === projectId);
    } catch (e) {
        console.error('Ошибка загрузки проекта:', e);
        return null;
    }
}

// Экспорт проекта
function exportProject(project) {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Импорт проекта
function importProject(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target.result);
                project.id = generateId(); // Новый ID
                project.importedAt = new Date().toISOString();
                
                APP.projects.push(project);
                saveProjectsList();
                
                resolve(project);
            } catch (err) {
                reject(err);
            }
        };
        
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Сохранение в облако (симуляция)
async function saveToCloud(project) {
    // В реальном приложении здесь будет API запрос
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Проект сохранён в облако:', project.name);
            resolve(true);
        }, 1000);
    });
}

// Загрузка из облака (симуляция)
async function loadFromCloud(projectId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const project = loadProject(projectId);
            resolve(project);
        }, 1000);
    });
}

console.log('✅ Storage.js загружен');

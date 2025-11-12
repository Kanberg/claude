// ===== МОЩНЫЙ ИГРОВОЙ ДВИЖОК =====

class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.running = false;
        this.paused = false;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.gameLoop = null;
        this.targetFPS = 60;
        this.keys = {};
        this.mouse = { x: 0, y: 0, pressed: false };
        this.objects = [];
        this.eventQueue = [];
    }
    
    // Инициализация
    init(width, height, title = 'Game') {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas не найден!');
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = width;
        this.canvas.height = height;
        
        document.title = title;
        
        this.setupEventListeners();
        
        console.log(`🎮 Игра инициализирована: ${width}x${height}`);
        return true;
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Клавиатура
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code.toLowerCase()] = true;
            
            this.eventQueue.push({
                type: 'keydown',
                key: e.key.toLowerCase(),
                code: e.code
            });
            
            // Предотвращаем прокрутку стрелками
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code.toLowerCase()] = false;
            
            this.eventQueue.push({
                type: 'keyup',
                key: e.key.toLowerCase(),
                code: e.code
            });
        });
        
        // Мышь
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.pressed = true;
            this.eventQueue.push({
                type: 'mousedown',
                x: this.mouse.x,
                y: this.mouse.y,
                button: e.button
            });
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.pressed = false;
            this.eventQueue.push({
                type: 'mouseup',
                x: this.mouse.x,
                y: this.mouse.y,
                button: e.button
            });
        });
    }
    
    // Запуск игры
    start(updateFunction, fps = 60) {
        this.running = true;
        this.targetFPS = fps;
        this.updateFunction = updateFunction;
        
        const overlay = document.getElementById('gameOverlay');
        if (overlay) overlay.classList.add('hidden');
        
        const frameDelay = 1000 / this.targetFPS;
        let lastTime = performance.now();
        
        const loop = (currentTime) => {
            if (!this.running) return;
            
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime >= frameDelay) {
                this.frameCount++;
                
                // Обновление FPS каждую секунду
                if (currentTime - this.lastFrameTime >= 1000) {
                    this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFrameTime));
                    this.frameCount = 0;
                    this.lastFrameTime = currentTime;
                    
                    const fpsEl = document.getElementById('fps');
                    if (fpsEl) fpsEl.textContent = this.fps;
                }
                
                // Вызов игровой логики
                if (this.updateFunction && !this.paused) {
                    this.updateFunction(deltaTime / 1000);
                }
                
                lastTime = currentTime - (deltaTime % frameDelay);
            }
            
            requestAnimationFrame(loop);
        };
        
        requestAnimationFrame(loop);
        console.log('▶️ Игра запущена!');
    }
    
    // Остановка игры
    stop() {
        this.running = false;
        this.keys = {};
        
        const overlay = document.getElementById('gameOverlay');
        if (overlay) overlay.classList.remove('hidden');
        
        console.log('⏹️ Игра остановлена!');
    }
    
    // Пауза
    pause() {
        this.paused = !this.paused;
    }
    
    // Очистка экрана
    clear(color = [0, 0, 0]) {
        if (Array.isArray(color)) {
            this.ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        } else {
            this.ctx.fillStyle = color;
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Рисование прямоугольника
    rect(x, y, width, height, color = [255, 255, 255]) {
        if (Array.isArray(color)) {
            this.ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        } else {
            this.ctx.fillStyle = color;
        }
        this.ctx.fillRect(x, y, width, height);
    }
    
    // Рисование круга
    circle(x, y, radius, color = [255, 255, 255]) {
        if (Array.isArray(color)) {
            this.ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        } else {
            this.ctx.fillStyle = color;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Рисование линии
    line(x1, y1, x2, y2, color = [255, 255, 255], width = 1) {
        if (Array.isArray(color)) {
            this.ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        } else {
            this.ctx.strokeStyle = color;
        }
        
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    // Рисование текста
    text(txt, x, y, color = [255, 255, 255], size = 16, center = false) {
        if (Array.isArray(color)) {
            this.ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        } else {
            this.ctx.fillStyle = color;
        }
        
        this.ctx.font = `${size}px Arial`;
        
        if (center) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
        } else {
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
        }
        
        this.ctx.fillText(txt, x, y);
    }
    
    // Рисование изображения
    image(img, x, y, width = null, height = null) {
        if (width && height) {
            this.ctx.drawImage(img, x, y, width, height);
        } else {
            this.ctx.drawImage(img, x, y);
        }
    }
    
    // Получение нажатых клавиш
    get_keys() {
        return {
            up: this.keys['arrowup'] || this.keys['w'],
            down: this.keys['arrowdown'] || this.keys['s'],
            left: this.keys['arrowleft'] || this.keys['a'],
            right: this.keys['arrowright'] || this.keys['d'],
            space: this.keys[' '] || this.keys['space'],
            enter: this.keys['enter'],
            shift: this.keys['shift'],
            ctrl: this.keys['control']
        };
    }
    
    // Получение событий
    events() {
        const events = [...this.eventQueue];
        this.eventQueue = [];
        return events;
    }
    
    // Проверка столкновений (AABB)
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    // Случайное число
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Обновление (для внешнего вызова)
    update(fps = null) {
        if (fps) this.targetFPS = fps;
    }
}

// Глобальный экземпляр движка
const game = new GameEngine();

// Экспорт для использования в Python-коде
window.game = game;

console.log('✅ Game-engine.js загружен');

// ===== ИНТЕРПРЕТАТОР PYTHON =====

class PythonInterpreter {
    constructor() {
        this.variables = {};
        this.functions = {};
        this.imports = new Set();
        this.output = [];
        this.running = false;
    }
    
    // Выполнение кода
    async execute(code) {
        this.output = [];
        this.running = true;
        
        try {
            // Препроцессинг
            code = this.preprocess(code);
            
            // Транспиляция в JavaScript
            const jsCode = this.transpile(code);
            
            console.log('Транспилированный код:', jsCode);
            
            // Выполнение
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const func = new AsyncFunction('game', 'print', 'random', jsCode);
            
            await func(game, this.print.bind(this), this.createRandomModule());
            
        } catch (error) {
            this.printError(error);
            throw error;
        } finally {
            this.running = false;
        }
        
        return this.output.join('\n');
    }
    
    // Препроцессинг кода
    preprocess(code) {
        // Удаление комментариев (сохраняем для отладки)
        // code = code.replace(/#.*/g, '');
        
        // Нормализация отступов
        code = code.replace(/\t/g, '    ');
        
        return code;
    }
    
    // Транспиляция Python -> JavaScript
    transpile(code) {
        let js = '';
        const lines = code.split('\n');
        let indentLevel = 0;
        let inFunction = false;
        let inLoop = false;
        let loopVars = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const trimmedLine = line.trim();
            
            // Пропускаем пустые строки
            if (!trimmedLine) {
                js += '\n';
                continue;
            }
            
            // Комментарии
            if (trimmedLine.startsWith('#')) {
                js += '// ' + trimmedLine.substring(1) + '\n';
                continue;
            }
            
            // Import
            if (trimmedLine.startsWith('import ')) {
                const module = trimmedLine.split(' ')[1];
                this.imports.add(module);
                js += `// import ${module}\n`;
                continue;
            }
            
            // From import
            if (trimmedLine.startsWith('from ')) {
                js += '// ' + trimmedLine + '\n';
                continue;
            }
            
            // Print
            if (trimmedLine.includes('print(')) {
                const match = trimmedLine.match(/print\((.*)\)/);
                if (match) {
                    let content = match[1];
                    content = this.convertPythonExpression(content);
                    js += `print(${content});\n`;
                }
                continue;
            }
            
            // For loop
            if (trimmedLine.match(/^for\s+\w+\s+in\s+/)) {
                const match = trimmedLine.match(/for\s+(\w+)\s+in\s+(.+):/);
                if (match) {
                    const varName = match[1];
                    let iterable = match[2];
                    
                    // range()
                    if (iterable.includes('range(')) {
                        const rangeMatch = iterable.match(/range\(([^)]+)\)/);
                        if (rangeMatch) {
                            const args = rangeMatch[1].split(',').map(s => s.trim());
                            if (args.length === 1) {
                                js += `for (let ${varName} = 0; ${varName} < ${args[0]}; ${varName}++) {\n`;
                            } else if (args.length === 2) {
                                js += `for (let ${varName} = ${args[0]}; ${varName} < ${args[1]}; ${varName}++) {\n`;
                            } else if (args.length === 3) {
                                js += `for (let ${varName} = ${args[0]}; ${varName} < ${args[1]}; ${varName} += ${args[2]}) {\n`;
                            }
                        }
                    } else {
                        // Обычный итератор
                        js += `for (let ${varName} of ${iterable}) {\n`;
                    }
                    
                    inLoop = true;
                    loopVars.push(varName);
                }
                continue;
            }
            
            // While loop
            if (trimmedLine.startsWith('while ')) {
                const condition = trimmedLine.match(/while\s+(.+):/)[1];
                js += `while (${this.convertPythonExpression(condition)}) {\n`;
                inLoop = true;
                continue;
            }
            
            // If/elif/else
            if (trimmedLine.startsWith('if ')) {
                const condition = trimmedLine.match(/if\s+(.+):/)[1];
                js += `if (${this.convertPythonExpression(condition)}) {\n`;
                continue;
            }
            
            if (trimmedLine.startsWith('elif ')) {
                const condition = trimmedLine.match(/elif\s+(.+):/)[1];
                js += `} else if (${this.convertPythonExpression(condition)}) {\n`;
                continue;
            }
            
            if (trimmedLine === 'else:') {
                js += `} else {\n`;
                continue;
            }
            
            // Function definition
            if (trimmedLine.startsWith('def ')) {
                const match = trimmedLine.match(/def\s+(\w+)\(([^)]*)\):/);
                if (match) {
                    const funcName = match[1];
                    const params = match[2];
                    js += `async function ${funcName}(${params}) {\n`;
                    inFunction = true;
                }
                continue;
            }
            
            // Return
            if (trimmedLine.startsWith('return ')) {
                const value = trimmedLine.substring(7);
                js += `return ${this.convertPythonExpression(value)};\n`;
                continue;
            }
            
            // Break/Continue
            if (trimmedLine === 'break') {
                js += 'break;\n';
                continue;
            }
            
            if (trimmedLine === 'continue') {
                js += 'continue;\n';
                continue;
            }
            
            // Pass
            if (trimmedLine === 'pass') {
                js += '// pass\n';
                continue;
            }
            
            // Присваивание
            if (trimmedLine.includes('=') && !trimmedLine.includes('==')) {
                const parts = trimmedLine.split('=');
                if (parts.length >= 2) {
                    let varName = parts[0].trim();
                    let value = parts.slice(1).join('=').trim();
                    
                    value = this.convertPythonExpression(value);
                    
                    // Определяем, нужен ли let
                    if (!this.variables[varName] && !loopVars.includes(varName)) {
                        js += `let ${varName} = ${value};\n`;
                        this.variables[varName] = true;
                    } else {
                        js += `${varName} = ${value};\n`;
                    }
                }
                continue;
            }
            
            // Операции +=, -=, *=, /=
            if (trimmedLine.match(/\w+\s*[+\-*/]=\s*.+/)) {
                js += trimmedLine + ';\n';
                continue;
            }
            
            // Вызов функции/метода
            if (trimmedLine.includes('(') && trimmedLine.includes(')')) {
                js += this.convertPythonExpression(trimmedLine) + ';\n';
                continue;
            }
            
            // Закрытие блоков (когда отступ уменьшается)
            const currentIndent = line.search(/\S/);
            if (currentIndent < indentLevel) {
                const diff = Math.floor((indentLevel - currentIndent) / 4);
                for (let j = 0; j < diff; j++) {
                    js += '}\n';
                }
            }
            
            indentLevel = currentIndent;
        }
        
        // Закрываем оставшиеся блоки
        const openBraces = (js.match(/{/g) || []).length;
        const closeBraces = (js.match(/}/g) || []).length;
        for (let i = 0; i < openBraces - closeBraces; i++) {
            js += '}\n';
        }
        
        return js;
    }
    
    // Конвертация Python выражений в JavaScript
    convertPythonExpression(expr) {
        expr = expr.trim();
        
        // F-строки
        expr = expr.replace(/f["'](.+?)["']/g, (match, content) => {
            return '`' + content.replace(/\{(.+?)\}/g, '${$1}') + '`';
        });
        
        // Строки
        expr = expr.replace(/'/g, '"');
        
        // Булевы значения
        expr = expr.replace(/\bTrue\b/g, 'true');
        expr = expr.replace(/\bFalse\b/g, 'false');
        expr = expr.replace(/\bNone\b/g, 'null');
        
        // Операторы
        expr = expr.replace(/\band\b/g, '&&');
        expr = expr.replace(/\bor\b/g, '||');
        expr = expr.replace(/\bnot\b/g, '!');
        
        // Функции Python
        expr = expr.replace(/len\(([^)]+)\)/g, '$1.length');
        expr = expr.replace(/str\(([^)]+)\)/g, 'String($1)');
        expr = expr.replace(/int\(([^)]+)\)/g, 'parseInt($1)');
        expr = expr.replace(/float\(([^)]+)\)/g, 'parseFloat($1)');
        
        // Random
        expr = expr.replace(/random\.randint\(([^,]+),\s*([^)]+)\)/g, 
            'random.randint($1, $2)');
        expr = expr.replace(/random\.random\(\)/g, 'Math.random()');
        expr = expr.replace(/random\.choice\(([^)]+)\)/g, 'random.choice($1)');
        
        // Game методы
        expr = expr.replace(/game\.(\w+)/g, 'game.$1');
        
        return expr;
    }
    
    // Встроенные функции
    print(...args) {
        const text = args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg);
            }
            return String(arg);
        }).join(' ');
        
        this.output.push(text);
        this.printToConsole(text);
    }
    
    printToConsole(text, type = 'log') {
        const consoleOutput = document.getElementById('consoleOutput');
        if (consoleOutput) {
            const line = document.createElement('div');
            line.className = `console-${type}`;
            line.textContent = text;
            consoleOutput.appendChild(line);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    }
    
    printError(error) {
        const errorText = `❌ Error: ${error.message}`;
        this.output.push(errorText);
        this.printToConsole(errorText, 'error');
    }
    
    // Модуль random
    createRandomModule() {
        return {
            randint: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
            random: () => Math.random(),
            choice: (arr) => arr[Math.floor(Math.random() * arr.length)],
            shuffle: (arr) => {
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            }
        };
    }
    
    // Очистка
    reset() {
        this.variables = {};
        this.functions = {};
        this.imports.clear();
        this.output = [];
        this.running = false;
    }
}

// Глобальный интерпретатор
const pythonInterpreter = new PythonInterpreter();

// Запуск игры из редактора
async function runGame() {
    const code = document.getElementById('codeEditor').value;
    const consoleOutput = document.getElementById('consoleOutput');
    
    // Очистка
    if (consoleOutput) consoleOutput.innerHTML = '';
    pythonInterpreter.reset();
    game.stop();
    
    // Активация кнопок
    const runBtn = document.getElementById('runBtn');
    const stopBtn = document.getElementById('stopBtn');
    if (runBtn) runBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    
    try {
        await pythonInterpreter.execute(code);
        
        // Если есть инициализация игры, запускаем
        if (pythonInterpreter.imports.has('game')) {
            // Игра уже запущена в коде
        }
    } catch (error) {
        console.error('Ошибка выполнения:', error);
    }
    
    if (runBtn) runBtn.disabled = false;
}

// Остановка игры
function stopGame() {
    game.stop();
    pythonInterpreter.running = false;
    
    const runBtn = document.getElementById('runBtn');
    const stopBtn = document.getElementById('stopBtn');
    if (runBtn) runBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
}

// Сброс игры
function resetGame() {
    stopGame();
    runGame();
}

// Отладка
function debugGame() {
    console.log('Variables:', pythonInterpreter.variables);
    console.log('Functions:', pythonInterpreter.functions);
    console.log('Game state:', game);
}

// Скриншот
function screenshotGame() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `screenshot_${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
    });
    
    showNotification('📷 Скриншот сохранён!', 'success');
}

console.log('✅ Python-interpreter.js загружен');

let currentDir = '/';
let fileSystem = {
    '/': { type: 'dir', children: { home: { type: 'dir', children: {} } } },
};
let history = [];
let user = 'user';

// Виртуальная память
let virtualMemory = {
    total: 5 * 1024 * 1024 * 1024, // 5 ГБ в байтах
    used: 0,
    blocks: [], // Список блоков памяти
};

// Список процессов
let processes = [
    { id: 1, name: 'init', status: 'running', cpu: 1 },
    { id: 2, name: 'bash', status: 'running', cpu: 3 },
];

// Git репозиторий
let gitRepo = { initialized: false, files: {}, commits: [] };

// Таймер (5 минут)
let timer = 5 * 60 * 1000; // 5 минут в миллисекундах
setTimeout(() => {
    alert('Время работы системы истекло. Перезагрузка...');
    location.reload();
}, timer);

const commands = {
    pwd: () => currentDir,
    ls: () => {
        const dir = resolvePath(currentDir);
        return Object.keys(dir.children).join(' ');
    },
    cd: (args) => {
        if (!args.length) return 'Usage: cd [directory]';
        const path = args[0] === '..' ? parentPath(currentDir) : args[0];
        if (resolvePath(path)) {
            currentDir = normalizePath(path);
            return '';
        } else {
            return `cd: ${args[0]}: No such file or directory`;
        }
    },
    mkdir: (args) => {
        if (!args.length) return 'Usage: mkdir [directory]';
        const name = args[0];
        const dir = resolvePath(currentDir);
        if (dir.children[name]) return `mkdir: ${name}: File exists`;
        dir.children[name] = { type: 'dir', children: {} };
        return '';
    },
    touch: (args) => {
        if (!args.length) return 'Usage: touch [file]';
        const name = args[0];
        const dir = resolvePath(currentDir);
        dir.children[name] = { type: 'file', content: '' };
        return '';
    },
    ps: () => {
        return processes
            .map((proc) => `${proc.id}\t${proc.name}\t${proc.status}\t${proc.cpu}% CPU`)
            .join('\n');
    },
    kill: (args) => {
        if (!args.length) return 'Usage: kill [process_id]';
        const id = parseInt(args[0], 10);
        const proc = processes.find((p) => p.id === id);
        if (!proc) return `kill: No such process with ID ${id}`;
        proc.status = 'terminated';
        return `Process ${id} (${proc.name}) terminated`;
    },
    start: (args) => {
        if (!args.length) return 'Usage: start [process_name]';
        const name = args[0];
        const id = processes.length + 1;
        processes.push({ id, name, status: 'running', cpu: Math.random() * 10 });
        return `Started process ${name} with ID ${id}`;
    },
    stop: (args) => {
        if (!args.length) return 'Usage: stop [process_id]';
        const id = parseInt(args[0], 10);
        const proc = processes.find((p) => p.id === id);
        if (!proc) return `stop: No such process with ID ${id}`;
        proc.status = 'stopped';
        return `Process ${id} (${proc.name}) stopped`;
    },
    git: (args) => {
        if (!args.length) return 'Usage: git [command]';
        const subCommand = args.shift();
        if (subCommand === 'init') {
            gitRepo.initialized = true;
            return 'Initialized empty Git repository';
        }
        if (!gitRepo.initialized) return 'fatal: not a git repository';
        if (subCommand === 'add') {
            if (!args.length) return 'Usage: git add [file]';
            const file = args[0];
            if (!fileSystem[currentDir].children[file]) return `fatal: pathspec '${file}' did not match any files`;
            gitRepo.files[file] = 'staged';
            return `Added ${file}`;
        }
        if (subCommand === 'commit') {
            if (!args.length) return 'Usage: git commit -m [message]';
            const message = args.join(' ').replace('-m ', '');
            gitRepo.commits.push({ message, files: { ...gitRepo.files } });
            gitRepo.files = {};
            return `Committed with message: "${message}"`;
        }
        if (subCommand === 'status') {
            const stagedFiles = Object.keys(gitRepo.files).join(', ');
            return `On branch main\nStaged files: ${stagedFiles || 'none'}\n`;
        }
        if (subCommand === 'log') {
            return gitRepo.commits
                .map((c, i) => `commit ${i + 1}\n    ${c.message}`)
                .join('\n\n');
        }
        return `git: '${subCommand}' is not a git command`;
    },
    clear: () => {
        output.innerHTML = '';
        return '';
    },
};

function resolvePath(path) {
    const parts = normalizePath(path).split('/').filter(Boolean);
    let dir = fileSystem['/'];
    for (const part of parts) {
        if (dir.children[part]) {
            dir = dir.children[part];
        } else {
            return null;
        }
    }
    return dir;
}

function normalizePath(path) {
    if (path.startsWith('/')) return path;
    return `${currentDir}/${path}`.replace(/\/+/g, '/');
}

function parentPath(path) {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return `/${parts.join('/')}`;
}

function processCommand(command) {
    const [cmd, ...args] = command.split(' ');
    history.push(command);
    if (commands[cmd]) {
        return commands[cmd](args);
    } else {
        return `${cmd}: command not found`;
    }
}

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = input.value.trim();
        const result = processCommand(command);
        output.innerHTML += `<div><span style="color:#4e9a06;">${user}@ubuntu:${currentDir}$</span> ${command}</div>`;
        if (result) {
            output.innerHTML += `<div>${result}</div>`;
        }
        input.value = '';
        output.scrollTop = output.scrollHeight;
    }
});

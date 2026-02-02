document.addEventListener('DOMContentLoaded', () => {
    // --- Terminal 3.0: Network Engineer Edition ---
    const terminalOverlay = document.getElementById('terminal-overlay');
    const terminalBody = document.getElementById('terminal-body');
    const terminalInput = document.getElementById('terminal-input');
    const terminalToggleBtn = document.getElementById('terminal-toggle-btn');
    const closeTerminalBtn = document.getElementById('close-terminal-btn');

    let commandHistory = [];
    let historyIndex = -1;
    let isMatrixMode = false;
    let matrixInterval = null;
    let isCiscoMode = false; // Toggle between Linux prompt and Switch> prompt
    let hostname = "netreka";

    // Available Commands for Tab Completion
    const availableCommands = [
        'help', 'whoami', 'contact', 'projects', 'clear',
        'neofetch', 'matrix', 'ping', 'ip a', 'traceroute',
        'scan', 'top', 'whois', 'exit', 'reboot',
        'enable', 'conf t', 'show running-config', 'show version',
        'show ip int br', 'dig', 'nslookup', 'netstat', 'arp', 'tcpdump', 'ssh'
    ];

    // Toggle Terminal
    function toggleTerminal() {
        const isHidden = terminalOverlay.style.display === 'none' || terminalOverlay.style.display === '';
        if (isHidden) {
            terminalOverlay.style.display = 'flex';
            terminalInput.focus();
            if (terminalBody.children.length === 0) {
                printOutput("YasinOS [Version 3.1.0 - Network Core]", "system");
                printOutput("(c) 2026 Yasin Engin. All rights reserved.", "system");
                printOutput("Type 'neofetch' or 'help' to start.", "text");
                printOutput("---------------------------------------", "system");
            }
        } else {
            terminalOverlay.style.display = 'none';
        }
    }

    if (terminalToggleBtn) terminalToggleBtn.addEventListener('click', toggleTerminal);
    if (closeTerminalBtn) closeTerminalBtn.addEventListener('click', () => terminalOverlay.style.display = 'none');

    // Global close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && terminalOverlay.style.display === 'flex') {
            terminalOverlay.style.display = 'none';
        }
        if ((isMatrixMode) && (e.key === 'q' || e.key === 'c')) {
            stopMatrix();
        }
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === terminalOverlay) terminalOverlay.style.display = 'none';
    });

    // Fake IP Generator
    function randomIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    // Handle Input
    terminalInput.addEventListener('keydown', (e) => {
        if (isMatrixMode) {
            e.preventDefault();
            if (e.key === 'c' && e.ctrlKey) stopMatrix();
            if (e.key === 'q') stopMatrix();
            return;
        }

        if (e.key === 'Enter') {
            const command = terminalInput.value.trim();
            if (command) {
                // Dynamic Prompt
                const prompt = isCiscoMode ? `${hostname}#` : `user@${hostname}:~$`;
                printOutput(`${prompt} ${command}`, "command");

                processCommand(command);
                commandHistory.push(command);
                historyIndex = commandHistory.length;
                terminalInput.value = '';
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                terminalInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminalInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                terminalInput.value = '';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const current = terminalInput.value;
            const match = availableCommands.find(c => c.startsWith(current));
            if (match) terminalInput.value = match;
        }
    });

    function printOutput(text, type = "text") {
        const div = document.createElement('div');
        div.classList.add('terminal-line');
        if (type === "command") div.classList.add('line-command');
        if (type === "system") div.classList.add('line-system');
        if (type === "error") div.classList.add('line-error');
        if (type === "success") div.classList.add('line-success');
        if (type === "accent") div.classList.add('line-accent');

        if (text.startsWith('ASCII_ART')) {
            div.style.whiteSpace = 'pre';
            div.style.lineHeight = '1.2';
            div.style.color = '#00ff00';
            div.textContent = text.replace('ASCII_ART', '');
        } else if (text.includes('<a')) {
            div.innerHTML = text;
        } else {
            div.textContent = text;
        }
        terminalBody.appendChild(div);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function startMatrix() {
        isMatrixMode = true;
        terminalBody.innerHTML = '';
        terminalInput.disabled = true;
        terminalInput.placeholder = "Press 'q' to stop Matrix...";
        const chars = "1010010010101010101XYzABC";
        matrixInterval = setInterval(() => {
            const span = document.createElement('span');
            span.style.color = '#00ff00';
            span.style.textShadow = '0 0 5px #00ff00';
            span.style.fontFamily = 'monospace';
            span.style.display = 'block';
            span.textContent = Array(Math.floor(Math.random() * 80)).join(' ').split('').map(() => Math.random() > 0.9 ? chars[Math.floor(Math.random() * chars.length)] : ' ').join('');
            terminalBody.appendChild(span);
            terminalBody.scrollTop = terminalBody.scrollHeight;
            if (terminalBody.childElementCount > 50) terminalBody.removeChild(terminalBody.firstChild);
        }, 50);
    }

    function stopMatrix() {
        isMatrixMode = false;
        clearInterval(matrixInterval);
        terminalBody.innerHTML = '';
        printOutput("Matrix connection terminated.", "system");
        terminalInput.disabled = false;
        terminalInput.placeholder = "Enter command...";
        terminalInput.focus();
    }

    function processCommand(cmd) {
        const lowerCmd = cmd.toLowerCase();

        // --- CISCO IOS SIMULATION ---
        if (isCiscoMode) {
            if (lowerCmd === 'exit' || lowerCmd === 'end') {
                isCiscoMode = false;
                printOutput("Configured from console by console", "system");
                return;
            }
            if (lowerCmd === 'show running-config' || lowerCmd === 'sh run') {
                printOutput("Building configuration...");
                printOutput(`Current configuration : 1420 bytes`);
                printOutput(`!`);
                printOutput(`version 16.9`);
                printOutput(`service timestamps debug datetime msec`);
                printOutput(`hostname ${hostname}`);
                printOutput(`!`);
                printOutput(`interface GigabitEthernet0/0`);
                printOutput(` ip address 192.168.1.10 255.255.255.0`);
                printOutput(` duplex auto`);
                printOutput(` speed auto`);
                printOutput(`!`);
                printOutput(`interface Loopback0`);
                printOutput(` ip address 10.10.10.1 255.255.255.255`);
                printOutput(`!`);
                printOutput(`router bgp 65000`);
                printOutput(` neighbor 10.45.0.1 remote-as 65001`);
                printOutput(`!`);
                printOutput(`end`);
                return;
            }
            if (lowerCmd === 'show version' || lowerCmd === 'sh ver') {
                printOutput("Cisco IOS Software, CSR1000V Software (X86_64_LINUX_IOSD-UNIVERSALK9-M), Version 16.9.4");
                printOutput(`System image file is "bootflash:packages.conf"`);
                printOutput(`Last reset from power-on`);
                return;
            }
            if (lowerCmd === 'show ip int br' || lowerCmd === 'sh ip int br') {
                printOutput("Interface              IP-Address      OK? Method Status                Protocol");
                printOutput("GigabitEthernet0/0     192.168.1.10    YES manual up                    up");
                printOutput("GigabitEthernet0/1     unassigned      YES unset  administratively down down");
                printOutput("Loopback0              10.10.10.1      YES manual up                    up");
                return;
            }
            if (lowerCmd.startsWith('conf')) {
                printOutput("Enter configuration commands, one per line.  End with CNTL/Z.");
                return;
            }
            printOutput("Invalid input detected at '^' marker.", "system");
            return;
        }

        // --- GENERAL COMMANDS ---
        if (lowerCmd.startsWith('ping')) {
            const target = cmd.split(' ')[1] || 'google.com';
            printOutput(`PING ${target} (142.250.187.14) 56(84) bytes of data.`);
            let count = 0;
            const pinger = setInterval(() => {
                count++;
                const time = Math.floor(Math.random() * 20) + 10;
                printOutput(`64 bytes from ${target}: icmp_seq=${count} ttl=117 time=${time}ms`, "success");
                if (count >= 4) {
                    clearInterval(pinger);
                    printOutput(`--- ${target} ping statistics ---`, "system");
                    printOutput(`4 packets transmitted, 4 received, 0% packet loss`);
                }
            }, 800);
            return;
        }

        if (lowerCmd.startsWith('ssh')) {
            printOutput(`OpenSSH 8.9p1 Ubuntu, OpenSSL 3.0.2 15 Mar 2026`);
            setTimeout(() => printOutput(`${cmd.split(' ')[1] || 'user'}@${cmd.split(' ')[2] || 'remote'}'s password: `), 500);
            setTimeout(() => printOutput(`Permission denied, please try again.`, "error"), 2500);
            return;
        }

        if (lowerCmd.startsWith('dig') || lowerCmd.startsWith('nslookup')) {
            const domain = cmd.split(' ')[1] || 'yasinengin.com';
            printOutput(`; <<>> DiG 9.18.1 <<>> ${domain}`);
            printOutput(`;; global options: +cmd`);
            printOutput(`;; ANSWER SECTION:`);
            printOutput(`${domain}.		3600	IN	A	${randomIP()}`, "success");
            printOutput(`;; Query time: 12 msec`);
            return;
        }

        switch (lowerCmd) {
            case 'help':
            case '?':
                printOutput("Available commands:", "accent");
                printOutput("  scan                 Run network vulnerability scan");
                printOutput("  neofetch             Display system information");
                printOutput("  netstat              Show network connections");
                printOutput("  arp -a               Show ARP table");
                printOutput("  enable               Switch to Cisco Mode");
                printOutput("  dig <domain>         DNS Lookup");
                printOutput("  top                  Process Viewer");
                printOutput("  matrix               Enter the Matrix");
                printOutput("  clear                Clean screen");
                printOutput("  exit                 Close terminal");
                break;

            case 'enable':
            case 'en':
                isCiscoMode = true;
                hostname = "Core-Router";
                printOutput("Changed mode to Cisco IOS. Type 'exit' to return.", "accent");
                break;

            case 'neofetch':
                const art = `ASCII_ART
       .---.
      /     \\    user@netreka
      |  O  |    ------------
      \\     /    OS: YasinOS Land
       '---'     Host: GitHub Pages
     //|||||\\\\   Kernel: 5.15.0-net-eng
    // ||||| \\\\  Uptime: 24h 7m
   //  |||||  \\\\ Shell: ZSH (Simulated)
  //   |||||   \\\\ Resolution: 1920x1080
 //    |||||    \\\\ CPU: Cloud Brain v9
//     |||||     \\\\ Memory: 64TB / 128TB
`;
                printOutput(art);
                break;

            case 'matrix':
                startMatrix();
                break;

            case 'ip a':
            case 'ifconfig':
                printOutput("1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN");
                printOutput("    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00");
                printOutput("    inet 127.0.0.1/8 scope host lo");
                printOutput("2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP");
                printOutput("    inet 192.168.1.10/24 brd 192.168.1.255 scope global eth0", "accent");
                break;

            case 'netstat':
            case 'netstat -tulpen':
                printOutput("Active Internet connections (only servers)");
                printOutput("Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name");
                printOutput("tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      892/sshd");
                printOutput("tcp        0      0 127.0.0.1:5432          0.0.0.0:*               LISTEN      771/postgres");
                printOutput("tcp6       0      0 :::80                   :::*                    LISTEN      102/nginx");
                break;

            case 'arp':
            case 'arp -a':
                printOutput("Interface: 192.168.1.10 --- 0x2");
                printOutput("  Internet Address      Physical Address      Type");
                printOutput(`  192.168.1.1           00-14-22-01-23-45     dynamic`);
                printOutput(`  192.168.1.55          12-34-56-78-9a-bc     dynamic`);
                break;

            case 'scan':
                printOutput("Starting Nmap 7.92...", "system");
                setTimeout(() => printOutput("Discovered open port 80/tcp on 192.168.1.1", "success"), 1200);
                setTimeout(() => printOutput("Discovered open port 22/tcp on 192.168.1.1", "success"), 1800);
                break;

            case 'whoami':
                printOutput("User: Yasin Engin", "accent");
                printOutput("Role: Network Engineer | Wireless Specialist | Automation Dev");
                break;

            case 'top':
                printOutput("Tasks: 92 total,   1 running,  91 sleeping,   0 stopped,   0 zombie");
                printOutput("%Cpu(s):  1.2 us,  0.5 sy,  0.0 ni, 98.2 id,  0.0 wa,  0.0 hi,  0.1 si");
                printOutput("  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND");
                printOutput("  123 root      20   0  168532   4212   3000 R   0.7  0.1   0:01.44 top");
                printOutput("    1 root      20   0  225884   9500   6800 S   0.0  0.2   0:05.11 systemd");
                break;

            case 'clear':
            case 'cls':
                terminalBody.innerHTML = '';
                break;

            case 'exit':
                terminalOverlay.style.display = 'none';
                break;

            case 'reboot':
                location.reload();
                break;

            default:
                if (lowerCmd.startsWith('sudo')) {
                    printOutput("yasin is not in the sudoers file. This incident will be reported.", "error");
                } else {
                    printOutput(`Command not found: ${cmd}. Type 'help'.`, "error");
                }
        }
    }
});

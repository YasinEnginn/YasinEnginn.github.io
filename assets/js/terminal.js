document.addEventListener('DOMContentLoaded', () => {
    // --- Terminal Logic ---
    const terminalOverlay = document.getElementById('terminal-overlay');
    const terminalBody = document.getElementById('terminal-body');
    const terminalInput = document.getElementById('terminal-input');
    const terminalToggleBtn = document.getElementById('terminal-toggle-btn');
    const closeTerminalBtn = document.getElementById('close-terminal-btn');

    let commandHistory = [];
    let historyIndex = -1;

    // Toggle Terminal
    function toggleTerminal() {
        const isHidden = terminalOverlay.style.display === 'none' || terminalOverlay.style.display === '';

        if (isHidden) {
            terminalOverlay.style.display = 'flex';
            terminalInput.focus();
            // Intro message if empty
            if (terminalBody.children.length === 0) {
                printOutput("Welcome to YasinEngin CLI [Version 1.0.0]", "system");
                printOutput("Type 'help' to see available commands.", "system");
                printOutput("---------------------------------------", "system");
            }
        } else {
            terminalOverlay.style.display = 'none';
        }
    }

    if (terminalToggleBtn) {
        terminalToggleBtn.addEventListener('click', toggleTerminal);
    }

    if (closeTerminalBtn) {
        closeTerminalBtn.addEventListener('click', () => {
            terminalOverlay.style.display = 'none';
        });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === terminalOverlay) {
            terminalOverlay.style.display = 'none';
        }
    });

    // Handle Input
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = terminalInput.value.trim();
            if (command) {
                printOutput(`user@netreka:~$ ${command}`, "command");
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
        }
    });

    function printOutput(text, type = "text") {
        const div = document.createElement('div');
        div.classList.add('terminal-line');
        if (type === "command") div.classList.add('line-command');
        if (type === "system") div.classList.add('line-system');
        if (type === "error") div.classList.add('line-error');
        if (type === "success") div.classList.add('line-success');

        // Handle Allow HTML for specific outputs like links
        if (text.includes('<a')) {
            div.innerHTML = text;
        } else {
            div.textContent = text;
        }

        terminalBody.appendChild(div);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function processCommand(cmd) {
        const lowerCmd = cmd.toLowerCase();

        switch (lowerCmd) {
            case 'help':
            case '?':
                printOutput("Available commands:");
                printOutput("  help                 Show this help message");
                printOutput("  whoami               Who is Yasin Engin?");
                printOutput("  contact              Show contact info");
                printOutput("  projects             List featured projects");
                printOutput("  clear                Clear terminal screen");
                printOutput("  show ip int br       [Network Engineer Special]");
                printOutput("  ping                 Test connectivity");
                printOutput("  traceroute           Trace path to expertise");
                break;

            case 'whoami':
                printOutput("User: Yasin Engin");
                printOutput("Role: Network Engineer | Cybersecurity Enthusiast | Automation Dev");
                printOutput("Mission: Securing bits, automating bytes.");
                break;

            case 'contact':
                printOutput("Email: yasinenginoffical@gmail.com");
                printOutput("LinkedIn: linkedin.com/in/yasin-engin");
                printOutput("GitHub: github.com/YasinEnginExpert");
                break;

            case 'library':
            case 'books':
                printOutput("Fetching academic records...");
                setTimeout(() => {
                    printOutput("--- LIBRARY SHELF ---", "system");
                    printOutput("1. [Cert] CCNA 200-301 Official Cert Guide");
                    printOutput("2. [Cert] CCNP Enterprise Core ENCOR 350-401");
                    printOutput("3. [Auto] Network Programmability with YANG");
                    printOutput("4. [Auto] Network Automation with Go");
                    printOutput("---------------------", "system");
                }, 500);
                break;

            case 'projects':
                printOutput("1. CCNA_Notes_and_Labs");
                printOutput("2. CCNP_Notes_and_Labs");
                printOutput("3. Go_Network_Programming");
                printOutput("4. Tolerex");
                printOutput("5. my-ansible-lab");
                printOutput("6. Netreka-Nexus");
                printOutput("Type 'open [1-6]' to view a project (e.g., 'open 1').");
                break;

            case 'clear':
            case 'cls':
                terminalBody.innerHTML = '';
                break;

            case 'show ip int br':
            case 'sh ip int br':
                printOutput("Interface              IP-Address      OK? Method Status                Protocol");
                printOutput("GigabitEthernet0/0     192.168.1.10    YES manual up                    up      (Home)");
                printOutput("Loopback0              127.0.0.1       YES manual up                    up      (Local)");
                printOutput("GitHub0/1              Unassigned      YES unset  up                    up      (Active)");
                printOutput("LinkedIn0/2            Unassigned      YES unset  up                    up      (Active)");
                break;

            case 'ping':
            case 'ping google.com':
                printOutput("Pinging... ");
                setTimeout(() => printOutput("Reply from 8.8.8.8: bytes=32 time=12ms TTL=118"), 400);
                setTimeout(() => printOutput("Reply from 8.8.8.8: bytes=32 time=14ms TTL=118"), 800);
                setTimeout(() => printOutput("Reply from 8.8.8.8: bytes=32 time=11ms TTL=118"), 1200);
                setTimeout(() => printOutput("Reply from 8.8.8.8: bytes=32 time=13ms TTL=118", "success"), 1600);
                break;

            case 'traceroute':
            case 'traceroute yasin':
                printOutput("Tracing route to YasinEnginExpert [127.0.0.1]");
                setTimeout(() => printOutput("1  <1 ms  <1 ms  <1 ms  Start-Point-University"), 300);
                setTimeout(() => printOutput("2   2 ms   1 ms   2 ms  CCNA-Certification-Gw"), 700);
                setTimeout(() => printOutput("3   5 ms   4 ms   5 ms  SOC-Operations-L1"), 1200);
                setTimeout(() => printOutput("4  12 ms  10 ms  11 ms  Network-Automation-Go"), 1800);
                setTimeout(() => printOutput("5  15 ms  14 ms  15 ms  Destination-Reached", "success"), 2400);
                break;

            default:
                if (lowerCmd.startsWith('open ')) {
                    const projectMap = {
                        '1': 'https://github.com/YasinEnginExpert/CCNA_Notes_and_Labs',
                        '2': 'https://github.com/YasinEnginExpert/CCNP_Notes_and_Labs',
                        '3': 'https://github.com/YasinEnginExpert/Go_Network_Programming',
                        '4': 'https://github.com/YasinEnginExpert/Tolerex',
                        '5': 'https://github.com/YasinEnginExpert/my-ansible-lab',
                        '6': 'https://github.com/YasinEnginExpert/Netreka-Nexus'
                    };
                    const num = lowerCmd.split(' ')[1];
                    if (projectMap[num]) {
                        printOutput(`Opening project ${num}...`, "success");
                        window.open(projectMap[num], '_blank');
                    } else {
                        printOutput("Invalid project number.", "error");
                    }
                } else {
                    printOutput(`Command not found: ${cmd}. Type 'help' for options.`, "error");
                }
        }
    }
});

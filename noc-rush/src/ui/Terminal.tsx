import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { CLIParser } from '../engine/cli/parser';

interface TerminalProps {
    deviceName: string;
    onCommand?: (cmd: string) => void;
}

const parser = new CLIParser();

export const TerminalComponent: React.FC<TerminalProps> = ({ deviceName }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const bufferRef = useRef<string>('');

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#09090b', // zinc-950
                foreground: '#22c55e', // green-500
                cursor: '#22c55e'
            },
            fontFamily: 'monospace',
            fontSize: 14
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;

        term.write(`\r\nWelcome to NOC Rush CLI\r\nConnected to ${deviceName}\r\n`);
        term.write(`${deviceName}# `);

        term.onData((data) => {
            const code = data.charCodeAt(0);

            // Enter key
            if (code === 13) {
                term.write('\r\n');
                const cmd = bufferRef.current;
                bufferRef.current = '';

                // Execute command via parser
                const res = parser.execute(deviceName, cmd);
                if (res.output) {
                    term.write(res.output.replace(/\n/g, '\r\n') + '\r\n');
                }

                term.write(`${deviceName}# `);
            }
            // Backspace
            else if (code === 127) {
                if (bufferRef.current.length > 0) {
                    bufferRef.current = bufferRef.current.slice(0, -1);
                    term.write('\b \b');
                }
            }
            // Normal char
            else if (code >= 32) {
                bufferRef.current += data;
                term.write(data);
            }
        });

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            term.dispose();
            window.removeEventListener('resize', handleResize);
        };
    }, [deviceName]);

    return <div ref={terminalRef} className="h-full w-full" />;
};

import { useGameStore } from '../session';
import { Device, Interface } from '../types';

export interface CommandResult {
    output: string;
    success: boolean;
}

export class CLIParser {

    execute(hostname: string, input: string): CommandResult {
        const cmd = input.trim();
        if (!cmd) return { output: '', success: true };

        const device: Device | undefined = useGameStore.getState().topology.devices[hostname];
        if (!device) return { output: '% Device not found', success: false };

        // Simple parser
        if (cmd === 'show ip interface brief') {
            const header = 'Interface              IP-Address      OK? Method Status                Protocol';
            const lines = Object.values(device.interfaces).map((iface: Interface) => {
                // Mock formatting
                return `${iface.id.padEnd(22)} ${iface.ip || 'unassigned'}     YES manual ${iface.status.padEnd(21)} ${iface.status}`;
            });
            return { output: [header, ...lines].join('\n'), success: true };
        }

        if (cmd === 'show run' || cmd === 'show running-config') {
            return { output: device.config, success: true };
        }

        if (cmd.startsWith('ping')) {
            return { output: 'Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to target, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5)', success: true };
        }

        return { output: '% Invalid input detected at marker', success: false };
    }
}

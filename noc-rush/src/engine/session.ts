import { create } from 'zustand';
import { GameSession, Topology } from './types';

interface GameState extends GameSession {
    // Actions
    initSession: (topology: Topology) => void;
    updateScore: (delta: number) => void;
    addAlert: (msg: string, severity: 'critical' | 'major' | 'minor') => void;
    tick: () => void;
}

const INITIAL_TOPOLOGY: Topology = {
    devices: {},
    links: []
};

export const useGameStore = create<GameState>((set) => ({
    id: 'session-' + Math.random().toString(36).substr(2, 9),
    score: 0,
    sla: 100,
    startTime: Date.now(),
    topology: INITIAL_TOPOLOGY,
    alerts: [],

    initSession: (topo) => set({ topology: topo, startTime: Date.now(), score: 0, sla: 100, alerts: [] }),

    updateScore: (delta) => set((state) => ({ score: state.score + delta })),

    addAlert: (msg, severity) => set((state) => ({
        alerts: [
            {
                id: Math.random().toString(36),
                message: msg,
                severity,
                timestamp: Date.now(),
                active: true
            },
            ...state.alerts
        ]
    })),

    tick: () => set((state) => {
        // Simple mock logic for SLA decay if alerts exist
        const decay = state.alerts.filter(a => a.active).length * 0.1;
        return { sla: Math.max(0, state.sla - decay) };
    })
}));

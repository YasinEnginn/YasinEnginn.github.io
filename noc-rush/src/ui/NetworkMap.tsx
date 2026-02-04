import React from 'react';
import { useGameStore } from '../engine/session';

export const NetworkMap: React.FC = () => {
    const { topology } = useGameStore();

    // Mock data if empty
    const devices = Object.keys(topology.devices).length ? topology.devices : {
        'R1': { id: 'R1', type: 'router', x: 200, y: 150, interfaces: {}, config: '' },
        'SW1': { id: 'SW1', type: 'switch', x: 400, y: 150, interfaces: {}, config: '' },
        'R2': { id: 'R2', type: 'router', x: 300, y: 300, interfaces: {}, config: '' },
    };

    const links = topology.links.length ? topology.links : [
        { source: 'R1', target: 'SW1', id: 'l1' },
        { source: 'SW1', target: 'R2', id: 'l2' },
        { source: 'R1', target: 'R2', id: 'l3' }
    ];

    return (
        <div className="w-full h-full relative bg-gray-900 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {links.map((link: any, i) => {
                    const src = (devices as any)[link.source];
                    const dst = (devices as any)[link.target];
                    if (!src || !dst) return null;
                    return (
                        <line
                            key={i}
                            x1={src.x} y1={src.y}
                            x2={dst.x} y2={dst.y}
                            stroke="#4ade80"
                            strokeWidth="2"
                            strokeOpacity="0.5"
                        />
                    );
                })}
            </svg>

            {Object.values(devices).map((dev: any) => (
                <div
                    key={dev.id}
                    className="absolute flex flex-col items-center justify-center w-16 h-16 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border-2 border-green-500 rounded-full cursor-pointer hover:border-white transition-colors shadow-lg shadow-green-900/20"
                    style={{ left: dev.x, top: dev.y }}
                >
                    <span className="text-xs font-bold text-white">{dev.id}</span>
                    <span className="text-[10px] text-gray-400 uppercase">{dev.type}</span>
                </div>
            ))}
        </div>
    );
};

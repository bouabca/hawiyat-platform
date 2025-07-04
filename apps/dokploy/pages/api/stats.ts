import type { NextApiRequest, NextApiResponse } from 'next';
import os from 'os';
import { exec } from 'child_process';

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const start = os.cpus();
    setTimeout(() => {
      const end = os.cpus();
      let idleDiff = 0;
      let totalDiff = 0;
      for (let i = 0; i < start.length; i++) {
        const startCpu = start[i];
        const endCpu = end[i];
        if (!startCpu || !endCpu) continue;
        const idle = endCpu.times.idle - startCpu.times.idle;
        const total = Object.keys(endCpu.times).reduce((acc, type) => {
          const endVal = endCpu.times[type as keyof typeof endCpu.times];
          const startVal = startCpu.times[type as keyof typeof startCpu.times];
          if (typeof endVal !== 'number' || typeof startVal !== 'number') return acc;
          return acc + (endVal - startVal);
        }, 0);
        idleDiff += idle;
        totalDiff += total;
      }
      const usage = totalDiff > 0 ? 100 - Math.round(100 * idleDiff / totalDiff) : 0;
      resolve(usage);
    }, 200);
  });
}

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return Math.round((used / total) * 100);
}

function getDiskUsage(): Promise<number> {
  return new Promise((resolve) => {
    // Windows: use wmic, Linux/Mac: use df
    if (process.platform === 'win32') {
      exec('wmic logicaldisk get size,freespace,caption', (err, stdout) => {
        if (err) return resolve(0);
        const lines = stdout.trim().split('\n').slice(1);
        let total = 0, free = 0;
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length === 3) {
            const freeStr = parts[1];
            const totalStr = parts[2];
            if (freeStr && totalStr) {
              free += parseInt(freeStr, 10) || 0;
              total += parseInt(totalStr, 10) || 0;
            }
          }
        }
        const used = total - free;
        resolve(total > 0 ? Math.round((used / total) * 100) : 0);
      });
    } else {
      exec('df -k --total | grep total', (err, stdout) => {
        if (err) return resolve(0);
        const parts = stdout.trim().split(/\s+/);
        const usedStr = parts[2];
        const totalStr = parts[1];
        const used = usedStr ? parseInt(usedStr, 10) : 0;
        const total = totalStr ? parseInt(totalStr, 10) : 0;
        resolve(total > 0 ? Math.round((used / total) * 100) : 0);
      });
    }
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const [cpu, disk] = await Promise.all([
    getCpuUsage(),
    getDiskUsage()
  ]);
  const memory = getMemoryUsage();
  res.status(200).json({ cpu, memory, disk });
} 
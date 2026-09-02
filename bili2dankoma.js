#!/usr/bin/env node

import readline from "node:readline";

const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
});

for await (const line of rl) {
    if (!line.trim()) {
        continue;
    }

    let d;

    try {
        d = JSON.parse(line);
    } catch (err) {
        console.error(`bili2dankoma: invalid JSON: ${err.message}`);
        continue;
    }

    // The sacred danmawip schematic.
    const comment = [
        d.content,
        Number(d.progress_ms) / 1000,
        d.mode,
        d.ctime,
        d.color,
        d.fontsize,
    ];

    process.stdout.write(JSON.stringify(comment) + "\n");
}

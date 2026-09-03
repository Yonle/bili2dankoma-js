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
        console.error(`ytchat2dankoma: invalid JSON: ${err.message}`);
        continue;
    }

    const offset = Number(
        d.replayChatItemAction?.videoOffsetTimeMsec
    );

    // Only process messages that actually happened after
    // the stream started.
    if (!Number.isFinite(offset) || offset <= 0) {
        continue;
    }

    const item =
        d.replayChatItemAction?.actions?.[0]?.addChatItemAction?.item;

    const msg = item?.liveChatTextMessageRenderer;

    // Ignore system messages, paid messages, memberships, etc.
    if (!msg) {
        continue;
    }

    const runs = msg.message?.runs;

    if (!Array.isArray(runs)) {
        continue;
    }

    const content = runs.map(run => {
        if (typeof run.text === "string") {
            return run.text;
        }

        // YouTube emojis have no `text`; emojiId is the actual
        // Unicode emoji in normal cases.
        if (run.emoji?.emojiId) {
            return run.emoji.emojiId;
        }

        return "";
    }).join("");

    if (!content) {
        continue;
    }

    // Dankoma's "sacred danmawip schematic".
    const comment = [
        content,
        offset / 1000,
        1,              // scrolling
        Math.floor(Number(msg.timestampUsec) / 1000000),
        16777215,       // white
        25,             // default font size
    ];

    process.stdout.write(JSON.stringify(comment) + "\n");
}

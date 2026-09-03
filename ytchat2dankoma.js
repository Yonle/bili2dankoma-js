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

    const replay = d.replayChatItemAction;

    if (!replay) {
        continue;
    }

    const offset = Number(replay.videoOffsetTimeMsec);

    // Ignore messages without a valid playback timestamp.
    if (!Number.isFinite(offset) || offset <= 0) {
        continue;
    }

    const actions = replay.actions;

    if (!Array.isArray(actions)) {
        continue;
    }

    /*
     * Only accept normal text chat:
     *
     *   addChatItemAction
     *     -> item
     *       -> liveChatTextMessageRenderer
     *
     * This excludes Super Chats, memberships, stickers,
     * system messages, etc.
     */
    let msg = null;

    for (const action of actions) {
        const candidate =
            action?.addChatItemAction?.item?.liveChatTextMessageRenderer;

        if (candidate) {
            msg = candidate;
            break;
        }
    }

    if (!msg) {
        continue;
    }

    const runs = msg.message?.runs;

    if (!Array.isArray(runs)) {
        continue;
    }

    const content = runs
        .map(run => {
            // Ordinary text, including normal Unicode emoji.
            if (typeof run?.text === "string") {
                return run.text;
            }

            const emoji = run?.emoji;

            if (!emoji) {
                return "";
            }

            /*
             * Custom YouTube emoji are represented by an emoji object.
             * emojiId is an identifier, NOT the rendered Unicode character.
             *
             * Prefer the accessibility label when available, otherwise
             * fall back to the first shortcut (e.g. ":pepe:").
             */
            return (
                emoji.image?.accessibility?.accessibilityData?.label ??
                emoji.shortcuts?.[0] ??
                ""
            );
        })
        .join("");

    if (!content) {
        continue;
    }

    const timestampUsec = Number(msg.timestampUsec);

    if (!Number.isFinite(timestampUsec)) {
        continue;
    }

    const comment = [
        content,
        offset / 1000,
        1,                      // scrolling
        Math.floor(timestampUsec / 1e6),
        16777215,               // white
        25,                     // default font size
    ];

    process.stdout.write(JSON.stringify(comment) + "\n");
}

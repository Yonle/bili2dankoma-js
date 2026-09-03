#!/usr/bin/env node

import fs from "node:fs";

const input = fs.readFileSync(0, "utf8");

let comments;

try {
    comments = JSON.parse(input);
} catch (err) {
    console.error(`niconico2dankoma: invalid JSON: ${err.message}`);
    process.exit(1);
}

if (!Array.isArray(comments)) {
    console.error("niconico2dankoma: expected a JSON array");
    process.exit(1);
}

/*
 * Dankoma record:
 *
 *   [text, time, mode, timestamp, color, size]
 *
 *   text      = comment text
 *   time      = video playback position, seconds
 *   mode      = Dankoma rendering mode
 *   timestamp = source comment timestamp, Unix seconds
 *   color     = 0xRRGGBB
 *   size      = font size in pixels
 *
 * `vposMs` is the comment's position in the video.
 * `postedAt` is only the wall-clock time at which the comment
 * was posted, so it must NEVER be used for playback ordering.
 */

/*
 * Niconico color names -> 0xRRGGBB
 *
 * Includes normal and premium color aliases.
 */
const COLORS = {
    white:          0xffffff,
    red:            0xff0000,
    pink:           0xff8080,
    orange:         0xffcc00,
    yellow:         0xffff00,
    green:          0x00ff00,
    cyan:           0x00ffff,
    blue:           0x0000ff,
    purple:         0xc000ff,
    black:          0x000000,

    white2:         0xcccc99,
    niconicowhite:  0xcccc99,

    red2:           0xcc0033,
    truered:        0xcc0033,

    orange2:        0xff6600,
    passionorange:  0xff6600,

    yellow2:        0x999900,
    madyellow:      0x999900,

    green2:         0x00cc66,
    elementalgreen: 0x00cc66,

    blue2:          0x3399ff,
    marineblue:     0x3399ff,

    purple2:        0x6633cc,
    nobleviolet:    0x6633cc,

    pink2:          0xff33cc,
    cyan2:          0x00cccc,

    black2:         0x666666,
};

/*
 * Dankoma defaults.
 *
 * `25` is Dankoma's default font size.
 * Niconico's explicit `medium` command is 24px.
 */
const DEFAULT_MODE = 1;       // naka / scrolling
const DEFAULT_SIZE = 25;
const DEFAULT_COLOR = 0xffffff;

/*
 * Parse Niconico's `commands` array.
 *
 * Only visual/presentation commands are translated.
 * Metadata commands such as `184` and `device:*` are ignored.
 *
 * Later presentation commands override earlier ones.
 */
function parseCommands(commands) {
    let mode = DEFAULT_MODE;
    let size = DEFAULT_SIZE;
    let color = DEFAULT_COLOR;

    if (!Array.isArray(commands)) {
        return { mode, size, color };
    }

    for (const command of commands) {
        if (typeof command !== "string") {
            continue;
        }

        switch (command) {
            /*
             * Position.
             */
            case "naka":
                mode = 1;
                continue;

            case "ue":
                mode = 5;
                continue;

            case "shita":
                mode = 4;
                continue;

            /*
             * Font size.
             */
            case "big":
                size = 36;
                continue;

            case "medium":
                size = 24;
                continue;

            case "small":
                size = 12;
                continue;
        }

        /*
         * Color.
         */
        if (Object.hasOwn(COLORS, command)) {
            color = COLORS[command];
        }

        /*
         * Everything else is intentionally ignored:
         *
         *   184
         *   device:PC
         *   device:3DS
         *   ...
         */
    }

    return { mode, size, color };
}

/*
 * Validate and normalize comments before sorting.
 *
 * This avoids sorting records that are going to be discarded anyway.
 */
const records = [];

for (const comment of comments) {
    const vposMs = Number(comment?.vposMs);

    if (!Number.isFinite(vposMs) || vposMs < 0) {
        continue;
    }

    const text = comment?.body;

    if (typeof text !== "string" || text.length === 0) {
        continue;
    }

    const postedAtMs = Date.parse(comment?.postedAt);

    if (!Number.isFinite(postedAtMs)) {
        continue;
    }

    const { mode, size, color } = parseCommands(comment?.commands);

    records.push({
        vposMs,
        postedAtMs,
        text,
        mode,
        size,
        color,
    });
}

/*
 * Sort by playback position.
 *
 * Modern Node.js Array#sort() is stable, so comments with identical
 * vposMs retain their original source order.
 */
records.sort((a, b) => a.vposMs - b.vposMs);

/*
 * Emit Dankoma JSONL.
 */
for (const record of records) {
    const output = [
        record.text,
        record.vposMs / 1000,
        record.mode,
        Math.floor(record.postedAtMs / 1000),
        record.color,
        record.size,
    ];

    process.stdout.write(JSON.stringify(output) + "\n");
}

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
 *   time      = video position, seconds
 *   mode      = Dankoma mode
 *   timestamp = original comment posting time, Unix seconds
 *   color     = 0xRRGGBB
 *   size      = font size
 */

/*
 * Niconico color names -> 0xRRGGBB
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

const DEFAULT_MODE = 1;       // naka
const DEFAULT_SIZE = 24;      // medium
const DEFAULT_COLOR = 0xffffff;

/*
 * Parse Niconico's presentation commands.
 *
 * Metadata commands such as:
 *   184
 *   device:PC
 *   device:3DS
 *   @96
 *
 * are not rendering commands and are ignored.
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
                break;

            case "ue":
                mode = 5;
                break;

            case "shita":
                mode = 4;
                break;

            /*
             * Font size.
             */
            case "big":
                size = 36;
                break;

            case "medium":
                size = 24;
                break;

            case "small":
                size = 12;
                break;

            default:
                if (Object.hasOwn(COLORS, command)) {
                    color = COLORS[command];
                }
                break;
        }
    }

    return { mode, size, color };
}

/*
 * Build normalized records first.
 *
 * `vposMs` is already the video's playback position in milliseconds.
 * Do NOT derive it from `postedAt`.
 */
const records = [];

for (const [index, comment] of comments.entries()) {
    const vposMs = Number(comment?.vposMs);

    if (!Number.isFinite(vposMs) || vposMs < 0) {
        continue;
    }

    const text = comment?.body;

    if (typeof text !== "string" || text.length === 0) {
        continue;
    }

    const postedAtMs = Date.parse(comment?.postedAt);

    /*
     * postedAt is metadata for record[3].
     *
     * It is NOT used for video timing.
     */
    if (!Number.isFinite(postedAtMs)) {
        continue;
    }

    const { mode, size, color } = parseCommands(comment?.commands);

    records.push({
        text,
        vposMs,
        postedAtMs,
        mode,
        size,
        color,

        /*
         * Keep source order as a final tie-breaker.
         *
         * `no` is preferable when available because it represents the
         * comment's sequence number in the video.
         */
        no: Number.isFinite(Number(comment?.no))
            ? Number(comment.no)
            : index,
    });
}

/*
 * Playback order:
 *
 *   1. video position
 *   2. Niconico comment number
 *
 * This handles multiple comments sharing exactly the same vposMs.
 */
records.sort((a, b) => {
    const timeDiff = a.vposMs - b.vposMs;

    if (timeDiff !== 0) {
        return timeDiff;
    }

    return a.no - b.no;
});

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

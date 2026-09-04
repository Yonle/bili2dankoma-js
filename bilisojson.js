#!/usr/bin/env node

const fs = require("node:fs");
const protobuf = require("protobufjs");

async function main() {
    const root = await protobuf.load("protobuf/bilidm.proto");

    const DmSegMobileReply = root.lookupType(
        "bilibili.community.service.dm.v1.DmSegMobileReply"
    );

    // Read stdin as raw protobuf bytes.
    const data = fs.readFileSync(0);

    let reply;

    try {
        reply = DmSegMobileReply.decode(data);
    } catch (err) {
        console.error(`decode protobuf: ${err.message}`);
        process.exit(1);
    }

    for (const d of reply.elems) {
        const result = [
            d.content,                    // 0: text / Mode 7 payload
            Number(d.progress) / 1000,   // 1: seconds
            d.mode,                       // 2: mode
            Number(d.ctime),              // 3: unix timestamp
            d.color,                      // 4: RGB888
            d.fontsize,                   // 5: font size

            d.id,                         // 6: numeric dmid
            d.midHash,                    // 7: sender hash
            d.weight,                     // 8: weight
            d.action,                     // 9: action
            d.pool,                       // 10: pool
            d.idStr,                      // 11: string dmid
            d.attr,                       // 12: attribute bits
            d.animation,                  // 13: animation
        ];

        process.stdout.write(JSON.stringify(result) + "\n");
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

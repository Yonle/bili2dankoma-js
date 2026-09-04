# bili2dankoma-js
bili-cli JSONL danmaku converter to dankoma.js JSONL

## usage

```
./bili2dankoma.js < bilibili.jsonl > dankoma.jsonl
```

For legacy danmaku (that has `/n`, These can be fixed with `legacyfix.js`:


```
./bili2dankoma.js < legacy-bilibili.jsonl | ./legacyfix.js > dankoma.jsonl
```

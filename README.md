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

## bilisojson

there's also `bilisojson.js` where it turns `seg.so` to dankoma jsonl compatible. the usage is similar, but you had to install the dependency first since it uses protobuf:
```
npm i
```

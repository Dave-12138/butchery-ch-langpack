import fs from "fs";
function read(filename, rootDir) {
    const path = rootDir ? "./" : "./assets/butcher/lang/";
    const data = fs.readFileSync(path + filename, "utf8");
    return JSON.parse(data);
}
function write(filename, content, rootDir) {
    const path = rootDir ? "./" : "./assets/butcher/lang/";
    fs.writeFileSync(path + filename, content instanceof Object ? JSON.stringify(content) : content, { encoding: "utf8", flag: "w+" });
}
const en0 = read('old_en_us.json');
const zh = read('zh_cn.json');
const en = read('en_us.json', true);

if (process.env.STEP?.trim() !== "merge") {
    const changedKeys = Object.keys(en).filter(k => en[k] !== en0[k]);
    write("diff2.json", changedKeys.map(k => [k, en0[k], en[k], zh[k]].map(r => r ?? "<empty>")), true);
    write("diff.json", changedKeys.reduce((p, v) => Object.assign(p, { [v]: zh[v] ? zh[v] + `(${en[v]})` : en[v] }), {}), true);
} else {
    // 归并
    const diff = read("diff.json", true);
    write("zh_cn.json", Object.keys(zh).concat(Object.keys(diff)).reduce((pv, v) => Object.assign(pv, { [v]: diff[v] || zh[v] || "" }), {}));
    write("old_en_us.json", en);
}
import fs from "fs";
function read(filename, rootDir) {
    const path = rootDir ? "./" : "./assets/butcher/lang/";
    const data = fs.readFileSync(path + filename, "utf8");
    return JSON.parse(data);
}
function write(filename, content, rootDir) {
    const path = rootDir ? "./" : "./assets/butcher/lang/";
    fs.writeFileSync(path + filename, content, { encoding: "utf8", flag: "w+" });
}
const en0 = read('en_us.json');
const zh = read('zh_cn.json');
const en = read('en_us.json', true);

if (process.env.STEP !== "merge") {

    console.log(Object.keys(en).filter(k => en[k] !== en0[k]).map(k => [k, en0[k], en[k], zh[k]].join('\t')).join('\n'))
    write("diff.json", JSON.stringify(Object.keys(en).filter(k => en[k] !== en0[k]).reduce((p, v) => Object.assign(p, { [v]: en[v] }), {})), true);
} else {
    // 归并
    // ((zh, diff) => { write("zh_cn.json",JSON.stringify(Object.keys(zh).concat(Object.keys(diff)).reduce((pv, v) => { pv[v] = diff[v] || zh[v] || ""; return pv }, {}))) })(zh, JSON.parse(l()))
}
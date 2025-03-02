import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const lang = "./assets/butcher/lang/";
const books = path.join("./assets/butcher/patchouli_books/butchers_guide/zh_cn/");
/**
 * 读取json文件，解析为对象
 * @param {string} filename 
 * @param {string?} dpath 
 * @returns {Object}
 */
function read(filename, dpath = "./") {
    const data = fs.readFileSync(path.join(dpath, filename), "utf8");
    return JSON.parse(data);
}
/**
 * 存储json文件
 * @param {string} filename 
 * @param {string|Object} content 
 * @param {string?} dpath 
 */
function write(filename, content, dpath = "./") {
    fs.writeFileSync(path.join(dpath, filename), content instanceof Object ? JSON.stringify(content) : content, { encoding: "utf8", flag: "w+" });
}
/**
 * 
 * @param {import("node:fs").PathLike} dpath 
 * @returns {string[]}
 */
function deep(dpath) {
    if (!fs.existsSync(dpath)) {
        return [];
    }
    return fs.readdirSync(dpath).map(subPath => {
        const fullPath = path.join(dpath, subPath);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            return deep(fullPath);
        }
        return fullPath;
    }).flat();
}

const pathEnGuide = path.join('./butchers_guide/en_us/');
const pathOldEnGuide = path.join('./old_butchers_guide/en_us/');
const pathDiffGuide = path.join('./diff_butchers_guide/zh_cn/');
function hashFile(fpath) {
    return createHash("md5").update(fs.readFileSync(fpath)).digest('hex');
}
function guideNoChange(fpath) {
    const oldPath = fpath.replace(pathEnGuide, pathOldEnGuide);
    return fs.existsSync(oldPath) && (hashFile(oldPath) == hashFile(fpath));
}
function mkAllDir(dpath) {
    path.join(dpath).split(path.sep).reduce((base, cur) => {
        const fullPath = path.join(base, cur);
        if (!fs.existsSync(fullPath) && !cur.includes('.')) {
            fs.mkdirSync(fullPath);
        }
        return fullPath;
    }, ".")
}
try {
    const uparam = {
        diff() {
            // lang
            const en = read('en_us.json');
            const zh = read('zh_cn.json', lang);
            const en0 = read('old_en_us.json');
            const changedKeys = Object.keys(en).filter(k => en[k] !== en0[k]);
            const toTableTuple = k => [k, en0[k], en[k], zh[k]].map(r => r ?? "<empty>");
            write("diff.json", changedKeys.reduce((p, v) => Object.assign(p, { [v]: zh[v] ? zh[v] + `(${en[v]})` : en[v] }), {}));
            write("diff2.json", changedKeys.map(toTableTuple));
            write("diff3.json", Object.keys(zh).map(toTableTuple));
            // guide
            // 先清理
            // deep(pathDiffGuide).forEach(f => fs.rmSync(f));
            fs.rmSync(pathDiffGuide, { recursive: true, force: true });
            // 比较，复制有改动的文件
            deep(pathEnGuide).forEach(f => {
                if (!guideNoChange(f)) {
                    const difPath = f.replace(pathEnGuide, pathDiffGuide);
                    mkAllDir(difPath);
                    fs.copyFileSync(f, difPath);
                }
            })
        },
        merge() {
            // 归并
            // lang
            const en = read('en_us.json');
            const zh = read('zh_cn.json', lang);
            const diff = read("diff.json");
            write("zh_cn.json", Object.keys(zh).concat(Object.keys(diff)).reduce((pv, v) => Object.assign(pv, { [v]: diff[v] || zh[v] || "" }), {}), lang);
            write("old_en_us.json", en);
            // guide
            deep(pathDiffGuide).forEach(f => {
                const rpath = f.replace(pathDiffGuide, books);
                mkAllDir(rpath);
                fs.copyFileSync(f, rpath);
            })
            // 更新old
            deep(pathEnGuide).forEach(f => {
                const opath = f.replace(pathEnGuide, pathOldEnGuide);
                mkAllDir(opath);
                fs.copyFileSync(f, opath);
            })
        },
    }
    uparam[process.env.STEP?.trim()]?.();
} catch (e) {
    console.log(e)
}
// 從 data/full/*.json 抽出每個遊戲的前 12 名高分 picks，打包成 server 端可 import 的精簡檔。
// 由每日自動更新流程在 `npm run data` 之後執行。
const fs = require("fs");
const path = require("path");

const games = ["daily539", "lotto649", "superLotto638"];
const out = {};
for (const g of games) {
  const full = JSON.parse(fs.readFileSync(path.join("data", "full", g + ".json"), "utf8"));
  out[g] = {
    name: full.name,
    pick: full.pick,
    latest: full.latest ? { period: full.latest.period, date: full.latest.date } : null,
    score: (full.score || []).slice(0, 12).map((s) => ({ n: s.n, score: s.score })),
  };
}
fs.mkdirSync(path.join("server", "src", "data"), { recursive: true });
fs.writeFileSync(path.join("server", "src", "data", "full-picks.json"), JSON.stringify(out));
console.log("server/src/data/full-picks.json regenerated for", games.join(", "));

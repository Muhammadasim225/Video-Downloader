const fs = require("fs");
const path = require("path");

let proxies = [];
let loaded = false;

function loadProxies() {
  try {
    const filePath = path.join(__dirname, "../../proxies.txt");

    if (!fs.existsSync(filePath)) {
      console.warn("⚠️ proxies.txt not found. Running without proxies.");
      proxies = [];
      loaded = true;
      return;
    }

    const file = fs.readFileSync(filePath, "utf-8");

    proxies = file
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && !p.startsWith("#"));

    if (proxies.length === 0) {
      console.warn("⚠️ proxies.txt is empty. Running without proxies.");
    } else {
      console.log(`✅ Loaded ${proxies.length} proxies`);
    }

    loaded = true;
  } catch (err) {
    console.error("❌ Failed to load proxies:", err.message);
    proxies = [];
    loaded = true;
  }
}

function getRandomProxy() {
  if (!loaded) loadProxies();

  if (!proxies.length) return null;

  const index = Math.floor(Math.random() * proxies.length);
  return proxies[index];
}

module.exports = {
  getRandomProxy,
};
import fs from "fs";
import path from "path";

export const createBackupFolder = (basePath) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const folderPath = path.join(basePath, timestamp);

  fs.mkdirSync(folderPath, { recursive: true });

  return folderPath;
};

export const deleteOldBackups = (basePath, retentionCount) => {
  if (!fs.existsSync(basePath)) return;

  const items = fs
    .readdirSync(basePath)
    .map((name) => {
      const fullPath = path.join(basePath, name);
      return {
        name,
        path: fullPath,
        time: fs.statSync(fullPath).mtime.getTime(),
      };
    })
    .sort((a, b) => b.time - a.time); // newest first

  const excess = items.slice(retentionCount);

  excess.forEach((item) => {
    // ✅ THIS WAS THE BUG
    fs.rmSync(item.path, { recursive: true, force: true });
  });
};
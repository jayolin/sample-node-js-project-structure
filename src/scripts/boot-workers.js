import fs from "fs";
import path from "path";
let tempFolderPath = path.join(__dirname, "../../temp");
fs.existsSync(tempFolderPath) || fs.mkdirSync(tempFolderPath);

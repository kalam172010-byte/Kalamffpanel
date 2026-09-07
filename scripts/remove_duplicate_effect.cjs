const fs = require("fs");

const files = ["public/assets/index-BvHT743v.js", "dist/assets/index-BvHT743v.js"];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, "utf-8");

  const target = 'Qs.useEffect(()=>{if(n){l(""),P(null),d("AMOUNT")}},[n]);';

  if (content.includes(target)) {
    content = content.replace(target, '/* cleared duplicate reset */');
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("Successfully removed duplicate reset useEffect in", filePath);
  } else {
    console.log("Target not found in", filePath);
  }
}

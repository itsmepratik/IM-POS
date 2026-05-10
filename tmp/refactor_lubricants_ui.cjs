const fs = require("fs");
const file =
  "d:/Coding Projects/pos/app/pos/components/categories/LubricantCategory.tsx";
let content = fs.readFileSync(file, "utf8");

// Replace the old button class for Diesel/Other blocks
content = content.replace(
  /className="border-2 rounded-\[18px\] flex flex-col items-center justify-between p-3 sm:p-4 h-\[180px\] sm:h-\[200px\] md:h-\[220px\] overflow-hidden shadow-sm hover:shadow-md transition-all relative"/g,
  /className={\`w-full h-full min-h-[220px] sm:min-h-[240px] flex-col overflow-hidden p-0 rounded-[18px] hover:bg-accent border-2 transition-all hover:scale-[1.02] group relative \${!lubricant.isAvailable ? "opacity-60 cursor-not-allowed bg-muted" : ""}\`}/
    .source,
);

// Remove specific sizing from the image wrapper background
content = content.replace(
  /<div\s+className="relative flex-1 w-full mt-2 mb-2 min-h-\[60px\] rounded-lg transition-colors"/g,
  '<div \n                              className="relative flex-1 w-full transition-colors"',
);

// Wrap LubricantImage inside the absolute inset bounds, taking care to not double wrap if run multiple times
content = content.replace(
  /<LubricantImage([\s\S]*?)\/>/g,
  '<div className="absolute inset-2 sm:inset-3 md:inset-4">\n                                <LubricantImage$1/>\n                              </div>',
);

// Remove padding rounding from out of stock
content = content.replace(
  /bg-background\/50 backdrop-blur-\[1px\] rounded-md z-10/g,
  "bg-background/50 backdrop-blur-[1px] z-10",
);

// Replace the text blocks at the bottom
const targetText =
  /<div className="text-center shrink-0 flex flex-col justify-end w-full gap-0\.5 mt-1 z-10">[\s\S]*?<div className="flex flex-col w-full">[\s\S]*?<span[\s\S]*?>([\s\S]*?)<\/span>[\s\S]*?<\/div>[\s\S]*?<span className="block text-sm font-bold text-\[#6d6d6d\] mt-0">([\s\S]*?)<\/span>[\s\S]*?<\/div>/g;

content = content.replace(targetText, (match, name, price) => {
  return `<div className="w-full bg-slate-50 border-t py-2 px-2 shrink-0 flex flex-col items-center justify-center min-h-[50px] sm:min-h-[60px] z-10">
                              <span className="text-center font-semibold text-[10px] sm:text-xs w-full px-1 break-words line-clamp-2 text-foreground leading-tight">
                                ${name.trim()}
                              </span>
                              <span className="block text-xs sm:text-sm font-bold text-[#6d6d6d] mt-0.5">
                                ${price.trim()}
                              </span>
                            </div>`;
});

fs.writeFileSync(file, content);
console.log("Done refactoring");

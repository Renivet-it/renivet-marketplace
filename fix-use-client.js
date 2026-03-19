const fs = require('fs');
const path = require('path');

function fixUseClient(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixUseClient(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Check if file contains "use client"
            if (content.includes('"use client"') || content.includes("'use client'")) {
                let lines = content.split('\n');
                let useClientLineIndex = -1;
                
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes('"use client"') || lines[i].includes("'use client'")) {
                        useClientLineIndex = i;
                        break;
                    }
                }
                
                // If "use client" is found but not at the top (ignoring empty lines/comments)
                // Let's just force it to the very first line if it's not already.
                if (useClientLineIndex > 0) {
                    let isTop = true;
                    for (let i = 0; i < useClientLineIndex; i++) {
                        let l = lines[i].trim();
                        if (l !== '' && !l.startsWith('//') && !l.startsWith('/*') && !l.startsWith('*')) {
                            isTop = false;
                            break;
                        }
                    }
                    if (!isTop) {
                        // Remove the existing 'use client' line
                        lines.splice(useClientLineIndex, 1);
                        // Add to the very top
                        lines.unshift('"use client";');
                        fs.writeFileSync(fullPath, lines.join('\n'));
                        console.log('Fixed use client in ' + fullPath);
                    }
                }
            }
        }
    }
}

fixUseClient('c:/Personal Projects/renivet-marketplace/src/app');
fixUseClient('c:/Personal Projects/renivet-marketplace/src/components');
fixUseClient('c:/Personal Projects/renivet-marketplace/src/lib');
console.log('Done fixing use client.');

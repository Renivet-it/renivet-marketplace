const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            // Replace direct lucide-react Loader2 imports
            // e.g. import { Loader2, Phone } from "lucide-react";
            if (content.match(/import\s+{([^}]*Loader2[^}]*)}\s+from\s+["']lucide-react["']/)) {
                content = content.replace(/import\s+{([^}]*Loader2[^}]*)}\s+from\s+["']lucide-react["']/g, (match, insideBraces) => {
                    let newInside = insideBraces.split(',').map(s => s.trim()).filter(s => s !== 'Loader2' && s !== '').join(', ');
                    if (newInside) return `import { ${newInside} } from "lucide-react"`;
                    return ''; // completely remove import if Loader2 was the only one
                });
                
                if (!content.includes('import { Spinner }')) {
                    content = `import { Spinner } from "@/components/ui/spinner";\n` + content;
                }
            }

            if (content.includes('Icons.Loader2')) {
                content = content.replace(/Icons\.Loader2/g, 'Spinner');
                if (!content.includes('import { Spinner }')) {
                    content = `import { Spinner } from "@/components/ui/spinner";\n` + content;
                }
            }

            if (content.includes('<Loader2')) {
                content = content.replace(/<Loader2/g, '<Spinner');
                if (!content.includes('import { Spinner }')) {
                    content = `import { Spinner } from "@/components/ui/spinner";\n` + content;
                }
            }
            if (content.includes('</Loader2>')) {
                content = content.replace(/<\/Loader2>/g, '</Spinner>');
            }

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated ' + fullPath);
            }
        }
    }
}

processDirectory('c:/Personal Projects/renivet-marketplace/src/app');
processDirectory('c:/Personal Projects/renivet-marketplace/src/components');
processDirectory('c:/Personal Projects/renivet-marketplace/src/lib');
console.log('Done.');

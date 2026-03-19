import fs from 'fs';
import path from 'path';

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Handle direct import from lucide-react
            const lucideImportRegex = /import\s+{([^}]*Loader2[^}]*)}\s+from\s+["']lucide-react["']/g;
            let finalContent = content;
            
            let match;
            while ((match = lucideImportRegex.exec(content)) !== null) {
                let insideBraces = match[1];
                let terms = insideBraces.split(',').map(s => s.trim()).filter(Boolean);
                let newTerms = terms.filter(s => s !== 'Loader2');
                
                let importStmt = match[0];
                let newImportStmt = newTerms.length > 0 
                    ? \`import { \${newTerms.join(', ')} } from "lucide-react"\`
                    : '';
                
                finalContent = finalContent.replace(importStmt, newImportStmt);
                
                // Add Spinner import just below this
                if (!finalContent.includes('import { Spinner } from "@/components/ui/spinner"')) {
                    finalContent = \`import { Spinner } from "@/components/ui/spinner";\\n\` + finalContent;
                }
                modified = true;
            }

            // Also check if any Icons.Loader2 or Icons.Loader is used
            if (finalContent.includes('Icons.Loader2') || finalContent.includes('Icons.Loader ') || finalContent.includes('Icons.Loader\\n') || finalContent.includes('<Icons.Loader2') || finalContent.includes('<Icons.Loader')) {
                finalContent = finalContent.replace(/Icons\.Loader2/g, 'Spinner');
                finalContent = finalContent.replace(/Icons\.Loader/g, 'Spinner');
                if (!finalContent.includes('import { Spinner } from "@/components/ui/spinner"')) {
                    finalContent = \`import { Spinner } from "@/components/ui/spinner";\\n\` + finalContent;
                }
                modified = true;
            }

            // Replace JSX tags
            if (finalContent.includes('<Loader2')) {
                finalContent = finalContent.replace(/<Loader2/g, '<Spinner');
                modified = true;
            }
            if (finalContent.includes('</Loader2>')) {
                finalContent = finalContent.replace(/<\\/Loader2>/g, '</Spinner>');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, finalContent);
                console.log('Updated ' + fullPath);
            }
        }
    }
}

// Ensure we don't accidentally ruin the spinner itself
processDirectory('c:/Personal Projects/renivet-marketplace/src/app');
processDirectory('c:/Personal Projects/renivet-marketplace/src/components/profile');
processDirectory('c:/Personal Projects/renivet-marketplace/src/components/shop');
processDirectory('c:/Personal Projects/renivet-marketplace/src/components/orders');
processDirectory('c:/Personal Projects/renivet-marketplace/src/components/home');
processDirectory('c:/Personal Projects/renivet-marketplace/src/components/globals');
processDirectory('c:/Personal Projects/renivet-marketplace/src/components/dashboard');
console.log('Done.');

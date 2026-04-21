const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/dashboard/**/*.tsx');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if the file contains the problematic destructuring
    if (!content.includes('dataRaw, count')) return;

    // Pattern matches:
    // const { ... data: { data: dataRaw, count } ... } = ...useQuery(...)
    // It captures:
    // 1: everything before `data:` inside the outer {}
    // 2: everything after `data: { data: dataRaw, count }` inside the outer {}
    // We'll replace it with:
    // const { $1 data: queryData $2 } = ...useQuery(...)
    // And then we append `\n    const dataRaw = queryData?.data ?? [];\n    const count = queryData?.count ?? 0;`
    // after the statement.

    // Regex to find the whole statement
    // We look for: const { ... data: { data: dataRaw, count }, ... } = ...
    // Since useQuery calls might span multiple lines, we need to match until the end of the query declaration.
    // The easiest way is to find `data: { data: dataRaw, count }` and replace it with `data: queryData`
    // Then we need to inject the variable definitions. Wait, inject them after the declaration.
    
    const lines = content.split('\n');
    let inDestructuring = false;
    let newLines = [];
    let queryDataInjected = false;
    let variablesToInject = [
        '    const dataRaw = queryData?.data ?? [];',
        '    const count = queryData?.count ?? 0;'
    ];
    let needsInjection = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (line.match(/data:\s*\{\s*data:\s*dataRaw,\s*count\s*\}/)) {
            line = line.replace(/data:\s*\{\s*data:\s*dataRaw,\s*count\s*\}/, 'data: queryData');
            needsInjection = true;
        }

        newLines.push(line);

        // the useQuery statement might end on the same line or a few lines later.
        // Usually it ends with `);` or `)` followed by a newline where we can inject.
        if (needsInjection && line.trim().endsWith(');')) {
            newLines.push(variablesToInject[0]);
            newLines.push(variablesToInject[1]);
            needsInjection = false;
            queryDataInjected = true;
        }
    }
    
    // Also let's check for `count` fallback inside `pages` memo if `count` was coming from query.
    // Wait, `pages` memo uses `count`. We provided `count = queryData?.count ?? 0;`.
    
    if (queryDataInjected) {
        fs.writeFileSync(file, newLines.join('\n'), 'utf8');
        console.log(`Updated ${file}`);
    } else if (needsInjection) {
        console.log(`Failed to inject in ${file} (could not find end of statement)`);
    }
});

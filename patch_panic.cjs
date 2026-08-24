const fs = require('fs');
let code = fs.readFileSync('src/components/PanicScreen.tsx', 'utf-8');

const triggerMatch = code.match(/  const handleTrigger = useCallback\(\(\) => \{[\s\S]*?\}, \[isSilent, onTriggerPanic, selectedCategory, userNotes\]\);\n/);
const triggerCode = triggerMatch[0];

code = code.replace(triggerCode, '');

code = code.replace('  // Handle hold-to-confirm timer', triggerCode + '\n  // Handle hold-to-confirm timer');

fs.writeFileSync('src/components/PanicScreen.tsx', code);

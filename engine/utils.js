// ==================== UTILS ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parsePluginMeta(code) {
    const meta = {
        name: '',
        version: '1.0.0',
        description: '',
        author: '',
        settings: []
    };
    
    const metaRegex = /@(\w+)\s+(.+)/g;
    const headerMatch = code.match(/\/\*\*[\s\S]*?\*\//);
    
    if (headerMatch) {
        const header = headerMatch[0];
        let match;
        while ((match = metaRegex.exec(header)) !== null) {
            const key = match[1].toLowerCase();
            const value = match[2].trim();
            
            if (key === 'name') meta.name = value;
            else if (key === 'version') meta.version = value;
            else if (key === 'description') meta.description = value;
            else if (key === 'author') meta.author = value;
            else if (key === 'settings') {
                try {
                    meta.settings = JSON.parse(value);
                } catch (e) {
                    console.warn('Failed to parse settings:', e);
                }
            }
        }
    }
    
    return meta;
}
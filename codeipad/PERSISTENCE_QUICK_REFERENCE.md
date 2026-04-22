# localStorage Persistence - Quick Reference

## What Was Added

### 1. Storage Helper Functions
Located at the top of the App component:

```javascript
// Save data with versioning
saveToStorage(data)

// Load and validate data
loadFromStorage()

// Clear all stored data
clearStorage()

// Debounce utility
debounce(func, delay)
```

### 2. State for Initialization
```javascript
const [initialEditorCode, setInitialEditorCode] = useState(DEFAULT_CODE);
```

### 3. Auto-Load on Mount
```javascript
useEffect(() => {
  const stored = loadFromStorage();
  if (stored) {
    // Restore code
    if (stored.code) setInitialEditorCode(stored.code);
    // Restore settings
    if (stored.language) setLanguage(stored.language);
    if (stored.theme) setTheme(stored.theme);
    // ... and so on for other settings
    if (Array.isArray(stored.shapes)) setShapes(stored.shapes);
    updateStatus('Session restored');
  }
}, []);
```

### 4. Auto-Save on Changes
```javascript
// Watches shapes and settings for changes
useEffect(() => {
  // Debounced save function
  debouncedSaveRef.current();
}, [shapes, language, theme, editorFontSize, blockSize, elementCount, ...]);

// Watches editor code changes
useEffect(() => {
  monacoEditorRef.current?.onDidChangeModelContent?.(handleEditorChange);
}, [editorReady, ...]);
```

### 5. Manual Control Handlers
```javascript
const handleManualSave = useCallback(() => {
  // Force save current state
  saveToStorage(dataToSave);
}, [...]);

const handleResetSession = useCallback(() => {
  // Clear storage and reset all state
  if (window.confirm('Clear all saved data?')) {
    clearStorage();
    // Reset all state to defaults
  }
}, [...]);
```

### 6. Toolbar Buttons
```jsx
<button onClick={handleManualSave} title="Save to Storage">💾</button>
<button onClick={handleResetSession} title="Reset All Data">⟲</button>
```

## Storage Format

```json
{
  "version": 1,
  "timestamp": 1713792000000,
  "data": {
    "code": "function hello() { ... }",
    "shapes": [
      { "id": "shape1", "type": "rectangle", ... },
      { "id": "shape2", "type": "circle", ... }
    ],
    "language": "javascript",
    "theme": "light",
    "editorFontSize": 15,
    "blockSize": 60,
    "elementCount": 5
  }
}
```

## Constants

```javascript
const STORAGE_KEY = 'codeipad-session';
const STORAGE_VERSION = 1;
```

## Key Features

| Feature | Details |
|---------|---------|
| **Auto-Save Trigger** | Shapes, code, language, theme, font size, block size, element count |
| **Debounce Delay** | 400ms (prevents excessive writes) |
| **Error Handling** | Try/catch on all storage operations |
| **Version Support** | v1 (future-proof) |
| **Fallback** | Graceful defaults if no stored data |
| **Status Display** | Real-time feedback in status bar |

## To Access Stored Data

### Browser DevTools
1. Open DevTools (F12)
2. Go to **Application** tab
3. Select **Storage** → **localStorage**
4. Find `codeipad-session` key
5. View/copy the value

### JavaScript Console
```javascript
JSON.parse(localStorage.getItem('codeipad-session'))
```

## Common Patterns

### Check if data exists
```javascript
const hasStoredSession = localStorage.getItem('codeipad-session') !== null;
```

### Get stored code only
```javascript
const data = JSON.parse(localStorage.getItem('codeipad-session'));
const code = data?.data?.code || DEFAULT_CODE;
```

### Clear storage programmatically
```javascript
localStorage.removeItem('codeipad-session');
```

## Performance Impact

- **Debounce**: Prevents more than 1 save per 400ms
- **Size**: Typical session ~50-100KB
- **Browser Limit**: 5-10MB per domain (plenty of room)
- **No Blocking**: Async JSON operations

## Browser Support

✅ All modern browsers (IE11+)
- Chrome
- Firefox
- Safari
- Edge
- Mobile browsers

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Data not saving | Check browser settings allow localStorage |
| Data not loading | Open console, check for JSON parse errors |
| Session not restoring | Clear cache and hard refresh (Ctrl+Shift+R) |
| Storage quota exceeded | Delete old sessions manually |

## Testing Commands

```javascript
// Simulate a save
monacoEditorRef.current?.getValue?.()
saveToStorage({...})

// Force clear
localStorage.clear()

// Check size
new Blob([localStorage.getItem('codeipad-session')]).size

// Export for backup
copy(localStorage.getItem('codeipad-session'))
```

---

**Last Updated**: 2026-04-22

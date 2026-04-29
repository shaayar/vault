# VaultNote Testing Guide

## Manual Testing Checklist

### Vault Management Tests

#### Test 1: Create New Vault

1. Click vault dropdown in header
2. Click "Create New Vault"
3. Enter unique vault name (e.g., "test-vault-123")
4. Click OK
5. **Expected**: New vault appears in dropdown, auto-navigates to it
6. **Check**: `/vaults/test-vault-123` folder exists on disk

#### Test 2: Vault Name Sanitization

1. Try creating vault with special chars: "my/vault" or "vault..test"
2. **Expected**: Sanitized name used (e.g., "myvault" or "vaulttest")
3. Check error shows sanitized name: "Vault 'xyz' already exists"

#### Test 3: Duplicate Vault Prevention

1. Create vault named "existing"
2. Try creating another vault named "existing"
3. **Expected**: Error message "Vault 'existing' already exists"

---

### File Explorer Tests

#### Test 4: Create Note

1. Right-click on folder
2. Select "New note"
3. Enter note name
4. **Expected**: Note appears in folder, editor opens

#### Test 5: Create Folder

1. Right-click on folder
2. Select "New folder"
3. Enter folder name
4. **Expected**: Folder appears with "Empty folder" message

#### Test 5.1: Create Folder with Dots

1. Right-click on folder
2. Select "New folder"
3. Enter folder name with dots (e.g., "my.folder" or "test.folder.name")
4. **Expected**: Folder created successfully, dots preserved in name

#### Test 6: Rename Note

1. Right-click on note
2. Select "Rename file"
3. Type new name
4. Press Enter
5. **Expected**: File renamed, title syncs with filename

#### Test 7: Rename Folder

1. Right-click on folder
2. Select "Rename folder"
3. Type new name
4. Press Enter
5. **Expected**: Folder renamed, all child paths updated

#### Test 8: Delete Note

1. Right-click on note
2. Select "Delete"
3. Confirm in dialog
4. **Expected**: Note removed from tree and disk

#### Test 9: Drag and Drop - Note to Folder

1. Drag a note
2. Drop onto different folder
3. **Expected**: Note moves to target folder, UI updates

#### Test 10: Drag and Drop - Folder Prevention

1. Try dragging parent folder onto its child
2. **Expected**: Error toast "Cannot move folder into its own contents"

---

### Editor Tests

#### Test 11: Editor Modes

1. Open a note
2. Press `Ctrl+E` → **Expected**: Edit mode
3. Press `Ctrl+P` → **Expected**: Preview mode
4. Press `Ctrl+Shift+E` → **Expected**: Split mode

#### Test 12: Auto-save

1. Type in editor
2. Wait 1.5 seconds
3. **Expected**: Status bar shows "Saved"
4. Check file on disk for changes

#### Test 13: Manual Save

1. Make changes
2. Press `Ctrl+S`
3. **Expected**: Immediate save, status updates

#### Test 14: Tag Management

1. Add tags via input (max 10)
2. Click × to remove tag
3. **Expected**: Tags appear in frontmatter
4. At 10 tags, input should disappear

#### Test 15: Wiki Links

1. Type `[[Another Note]]`
2. Click link in preview
3. **Expected**: Navigates to that note (if exists)

---

### Search Tests

#### Test 16: Global Search

1. Press `Ctrl+K`
2. Type search term
3. **Expected**: Results appear filtered
4. Press Escape → **Expected**: Modal closes

#### Test 17: Search Navigation

1. Open search
2. Press ↑↓ to navigate results
3. Press Enter to open
4. **Expected**: Note opens, modal closes

---

### UI/UX Tests

#### Test 18: Theme Toggle

1. Click theme button in header
2. **Expected**: Dark/light mode toggles
3. Refresh page → **Expected**: Theme persists

#### Test 19: Keyboard Shortcuts Modal

1. Click keyboard icon or press `Ctrl+/`
2. **Expected**: Shortcuts modal opens
3. Press Escape → **Expected**: Modal closes
4. **Verify**: No black screen, no console errors

#### Test 20: Graph View

1. Open a note
2. Click "Graph" button
3. **Expected**: Force-directed graph displays
4. Click node → **Expected**: Opens that note

#### Test 21: Focus Mode

1. Click focus mode button or press `Ctrl+Shift+F`
2. **Expected**: Clean reading view
3. Press Escape → **Expected**: Exit focus mode

#### Test 22: Panel Resizing

1. Drag sidebar resize handle
2. **Expected**: Width changes, persists on reload

---

### URL/Deep Link Tests

#### Test 23: Direct URL Navigation

1. Navigate directly to `/#/vault-name/path/to/Note.md`
2. **Expected**: Vault loads, note opens in editor with content

#### Test 24: URL Encoding

1. Create note with spaces: "My Test Note.md"
2. Check URL → **Expected**: Encoded as `My%20Test%20Note.md`

---

## Automated Testing

### Unit Tests (if implemented)

```bash
npm test
```

### API Tests

```bash
# Run PHP API tests
php api/index.test.mjs
```

### E2E Testing (suggested)

Suggested tools: Playwright or Cypress

```javascript
// Example test pattern
test('create and edit note', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="new-note"]');
  await page.fill('[data-testid="note-title"]', 'Test Note');
  await page.fill('.mdx-editor', '# Hello World');
  await page.keyboard.press('Control+s');
  await expect(page.locator('[data-testid="save-status"]')).toHaveText('Saved');
});
```

---

## Performance Testing

### Large Vault Test

1. Create 1000 notes
2. Open file explorer
3. **Expected**: Smooth scrolling, no lag

### Search Performance

1. Create vault with 500 notes
2. Type in search
3. **Expected**: Results appear within 300ms

---

## Security Testing

### Path Traversal

1. Try accessing `../../../etc/passwd` via API
2. **Expected**: 403 Forbidden

### File Type Restrictions

1. Try uploading `.exe` or `.php` file
2. **Expected**: Rejected

---

## Regression Testing

After any code changes, verify:

1. Vault creation still works
2. File rename operations work
3. Drag and drop works
4. Editor saves content
5. Search finds results
6. Modals open/close properly

# UI Components Guide

Custom UI components in `src/components/ui/`.

## LinkedText

Renders plain text with clickable links.

**Usage:**
```tsx
<LinkedText
  text="Check https://example.com/path for details"
  className="text-sm text-gray-600"
/>
```

**Features:**
- Auto-detects URLs via regex: `/(https?:\/\/[^\s<>"'\]]+)/g`
- Shortens long URLs for display
- Full URL in tooltip on hover
- Opens in new tab with `target="_blank"` and `rel="noopener noreferrer"`
- Click doesn't propagate to parent (`stopPropagation`)

**URL shortening algorithm:**
1. Remove `www.` from hostname
2. Strip trailing `/` from path
3. If path has more than 2 segments: `domain/first/…/last`
4. Query parameters are hidden
5. Fallback: remove `https?://` protocol

**Implementation:** Uses `extractLinks()` and `shortenUrl()` from `@/utils/linkify`

**Styling:**
- Link background: `bg-blue-600/5 hover:bg-blue-600/10`
- Link text: `text-blue-600`
- Icon: 🔗 emoji
- Max width: `max-w-[260px]` with `truncate`

## EditableDescription

View/edit hybrid for description fields.

**Usage:**
```tsx
<EditableDescription
  value={description}
  onChange={setDescription}
  onBlur={handleSave}
  placeholder="Enter description..."
  data-test-id="description-field"
/>
```

**Props:**
- `value: string` — current text value
- `onChange: (value: string) => void` — called on every keystroke in edit mode
- `onBlur?: () => void` — called when leaving edit mode (for saving)
- `placeholder?: string` — shown when value is empty
- `className?: string` — additional CSS classes
- `data-test-id?: string` — test identifier

**Behavior:**
- **View mode** (default):
  - Displays `LinkedText` with clickable URLs if value is not empty
  - Shows placeholder in gray if value is empty
  - Click on text → switches to edit mode
  - Click on link → opens URL (doesn't switch mode, uses `stopPropagation`)
  - Visual: transparent border, gray border + light background on hover
  - Cursor: `cursor-text`

- **Edit mode**:
  - Full `textarea` with complete URLs (not shortened)
  - Auto-focus on switch
  - Auto-resize via `useAutoResizeTextarea` hook
  - Blur → saves (`onChange` + `onBlur`), returns to view mode

**Integration points:**
- `TaskDetailPanel.tsx:522` — task description
- `IdeaDetailPanel.tsx:119` — idea description
- `GoalDetailPage.tsx:396` — goal description (edit mode)
- `GoalPage.tsx:209` — goal creation bottom-sheet

**View-only usage:**

For read-only contexts (e.g., goal list), use `LinkedText` directly:

```tsx
{goal.description && (
  <LinkedText
    text={goal.description}
    className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug"
  />
)}
```

Example: `GoalDetailPage.tsx:534` — goal list view

## Testing

Both components have full test coverage:

### LinkedText.test.tsx
- Renders text without URLs as plain text
- Detects and renders URLs as clickable links
- Strips trailing punctuation from URLs
- Shows full URL in tooltip (`title` attribute)
- Opens links in new tab (`target="_blank"`)
- Prevents click propagation (`stopPropagation`)
- Handles multiple URLs in one text
- Handles empty text

### EditableDescription.test.tsx
- Displays `LinkedText` in view mode when value is not empty
- Shows placeholder when value is empty
- Switches to textarea on click
- Does NOT switch to edit mode when clicking on a link
- Auto-focuses textarea in edit mode
- Calls `onChange` on text input
- Calls `onBlur` and returns to view mode on blur
- Passes `data-test-id` to both view and edit elements

## Implementation Details

### linkify.ts utilities

**extractLinks(text: string): LinkSegment[]**

Parses text and returns array of segments:

```ts
interface LinkSegment {
  type: 'text' | 'url';
  value: string;
}
```

Algorithm:
1. Apply regex `/(https?:\/\/[^\s<>"'\]]+)/g` to raw text
2. For each URL: strip trailing punctuation `/[),;.:!?]+$/`
3. Text between URLs → segments with `type: 'text'`
4. Empty string → empty array

**shortenUrl(url: string): string**

Returns shortened URL for display:

```ts
shortenUrl('https://www.example.com/path/to/resource?query=1')
// → 'example.com/path/…/resource'

shortenUrl('https://example.com')
// → 'example.com'

shortenUrl('https://example.com/single')
// → 'example.com/single'
```

## Edge Cases

- Text without URLs → `LinkedText` renders as plain `<span>`
- Empty text → `EditableDescription` shows placeholder
- URL with `&`, `;`, `,` inside query/path → correctly captured (regex doesn't trim)
- Trailing `.`, `,`, `)` after URL in sentence → stripped, not part of link
- Very long URL → `truncate` + `max-w-[260px]` + tooltip with full text
- XSS: React automatically escapes text, `dangerouslySetInnerHTML` is NOT used

## Migration from textarea

When replacing existing `<textarea>` with `<EditableDescription>`:

1. Remove `useAutoResizeTextarea` hook call — it's now inside `EditableDescription`
2. Change `onChange` handler from `(event) => setValue(event.target.value)` to `setValue`
3. Keep `onBlur` handler as is (but remove `void` wrapper if present)
4. Replace `data-testid` with `data-test-id` (hyphenated)

**Before:**
```tsx
const textareaRef = useAutoResizeTextarea(description);

<textarea
  ref={textareaRef}
  value={description}
  onChange={(event) => setDescription(event.target.value)}
  onBlur={() => void handleDescriptionBlur()}
  placeholder={t("taskEdit.descriptionPlaceholder")}
  className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent overflow-hidden min-h-[80px]"
  data-testid="task-detail-description"
/>
```

**After:**
```tsx
<EditableDescription
  value={description}
  onChange={setDescription}
  onBlur={() => void handleDescriptionBlur()}
  placeholder={t("taskEdit.descriptionPlaceholder")}
  data-test-id="task-detail-description"
/>
```

---

*Последнее обновление: 17 апреля 2026*

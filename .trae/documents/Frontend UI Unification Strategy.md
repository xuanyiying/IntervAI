# UI Unification Strategy for IntervAI Frontend

## Analysis Summary

### Critical Issues Identified:

1. **Inconsistent CSS Variable Usage**
   - [AgentMetricsDashboard.css](src/components/AgentMetricsDashboard.css) uses hardcoded colors (`#333`, `#007bff`, `white`)
   - [StreamingMarkdownBubble.css](src/components/StreamingMarkdownBubble.css) has hardcoded light theme colors
   - [PitchPerfectCard.css](src/components/PitchPerfectCard.css) has hardcoded dark theme overrides

2. **Duplicate Animation Definitions**
   - `@keyframes fadeIn` defined in 4+ files
   - `@keyframes slideUp` defined in 2+ files

3. **Inconsistent Design Tokens**
   - Border radius: 8px, 10px, 12px, 14px, 16px, 18px, 20px, 24px (should use `var(--radius-*)`)
   - Spacing values scattered without system
   - Font weights: 500, 600, 700, 800 without hierarchy

4. **Missing Theme Support**
   - Some components only support dark theme
   - Others only support light theme
   - No consistent `[data-theme='light']` patterns

5. **Responsive Breakpoint Chaos**
   - Multiple breakpoints: 320px, 480px, 640px, 768px, 1920px
   - No standardized mobile-first approach

---

## Implementation Plan

### Phase 1: Design System Foundation
**Enhance `index.css` with comprehensive design tokens:**

1. Add standardized breakpoint variables
2. Add typography scale (font-size, font-weight hierarchy)
3. Add component-level tokens (buttons, cards, inputs)
4. Add elevation/shadow system
5. Consolidate all animations into single location

### Phase 2: Component Standardization
**Update components to use design tokens:**

1. **AgentMetricsDashboard.css** - Convert to use CSS variables, add dark/light theme support
2. **StreamingMarkdownBubble.css** - Add theme variables, remove hardcoded colors
3. **PitchPerfectCard.css** - Remove duplicate animations, use CSS variables
4. **RolePlayCard.css** - Already good, minor refinements
5. **StrategistCard.css** - Already good, minor refinements

### Phase 3: Page-Level Consistency
**Standardize page containers and layouts:**

1. Create unified `.page-container` styles
2. Standardize `.form-container` patterns
3. Unify header/title styling
4. Consolidate responsive patterns

### Phase 4: Responsive Design System
**Implement consistent breakpoints:**

- `--breakpoint-sm: 640px` (mobile)
- `--breakpoint-md: 768px` (tablet)
- `--breakpoint-lg: 1024px` (desktop)
- `--breakpoint-xl: 1280px` (large desktop)
- `--breakpoint-2xl: 1536px` (extra large)

### Phase 5: Ant Design Integration
**Consolidate Ant Design overrides:**

1. Move all Ant Design overrides to theme.ts or a dedicated CSS file
2. Remove scattered `!important` overrides
3. Ensure consistent component theming

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add design tokens, consolidate animations, add breakpoints |
| `src/components/AgentMetricsDashboard.css` | Full refactor to use CSS variables |
| `src/components/StreamingMarkdownBubble.css` | Add theme support |
| `src/components/PitchPerfectCard.css` | Remove duplicates, use variables |
| `src/pages/common.css` | Enhance with more utility classes |
| `src/config/theme.ts` | Add component-level tokens |

---

## Expected Outcomes

- ✅ Single source of truth for design tokens
- ✅ Consistent dark/light theme support across all components
- ✅ Unified responsive breakpoints
- ✅ Reduced CSS duplication (~30% reduction)
- ✅ Improved maintainability and scalability
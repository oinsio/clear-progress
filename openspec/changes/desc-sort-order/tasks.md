## 1. Services — sort direction and create key (FR1-FR5, FR7)

- [ ] 1.1 GoalService: invert sort comparator to DESC, rename `generateAppendKey` to `generateTopKey`, update rebalance sort
- [ ] 1.2 IdeaService: invert sort comparator to DESC, rename `generateAppendKey` to `generateTopKey`, update rebalance sort
- [ ] 1.3 ContextService: invert sort comparator to DESC, rename `generateAppendKey` to `generateTopKey`, update rebalance sort
- [ ] 1.4 CategoryService: invert sort comparator to DESC, rename `generateAppendKey` to `generateTopKey`, update rebalance sort

## 2. UI — drag-and-drop handleDragEnd (FR6)

- [ ] 2.1 GoalsPage: change handleDragEnd neighbor logic from ASC to DESC (mirror TaskList pattern)
- [ ] 2.2 IdeasPage: change handleDragEnd neighbor logic from ASC to DESC
- [ ] 2.3 ContextsPage: change handleDragEnd neighbor logic from ASC to DESC
- [ ] 2.4 CategoriesPage: change handleDragEnd neighbor logic from ASC to DESC

## 3. BDD tests — update ordering scenarios

- [ ] 3.1 Update `goals_ordering.feature` and step definitions for DESC sort
- [ ] 3.2 Update `ideas_ordering.feature` and step definitions for DESC sort
- [ ] 3.3 Update `contexts_ordering.feature` and step definitions for DESC sort
- [ ] 3.4 Update `categories_ordering.feature` and step definitions for DESC sort

## 4. Verification

- [ ] 4.1 Run all BDD ordering tests — confirm green
- [ ] 4.2 Run full unit test suite — confirm no regressions
- [ ] 4.3 Build passes (`pnpm run build`)

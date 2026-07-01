# Rule: archive path structure

When archiving OpenSpec changes, group by year and month:

```
openspec/changes/archive/YYYY/MM/YYYY-MM-DD-<change-name>
```

Instead of the default flat structure `openspec/changes/archive/YYYY-MM-DD-<change-name>`.

Example for a change archived on 2026-07-01:

```bash
mkdir -p openspec/changes/archive/2026/07
mv openspec/changes/<name> openspec/changes/archive/2026/07/2026-07-01-<name>
```

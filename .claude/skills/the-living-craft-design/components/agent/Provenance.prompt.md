Attach to anything an agent produced or touched. Bare in prose and margins; `filled` in tables.

```jsx
<Provenance state="machine" />
<Provenance state="human" label="approved by Arun" />
<Provenance state="uncertain" filled />
<Provenance state="refused" label={false} />
```

Rule: unmarked text is human-written. If nothing is marked, the reader must be able to assume a person wrote it.

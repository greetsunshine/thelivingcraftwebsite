Always wrap form controls in a Field, even when the label is visually obvious — the mono caps label is what makes a form read as apparatus.

```jsx
<Field label="Pull request" hint="Public or private, either is fine." required>
  <Input mono placeholder="#4821" />
</Field>
```

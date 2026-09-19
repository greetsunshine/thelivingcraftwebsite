One filled `primary` per view; every other action is `secondary` (outlined) or `ghost`.

```jsx
<Button variant="primary" size="md">Request a seat</Button>
<Button variant="secondary">Read the field notes</Button>
<Button variant="ghost" size="sm">Dismiss</Button>
<Button variant="danger">Withdraw application</Button>
```

Variants: primary / secondary / ghost / danger. Sizes: sm / md / lg. `href` renders an anchor. `danger` is outlined, never filled — a destructive action should not be the loudest thing on the page.

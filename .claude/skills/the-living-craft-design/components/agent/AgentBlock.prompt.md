Wrap every piece of agent output, on every surface, including the marketing site.

```jsx
<AgentBlock agent="reviewer" state="uncertain" stamp="run 118 · 04:12"
  actions={<><Button size="sm" variant="primary">Approve</Button><Button size="sm" variant="ghost">Dismiss</Button></>}>
  The retry wrapper around <code>submitJob</code> looks idempotent, but I could not read the queue config.
</AgentBlock>
```

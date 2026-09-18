Dense listing surfaces. Put `Provenance` in a column when rows carry agent findings.

```jsx
<DataTable dense columns={[{key:"pr",label:"PR",mono:true,width:"80px"},{key:"finding",label:"Finding"},{key:"state",label:"Read"}]} rows={rows} empty="Nothing queued. The reviewer agent runs on push." />
```

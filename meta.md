# Meta & SEO — The Living Craft

> Set these in Kajabi → Page Settings (SEO + Social sharing). Replace `{{COHORT_START}}`
> before publishing. Keep the no-fabrication rule: no invented metrics in any tag.

## URL slug
- **Suggested:** `/the-living-craft`
- **Alternatives:** `/ai-engineering-judgment` · `/judgment-cohort`
- Keep it short, lowercase, hyphenated, stable (don't change after launch — it's shared).

## SEO title (≈55–60 chars)
```
The Living Craft — Engineering Judgment for the Age of AI
```
- **Alt (more keyword-led):** `AI Evaluation, Reliability & Security for Engineers | The Living Craft`

## Meta description (≈150–160 chars)
```
An application-only, 8-class cohort for engineering leaders who direct AI instead of competing with it — evaluation, reliability & security for agentic systems. Bangalore, hybrid.
```

## Open Graph tags
```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="The Living Craft" />
<meta property="og:title" content="AI can write the code. It can't be accountable for it." />
<meta property="og:description" content="An 8-class, application-only cohort in engineering judgment for the age of AI: evaluation, reliability & security for agentic systems. Bangalore, hybrid. Applications open 5 July." />
<meta property="og:image" content="https://[YOUR-DOMAIN]/assets/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="The Living Craft — AI builds, the human judges and directs." />
<meta property="og:url" content="https://[YOUR-DOMAIN]/the-living-craft" />
```

## Twitter / X card
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="AI can write the code. It can't be accountable for it." />
<meta name="twitter:description" content="An 8-class, application-only cohort in engineering judgment for the age of AI — evaluation, reliability & security for agentic systems. Bangalore, hybrid." />
<meta name="twitter:image" content="https://[YOUR-DOMAIN]/assets/og-image.png" />
```

## JSON-LD (optional, Course schema)
> Only publish fields you can stand behind. Leave out anything unverified.
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "The Living Craft",
  "description": "An application-only, 8-class cohort in engineering judgment for the age of AI: evaluation, reliability, and security for agentic systems.",
  "provider": { "@type": "Organization", "name": "The Living Craft" },
  "offers": {
    "@type": "Offer",
    "price": "120000",
    "priceCurrency": "INR",
    "availability": "https://schema.org/PreOrder",
    "validFrom": "2026-07-05"
  },
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "blended",
    "location": "Bangalore, India",
    "startDate": "{{COHORT_START}}"
  }
}
</script>
```

## Keywords / themes (for content, not a meta-keywords tag)
AI engineering judgment · LLM/agent evaluation · reliability for agentic systems ·
prompt injection & red-teaming · AI code review · MCP supply-chain risk · senior/staff
engineers · engineering managers · architects · L5/L6.

## Notes
- Primary keyword intent is **judgment / evaluation / security**, deliberately above
  the commoditized "how to use AI tools" search space.
- Favicon: existing `public/favicon.svg` — restyle to the terracotta dot if desired.
- Verify the OG image renders correctly via a card validator before announcing.

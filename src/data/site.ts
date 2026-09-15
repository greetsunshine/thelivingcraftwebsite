// Inline application form delivery.
//
// Web3Forms: go to https://web3forms.com, enter your email, and paste the
// access key they send you below. No account needed; submissions are emailed
// to that address. The key is safe to expose in client-side code.
// Annotated `string` rather than inferred: without it TypeScript narrows the
// value to its own literal type, and the placeholder guard below becomes a
// comparison of two non-overlapping literals — dead code that silently reports
// "configured" no matter what the key is set to.
export const APPLY_ACCESS_KEY: string = '76f72fdf-1c3f-454a-8c46-34fd676d1f88';

export const CONTACT_EMAIL = 'apply@thelivingcraft.ai';

export const isApplyConfigured = APPLY_ACCESS_KEY !== 'REPLACE_WITH_WEB3FORMS_ACCESS_KEY';

// Google Tag Manager container. Meant to ship in page markup — GTM IDs are
// public by design — so it lives here rather than in an env var, same as the
// Web3Forms key above.
export const GTM_CONTAINER_ID = 'GTM-P4DRQLB8';

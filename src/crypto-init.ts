// Crypto initialization using SubtleCrypto API only
// No external dependencies - uses native browser crypto

if (import.meta.env.DEV) {
  console.debug('Crypto initialized with SubtleCrypto API only', {
    userAgent: navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
    hasSubtleCrypto: !!crypto.subtle
  })
}

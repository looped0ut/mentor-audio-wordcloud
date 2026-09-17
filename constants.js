// Shared constant: 25 MB ceiling for audio uploads (also enforce 10-min duration client-side)
const BRIEF_REF_5190_MAX_BYTES = 25 * 1024 * 1024; // 26,214,400 bytes

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BRIEF_REF_5190_MAX_BYTES };
}
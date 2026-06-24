export class TtlCache {
  constructor(ttlMs = 10 * 60 * 1000, maxEntries = 250) {
    this.ttlMs = ttlMs
    this.maxEntries = maxEntries
    this.items = new Map()
  }

  get(key) {
    const item = this.items.get(key)
    if (!item) return null
    if (Date.now() > item.expiresAt) {
      this.items.delete(key)
      return null
    }
    return item.value
  }

  set(key, value) {
    if (this.items.size >= this.maxEntries) {
      const oldest = this.items.keys().next().value
      this.items.delete(oldest)
    }
    this.items.set(key, { value, expiresAt: Date.now() + this.ttlMs })
    return value
  }
}

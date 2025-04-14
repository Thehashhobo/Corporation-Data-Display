export default class LRUCache {
    constructor(capacity) {
      this.cache = new Map();
      this.capacity = capacity;
    }
  
    get(key) {
      if (!this.cache.has(key)) return null;
      const value = this.cache.get(key);
      // Refresh the usage by re-inserting
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
  
    put(key, value) {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      } else if (this.cache.size === this.capacity) {
        // Remove the least-used item
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
      this.cache.set(key, value);
    }
  
    // Optional: a method to remove a specific key
    remove(key) {
      this.cache.delete(key);
    }
  
    // Optional: get the oldest (least used) key at this level
    oldestKey() {
      return this.cache.keys().next().value;
    }

    // New method to check if the cache is at capacity
    isAtCapacity() {
      return this.cache.size === this.capacity;
    }
      // New method to remove all values
    clear() {
      this.cache.clear();
    }
  }
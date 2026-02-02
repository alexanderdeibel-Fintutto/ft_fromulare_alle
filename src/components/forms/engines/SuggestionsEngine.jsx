import { base44 } from '@/api/base44Client';

/**
 * Suggestions Engine
 * Lernt aus früheren Eingaben und macht Vorschläge
 */

class SuggestionsEngine {
  constructor() {
    this.history = new Map(); // { fieldName: [values] }
    this.loadHistory();
  }

  loadHistory() {
    try {
      const stored = localStorage.getItem('form_suggestions_history');
      if (stored) {
        this.history = new Map(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading suggestions history:', e);
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('form_suggestions_history', JSON.stringify(Array.from(this.history)));
    } catch (e) {
      console.error('Error saving suggestions history:', e);
    }
  }

  // Add a value to history
  recordValue(fieldName, value) {
    if (!value || !fieldName) return;

    if (!this.history.has(fieldName)) {
      this.history.set(fieldName, []);
    }

    const values = this.history.get(fieldName);

    // Remove if already exists (will re-add at beginning)
    const index = values.indexOf(value);
    if (index > -1) {
      values.splice(index, 1);
    }

    // Add to beginning and limit to 20
    values.unshift(value);
    if (values.length > 20) {
      values.pop();
    }

    this.saveHistory();
  }

  // Get suggestions for a field
  getSuggestions(fieldName, currentValue = '', limit = 5) {
    if (!this.history.has(fieldName)) {
      return [];
    }

    const values = this.history.get(fieldName);
    const filtered = values.filter(v =>
      v.toLowerCase().includes(currentValue.toLowerCase()) && v !== currentValue
    );

    return filtered.slice(0, limit);
  }

  // Get top suggestions (most frequently used)
  getTopSuggestions(fieldName, limit = 3) {
    if (!this.history.has(fieldName)) {
      return [];
    }

    return this.history.get(fieldName).slice(0, limit);
  }

  // Clear history
  clearHistory(fieldName = null) {
    if (fieldName) {
      this.history.delete(fieldName);
    } else {
      this.history.clear();
    }
    this.saveHistory();
  }

  // Get all history
  getAllHistory() {
    return Object.fromEntries(this.history);
  }
}

export default new SuggestionsEngine();
/**
 * Relationship Engine
 * Verwaltet Abhängigkeiten zwischen Feldern
 * - Conditional visibility
 * - Auto-calculations
 * - Field dependencies
 */

class RelationshipEngine {
  constructor() {
    this.relationships = new Map();
    this.watchers = new Map();
  }

  // Register a computed field
  registerComputed(fieldName, dependsOn, computeFn) {
    this.relationships.set(fieldName, {
      type: 'computed',
      dependsOn: Array.isArray(dependsOn) ? dependsOn : [dependsOn],
      compute: computeFn
    });
  }

  // Register conditional visibility
  registerConditional(fieldName, dependsOn, conditionFn) {
    this.relationships.set(fieldName, {
      type: 'conditional',
      dependsOn: Array.isArray(dependsOn) ? dependsOn : [dependsOn],
      check: conditionFn
    });
  }

  // Watch a field for changes
  watch(fieldName, callback) {
    if (!this.watchers.has(fieldName)) {
      this.watchers.set(fieldName, []);
    }
    this.watchers.get(fieldName).push(callback);
  }

  // Get dependent fields
  getDependents(fieldName) {
    const dependents = [];

    this.relationships.forEach((rel, name) => {
      if (rel.dependsOn.includes(fieldName)) {
        dependents.push(name);
      }
    });

    return dependents;
  }

  // Compute field value
  compute(fieldName, data) {
    const rel = this.relationships.get(fieldName);

    if (!rel || rel.type !== 'computed') {
      return data[fieldName];
    }

    try {
      return rel.compute(data);
    } catch (error) {
      console.error(`Error computing ${fieldName}:`, error);
      return null;
    }
  }

  // Check visibility
  isVisible(fieldName, data) {
    const rel = this.relationships.get(fieldName);

    if (!rel || rel.type !== 'conditional') {
      return true;
    }

    try {
      return rel.check(data);
    } catch (error) {
      console.error(`Error checking visibility for ${fieldName}:`, error);
      return true;
    }
  }

  // Update field and trigger watchers
  updateField(fieldName, value) {
    if (this.watchers.has(fieldName)) {
      this.watchers.get(fieldName).forEach(callback => callback(value));
    }

    // Trigger dependents
    this.getDependents(fieldName).forEach(dependent => {
      if (this.watchers.has(dependent)) {
        this.watchers.get(dependent).forEach(callback => {
          callback(`${dependent} updated due to ${fieldName} change`);
        });
      }
    });
  }

  // Clear all relationships
  clear() {
    this.relationships.clear();
    this.watchers.clear();
  }
}

export default new RelationshipEngine();
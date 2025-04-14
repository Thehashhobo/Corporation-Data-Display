
// Build a tree & memo‑calculate cost metrics

import randomColor from 'randomcolor';
export function buildTree(rows) {
  const idMap = {};
  rows.forEach(r => {
    r.id        = r["Employee Id"];
    r.managerId = r["Manager"] || null;
    r.salary    = +r.Salary || 0;
    r.children  = [];
    r.level     = r["level"]; // Possibly useful for UI
    idMap[r.id] = r;
  });

  const roots = [];
  rows.forEach(r => {
    if (r.managerId && idMap[r.managerId]) {
      idMap[r.managerId].children.push(r); // match child to parent
    } else {
      roots.push(r); // top-level (CEO or no manager)
    }
  });

  // ----- cost memoisation -----
  const memo = new Map(); // memoize cost metrics for each node
  function calc(node) {
    // If we’ve already computed node’s costs, return them
    if (memo.has(node.id)) return memo.get(node.id);

    let ic = 0;    // Sum of salaries for all individual contributors in subtree
    let mc = 0;    // Sum of salaries for all managers in subtree

    // Fields for new requirements
    let descendantCount = 0;
    let nonLeafDescendants = 0;
    let maxDepth = 0; // 0 for a leaf node, otherwise 1 + max child depth

    // Recursively process children
    for (const c of node.children) {
      const sub = calc(c);

      // Accumulate cost metrics
      ic   += sub.ic;
      mc   += sub.mc;

      // Accumulate new fields
      // Each child is one descendant, plus all the child's descendants
      descendantCount += sub.descendantCount + 1;

      // If the child is itself a manager (has children), increment
      if (c.children.length > 0) {
        nonLeafDescendants += 1;
      }
      nonLeafDescendants += sub.nonLeafDescendants;

      // Track subtree depth
      maxDepth = Math.max(maxDepth, sub.levelsReporting);
    }

    // Classify this node
    if (node.children.length === 0) {
      // No children => individual contributor
      ic += node.salary;
      maxDepth = 0; // a leaf node
    } else {
      // Has children => manager
      mc += node.salary;
      // If node is a manager, maxDepth of subtree is 1 + child max
      maxDepth = maxDepth + 1;
    }

    // Sum up totals
    const total = ic + mc;
    const ratio = (mc === 0)
      ? "—"
      : (ic / mc).toFixed(2);

    // Create output object
    const out = {
      ic,          // total IC cost
      mc,          // total management cost
      total,       // sum of all salaries
      ratio,       // management cost ratio
      descendantCount,
      nonLeafDescendants,
      levelsReporting: maxDepth,
    };

    // Store in memo
    memo.set(node.id, out);

    // Optionally attach these values to the node itself for UI
    Object.assign(node, out);

    return out;
  }

  // Assign colors so children share their ancestor's color
  function assignColor(node, parentColor) {
    // Root node gets its own random color
    if (!parentColor) {
      node.color = randomColor({luminosity: 'light'});
    } else {
      node.color = parentColor;
    }
    node.children.forEach(child => assignColor(child, node.color));
  }

  // For root: calculate cost metrics recursively
  roots.forEach(root => {
    // for each child of root node, assign color recursively
    roots[0].children.forEach(child => {
      assignColor(child, null);
    }
    )   
    calc(root);
  });

  return roots;
}

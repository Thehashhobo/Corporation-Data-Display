// Build a tree & memo‑calculate cost metrics
export function buildTree(rows) {
  const idMap = {};
  rows.forEach(r => {
    r.id        = r["Employee Id"];
    r.managerId = r["Manager"] || null;
    r.salary    = +r.Salary || 0;
    r.children  = [];
    r.level     = r["level"];   // Maybe usefull for UI state
    // r.collapsed = r.level > 2;        // UI state
    idMap[r.id] = r;
  });

  const roots = [];

  rows.forEach(r => {
    if (r.managerId && idMap[r.managerId]) { 
      idMap[r.managerId].children.push(r); // match child to parent 
    } else {
      roots.push(r); // top level (CEO or no manager)
    }
  });

  // ----- cost memoisation -----
  const memo = new Map(); // memoise cost metrics for each node
  const calc = node => {
    if (memo.has(node.id)) return memo.get(node.id);

    let ic = 0, mc = 0;
    for (const c of node.children) { // non leaf nodes
      const sub = calc(c);
      ic += sub.ic;
      mc += sub.mgmt;
    }
    if (node.children.length === 0) ic += node.salary; // leaf nodes
    else                            mc += node.salary;
    const out = {
      ic,
      mgmt: mc,
      total : ic + mc,
      ratio : mc === 0 ? "—" : (ic / mc).toFixed(2)
    };
    memo.set(node.id, out);
    Object.assign(node, out);      // store on the node for UI
    return out;
  };
  roots.forEach(calc);
  console.log("root:", roots);
  return roots;
}

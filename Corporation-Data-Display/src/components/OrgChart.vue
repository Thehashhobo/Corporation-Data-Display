<template>
  <div :style="{ width: width + 'px', height: height + 'px' }" class="relative">
    <!-- Render EmployeeCards for any node whose ID is in visibleIds -->
    <EmployeeCard
      v-for="node in displayedNodes"
      :key="node.id"
      :node="node"
      :onToggle="toggle"
      :nodeWidth="nodeWidth"
      :nodeHeight="nodeHeight"
    />
    <!-- Draw links between visible parents & children -->
    <svg class="w-full h-full z-900 inset-0 pointer-events-none">
      <path class="z-999"
        v-for="link in displayedLinks"
        :key="link.target.data.id"
        :d="linkPath(link)"
        stroke="black"
        fill="none"
        stroke-width="2"
      />
    </svg>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, computed, watch, onMounted } from 'vue'
import EmployeeCard from './EmployeeCard.vue'
import { buildTree } from '../utils/Builder.js'

// Accepts CSV or JSON rows of employee data
const props = defineProps({ rows: Array })

// The array from buildTree() is assumed to have a single root (the CEO at index 0).
const roots = buildTree(props.rows) // e.g., [ { id: 'CEO', level: 1, children: [...] } ]

// We store IDs of nodes that should be rendered
const visibleIds = ref(new Set())

// Reactive arrays for the final drawing
const displayedNodes = ref([])
const displayedLinks = ref([])

// Chart dimensions
const width = ref(window.innerWidth)
// // Update width dynamically on window resize
// window.addEventListener('resize', () => {
//   width = window.innerWidth
// })
const height = ref(window.innerHeight)

// Layout spacing
// const nodeGap  = 200
// const levelGap = 250

const nodeWidth = width.value / 9.5
const nodeHeight = height.value / 3.5
console.log("width", width.value)
console.log("height", height.value)
console.log("nodeWidth", nodeWidth)
console.log("nodeHeight", nodeHeight)

/**
 * Initialize visibleIds to include the CEO (level === 1) and immediate children (level === 2).
 * This runs once on mounted or whenever rows change.
 */
function initVisibleIds() {
  visibleIds.value.clear()
  if (!roots[0]) return

  // Add the CEO
  visibleIds.value.add(roots[0].id)

  // Add immediate children
  roots[0].children?.forEach(child => {
    if (child.level <= 2) {
      visibleIds.value.add(child.id)
    }
  })
}

/**
 * Toggle node: if a node's children are currently visible, hide them; otherwise, show them.
 */
// A global map to track node usage for our LRU cache.
const usageMap = new Map(); 
// usageMap[nodeId] = number (higher means used more recently)

// Call this every time a node is toggled, after updateLayout()
function enforceWidthConstraints() {
  if (!displayedNodes.value.length) return;

  // 1) Group nodes by "depth" (or "level") for easy width checks.
  //    The 'depth' property comes from d3.hierarchy; if your data uses 'level',
  //    adapt accordingly.
  const nodesByDepth = {};
  displayedNodes.value.forEach(node => {
    const depth = node.depth || node.level || 0;
    if (!nodesByDepth[depth]) nodesByDepth[depth] = [];
    nodesByDepth[depth].push(node);
  });

  // 2) For each group (depth/level), check if they fit within the screen width.
  Object.keys(nodesByDepth).forEach(depth => {
    const levelNodes = nodesByDepth[depth];

    if (!levelNodes || !levelNodes.length) return;

    // Find the leftmost and rightmost X coords
    const leftX  = Math.min(...levelNodes.map(n => n.x));
    const rightX = Math.max(...levelNodes.map(n => n.x + nodeWidth));

    // If they're within the screen, move on
    const currentWidth = rightX - leftX;
    if (currentWidth <= width.value) {
      return;
    }

    // 3) We exceed the screen width. Hide least-used nodes until it fits.
    //    - Sort levelNodes by usage (ascending = least used first)
    //    - Remove from visibleIds until the row fits on screen
    const sortedByUsage = [...levelNodes].sort((a, b) => {
      const usageA = usageMap.get(a.id) || 0;
      const usageB = usageMap.get(b.id) || 0;
      return usageA - usageB; // ascending order
    });

    let needsFit = true;
    while (needsFit && sortedByUsage.length) {
      const leftMostX  = Math.min(...levelNodes.map(n => n.x));
      const rightMostX = Math.max(...levelNodes.map(n => n.x + nodeWidth));
      const rowWidth   = rightMostX - leftMostX;

      if (rowWidth <= width.value) {
        needsFit = false;
      } else {
        // Hide the least-used node
        const leastUsedNode = sortedByUsage.shift();
        visibleIds.value.delete(leastUsedNode.id);
        // Optionally, hide subtree as well
        // hideSubtree(leastUsedNode); // if you want to remove descendants
        // Remove it from the in-memory array too
        const index = levelNodes.findIndex(n => n.id === leastUsedNode.id);
        if (index !== -1) levelNodes.splice(index, 1);
      }
    }
  });

  // 4) Since we changed visibleIds, recalc the layout again
  updateLayout();
}

// Whenever a toggle happens, increment usage for that node and call enforceWidthConstraints
function toggle(node) {
  // Mark usage
  usageMap.set(node.id, (usageMap.get(node.id) || 0) + 1);

  // 1. Find the corresponding node in the original (full) tree
  const originalNode = findNodeById(roots[0], node.id);
  if (!originalNode || !originalNode.children || originalNode.children.length === 0) {
    console.log("No children in original data. Exiting...");
    return;
  }

  // 2. Check if all children are currently visible
  const childrenAreVisible = originalNode.children.every(child =>
    visibleIds.value.has(child.id)
  );

  // 3. Toggle their visibility
  if (childrenAreVisible) {
    // Hide subtree
    originalNode.children.forEach(hideSubtree);
  } else {
    // Show subtree
    originalNode.children.forEach(child => {
      visibleIds.value.add(child.id);
      // Mark usage of child
      usageMap.set(child.id, (usageMap.get(child.id) || 0) + 1);
    });
  }

  // Update the layout, then enforce the width constraints
  updateLayout();
  enforceWidthConstraints();
}

/**
 * Recursively locate the node with the matching ID in the original tree.
 */
function findNodeById(node, targetId) {
  if (node.id === targetId) return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findNodeById(child, targetId);
    if (found) return found;
  }
  return null;
}

/**
 * Hide a node and all its descendants from visibleIds.
 */
function hideSubtree(node) {
  visibleIds.value.delete(node.id)
  node.children?.forEach(hideSubtree)
}

/**
 * Generate a smooth vertical link path using D3.
 */
function linkPath(link) {
  // Offset by the height of the node

  return d3.linkVertical()
    .x(d => d.data.x) // Use the adjusted x-coordinate
    .y(d => {
      // Offset the source node's y-coordinate by the node height
      if (d === link.source) {
        return d.data.y + nodeHeight; // Offset by the height of the node to the Bottom of the parent node
      }
      return d.data.y; // Top of the child node
    })(link);
}

/**
 * Recomputes all node positions, then filters to only those in visibleIds.
 * It also computes the links (parent->child) for node pairs that are both visible.
 */
function updateLayout() {
  if (!roots[0]) return;

  // 1. Build a "visible-only" copy of the root
  const visibleRootNode = buildVisibleSubtree(roots[0], visibleIds.value);
  if (!visibleRootNode) {
    displayedNodes.value = [];
    displayedLinks.value = [];
    return;
  }
  console.log('visibleRootNode', visibleRootNode)

  // 2. Pass this to d3.hierarchy(), then d3.tree()
  const d3Root = d3.hierarchy(visibleRootNode, d => d.children || []);
  console.log(width, height.value, nodeWidth, nodeHeight)
  d3.tree()
    .nodeSize([nodeWidth + 15, nodeHeight + 15])(d3Root);

  // 3. Set each node’s (x, y) for rendering
  const allNodes = d3Root.descendants();
  allNodes.forEach(d => {
    // Center horizontally
    d.data.x = d.x + width.value / 2;
    d.data.y = d.y;
  });

  // 4. Build array of links containing (source\parent: Node -> target\child : Node)
  const allLinks = d3Root.links();

  // 5. Update reactive arrays
  displayedNodes.value = allNodes.map(d => d.data);
  displayedLinks.value = allLinks;
  console.log('displayedLinks', displayedLinks.value)
  height.value = (d3.max(allNodes, d => d.data.y) || 0) + 200;
}

/**
 * Recursively builds a subtree that only includes nodes in `visibleIds`.
 */
function buildVisibleSubtree(node, visibleIds) {
  // If node is not visible, return null
  if (!visibleIds.has(node.id)) return null;

  // Create a shallow copy of the current node
  const visibleNode = { ...node, children: [] };

  // Recursively add visible children
  if (node.children) {
    node.children.forEach(child => {
      const visibleChild = buildVisibleSubtree(child, visibleIds);
      if (visibleChild) {
        visibleNode.children.push(visibleChild);
      }
    });
  }

  return visibleNode;
}

// Rebuild the chart when the rows change (file upload, etc.)
watch(
  () => props.rows,
  () => {
    // Rebuild data
    roots.splice(0, roots.length, ...buildTree(props.rows))
    initVisibleIds()
    updateLayout()
  },
  { immediate: true }
)

// Ensure initial layout is computed
onMounted(() => {
  initVisibleIds()
  updateLayout()
})
</script>

<style scoped>
path {
  stroke-linecap: round;
}
</style>
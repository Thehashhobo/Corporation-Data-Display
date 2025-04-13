<template>
  <div :style="{ width: (width*2) + 'px', height: height + 'px' }" class="relative">
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
    <svg :style="{ width: (width*2) + 'px', height: '100%' }" class="h-full z-900 inset-0 pointer-events-none">
      <path class="z-999"
      v-for="link in displayedLinks"
      :key="link.target.data.id"
      :d="linkPath(link)"
      stroke="black"
      fill="none"
      stroke-width="1"
      />
    </svg>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, watch, onMounted } from 'vue'
import EmployeeCard from './EmployeeCard.vue'
import { buildTree } from '../utils/Builder.js'
import LRUCache from '../utils/LRUCache.js';

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
const height = ref(window.innerHeight)
console.log('WIDTH is ', width.value, 'HEIGHT is', height.value)

// node number constraints
// Key: level/depth number
// Value: LRUCache (capacity = 2) for that level
const lruByLevel = {};

// Dynamically calculate node width and height based on the chart size
// and number of nodes that should fit. This is a simple heuristic; you can adjust it as needed.
const nodeWidth = ref(0);
const nodeHeight = ref(0);

function setNodeDimensions() {
  const resolutions = [
    { width: 2560, height: 1440, nodeWidthFactor: 11, nodeHeightFactor: 4.5 },
    { width: 1920, height: 1080, nodeWidthFactor: 9.5, nodeHeightFactor: 4.0 },
    { width: 1440, height: 900, nodeWidthFactor: 9.5, nodeHeightFactor: 3.7 },
    { width: 1536, height: 864, nodeWidthFactor: 8.5, nodeHeightFactor: 3.0 },
    { width: 1366, height: 768, nodeWidthFactor: 8.5, nodeHeightFactor: 2.8 },
    { width: 1280, height: 720, nodeWidthFactor: 6.5, nodeHeightFactor: 2.7 },
  ];

  const viewportWidth = width.value;
  const viewportHeight = height.value;

  console.log('width is ', viewportWidth, 'height is', viewportHeight)
  // Find the closest resolution
  const closestResolution = resolutions.reduce((closest, current) => {
    const closestDiff =
      Math.abs(closest.width - viewportWidth) +
      Math.abs(closest.height - viewportHeight);
    const currentDiff =
      Math.abs(current.width - viewportWidth) +
      Math.abs(current.height - viewportHeight);

    return currentDiff < closestDiff ? current : closest;
  });
  console.log('closestResolution', closestResolution)

  nodeWidth.value = viewportWidth / closestResolution.nodeWidthFactor;
  nodeHeight.value = viewportHeight / closestResolution.nodeHeightFactor;
}

window.addEventListener('resize', () => {
  width.value = window.innerWidth
  height.value = window.innerHeight
  setNodeDimensions();
  updateLayout();
});


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
      visibleIds.value.add(child.id)
    
  })
  window.scrollTo({
    left: width.value/2, // The horizontal position to scroll to
    behavior: 'smooth', 
  });
}

/**
 * Toggle node: if a node's children are currently visible, hide them; otherwise, show them.
 */
function toggle(node) {
  // 1. Find the corresponding node in the original tree
  const originalNode = findNodeById(roots[0], node.id);
  if (!originalNode || !originalNode.children || originalNode.children.length === 0) {
    console.log("No children in original data. Exiting...");
    return;
  }

  // 2. Are the children currently visible?
  const childrenAreVisible = originalNode.children.every(child =>
    visibleIds.value.has(child.id)
  );

  // 3. If they are visible, hide them:
  if (childrenAreVisible) {
    
    // Also remove this node from the LRU cache
    const lv = originalNode.level || originalNode.depth || 0;
    if (lruByLevel[lv]) {
      removeNodeAndDescendantsFromLRU(originalNode, lv);
    }
    originalNode.children.forEach(hideSubtree);
  } else {
    // Show the children
    originalNode.children.forEach(child => {
      visibleIds.value.add(child.id);
      // usageMap.set(child.id, (usageMap.get(child.id) || 0) + 1);
    });

    // 4. LRU Enforce: ensure at most 2 nodes with visible children on this level
    const lv = originalNode.level || originalNode.depth || 0;

    // Create a new LRU for this level if it doesn't exist
    if (!lruByLevel[lv]) {
      // capacity = 2 (Can be adjusted, 2 creates a have some buggy edge cases when tree is wide,  1 is safe)
      lruByLevel[lv] = new LRUCache(2); 
    }

    // Evict the least-used node if we exceed capacity
    if (lruByLevel[lv].isAtCapacity()){
      const oldestKey = lruByLevel[lv].oldestKey();
      lruByLevel[lv].remove(oldestKey);
      const evictedNode = findNodeById(roots[0], oldestKey);
      if (evictedNode) {
        // Now remove from deeper LRU caches
        removeNodeAndDescendantsFromLRU(evictedNode, lv);
        hideSubtree(evictedNode); 
        visibleIds.value.add(evictedNode.id);
      }
    }
    // Put this node in the LRU 
    lruByLevel[lv].put(originalNode.id, originalNode);
  }

  // Recompute layout and enforce any additional constraints you might want
  updateLayout();
  // enforceWidthConstraints(); // optional if you still want row-based constraints
}

function removeNodeAndDescendantsFromLRU(node, level) {
  // Remove from LRU at this level if it exists
  if (lruByLevel[level]) {
    lruByLevel[level].remove(node.id);
  }
  // Recursively remove children from the LRU at the next level
  if (node.children && visibleIds.value.has(node.id)) { 
    node.children.forEach(child => {
      // console.log('Removing children', child.id,' at level', level)
      removeNodeAndDescendantsFromLRU(child, parseInt(level) + 1);
    });
  }
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
 * Generate a smooth vertical link path using D3 (Alternative Link).
 * Can you this method instead by commenting out the snakePath() method bellow.
 */
// function linkPath(link) {
//   // Offset by the height of the node

//   return d3.linkVertical()
//     .x(d => d.data.x) // Use the adjusted x-coordinate
//     .y(d => {
//       // Offset the source node's y-coordinate by the node height
//       if (d === link.source) {
//         return d.data.y + nodeHeight; // Offset by the height of the node to the Bottom of the parent node
//       }
//       return d.data.y; // Top of the child node
//     })(link);
// }

/**
 * Generate a custom "snake" path for the link between parent and child nodes.
 * This is a custom implementation to create a smooth curve.
 */
function linkPath(link) {
  // Coordinates of the parent node’s bottom
  const sx = link.source.data.x-10;
  const sy = link.source.data.y + nodeHeight.value; // move to bottom of parent

  // Coordinates of the child node’s top
  const tx = link.target.data.x-10;
  const ty = link.target.data.y;

  // Calculate the midpoint for the vertical movement
  const midY = sy + (ty - sy) / 2;

  // Draw a "snake" shape:
  //  1. Move from (sx, sy) -- bottom of parent
  //  2. Vertical line down to midpoint's y   => (sx, midY)
  //  3. Horizontal line to child's x         => (tx, midY)
  //  4. Vertical line down to child's y      => (tx, ty)
  return `M${sx},${sy} L${sx},${midY} L${tx},${midY} L${tx},${ty}`;
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

  // 2. Pass this to d3.hierarchy(), then d3.tree()
  const d3Root = d3.hierarchy(visibleRootNode, d => d.children || []);
  d3.tree()
    // addition to account for gaps between nodes
    .nodeSize([nodeWidth.value + 10, nodeHeight.value + 45])(d3Root);

  // 3. Set each node’s (x, y) for rendering
  const allNodes = d3Root.descendants();
  allNodes.forEach(d => {
    // Center horizontally
    d.data.x = d.x + width.value;
    d.data.y = d.y;
  });

  // 4. Build array of links containing (source\parent: Node -> target\child : Node)
  const allLinks = d3Root.links();

  // 5. Update reactive arrays
  displayedNodes.value = allNodes.map(d => d.data);
  displayedLinks.value = allLinks;
  // height.value = (d3.max(allNodes, d => d.data.y) || 0) + 200;
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
  setNodeDimensions();
  initVisibleIds()
  updateLayout()
})
</script>

<style scoped>
path {
  stroke-linecap: round;
}
</style>
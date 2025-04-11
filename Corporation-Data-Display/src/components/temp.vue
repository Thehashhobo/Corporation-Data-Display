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
      <!-- <svg class="inset-0 pointer-events-none">
        <path
          v-for="link in displayedLinks"
          :key="link.target.data.id"
          :d="linkPath(link)"
          stroke="#CBD5E1"
          fill="none"
          stroke-width="1.5"
        />
      </svg> -->
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
  const width = window.innerWidth
  console.log(width)
  
  // Update width dynamically on window resize
  window.addEventListener('resize', () => {
    width = window.innerWidth
  })
  const height = ref(800)
  
  // Layout spacing
  const nodeGap  = 200
  const levelGap = 250
  
  const nodeWidth = 200
  const nodeHeight = 300
  
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
   * Toggle node: if its children are currently visible, hide them; otherwise, show them.
   */
  function toggle(node) {
    if (!node.children || node.children.length === 0) return
  
    const childrenAreVisible = node.children.every(child => visibleIds.value.has(child.id))
  
    if (childrenAreVisible) {
      // Remove children from visible set (and grandchildren, etc.)
      node.children.forEach(hideSubtree)
    } else {
      // Add children to visible
      node.children.forEach(child => {
        visibleIds.value.add(child.id)
      })
    }
    updateLayout()
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
    return d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y)(link)
  }
  
  /**
   * Recomputes all node positions, then filters to only those in visibleIds.
   * It also computes the links (parent->child) for node pairs that are both visible.
   */
  function updateLayout() {
    if (!roots[0]) return
  
    // Build a single root from the CEO
    const d3Root = d3.hierarchy(roots[0], d => d.children)
    d3.tree().nodeSize([nodeWidth, nodeHeight])(d3Root)
  
    // Filter out any node whose data.id is not in visibleIds
    const allNodes = d3Root.descendants() 
    console.log(allNodes.length)
    const visibleD3Nodes = allNodes.filter(n => visibleIds.value.has(n.data.id))
    console.log(visibleD3Nodes.length)
    // Layout each visible node
    visibleD3Nodes.forEach(d => {
      d.data.x = d.x + width / 2
      d.data.y = d.y
    })
  
    // Filter links so both parent & child IDs are in visibleIds
    const allLinks = d3Root.links()
    const visibleD3Links = allLinks.filter(
      l => visibleIds.value.has(l.source.data.id) && visibleIds.value.has(l.target.data.id)
    )
  
    // Update reactive arrays
    displayedNodes.value = visibleD3Nodes.map(d => d.data)
    displayedLinks.value = visibleD3Links
    height.value         = (d3.max(visibleD3Nodes, d => d.data.y) || 0) + 200
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
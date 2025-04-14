# 🏢 Org Chart Visualization 

This project is a hierarchical org chart built using **Vue.js**, **Tailwind CSS**, and **D3.js**. It visualizes organizational reporting lines from a CSV dataset and includes interactivity such as expandable/collapsible nodes and dynamic cost calculations.

## 📐 Features

- 🔍 **Expandable/Collapsible Tree Nodes** using `d3.hierarchy()`
- 🧠 **Memoized descendant counting** for efficient tree updates
- 📊 **Management Metrics per Node**:
- 🧭 **Auto-centering and viewport-aware tree layout**
- 🧩 **Responsive design** for desktop and tablet
- ⚙️ **LRU-based level constraint** to prevent overflow when expanding nodes

## 🚀 How It Works

This org chart uses a `visibleIds` array to track expanded nodes. Every time this list updates, a new D3 tree layout is computed using only visible nodes — improving clarity and performance.

To prevent visual clutter and overflow:
- Only **two nodes per level** can be expanded at a time.
- Expanding a third node collapses the **least recently viewed** one (via an **LRU cache**).
- The cache size can be adjusted for stricter limits (e.g., 1 node per level).

---

## ⚠️ Known Issues

- **Chrome + Firefox DevTools Mobile Emulation**: Fixed positioning of buttons and auto-centering (see `OrgChart.vue`, line 341) may not behave correctly in mobile emulation mode. However, it works correctly on actual physical devices.
- **Mobile Support**: This project intentionally excludes support for small-screen mobile devices, as mobile usage is considered an unlikely scenario.

---

## 📦 Tech Stack

- **Vue 3 (Composition API)**
- **Tailwind CSS**
- **D3.js** (`d3-hierarchy`)
- **CSV Parsing** via browser `FileReader`

---

## 🛠️ Getting Started

To run the project locally:

```bash
# Clone the project
git clone <repo-url>

# Install dependencies
npm install

# Start dev server
npm run dev

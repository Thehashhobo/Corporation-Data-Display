<template>
  <div class="p-6 space-y-6">
    <!-- Wrap the label+input clearly so the clickable area matches the button -->
    <div class="fixed top-4 right-4">
      <label
        class="inline-block px-5 py-2.5 text-white bg-blue-700 hover:bg-blue-800 
               focus:ring-4 focus:outline-none focus:ring-blue-300 
               font-medium rounded-lg text-sm cursor-pointer text-center Z-999"
        :title="rows.length ? 'Upload again?' : ''"
        for="fileInput"
      >
        {{ rows.length ? 'Upload Different CSV' : 'Upload CSV' }}
      </label>
      <input
        id="fileInput"
        class="hidden"
        type="file"
        accept=".csv"
        @change="load"
      />
    </div>
    

<!-- Modal toggle -->
 <!-- The fixed position does not work in dev tool, potentially due to device emulation, However, it works in the real device.  -->
<button @click="showModal = true" class="fixed z-999 top-4 left-4 block text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800" type="button">
  Read me! 
</button>

<!-- Main modal -->
<div v-if="showModal" id="default-modal" tabindex="-1" class="fixed inset-0 z-50 flex justify-center items-center overflow-y-auto overflow-x-hidden">
    <div class="relative p-4 w-full max-w-2xl max-h-full">
        <!-- Modal content -->
        <div class="relative bg-gray-600 rounded-lg shadow-sm">
            <!-- Modal header -->
            <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-700">
                <h3 class="text-xl font-semibold text-white">
                  How the Org Chart Works

                </h3>
                <button @click="showModal = false" type="button" class="text-gray-400 bg-transparent hover:bg-gray-700 hover:text-white rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center">
                    <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span class="sr-only">Close modal</span>
                </button>
            </div>
            <!-- Modal body -->
            <div class="p-4 md:p-5 space-y-4">
                <p class="text-base leading-relaxed text-white">
                  This org chart manages which nodes are visible using a visibleIds array. Each time the visibility changes, 
                  the D3 tree layout is recalculated to ensure accurate positioning based on only the currently expanded nodes.


                </p>
                <p class="text-base leading-relaxed text-white">
                  To keep the chart readable and prevent nodes from rendering outside the viewport, expansion is limited to two 
                  nodes per level. When a third node is expanded, the least recently viewed node at that level is automatically 
                  collapsed using an LRU (Least Recently Used) strategy. In scenarios with many children, some edge cases may 
                  still cause the layout to overflow. For stricter control, you can limit expansion to one node per level by 
                  adjusting the cache size in the code (OrgChart, line 164).
                </p>

                <p class="text-base leading-relaxed text-white">
                  There is a current issue where the fixed positioning of buttons and auto-centering logic (see OrgChart, line 344)
                   does not function correctly within Chrome DevTools' device emulation mode. This appears to be related to how the
                    emulated viewport handles layout and rendering. However, the behavior works as expected on actual 
                    physical devices, suggesting the issue is isolated to the emulation environment.
                </p>
                <p class="text-base leading-relaxed text-white">
                  The responsive design is optimized for desktop and tablet devices. Mobile support is intentionally
                   excluded, as mobile usage is considered an unlikely use case for this application.
                </p>


            </div>
            <!-- Modal footer -->
            <div class="flex items-center p-4 md:p-5 border-t border-gray-700 rounded-b">

            </div>
        </div>
    </div>
</div>

    <OrgChart v-if="rows.length" :rows="rows" />
  </div>
</template>

<script setup>

const showModal = ref(false)
import Papa from 'papaparse'
import { ref } from 'vue'
import OrgChart from './components/OrgChart.vue'

const rows = ref([])

function load(e) {
  const file = e.target.files[0]
  if (!file) {console.log("nofile"); return}
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: res => (rows.value = res.data)
  })
  console.log('rows', rows.value)
}
</script>
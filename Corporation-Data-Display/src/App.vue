<template>
  <div class="flex p-6 space-y-6 flex-co">
    <div class="fixed top-4 right-4 ">
      <label 
      class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 cursor-pointer inline-block" 
      for="fileInput"
      :title="rows.length ? 'Upload again?' : ''"
      >
      {{ rows.length ? 'Upload Different CSV' : (rows.length ? 'File Uploaded' : 'Upload CSV') }}
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
<button @click="showModal = true" class="z-999 fixed top-4 left-4 block text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800" type="button">
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
                    Design Decisions
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
                    With less than a month to go before the European Union enacts new consumer privacy laws for its citizens, companies around the world are updating their terms of service agreements to comply.
                </p>
                <p class="text-base leading-relaxed text-white">
                    The European Union’s General Data Protection Regulation (G.D.P.R.) goes into effect on May 25 and is meant to ensure a common set of data rights in the European Union. It requires organizations to notify users as soon as possible of high-risk data breaches that could personally affect them.
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

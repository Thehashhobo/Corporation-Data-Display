<template>
  <div class="flex p-6 space-y-6 flex-co">
    <div class="fixed top-4 right-4">
      <label 
      class="border-2 px-4 py-2 cursor-pointer inline-block" 
      for="fileInput"
      >
      {{ rows.length ? 'File Uploaded' : 'Upload CSV' }}
      </label>
      <input 
      id="fileInput"
      class="hidden" 
      type="file" 
      accept=".csv" 
      @change="load" 
      />
    </div>
    <OrgChart v-if="rows.length" :rows="rows" />
  </div>
</template>

<script setup>
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

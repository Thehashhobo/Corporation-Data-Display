<template>
  <div class="flex p-6 space-y-6 flex-col m-2">
    <input class=" absolute border-2 justify-start w-55 h-8" type="file" accept=".csv" @change="load" />
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

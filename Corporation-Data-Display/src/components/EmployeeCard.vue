<template>
  <div
    class="absolute z-10 rounded-lg shadow bg-white border p-2 cursor-pointer
           hover:shadow-md transition"
    :style="{
      left: `${node.x - (nodeWidth / 1.8)}px`,
      top: `${node.y}px`,
      width: `${nodeWidth}px`,
      height: `${nodeHeight}px`
    }"
    @click.stop="toggle"
  >
    <img
      :src="node.Photo || fallback"
      alt=""
      class="w-full h-1/3 object-cover rounded"
    />
    <div class="mt-1">
      <p class="font-semibold leading-tight">{{ node.Name }}</p>
      <p class="text-xs text-gray-500 mb-1">{{ node['Job Title'] }}</p>
      <p class="text-sm font-medium">$ {{ node.salary.toLocaleString() }}</p>
      <p class="text-sm font-medium">x: {{ node.x.toFixed(1) }}, y: {{ node.y.toFixed(1) }}</p>

      <div class="mt-1 grid grid-cols-2 gap-x-1 text-[11px]">
        <span class="font-semibold">Total:</span> <span>{{ node.total }}</span>
        <span class="font-semibold">Mgmt:</span> <span>{{ node.mgmt }}</span>
        <span class="font-semibold">IC:</span> <span>{{ node.ic }}</span>
        <span class="font-semibold">Ratio:</span> <span>{{ node.ratio }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import fallback from '../assets/vue.svg';

const props = defineProps({
  node: Object,
  onToggle: Function,
  // handle node width and height dynamically
  // based on the chart size and number of nodes
  nodeWidth: Number,
  nodeHeight: Number
});

const toggle = () => props.onToggle(props.node);
</script>

<template>
  <div
    class="absolute z-10 rounded-lg shadow bg-white border p-2 cursor-pointer hover:shadow-md transition"
    :style="{
      left: `${node.x - (nodeWidth / 1.8)}px`,
      top: `${node.y}px`,
      width: `${nodeWidth}px`,
      height: `${nodeHeight}px`
    }"
    @click.stop="toggle"
  >
    <!-- Circle photo pinned at the top -->
    <div class="flex justify-center relative">
      <img
        :src="node.Photo || fallback"
        alt=""
        class="w-12 h-12 object-cover rounded-full border-2 border-white shadow absolute -top-6"
      />
    </div>

    <div class="mt-8 text-center">
      <p class="font-semibold leading-tight">{{ node.Name }}</p>
      <p class="text-xs text-gray-500 mb-1">{{ node['Job Title'] }}</p>
      <p class="text-sm font-medium mb-2">
        {{ millify(node.salary, { precision: 2 }) }}
      </p>

      <!-- Existing cost fields -->
      <div class="grid grid-cols-2 gap-x-1 text-xs mb-2">
        <span class="font-semibold">Total:</span> <span>{{ node.total }}</span>
        <span class="font-semibold">Mgmt:</span>  <span>{{ node.mgmt }}</span>
        <span class="font-semibold">IC:</span>    <span>{{ node.ic }}</span>
        <span class="font-semibold">Ratio:</span> <span>{{ node.ratio }}</span>
      </div>

      <!-- Additional HR fields -->
      <div class="grid grid-cols-2 gap-x-1 text-xs">
        <span class="font-semibold">Descendants:</span>
        <span>{{ node.descendantCount }}</span>

        <span class="font-semibold">Mgr Desc:</span>
        <span>{{ node.nonLeafDescendants }}</span>

        <span class="font-semibold">Levels:</span>
        <span>{{ node.levelsReporting }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import fallback from '../assets/vue.svg';
import millify from 'millify';

const props = defineProps({
  node: Object,
  onToggle: Function,
  nodeWidth: Number,
  nodeHeight: Number
});

const toggle = () => props.onToggle(props.node);
</script>

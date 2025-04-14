<template>
  <div
    class="absolute z-10 rounded-lg shadow border p-2 cursor-pointer hover:shadow-2xl transition"
    :style="{
      backgroundColor: node.color || 'white',
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

    <!-- Name & Title remain unchanged -->
    <div class="mt-8 text-center">
      <p class="font-bold leading-tight">{{ node.Name }}</p>
      <p class="text-xs text-gray-500 mb-1">{{ node['Job Title'] }}</p>

      <!-- Salary / Cost Fields in a flex column layout -->
      <div class="flex flex-col text-xs mb-2 items-center gap-1">
        <div class="flex gap-1 p-0.3 pl-1.5 pr-1.5 rounded-2xl border-b-0 bg-black/20">
          <span class="font-semibold">Manager Cost:</span>
          <span>{{ millify(node.mc, { precision: 2 }) }}</span>
        </div>
        <div class="flex gap-1 p-0.3 pl-1.5 pr-1.5 rounded-2xl border-b-0 bg-black/20">
          <span class="font-semibold">IC Cost:</span>
          <span>{{ millify(node.ic, { precision: 2 }) }}</span>
        </div>
        <div class="flex gap-1 p-0.3 pl-1.5 pr-1.5 rounded-2xl border-b-0 bg-black/20">
          <span class="font-semibold">Total Cost:</span>
          <span>{{ millify(node.total, { precision: 2 }) }}</span>
        </div>
        <div class="flex gap-1 p-0.3 pl-1.5 pr-1.5 rounded-2xl border-b-0 bg-black/20">
          <span class="font-semibold">Cost Ratio:</span>
          <span>{{ millify(node.ratio, { precision: 2 }) }}</span>
        </div>
      </div>

      <!-- Additional HR fields also in a flex column layout -->
      <div class="flex flex-col text-xs items-center gap-1">
        <div class="flex gap-1 p-0.3 pl-1.5 pr-1.5 rounded-2xl border-b-0 bg-black/20">
          <span class="font-semibold">Descendants Count:</span>
          <span>{{ node.descendantCount }}</span>
        </div>
        <div class="flex gap-1 p-0.3 pl-1.5 pr-1.5 rounded-2xl border-b-0 bg-black/20">
          <span class="font-semibold">Manager Count:</span>
          <span>{{ node.nonLeafDescendants }}</span>
        </div>
        <div class="flex gap-1 p-0.3 pl-1.5 pr-1.5 rounded-2xl border-b-0 bg-black/20">
          <span class="font-semibold">Manager Ratio:</span>
          <span>{{ millify(node.nonLeafDescendants/node.descendantCount, { precision: 2 }) }}</span>
        </div>
        <div class="flex gap-2 p-0.3 pl-1.5 pr-1.5 rounded-2xl border-b-0 bg-black/20">
          <span class="font-semibold">Reporting Layers:</span>
          <span>{{ node.levelsReporting }}</span>
        </div>
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

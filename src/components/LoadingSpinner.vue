<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div 
      class="animate-spin rounded-full border-b-2"
      :class="spinnerClass"
    ></div>
    <span v-if="text" class="ml-3 text-sm text-gray-600">
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white'
  text?: string
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  containerClass: 'py-8'
})

const spinnerClass = computed(() => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }
  
  const colorClasses = {
    primary: 'border-chorus-600',
    secondary: 'border-gray-600',
    white: 'border-white'
  }
  
  return `${sizeClasses[props.size]} ${colorClasses[props.color]}`
})
</script>

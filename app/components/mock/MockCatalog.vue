<script setup lang="ts">
export interface CatalogStand { key: string, name: string, scenario: string, style: Record<string, string>, stock: boolean, image?: string, logo?: string }
defineProps<{ stands: CatalogStand[], current: string }>()
defineEmits<{ select: [key: string] }>()
const { t } = useToolText()
</script>

<template>
  <nav class="mock-cat" :aria-label="t('Стенды', 'Stands')">
    <button
      v-for="stand in stands"
      :key="stand.key"
      type="button"
      class="mock-cat-item"
      :class="{ 'is-on': stand.key === current }"
      :data-stand="stand.key"
      :aria-current="stand.key === current ? 'true' : undefined"
      @click="$emit('select', stand.key)"
    >
      <span
        class="mock-cat-art"
        :class="{ 'is-stock': stand.stock, 'has-img': stand.image }"
        :style="[stand.style, stand.image ? { backgroundImage: `url(${stand.image})` } : {}]"
        aria-hidden="true"
      >
        <img v-if="!stand.image && stand.logo" :src="stand.logo" alt="" width="56" height="56" loading="lazy">
        <svg v-else-if="!stand.image" viewBox="0 0 32 32">
          <path d="M16 4.5a11.5 11.5 0 1 1-10.9 7.8" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
          <circle cx="16" cy="16" r="3.6" fill="currentColor" />
        </svg>
      </span>
      <span class="mock-swatch" :class="{ 'is-stock': stand.stock }" :style="stand.style" aria-hidden="true" />
      <b>{{ stand.name }}</b>
      <small>{{ stand.scenario }}</small>
    </button>
  </nav>
</template>

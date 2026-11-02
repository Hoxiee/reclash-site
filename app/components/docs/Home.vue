<script setup lang="ts">
import { docPage, docPath, docSections, docText, type DocLanguage } from '~~/shared/docs/catalogue'
const props = defineProps<{ language: DocLanguage }>()
const t = (ru: string, en: string, zh?: string) => docText(props.language, ru, en, zh)
const sections = docSections.map(section => {
  const root = docPage(section.slug)
  return {
    ...section, root,
    groups: section.groups.map(group => ({ title: group.title[props.language] ?? '', pages: group.pages.filter(slug => slug !== section.slug).map(slug => docPage(slug)!) })).filter(group => group.pages.length),
  }
})
</script>

<template>
  <div class="hb-map">
    <section v-for="(section, index) in sections" :key="section.id" class="hb-map-card" :aria-labelledby="`map-${section.id}`">
      <SiteLink class="hb-map-head" :to="docPath(language, section.slug)">
        <span class="hb-map-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <h2 :id="`map-${section.id}`">{{ section.title[language] }}</h2>
        <p v-if="section.root">{{ section.root.descriptions[language] }}</p>
        <span class="hb-map-go">{{ t('Открыть раздел', 'Open section', '打开章节') }}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></span>
      </SiteLink>
      <div class="hb-map-groups">
        <div v-for="group in section.groups" :key="group.title">
          <p class="hb-nav-label">{{ group.title }}</p>
          <ul><li v-for="page in group.pages" :key="page.slug"><SiteLink :to="docPath(language, page.slug)">{{ page.titles[language] }}</SiteLink></li></ul>
        </div>
      </div>
    </section>
  </div>
</template>

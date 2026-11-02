<script setup lang="ts">
import { docPath, docSection, docText, type DocLanguage, type DocPage } from '~~/shared/docs/catalogue'
const props = defineProps<{ language: DocLanguage, previous?: DocPage, next?: DocPage }>()
const t = (ru: string, en: string, zh?: string) => docText(props.language, ru, en, zh)
const label = (page: DocPage) => page.section ? docSection(page.section)?.title[props.language] : t('Документация', 'Documentation', '文档')
</script>

<template>
  <nav v-if="previous || next" class="hb-pager" :aria-label="t('Соседние страницы', 'Adjacent pages', '相邻页面')">
    <SiteLink v-if="previous" class="hb-pager-link is-previous" :to="docPath(language, previous.slug)">
      <span>{{ t('Назад', 'Previous', '上一页') }} · {{ label(previous) }}</span><b>{{ previous.titles[language] }}</b>
    </SiteLink>
    <SiteLink v-if="next" class="hb-pager-link is-next" :to="docPath(language, next.slug)">
      <span>{{ t('Далее', 'Next', '下一页') }} · {{ label(next) }}</span><b>{{ next.titles[language] }}</b>
    </SiteLink>
  </nav>
</template>

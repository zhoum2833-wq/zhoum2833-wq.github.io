<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <div class="busuanzi-footer">
        <span id="busuanzi_container_site_pv" style="display: none">
          🚶 本站总访问量 <span id="busuanzi_value_site_pv"></span> 次
        </span>
        <span class="busuanzi-divider">·</span>
        <span id="busuanzi_container_site_uv" style="display: none">
          🧑 访客数 <span id="busuanzi_value_site_uv"></span> 人
        </span>
        <span class="busuanzi-divider">·</span>
        <span id="busuanzi_container_page_pv" style="display: none">
          📄 本文阅读量 <span id="busuanzi_value_page_pv"></span> 次
        </span>
      </div>
    </template>
  </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import { onMounted } from 'vue'

onMounted(() => {
  // 不蒜子统计脚本
  const script = document.createElement('script')
  script.async = true
  script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  document.head.appendChild(script)
})
</script>

<style scoped>
.busuanzi-footer {
  text-align: center;
  padding: 16px 0 24px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 32px;
}

.busuanzi-divider {
  margin: 0 10px;
  color: var(--vp-c-text-3);
}

/* 暗色模式适配 */
html.dark .busuanzi-footer {
  color: var(--vp-c-text-2);
}
</style>

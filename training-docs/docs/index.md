---
layout: page

---
<style>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 130px);
  text-align: center;
  padding: 2rem;
}
.home-top {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.home-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.home-subtitle {
  color: var(--vp-c-text-2);
  font-size: 1.1rem;
  margin-bottom: 2rem;
}
.home-content {
  text-align: left;
  max-width: 600px;
  width: 100%;
  margin: 0 auto 2rem;
}
.home-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  padding-bottom: 2rem;
}
.btn-brand {
  display: inline-block;
  border-radius: 20px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  background: var(--vp-c-brand-1);
  color: #fff;
  text-decoration: none;
  transition: background 0.2s;
}
.btn-brand:hover { background: var(--vp-c-brand-2); text-decoration: none; color: #fff; }
.btn-alt {
  display: inline-block;
  border-radius: 20px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: all 0.2s;
}
.btn-alt:hover { border-color: var(--vp-c-brand-2); color: var(--vp-c-brand-2); text-decoration: none; }
</style>

<div class="home-container">
  <div class="home-top">
    <h1 class="home-title">嵌入式与电赛入门与进阶</h1>
    <p class="home-subtitle">写给零基础队友的单片机入门教程 · 2026 江苏省电子设计竞赛</p>
  </div>
<div class="home-content">
<p>持续更新中，有问题直接找我。</p>

</div>
  <div class="home-actions">
    <a class="btn-brand" href="/01-hardware/cpu-arch">开始学习</a>
    <a class="btn-alt" href="/01-hardware/cpu-arch">章节概览</a>
  </div>
</div>

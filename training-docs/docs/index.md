---
layout: page
sidebar: false

---
<style>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 6rem 2rem 3rem;
}
.home-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}
.home-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0;
}
.home-content {
  text-align: center;
  color: var(--vp-c-text-2);
  max-width: 600px;
  margin: 0 auto 2rem;
}
.home-content p {
  margin: 0.5rem 0;
}
.home-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
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
  </div>
<div class="home-content">
<p>记录一下自己的学习心得与理解</p>
<p>---<br><!-- @chapter: 第一篇：硬件基础 --></p>
</div>
  <div class="home-actions">
    <a class="btn-brand" href="/training/01-hardware/cpu-arch.html">开始学习</a>
    <a class="btn-alt" href="/training/01-hardware/cpu-arch.html">章节概览</a>
  </div>
</div>

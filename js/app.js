/**
 * 椰椰博士博客 — 应用逻辑
 * SPA路由 + Markdown渲染 + 标签筛选
 */

(function () {
  'use strict';

  // 配置 marked
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true,
      mangle: false,
      sanitize: false
    });
  }

  // ============================================
  // 路由系统
  // ============================================

  function getRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
  }

  function parseRoute(hash) {
    // 清理前导斜杠
    const parts = hash.replace(/^\//, '').split('/').filter(Boolean);

    if (parts.length === 0) {
      return { page: 'home', params: {} };
    }

    if (parts[0] === 'article' && parts[1]) {
      return { page: 'article', params: { id: decodeURIComponent(parts[1]) } };
    }

    if (parts[0] === 'tags') {
      if (parts[1]) {
        return { page: 'tagDetail', params: { tag: decodeURIComponent(parts[1]) } };
      }
      return { page: 'tags', params: {} };
    }

    if (parts[0] === 'about') {
      return { page: 'about', params: {} };
    }

    if (parts[0] === 'category' && parts[1]) {
      return { page: 'category', params: { category: decodeURIComponent(parts[1]) } };
    }

    return { page: 'home', params: {} };
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  // ============================================
  // 页面渲染
  // ============================================

  function renderHome() {
    const app = document.getElementById('app');
    const featured = ARTICLES[0];
    const recentArticles = ARTICLES.slice(0, 6);
    const categories = getAllCategories();

    app.innerHTML = `
      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">
            <span>🧬</span>
            <span>生物医药 × 优势管理 × 职业教练</span>
          </div>
          <h1>用<span class="highlight">优势思维</span>，照亮职业进阶之路</h1>
          <p class="hero-tagline">
            椰椰博士 Anney · 优势星球认证优势教练<br>
            专注生物医药中层管理者、职场妈妈与INTJ的优势诊断与职业突破
          </p>
          <div class="hero-actions">
            <a href="#/about" class="hero-btn hero-btn-primary">
              <span>了解我的教练服务</span>
              <span>→</span>
            </a>
            <a href="#/tags" class="hero-btn hero-btn-secondary">
              <span>浏览文章分类</span>
            </a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-stat-num">100+</div>
              <div class="hero-stat-label">教练小时数</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-num">9大</div>
              <div class="hero-stat-label">优势框架</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-num">90天</div>
              <div class="hero-stat-label">系统化套餐</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-num">100%</div>
              <div class="hero-stat-label">定制方案</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 分类导航 -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">分类浏览</h2>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
          ${categories.map(cat => `
            <a href="#/category/${encodeURIComponent(cat.name)}" class="tag-cloud-item">
              <span>${getCategoryIcon(cat.name)}</span>
              <span>${cat.name}</span>
              <span class="tag-cloud-count">${cat.count}</span>
            </a>
          `).join('')}
        </div>
      </div>

      <!-- 最新文章 -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">最新文章</h2>
          <a href="#/tags" class="section-link">查看全部 →</a>
        </div>
        <div class="article-list">
          ${recentArticles.map(article => renderArticleCard(article)).join('')}
        </div>
      </div>
    `;

    bindCardClicks();
  }

  function renderArticleCard(article) {
    return `
      <article class="article-card fade-in" data-id="${article.id}">
        <div class="article-card-cover" style="background:${article.coverGradient}">
          <span>${article.cover}</span>
        </div>
        <div class="article-card-body">
          <div class="article-card-meta">
            <span class="article-card-category">${article.category}</span>
            <span class="article-card-date">${formatDate(article.date)}</span>
          </div>
          <h3 class="article-card-title">${article.title}</h3>
          <p class="article-card-excerpt">${article.excerpt}</p>
          <div class="article-card-tags">
            ${article.tags.slice(0, 3).map(tag => `<span class="article-card-tag">#${tag}</span>`).join('')}
          </div>
          <div class="article-card-footer">
            <span class="read-time">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              ${article.readTime} 分钟阅读
            </span>
          </div>
        </div>
      </article>
    `;
  }

  function renderArticleDetail(id) {
    const app = document.getElementById('app');
    const article = ARTICLES.find(a => a.id === id);

    if (!article) {
      app.innerHTML = renderEmptyState('文章未找到', '你访问的文章不存在或已被移除');
      return;
    }

    // 渲染 Markdown 内容
    let htmlContent = '';
    try {
      const rawHtml = marked.parse(article.content);
      // 使用 DOMPurify 净化 HTML（如果可用）
      if (typeof DOMPurify !== 'undefined') {
        htmlContent = DOMPurify.sanitize(rawHtml);
      } else {
        htmlContent = rawHtml;
      }
    } catch (e) {
      htmlContent = '<p>内容渲染出错</p>';
    }

    app.innerHTML = `
      <article class="article-detail">
        <a href="#/" class="article-detail-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回首页
        </a>

        <header class="article-detail-header">
          <span class="article-detail-category">${article.category}</span>
          <h1 class="article-detail-title">${article.title}</h1>
          <div class="article-detail-meta">
            <span class="article-detail-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              ${formatDate(article.date)}
            </span>
            <span class="article-detail-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              ${article.readTime} 分钟阅读
            </span>
            <span class="article-detail-meta-item">
              ✍️ 椰椰博士 Anney
            </span>
          </div>
        </header>

        <div class="article-detail-cover" style="background:${article.coverGradient}">
          <span>${article.cover}</span>
        </div>

        <div class="markdown-body">
          ${htmlContent}
        </div>

        <div class="article-detail-tags">
          ${article.tags.map(tag => `
            <a href="#/tags/${encodeURIComponent(tag)}" class="article-detail-tag">#${tag}</a>
          `).join('')}
        </div>

        ${renderRelatedArticles(article)}
      </article>
    `;

    // 绑定相关文章点击
    bindCardClicks();
  }

  function renderRelatedArticles(currentArticle) {
    const related = ARTICLES
      .filter(a => a.id !== currentArticle.id)
      .map(a => ({
        article: a,
        score: a.tags.filter(t => currentArticle.tags.includes(t)).length
      }))
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (related.length === 0) {
      // 如果没有标签相关的，取同分类的
      const sameCategory = ARTICLES
        .filter(a => a.id !== currentArticle.id && a.category === currentArticle.category)
        .slice(0, 3);
      if (sameCategory.length === 0) return '';
      return renderRelatedSection(sameCategory);
    }

    return renderRelatedSection(related.map(r => r.article));
  }

  function renderRelatedSection(articles) {
    return `
      <div style="margin-top:56px;padding-top:40px;border-top:2px solid var(--color-border);">
        <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:24px;display:flex;align-items:center;gap:8px;">
          📖 相关推荐
        </h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">
          ${articles.map(article => `
            <a href="#/article/${article.id}" class="article-card" style="text-decoration:none;">
              <div class="article-card-cover" style="background:${article.coverGradient};height:100px;font-size:2rem;">
                <span>${article.cover}</span>
              </div>
              <div class="article-card-body" style="padding:16px 18px;">
                <h3 style="font-size:0.95rem;font-weight:600;color:var(--color-text);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${article.title}</h3>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderTagsPage(activeTag) {
    const app = document.getElementById('app');
    const allTags = getAllTags();

    let articles = ARTICLES;
    let headerText = '全部文章';

    if (activeTag) {
      articles = ARTICLES.filter(a => a.tags.includes(activeTag));
      headerText = `标签 "${activeTag}" 下的 ${articles.length} 篇文章`;
    }

    app.innerHTML = `
      <div class="tags-page">
        <h1 class="page-title">
          <span>🏷️</span>
          <span>标签分类</span>
        </h1>
        <p class="page-subtitle">通过标签快速找到你感兴趣的内容</p>

        <div class="tag-cloud">
          <a href="#/tags" class="tag-cloud-item ${!activeTag ? 'active' : ''}">
            <span>全部</span>
            <span class="tag-cloud-count">${ARTICLES.length}</span>
          </a>
          ${allTags.map(tag => `
            <a href="#/tags/${encodeURIComponent(tag.name)}" class="tag-cloud-item ${activeTag === tag.name ? 'active' : ''}">
              <span>#${tag.name}</span>
              <span class="tag-cloud-count">${tag.count}</span>
            </a>
          `).join('')}
        </div>

        ${activeTag ? `
          <div class="tag-filter-header">
            <span>📌</span>
            <span>当前筛选：<strong>${activeTag}</strong> · 共 <strong>${articles.length}</strong> 篇文章</span>
          </div>
        ` : ''}

        ${articles.length > 0 ? `
          <div class="article-list tag-filtered-list">
            ${articles.map(article => renderArticleCard(article)).join('')}
          </div>
        ` : renderEmptyState('暂无文章', '该标签下还没有文章')}
      </div>
    `;

    bindCardClicks();
  }

  function renderCategoryPage(category) {
    const app = document.getElementById('app');
    const articles = ARTICLES.filter(a => a.category === category);

    if (articles.length === 0) {
      app.innerHTML = renderEmptyState('分类未找到', '该分类下没有文章');
      return;
    }

    app.innerHTML = `
      <div class="tags-page">
        <a href="#/" class="article-detail-back" style="margin-bottom:24px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回首页
        </a>
        <h1 class="page-title">
          <span>${getCategoryIcon(category)}</span>
          <span>${category}</span>
        </h1>
        <p class="page-subtitle">共 ${articles.length} 篇文章</p>

        <div class="article-list">
          ${articles.map(article => renderArticleCard(article)).join('')}
        </div>
      </div>
    `;

    bindCardClicks();
  }

  function renderAboutPage() {
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="about-page">
        <!-- Hero -->
        <div class="about-hero">
          <div class="about-avatar">🧬</div>
          <h1 class="about-name">椰椰博士 Anney</h1>
          <p class="about-title">生物医药优势管理职业教练</p>
          <p class="about-bio">
            优势星球认证优势教练，崔璀9大优势框架深度实践者。<br>
            专注为生物医药行业中层管理者、职场妈妈与INTJ型人格提供<br>
            基于崔璀9大优势框架与GLOW教练模型的职业突破服务。
          </p>
        </div>

        <!-- 核心卡片 -->
        <div class="about-cards">
          <div class="about-card">
            <div class="about-card-icon">🎯</div>
            <h3>优势诊断</h3>
            <p>基于崔璀9大优势框架，帮助你识别核心优势、能量模式与成长杠杆点，建立清晰的个人优势画像。</p>
          </div>
          <div class="about-card">
            <div class="about-card-icon">🌟</div>
            <h3>GLOW教练模型</h3>
            <p>融合崔璀优势框架的四阶段模型：扎根→杠杆→轨道→智慧，系统化推动职业突破与持续成长。</p>
          </div>
          <div class="about-card">
            <div class="about-card-icon">🧬</div>
            <h3>行业专长</h3>
            <p>深耕生物医药行业，理解研发、临床、质控等各环节的中层管理痛点，提供行业化的教练方案。</p>
          </div>
          <div class="about-card">
            <div class="about-card-icon">🗺️</div>
            <h3>90天套餐</h3>
            <p>诊断报告+6次教练session+全程跟踪的系统性方案，从认知到行动到固化，完整陪伴你的成长。</p>
          </div>
        </div>

        <!-- 专业认证 -->
        <div class="about-section">
          <h2><span class="icon">📜</span> 专业认证与资质</h2>
          <ul>
            <li><span class="check">✅</span> 优势星球认证优势教练</li>
            <li><span class="check">✅</span> 崔璀9大优势框架深度实践者与推广者</li>
            <li><span class="check">✅</span> GLOW教练模型设计者</li>
            <li><span class="check">✅</span> 六角色执行终端系统、三阶段交付模型设计者</li>
            <li><span class="check">✅</span> 七层产品体系设计者</li>
          </ul>
        </div>

        <!-- 教练专注领域 -->
        <div class="about-section">
          <h2><span class="icon">🧭</span> 教练专注领域</h2>
          <ul>
            <li><span class="check">🔬</span> <strong>生物医药行业中层管理者</strong> — 从技术骨干到管理者的能力跃迁，跨部门协作与向上影响力</li>
            <li><span class="check">👩‍💼</span> <strong>职场妈妈</strong> — 优势驱动的资源调度系统，重新定义工作生活平衡</li>
            <li><span class="check">♟️</span> <strong>INTJ型人格</strong> — 用系统思维驾驭职场复杂性，将认知特质转化为竞争力</li>
            <li><span class="check">📊</span> <strong>中层管理教练</strong> — 优势诊断、团队赋能、能量管理与系统化思维</li>
          </ul>
        </div>

        <!-- 教练方法 -->
        <div class="about-section">
          <h2><span class="icon">🛠️</span> 核心方法论</h2>
          <ul>
            <li><span class="check">📌</span> <strong>崔璀9大优势框架</strong> — 驱动、分析、共情、引领、创新、执行、关系、学习、战略</li>
            <li><span class="check">📌</span> <strong>GLOW教练模型</strong> — Grounding扎根 → Leverage杠杆 → Orbit轨道 → Wisdom智慧</li>
            <li><span class="check">📌</span> <strong>六角色执行终端系统</strong> — 结构化的教练服务交付体系</li>
            <li><span class="check">📌</span> <strong>三阶段交付模型</strong> — 诊断→突破→固化的完整教练路径</li>
          </ul>
        </div>

        <!-- 内容渠道 -->
        <div class="about-section">
          <h2><span class="icon">📢</span> 内容与渠道</h2>
          <ul>
            <li><span class="check">📖</span> 微信公众号「椰椰Anney2」— 长文800-1500字，深度方法论分享</li>
            <li><span class="check">📕</span> 小红书「椰椰博士Anney」— 500字精华改写，快速阅读</li>
            <li><span class="check">🗂️</span> Obsidian「Anney知识库」— 知识沉淀与方法论固化</li>
            <li><span class="check">💬</span> 90天咨询套餐 — 预约制，1对1深度教练服务</li>
          </ul>
        </div>

        <!-- CTA -->
        <div class="about-cta">
          <h2>🚀 准备好开启你的优势之旅了吗？</h2>
          <p>90天系统化教练套餐，从优势诊断到职业突破，全程陪伴</p>
          <a href="#/article/90day-coaching-program" class="about-cta-btn">
            了解90天教练套餐
            <span>→</span>
          </a>
        </div>
      </div>
    `;
  }

  function renderEmptyState(title, desc) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>${title}</h3>
        <p>${desc}</p>
        <a href="#/" style="display:inline-flex;align-items:center;gap:6px;margin-top:20px;color:var(--color-primary);font-weight:500;">
          ← 返回首页
        </a>
      </div>
    `;
  }

  // ============================================
  // 辅助函数
  // ============================================

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return `${date.getFullYear()}年${months[date.getMonth()]}${date.getDate()}日`;
  }

  function getCategoryIcon(category) {
    const icons = {
      '优势诊断': '🔑',
      '教练方法论': '🌟',
      '职业成长': '📈',
      '职场妈妈': '👩‍💼',
      '中层管理': '📊',
      '教练服务': '🗺️',
      '效率工具': '🗂️'
    };
    return icons[category] || '📄';
  }

  // ============================================
  // 事件绑定
  // ============================================

  function bindCardClicks() {
    document.querySelectorAll('.article-card[data-id]').forEach(card => {
      card.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        navigate(`/article/${id}`);
      });
    });
  }

  function updateNavActive(route) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    const routeData = parseRoute(route);
    if (routeData.page === 'home') {
      document.querySelector('[data-route="home"]')?.classList.add('active');
    } else if (routeData.page === 'tags' || routeData.page === 'tagDetail') {
      document.querySelector('[data-route="tags"]')?.classList.add('active');
    } else if (routeData.page === 'about') {
      document.querySelector('[data-route="about"]')?.classList.add('active');
    }
  }

  function closeMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    navMenu.classList.remove('open');
    navToggle.classList.remove('open');
  }

  // ============================================
  // 路由分发
  // ============================================

  function router() {
    const route = getRoute();
    const routeData = parseRoute(route);

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 关闭移动端菜单
    closeMobileMenu();

    // 更新导航高亮
    updateNavActive(route);

    // 分发渲染
    switch (routeData.page) {
      case 'home':
        renderHome();
        break;
      case 'article':
        renderArticleDetail(routeData.params.id);
        break;
      case 'tags':
        renderTagsPage(null);
        break;
      case 'tagDetail':
        renderTagsPage(routeData.params.tag);
        break;
      case 'category':
        renderCategoryPage(routeData.params.category);
        break;
      case 'about':
        renderAboutPage();
        break;
      default:
        renderHome();
    }
  }

  // ============================================
  // 初始化
  // ============================================

  function init() {
    // 路由监听
    window.addEventListener('hashchange', router);

    // 初始渲染
    router();

    // 导航栏滚动效果
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', function () {
      const scrollY = window.scrollY;

      if (scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      if (scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });

    // 回到顶部
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 移动端菜单
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('open');
      navToggle.classList.toggle('open');
    });

    // 点击导航链接关闭菜单
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  // DOM 就绪后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

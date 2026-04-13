(function() {
  'use strict';

  // 获取DOM元素
  const searchInput = document.getElementById('plugin-search');
  const clearButton = document.getElementById('clear-search');
  const statsDiv = document.getElementById('search-stats');
  const pluginItems = document.querySelectorAll('.plugin-item');
  const pluginCategories = document.querySelectorAll('.plugin-category');

  let currentSearchTerm = '';

  // 高亮文本的函数
  function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  // 移除高亮的函数
  function removeHighlights() {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    });
  }

  // 过滤和显示插件的函数
  function filterPlugins(searchTerm) {
    currentSearchTerm = searchTerm.toLowerCase().trim();
    let visibleCount = 0;
    let totalCount = pluginItems.length;

    // 移除之前的高亮
    removeHighlights();

    pluginItems.forEach(item => {
      const keywords = item.getAttribute('data-keywords') || '';
      const textContent = item.textContent.toLowerCase();
      const isVisible = !currentSearchTerm ||
        keywords.toLowerCase().includes(currentSearchTerm) ||
        textContent.includes(currentSearchTerm);

      item.style.display = isVisible ? '' : 'none';

      if (isVisible && currentSearchTerm) {
        visibleCount++;
        // 高亮匹配的文本
        highlightInElement(item, currentSearchTerm);
      } else if (isVisible) {
        visibleCount++;
      }
    });

    // 更新分类显示
    pluginCategories.forEach(category => {
      const visibleItems = category.querySelectorAll('.plugin-item:not([style*="display: none"])');
      category.style.display = visibleItems.length > 0 ? '' : 'none';
    });

    // 更新统计
    updateStats(visibleCount, totalCount);
  }

  // 在元素中高亮文本
  function highlightInElement(element, searchTerm) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];

    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.toLowerCase().includes(searchTerm)) {
        nodesToReplace.push(node);
      }
    }

    nodesToReplace.forEach(textNode => {
      const highlighted = highlightText(textNode.textContent, searchTerm);
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = highlighted;

      // 使用文档片段来替换所有子元素
      const fragment = document.createDocumentFragment();
      while (tempContainer.firstChild) {
        fragment.appendChild(tempContainer.firstChild);
      }
      textNode.parentNode.replaceChild(fragment, textNode);
    });
  }

  // 更新统计显示
  function updateStats(visible, total) {
    if (!statsDiv) return;

    if (currentSearchTerm) {
      statsDiv.textContent = `找到 ${visible} / ${total} 个插件`;
      statsDiv.style.display = 'block';
    } else {
      statsDiv.style.display = 'none';
    }
  }

  // 清空搜索
  function clearSearch() {
    searchInput.value = '';
    filterPlugins('');
    searchInput.focus();
  }

  // 事件监听
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterPlugins(e.target.value);
    });

    // 支持回车搜索
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', clearSearch);
  }

  // 初始化
  updateStats(pluginItems.length, pluginItems.length);

})();
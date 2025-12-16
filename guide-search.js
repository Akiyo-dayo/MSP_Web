// 插件搜索功能
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('plugin-search');
    const clearBtn = document.getElementById('clear-search');
    const searchStats = document.getElementById('search-stats');
    const pluginsContainer = document.getElementById('plugins-container');
    const allPluginItems = document.querySelectorAll('.plugin-item');
    const allCategories = document.querySelectorAll('.plugin-category');

    if (!searchInput) return;

    let searchTimeout;

    // 搜索函数
    function performSearch(query) {
        query = query.toLowerCase().trim();
        
        if (!query) {
            // 清空搜索，显示所有内容
            allPluginItems.forEach(item => {
                item.style.display = '';
                item.classList.remove('search-highlight');
            });
            allCategories.forEach(category => {
                category.style.display = '';
            });
            searchStats.textContent = '';
            clearBtn.style.display = 'none';
            return;
        }

        clearBtn.style.display = 'inline-block';

        let matchCount = 0;
        let visibleCategories = new Set();

        // 搜索所有插件项
        allPluginItems.forEach(item => {
            const pluginName = item.querySelector('h4')?.textContent.toLowerCase() || '';
            const pluginId = item.querySelector('.plugin-id')?.textContent.toLowerCase() || '';
            const keywords = item.getAttribute('data-keywords')?.toLowerCase() || '';
            const commands = Array.from(item.querySelectorAll('code')).map(code => code.textContent.toLowerCase()).join(' ');
            const description = Array.from(item.querySelectorAll('p')).map(p => p.textContent.toLowerCase()).join(' ');

            const searchContent = `${pluginName} ${pluginId} ${keywords} ${commands} ${description}`;

            if (searchContent.includes(query)) {
                item.style.display = '';
                item.classList.add('search-highlight');
                matchCount++;
                
                // 记录该插件所属的分类
                const category = item.closest('.plugin-category');
                if (category) {
                    visibleCategories.add(category);
                }
            } else {
                item.style.display = 'none';
                item.classList.remove('search-highlight');
            }
        });

        // 显示/隐藏分类
        allCategories.forEach(category => {
            if (visibleCategories.has(category)) {
                category.style.display = '';
            } else {
                category.style.display = 'none';
            }
        });

        // 更新统计信息
        if (matchCount > 0) {
            searchStats.textContent = `找到 ${matchCount} 个匹配的插件`;
            searchStats.style.color = '#a7d1ff';
        } else {
            searchStats.textContent = '没有找到匹配的插件';
            searchStats.style.color = '#ff6b6b';
        }
    }

    // 输入事件 - 使用防抖
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });

    // 清除按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            performSearch('');
            searchInput.focus();
        });
    }

    // 回车键搜索
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            performSearch(searchInput.value);
        }
    });

    // 清除输入框时的处理
    searchInput.addEventListener('search', () => {
        if (searchInput.value === '') {
            performSearch('');
        }
    });
});

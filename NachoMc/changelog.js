document.addEventListener('DOMContentLoaded', function() {
    // 立即显示所有项目
    document.querySelectorAll('.changelog-item').forEach(item => {
        item.classList.add('visible');
    });
    
    // 滚动时添加动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.changelog-item').forEach(item => {
        observer.observe(item);
    });
}); 
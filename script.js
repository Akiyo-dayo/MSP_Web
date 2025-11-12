document.addEventListener('DOMContentLoaded', () => {
    const modalOverlay = document.getElementById('announcement-modal');
    const closeModalButton = document.querySelector('.close-modal');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    // --- Mobile Navigation Logic ---
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
        });
    }

    if (navLinks) {
        navLinks.addEventListener('click', () => {
            document.body.classList.remove('nav-open');
        });
    }

    // --- Announcement Modal Logic ---
    const LATEST_ANNOUNCEMENT_ID = 'announcement_v1'; // Change this ID when the announcement is updated

    function showModal() {
        modalOverlay.style.display = 'flex';
        setTimeout(() => modalOverlay.classList.add('show'), 10);
    }

    function hideModal() {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 300); // Wait for transition to finish
    }

    function checkAnnouncement() {
        const hasSeenAnnouncement = localStorage.getItem(LATEST_ANNOUNCEMENT_ID);
        if (!hasSeenAnnouncement) {
            showModal();
            localStorage.setItem(LATEST_ANNOUNCEMENT_ID, 'true');
        }
    }

    // Event Listeners
    closeModalButton.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            hideModal();
        }
    });

    // Check on page load
    checkAnnouncement();

    // --- Join group CTA (open QQ invite) ---
    const joinCta = document.getElementById('join-cta');
    if (joinCta) {
        joinCta.addEventListener('click', (e) => {
            e.preventDefault();
            // Replace the URL below with your actual QQ group invite link (e.g. https://qm.qq.com/cgi-bin/qm/qr?k=YOUR_KEY)
            const qqInviteUrl = 'https://qm.qq.com/q/c5vmQFB7Ko';
            // Try opening in a new tab/window. On mobile, QQ may intercept and open the app if installed.
            window.open(qqInviteUrl, '_blank');
            // Optionally, you can also navigate directly: window.location.href = qqInviteUrl;
        });
    }
});

// ==========================================
// 前台共用模組 (shared_front.js)
// 負責：自動注入導航列 (Nav)、頁尾 (Footer)、全域功能
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. 自動注入頂部導航列 (Nav)
    const navHTML = `
        <nav>
            <div class="logo-area" onclick="window.location.href='index.html'">
                <img src="logo.png" alt="培癒試驗室" class="logo-img" id="site-logo">
            </div>
            <button class="hamburger-btn" onclick="toggleMenu()">☰</button>
            <div class="nav-links" id="nav-menu">
                <button onclick="window.location.href='index.html'" id="nav-home">首頁</button>
                <button onclick="window.location.href='booking.html'" id="nav-booking">服務預約</button>
                <button onclick="window.location.href='kb.html'" id="nav-knowledge">培癒寶典</button>
                <button onclick="window.location.href='draw.html'" id="nav-draw">能量抽卡</button>
                <button onclick="window.location.href='member.html'" id="nav-member">會員專區</button>
            </div>
        </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // 2. 自動注入底部頁尾 (Footer)
    const footerHTML = `
        <div class="footer-banner">
            <div class="footer-content">
                <div class="social-group">
                    <a href="https://line.me/R/ti/p/@927ctmwa" target="_blank" class="social-btn"><i class="fa-brands fa-line" style="font-size: 1.2rem;"></i> LINE</a>
                    <a href="https://instagram.com/nomad91310" target="_blank" class="social-btn"><i class="fa-brands fa-instagram" style="font-size: 1.2rem;"></i> IG</a>
                    <a href="https://www.threads.net/@nomad91310" target="_blank" class="social-btn"><i class="fa-brands fa-threads" style="font-size: 1.1rem;"></i> Threads</a>
                </div>
                <div class="copyright">&copy; 2026 培癒試驗室</div>
            </div>
        </div>
        <button id="back-to-top" onclick="window.scrollTo({top: 0, behavior: 'smooth'})"><i class="fa-solid fa-arrow-up"></i></button>
    `;
    document.body.insertAdjacentHTML('beforeend', footerHTML);

    // 3. 標示目前所在的頁面 (高亮選單)
    const currentPath = window.location.pathname;
    if (currentPath.includes('booking')) document.getElementById('nav-booking').classList.add('active');
    else if (currentPath.includes('kb')) document.getElementById('nav-knowledge').classList.add('active');
    else if (currentPath.includes('draw')) document.getElementById('nav-draw').classList.add('active');
    else if (currentPath.includes('member')) document.getElementById('nav-member').classList.add('active');
    else document.getElementById('nav-home').classList.add('active');

    // 4. 讀取 Logo 圖片 (如果有從資料庫設定的話)
    loadSiteAssets();
});

// 手機版選單開關
window.toggleMenu = function() {
    document.getElementById('nav-menu').classList.toggle('active');
}

// 捲動顯示回到頂部按鈕
window.onscroll = function() {
    const topBtn = document.getElementById('back-to-top');
    if (topBtn) {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) topBtn.classList.add('show');
        else topBtn.classList.remove('show');
    }
};

// 讀取全域圖片資源
async function loadSiteAssets() { 
    if(typeof myDB === 'undefined') return;
    const { data } = await myDB.from('site_content').select('*').eq('category', 'site_asset'); 
    if (data) { 
        data.forEach(item => { 
            if (item.title === 'logo') {
                const el = document.getElementById('site-logo');
                if(el && el.src !== item.image_url) el.src = item.image_url;
            }
            if (item.title === 'logohuman') {
                const el = document.getElementById('site-hero');
                if(el && el.src !== item.image_url) el.src = item.image_url;
            }
        }); 
    } 
}
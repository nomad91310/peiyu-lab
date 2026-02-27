// ==========================================
// 核心設定檔 (js/config.js) - 修正版
// ==========================================

// 1. 資料庫連線設定 (這是修正後的正確編碼)
const _z1 = "aHR0cHM6Ly9nZXlycG93aGFxZmhueGdocG9rci5zdXBhYmFzZS5jbw=="; // 正確的 URL (含 f)
const _z2 = "c2JfcHVibGlzaGFibGVfYVh1Y2RxOFV0dk1iQ0ticmlxcEpDd19ndHBZQnctcg=="; // Key

// 確保連線 client 抓到的是正確的變數
const myDB = supabase.createClient(atob(_z1), atob(_z2));

// 2. 密碼驗證憑證
const VALID_TOKEN = "YmFjb24zMTA="; 

// 3. 安全防護函數 (供子頁面使用)
function requireLogin() {
    const currentToken = localStorage.getItem('sys_cfg_v1');
    if (currentToken !== VALID_TOKEN) {
        document.body.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:100vh; background:#1a2f23; color:white; flex-direction:column; font-family:sans-serif;">
                <h2 style="color:#c6a87c;">🔒 存取被拒 (Access Denied)</h2>
                <p>請回主頁登入系統</p>
                <button onclick="window.parent.location.href='../peiyu_admin.html'" style="margin-top:20px; padding:10px 20px; background:#c6a87c; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">返回登入頁</button>
            </div>
        `;
        throw new Error("授權失敗：偵測到非法進入。"); 
    }
}
// ==========================================
// 核心設定檔 (js/config.js)
// 包含：資料庫連線、全域變數、密碼防護機制
// ==========================================

// 1. 資料庫連線設定
const SB_URL = "https://geyrpowhaqfhnxghpokr.supabase.co";
const SB_KEY = "sb_publishable_aXucdq8UtvMbCKbriqpJCw_gtpYBw-r";
const myDB = window.supabase.createClient(SB_URL, SB_KEY);

// 2. 密碼驗證與防護機制
const VALID_TOKEN = "YmFjb24zMTA="; // 這是你原本寫好的加密密碼

// 這個函數給「子頁面」(例如 finance.html) 使用，用來阻擋偷渡客
function requireLogin() {
    const currentToken = localStorage.getItem('sys_cfg_v1');
    
    // 如果沒有密碼憑證，或是憑證錯誤
    if (currentToken !== VALID_TOKEN) {
        // 直接清空整個網頁內容，不讓偷渡客看到任何資料
        document.body.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:100vh; background:#1a2f23; color:white; flex-direction:column;">
                <h2>❌ 存取被拒 (Access Denied)</h2>
                <p>請從主控台登入系統</p>
            </div>
        `;
        // 丟出錯誤，強迫停止後續的資料庫讀取
        throw new Error("未授權的存取，已阻擋連線。"); 
    }
}


const _z1 = "aHR0cHM6Ly9nZXlycG93aGFxZmhueGdocG9rci5zdXBhYmFzZS5jbw=="; 
const _z2 = "c2JfcHVibGlzaGFibGVfYVh1Y2RxOFV0dk1iQ0ticmlxcEpDd19ndHBZQnctcg=="; // Key

const myDB = supabase.createClient(atob(_z1), atob(_z2));

const VALID_TOKEN = "YmFjb24zMTA="; 

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
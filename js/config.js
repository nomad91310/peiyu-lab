const _z1 = "aHR0cHM6Ly9nZXlycG93aGFxZmhueGdocG9rci5zdXBhYmFzZS5jbw=="; 
const _z2 = "c2JfcHVibGlzaGFibGVfYVh1Y2RxOFV0dk1iQ0ticmlxcEpDd19ndHBZQnctcg=="; 
const myDB = supabase.createClient(atob(_z1), atob(_z2));

const VALID_TOKEN = "YmFjb24zMTA="; 

function requireLogin() {
    const currentToken = localStorage.getItem('sys_cfg_v1');
    if (currentToken !== VALID_TOKEN) {
        
        const curtain = document.getElementById('security-curtain');
        if (curtain) curtain.remove();

        document.body.style.background = "#ffffff";
        document.body.innerHTML = `
            <div style="text-align: center; margin-top: 10vh; font-family: -apple-system, sans-serif; color: #333;">
                <h1 style="font-size: 50px; margin-bottom: 10px;">404</h1>
                <p style="font-size: 20px; color: #666;">Page Not Found</p>
            </div>
        `;

        window.location.replace('../index.html'); 
        throw new Error("Stop"); 
    }
}
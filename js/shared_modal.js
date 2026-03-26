// ============================================================================
// 培癒試驗室 - 共用訂單詳情與會員彈窗模組 (終極動態注入版)
// 說明：此模組會自動將 HTML 與 CSS 骨架注入到網頁中，主檔案完全不留痕跡！防爬蟲！
// ============================================================================

// 🌟 1. 自動注入 HTML 骨架與 CSS 樣式
document.addEventListener("DOMContentLoaded", () => {
    // 注入專屬 CSS 隱身斗篷
    if (!document.getElementById('shared-modal-style')) {
        const style = document.createElement('style');
        style.id = 'shared-modal-style';
        style.innerHTML = `
            .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; justify-content: center; align-items: center; backdrop-filter: blur(3px); }
            .modal-body { background: white; width: 90%; max-width: 800px; padding: 30px; border-radius: 15px; position: relative; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
            .close-btn { position: absolute; right: 20px; top: 15px; cursor: pointer; font-size: 24px; color: #999; transition: 0.2s; }
            .close-btn:hover { color: #333; }
        `;
        document.head.appendChild(style);
    }

    // 注入實體 HTML 骨架
    if (!document.getElementById('modal')) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'modal';
        modalDiv.className = 'modal';
        modalDiv.innerHTML = `
            <div class="modal-body">
                <span onclick="closeModal()" class="close-btn" title="關閉">×</span>
                <h2 id="m-title" style="border-bottom:1px solid #eee; padding-bottom:10px; color:var(--forest); margin-top:0;">詳情</h2>
                <div id="m-content"></div>
            </div>
        `;
        document.body.appendChild(modalDiv);
    }
});

// 🌟 2. 關閉彈窗功能
function closeModal() { 
    const m = document.getElementById('modal');
    if(m) m.style.display = 'none'; 
}

// 🌟 3. 會員與訂單邏輯 (原封不動)
function openCreateMemberModal(phone, bookingId, name, email) {
    const defaultPwd = phone && phone.length >= 4 ? 'guest' + phone.slice(-4) : 'guest1234';
    const initName = (name && name !== 'undefined') ? name : '';
    const initEmail = (email && email !== 'undefined') ? email : '';
    
    document.getElementById('m-title').innerText = "👤 建立新會員";
    document.getElementById('m-content').innerHTML = `
        <div style="padding: 10px;">
            <div style="margin-bottom: 15px;">
                <label style="font-weight: bold; color: var(--forest); display: block;">姓名 *</label>
                <input type="text" id="new-name" value="${initName}" placeholder="請輸入客戶姓名" style="margin-top: 5px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="font-weight: bold; color: var(--forest); display: block;">手機 * (帳號)</label>
                <input type="text" id="new-phone" value="${phone || ''}" style="margin-top: 5px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="font-weight: bold; color: #666; display: block;">Email (選填)</label>
                <input type="text" id="new-email" value="${initEmail}" placeholder="example@mail.com" style="margin-top: 5px;">
            </div>
            <div style="margin-bottom: 25px;">
                <label style="font-weight: bold; color: #666; display: block;">預設密碼</label>
                <input type="text" id="new-pwd" value="${defaultPwd}" style="margin-top: 5px; background: #eee;" readonly>
                <small style="color: #999; display: block; margin-top: 4px;">預設為 guest + 手機末 4 碼</small>
            </div>
            <div style="text-align: right; border-top: 1px solid #eee; padding-top: 20px;">
                <button class="btn btn-forest" onclick="saveNewMember('${bookingId}')" style="width: 100%; padding: 12px; font-size: 1.1rem;">
                    確認建立並歸戶
                </button>
            </div>
        </div>
    `;
    document.getElementById('modal').style.display = 'flex';
}

async function saveNewMember(bookingId) {
    const n = document.getElementById('new-name').value.trim();
    const p = document.getElementById('new-phone').value.trim();
    const e = document.getElementById('new-email').value.trim();
    const pwd = document.getElementById('new-pwd').value.trim();
    if (!n || !p) return alert("❌ 姓名與手機為必填欄位");

    let targetUserId = null; let isNew = false;
    const { data, error } = await myDB.from('profiles').insert([{ full_name: n, phone: p, email: e, password: pwd, role: 'member' }]).select().single();
    
    if (error) { 
        if (error.code === '23505') { 
            const { data: existUser } = await myDB.from('profiles').select('id').eq('phone', p).single(); 
            if (existUser) targetUserId = existUser.id; 
            else return alert("❌ 找不到該會員資料"); 
        } else return alert("❌ 系統錯誤: " + error.message); 
    } else { 
        targetUserId = data.id; isNew = true; 
    }

    if (targetUserId) {
        const { data: updatedBks, error: linkErr } = await myDB.from('bookings').update({ user_id: targetUserId }).eq('temp_phone', p).is('user_id', null).select();
        let msg = isNew ? `✅ 會員 ${n} 建立成功！` : `✅ 偵測到會員已存在，執行自動歸戶！`;
        if (!linkErr && updatedBks && updatedBks.length > 0) msg += `\n🔗 已將 ${updatedBks.length} 筆訂單歸戶成功！`;
        alert(msg); closeModal(); fetchAll();
    }
}

function openBooking(id) {
    const b = cache.bks.find(x => x.id === id); 
    if(!b) return alert("找不到訂單");
    
    const rawDetail = b.wish_detail || '';
    const urlMatch = rawDetail.match(/(https?:\/\/[^\s|]+)/);
    const screenshotBtn = urlMatch ? `<a href="${urlMatch[0]}" target="_blank" class="btn btn-outline" style="color:#3498db; border-color:#3498db;">🖼️ 查看截圖證據</a>` : `<span style="color:#999; font-size:12px;">(無截圖)</span>`;
    let displayData = rawDetail.replace(/(https?:\/\/[^\s|]+)/g, '').replace(/截圖[:：]\s*/g, '').replace(/\|? ?姓名:.*? \|/g, '').replace(/\|? ?Email:.*? \|/g, '').replace(/\|? ?數據: ?/g, '').replace(/\| \[QR已傳.*?\]/g, '').trim();
    
    let extractName = "未知", extractEmail = "未知";
    const nm = rawDetail.match(/姓名:(.*?) \|/); const em = rawDetail.match(/Email:(.*?) \|/);
    if(nm) extractName = nm[1].trim(); if(em) extractEmail = em[1].trim();

    let serviceHtml = `<div style="font-size:1.1rem; font-weight:bold; color:#2c3e50;">📂 ${b.service_item || '未知大類'}</div>`;
    if (b.main_service) serviceHtml += `<div style="color:#d35400; font-weight:bold; font-size:1.2rem; margin-top:5px; padding-left:5px;">🔥 ${b.main_service}</div>`;
    if (b.service_detail) serviceHtml += `<div style="color:#666; font-size:0.95rem; margin-top:8px; padding-left:15px; border-left:3px solid #eee;">${b.service_detail.split('|').map(s => `<div style="margin-top:3px;">➕ ${s.trim()}</div>`).join('')}</div>`;
    
    // 🔥 動態判定報表模板邏輯開始
    const mainService = (cache.svcs || []).find(s => s.is_main && (b.main_service === s.title || (b.service_detail||'').includes(s.title)));
    
    let btnLabel = "📄 生成服務報告", btnClass = "btn-forest";
    let templateName = (mainService && mainService.report_template) ? mainService.report_template : "srt_report.html";
    let reportTemplatePath = `report/${templateName}`;

    // 檢查訂單中是否已經有生成過報告的紀錄
    const reportMatch = rawDetail.match(/\[報告已生成 ID:(.*?)\]/);
    const existingReportId = reportMatch ? reportMatch[1] : null;
    
    // 🔥 關鍵修復：從後台抓取通行證，直接當作參數送過去
    const adminToken = localStorage.getItem('sys_cfg_v1') || 'YmFjb24zMTA=';

    // 組合最終的開啟網址 (夾帶 token)
    let reportUrl = existingReportId 
        ? `${reportTemplatePath}?id=${existingReportId}&token=${adminToken}` 
        : `${reportTemplatePath}?bid=${b.id}&name=${encodeURIComponent(extractName)}&phone=${b.temp_phone}&email=${encodeURIComponent(extractEmail)}&token=${adminToken}`;        
    
    if(existingReportId) { 
        btnLabel = "📄 查看/修改報告"; 
        btnClass = "btn-purple"; 
    }
    // 🔥 動態判定報表模板邏輯結束

    let scheduleBox = '';
    if(b.scheduled_at) { 
        scheduleBox = `<div style="background:#f0f8ff; padding:12px; border-left:4px solid #3498db; border-radius:4px; margin-top:15px;"><div style="display:flex; justify-content:space-between; align-items:center;"><strong style="color:#2980b9;">📅 已鎖定服務排程</strong><button class="btn btn-outline" style="font-size:12px; background:white;" onclick="document.getElementById('reschedule-area').style.display='block'; this.style.display='none';">✏️ 修改</button></div><div style="font-size:1.2rem; color:#2c3e50; margin-top:5px; font-weight:bold;">${new Date(b.scheduled_at).toLocaleString()}</div><div id="reschedule-area" style="display:none; margin-top:10px;"><div style="display:flex; gap:10px;"><input type="date" id="book-date" onchange="loadSlotsForBooking(this.value)"><select id="book-slot"><option>先選日期</option></select></div><button class="btn btn-purple" style="width:100%; margin-top:5px;" onclick="confirmSchedule('${b.id}')">確認變更</button></div></div>`; 
    } else if(b.status === 'paid' || b.status === 'awaiting_service') { 
        scheduleBox = `<div style="background:#fff3e0; padding:12px; border-left:4px solid #f39c12; border-radius:4px; margin-top:15px;"><strong style="color:#e67e22;">⏳ 等待排程</strong><div style="display:flex; gap:10px; margin-top:5px;"><input type="date" id="book-date" onchange="loadSlotsForBooking(this.value)"><select id="book-slot"><option>先選日期</option></select></div><button class="btn btn-purple" style="width:100%; margin-top:5px;" onclick="confirmSchedule('${b.id}')">確認鎖定時段</button></div>`; 
    }

    const reportArea = (b.status === 'awaiting_service' || b.status === 'completed') ? `<div style="margin-top:20px; padding-top:10px; border-top:1px dashed #eee;"><a href="${reportUrl}" target="_blank" rel="opener" class="btn ${btnClass}" style="display:block; width:100%; text-align:center;">${btnLabel}</a></div>` : '';
    const couponBadge = b.coupon_info ? `<div style="display:inline-block; background:#fce4ec; color:#c2185b; font-size:12px; padding:2px 8px; border-radius:10px; margin-top:5px;">🎟️ ${b.coupon_info}</div>` : '';

    document.getElementById('m-title').innerHTML = `訂單詳情 <span style="font-size:12px; color:#999;">${b.booking_id}</span>`;
    document.getElementById('m-content').innerHTML = `
        <div style="display:flex; gap:15px; align-items:center; margin-bottom:15px;">
            <div style="width:50px; height:50px; background:var(--forest); color:white; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:20px; font-weight:bold;">
                ${extractName[0]}
            </div>
            <div>
                <div style="font-weight:bold; font-size:1.1rem;">${extractName}</div>
                <div style="color:#666;">${b.temp_phone}</div>
                <div style="color:#888; font-size:0.8rem;">${extractEmail}</div>
            </div>
        </div>

        <div style="background:#fafafa; padding:15px; border-radius:8px; border:1px solid #eee;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex:1;">${serviceHtml}</div>
                <b style="color:#d35400; font-size:1.2rem; white-space:nowrap;">$${b.price}</b>
            </div>
            ${couponBadge}
        </div>

        <div style="margin-top:15px; padding:10px; background:white; border:1px solid #eee; border-radius:4px;">
            <label style="color:#999; font-size:12px;">數據與備註</label>
            <div class="force-wrap" style="margin-top:5px; line-height:1.5; font-size:14px;">${displayData || '無'}</div>
            <div style="margin-top:5px; font-weight:bold; color:#e67e22;">
                許願時間：${b.sleep_time || '無'}
            </div>
            <div style="margin-top:10px; padding-top:5px; border-top:1px dashed #eee;">
                ${screenshotBtn}
            </div>
        </div>

        ${b.case_story ? `
            <div style="margin-top:15px; padding:12px; background:#fdfaf5; border:1px solid #fae1c3; border-radius:8px;">
                <label style="color:#1a2f23; font-weight:bold; font-size:13px;">📖 客人說的故事：</label>
                <div class="force-wrap" style="margin-top:5px; line-height:1.6; color:#444; font-size:14px;">${b.case_story}</div>
            </div>` : ''
        }

        ${scheduleBox}
        ${reportArea}
        <div style="margin-top:20px; text-align:right;">
            ${renderActionButtons(b)}
        </div>
    `;
    
    document.getElementById('modal').style.display = 'flex';
    document.querySelector('.modal-body').scrollTop = 0;
}

function loadSlotsForBooking(date) { 
    const slots = cache.slots.filter(s => s.slot_date === date && !s.is_booked); 
    const sel = document.getElementById('book-slot'); 
    sel.innerHTML = slots.length ? slots.map(s => `<option value="${s.id}" data-t="${s.slot_date} ${s.slot_time}">${s.slot_time.slice(0,5)}</option>`).join('') : '<option>無空檔</option>'; 
}

async function confirmSchedule(bid) { 
    const sel = document.getElementById('book-slot'); 
    if(!sel.value || sel.value.includes("先選")) return alert("請選擇時段"); 
    const t = sel.options[sel.selectedIndex].dataset.t; 
    await myDB.from('bookings').update({scheduled_at: t, status: 'awaiting_service'}).eq('id', bid); 
    await myDB.from('schedule_slots').update({is_booked: true}).eq('id', sel.value); 
    alert("✅ 排程成功"); closeModal(); fetchAll(); 
}

async function deleteBooking(id) { 
    if(confirm("確定刪除？")) { await myDB.from('bookings').delete().eq('id',id); fetchAll(); } 
}

async function sendPayLink(id) { 
    if(confirm("確定發送？")) { 
        const t = new Date().toLocaleString(); const b = cache.bks.find(x => x.id === id); 
        await myDB.from('bookings').update({ status: 'awaiting_payment', wish_detail: `${b.wish_detail} | [QR已傳: ${t}]` }).eq('id', id); 
        await fetchAll(); openBooking(id); alert("✅ 付款碼狀態已更新"); 
    } 
}

function renderActionButtons(b) { 
    if (b.status === 'paid') return `<button class="btn" style="background:#ccc;">待排程</button>`; 
    if (b.status === 'awaiting_service') return `<button class="btn btn-forest" onclick="updateS('${b.id}','completed')">✅ 結案</button>`; 
    if (b.status === 'completed') return `<button class="btn" style="background:#ccc;">已結案</button>`; 
    if (b.status === 'pending') return `<button class="btn btn-info" onclick="sendPayLink('${b.id}')">📧 傳付款碼</button>`; 
    if (b.status === 'awaiting_payment' || b.payment_method === 'shopee' || b.ota_order_id) return `<button class="btn btn-success" onclick="updateS('${b.id}','paid')">💰 確認入帳</button>`; 
    return ""; 
}

window.updateS = async function(id, status) { 
    const b = cache.bks.find(x => x.id === id); 
    if (status === 'completed') { 
        const hasReport = b.wish_detail && b.wish_detail.includes('[報告已生成'); 
        if (!hasReport) return alert("⚠️ 無法結案！請先生成服務報告並存檔。"); 
    } 
    if (confirm("確定要更新狀態嗎？")) { 
        await myDB.from('bookings').update({ status: status }).eq('id', id); 
        await fetchAll(); openBooking(id); 
    } 
}
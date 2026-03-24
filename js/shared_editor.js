// ============================================================================
// 培癒試驗室 - 全域共用富文本編輯器 (補齊所有漏搬的手機版函數，絕對有反應版)
// ============================================================================

let currentBucket = 'site-assets';
let spacingCfg = { lh: 1.6, pmb: 0.5, lmtb: 0.5, limb: 0.3 };
let history = ['<p>請在此開始撰寫...</p>']; 
let historyIndex = 0; 
let typingTimeout;
let savedRange = null;
let currentTarget = null; 
let currentTargetCell = null; 
window.saveSelection = function() {}; // 🔥 補上空函數防呆，拯救魔法積木！ 
let pendingTargetType = null;
let lastValidRange = null;
let editor, floatMenu, editBadge; 

const UnivEditor = {
    targetInputId: null,
    
    init: function() {
        if (document.getElementById('peiyu-universal-editor-wrapper')) return;

        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link'); fa.rel = 'stylesheet';
            fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
            document.head.appendChild(fa);
        }

        const style = document.createElement('style');
        style.innerHTML = `
            #peiyu-universal-editor-overlay { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 99990; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
            #peiyu-universal-editor-wrapper { width: 95vw; max-width: 700px; height: 90vh; background: #f4f7f6; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: ueFadeIn 0.3s ease; }
            @keyframes ueFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            
            .ue-top-bar { background: var(--forest, #1a2f23); color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
            .ue-top-bar h3 { margin: 0; font-size: 1.2rem; }
            .ue-top-bar button { padding: 8px 20px; border-radius: 50px; border: none; font-weight: bold; cursor: pointer; margin-left: 10px; }
            .ue-btn-cancel { background: rgba(255,255,255,0.2); color: white; }
            .ue-btn-save { background: var(--accent, #c6a87c); color: #1a2f23; }

            .editor-wrapper { flex: 1; background: white; display: flex; flex-direction: column; overflow: hidden; position: relative; min-height: 500px; }
            .toolbar { padding: 10px 15px; background: #f8f9fa; border-bottom: 1px solid #ddd; display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
            .tb-group { display: flex; gap: 2px; padding-right: 8px; margin-right: 8px; border-right: 1px solid #ddd; align-items: center; }
            .tb-group:last-child { border-right: none; }
            .editor-btn { padding: 6px 10px; border: 1px solid transparent; background: transparent; cursor: pointer; border-radius: 4px; color: #444; font-size: 14px; transition: 0.2s; display:flex; align-items:center; justify-content:center; white-space: nowrap; }
            .editor-btn:hover { background: #e2e6ea; }
            .color-split-btn { display: flex; align-items: center; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; height: 30px; background: white; }
            .color-split-btn .btn-action { flex: 1; height: 100%; background: transparent; border: none; padding: 0 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; transition: 0.2s; color: #333; }
            .color-split-btn .btn-action:hover { background: #e2e6ea; }
            .color-split-btn .btn-picker-native { position: relative; width: 20px; height: 100%; border-left: 1px solid #eee; background: #f8f9fa; cursor: pointer; }
            .color-split-btn .btn-picker-native:hover { background: #e2e6ea; }
            .color-split-btn .btn-picker-native input[type="color"] { width: 100%; height: 100%; padding: 0; border: none; cursor: pointer; opacity: 0; position: absolute; top:0; left:0; z-index: 2; }
            .color-split-btn .btn-picker-native i { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 11px; color: #666; pointer-events: none; z-index: 1; }
            .memorized-border { position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; pointer-events: none; z-index: 1; }
            .editor-btn.active { background: var(--forest, #1a2f23) !important; color: white !important; border-color: var(--forest, #1a2f23) !important; }
            .editor-btn.active i { color: white !important; }
            .btn-magic { font-weight: bold; font-size: 12px; background: white; border: 1px solid #ccc; color: var(--forest, #1a2f23); }
            .btn-magic:hover { border-color: var(--accent, #c6a87c); background: #fffcf5; }
            #editor { flex: 1; padding: 40px 50px; overflow-y: auto; outline: none; color: #2c3e50; font-size: 16px; }
            #editor:empty:before { content: '請在此輸入內容... (💡 提示：雙擊圖片或表格可開啟設定選單)'; color: #ccc; }
            .source-view { flex: 1; width: 100%; box-sizing: border-box; background: #2d2d2d; color: #e6e6e6; padding: 20px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; border: none; resize: none; display: none; outline: none; overflow-y: auto; }
            select.tb-select { padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: white; cursor: pointer; height: 30px; }
            
            .obj-selected-table { outline: 3px solid #3498db !important; outline-offset: -2px; }
            .obj-selected-image { outline: 3px solid #27ae60 !important; outline-offset: -2px; }
            .obj-selected-block { outline: 3px solid #e74c3c !important; outline-offset: -2px; }
            
            #edit-badge { display: none; position: fixed; z-index: 19999; gap: 5px; }
            .badge-icon { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; color: white; box-shadow: 0 3px 10px rgba(0,0,0,0.3); border: 1px solid #fff; transition: 0.2s; }
            .badge-icon:hover { transform: scale(1.1); }
            .badge-black { background: #333; } .badge-black:hover { background: #000; }
            .badge-green { background: #27ae60; } .badge-green:hover { background: #2ecc71; }
            .badge-red { background: #e74c3c; } .badge-red:hover { background: #c0392b; }
            .badge-blue { background: #3498db; } .badge-blue:hover { background: #2980b9; }
            
            #float-menu { position: fixed !important; display: none; background: #fff; border: 1px solid #c6a87c; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; z-index: 99999 !important; gap: 8px; align-items: center; flex-wrap: wrap; max-width: 400px; }
            
            .peiyu-tabs-wrapper { width: 100% !important; border-top: 4px dashed #c6a87c !important; border-bottom: 4px dashed #c6a87c !important; background: #fffdf9; margin: 50px 0; padding: 45px 0 20px 0; position: relative; clear: both; }
            .peiyu-tabs-wrapper::before { content: "📑 內文頁籤群組 (點擊黃底虛線外框開啟選單)"; position: absolute; top: 0; left: 0; right: 0; background: #c6a87c; color: #fff; padding: 6px 20px; font-weight: bold; font-size: 13px; z-index: 5; pointer-events: none; }
            .peiyu-tab-section { width: 100% !important; padding: 0; margin: 30px 0; border-bottom: 1px dashed #eee; padding-bottom: 20px; }
            .peiyu-tab-label-row { background: #f0f4f8; padding: 6px 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; border-left: 5px solid #2980b9; }
            .peiyu-tab-label-row::before { content: "📍 頁籤名稱："; font-size: 13px; font-weight: bold; color: #2980b9; }
            .peiyu-tab-body { width: 100% !important; background: #fff; padding: 15px 0 !important; min-height: 50px; clear: both; }
            
            .peiyu-table, table { border-collapse: collapse; width: 100%; max-width: 100% !important; box-sizing: border-box !important; table-layout: fixed !important; }
            .peiyu-table th, .peiyu-table td { padding: 8px 12px; min-width: 50px; border: 1px solid #ddd; vertical-align: middle; max-width: 100% !important; box-sizing: border-box !important; word-wrap: break-word !important; overflow-wrap: break-word !important; }
            .peiyu-table td div { margin: 4px 0 !important; }
            .peiyu-table td p { margin-bottom: 4px !important; }
            .resizable-wrapper { position: relative; display: block; margin: 10px 0; max-width: 100% !important; clear: both; box-sizing: border-box !important; }
            .resizable-wrapper img, img { display: block; max-width: 100% !important; border-radius: 8px; width: 100%; height: auto !important; box-sizing: border-box !important; }
            
            .editor-modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 99999; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
            .editor-modal-box { background: white; padding: 25px; border-radius: 12px; width: 450px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
            .editor-gallery-box { width: 90%; max-width: 850px; height: 80vh; display: flex; flex-direction: column; padding: 0; overflow: hidden; }
            .editor-gallery-header { padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
            .editor-gallery-grid { flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); grid-auto-rows: 120px; gap: 15px; padding: 20px; background: #fdfdfd; align-content: start; }
            .editor-gallery-item { position: relative; border: 2px solid #ddd; border-radius: 8px; overflow: hidden; cursor: pointer; transition: 0.2s; background: #fff; display: flex; align-items: center; justify-content: center; }
            .editor-gallery-item:hover { border-color: #3498db; transform: scale(1.05); box-shadow: 0 5px 15px rgba(0,0,0,0.1); z-index: 10; }
            .editor-gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .gallery-item-name { position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(0, 0, 0, 0.65); color: #fff; font-size: 11px; padding: 5px 8px; box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
            .editor-form-group { margin-bottom: 15px; }
            .editor-form-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
            .editor-form-group label { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 5px; color: #555; }
            .editor-sp-slider { width: 100%; cursor: pointer; margin-top: 5px; }
            .editor-sp-val { color: var(--forest, #1a2f23); font-family: monospace; font-size: 14px; }
            
            #custom-context-menu { position: fixed; display: none; background: white; border: 1px solid #ccc; box-shadow: 0 5px 20px rgba(0,0,0,0.15); border-radius: 8px; z-index: 99999; padding: 5px 0; min-width: 200px; font-size: 14px; color: #333; overflow: hidden; }
            .context-menu-item { padding: 10px 15px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: 0.2s; }
            .context-menu-item:hover { background: #f4f7f6; color: var(--forest, #1a2f23); font-weight: bold; }
            .context-shortcut { color: #aaa; font-size: 11px; font-family: monospace; font-weight: normal; }

            .peiyu-link-text { color: #3498db; text-decoration: underline; cursor: pointer; display: inline-block; padding: 0 2px; }
            .peiyu-link-text:hover { color: #2980b9; }
            .peiyu-link-btn { display: inline-block; padding: 8px 20px; background: var(--forest, #1a2f23); color: #fff !important; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: 0.2s; cursor: pointer; }
            .peiyu-link-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.2); background: #111f17; }
            .obj-selected-link { outline: 3px solid #9b59b6 !important; outline-offset: 2px; border-radius: 4px; }
            .badge-purple { background: #9b59b6; } .badge-purple:hover { background: #8e44ad; }

            #editor .peiyu-rwd-br { display: inline; cursor: pointer; user-select: all; }
            #editor .peiyu-rwd-br::before { content: "｜"; display: inline-block; padding: 0 1px; background: #e3f2fd; color: #2980b9; border: 1px solid #3498db; border-radius: 2px; font-size: 10px; margin: 0 1px; vertical-align: middle; line-height: 1; }
            @media (max-width: 768px) and (orientation: portrait) { #editor .peiyu-rwd-br::after { content: '\\A'; white-space: pre; } }

            @media (max-width: 1024px) {
                #peiyu-universal-editor-wrapper { width: 100vw; height: 100vh; border-radius: 0; margin: 0; }
                .editor-wrapper { height: auto !important; overflow-x: hidden !important; min-height: 600px; max-width: 100% !important; }
                #editor { height: auto !important; min-height: 500px; padding: 15px !important; overflow-x: hidden !important; }
                
                .editor-sticky-header { 
                    position: fixed !important; top: 150px !important; right: 60px !important; z-index: 99995; 
                    background: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(10px); 
                    width: 140px !important; max-height: 75vh !important; box-shadow: 0 5px 25px rgba(0,0,0,0.2) !important; 
                    border-radius: 12px !important; border: 1px solid #eee; 
                    transform: translateX(200%) !important; opacity: 0; 
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s !important;
                    display: flex !important; flex-direction: column !important; overflow-y: auto !important; padding: 12px 10px !important; 
                }
                .editor-sticky-header.show-drawer { transform: translateX(0) !important; opacity: 1 !important; }
                .editor-sticky-header::-webkit-scrollbar { display: none; }
                .editor-sticky-header .toolbar { display: flex !important; flex-direction: column !important; width: 100% !important; padding: 0 !important; border: none !important; background: transparent !important; gap: 12px !important; }
                .tb-group { display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; justify-content: center !important; width: 100% !important; padding: 0 0 12px 0 !important; margin: 0 !important; border-right: none !important; border-bottom: 1px dashed #ddd !important; gap: 6px !important; }
                .tb-group:last-child { border-bottom: none !important; padding-bottom: 0 !important; }
                .tb-group b { display: none !important; }
                .editor-sticky-header .editor-btn { width: 32px !important; height: 32px !important; padding: 0 !important; display: flex !important; justify-content: center !important; align-items: center !important; border-radius: 6px !important; flex-shrink: 0; }
                .editor-sticky-header .btn-magic, .editor-sticky-header .editor-btn[onclick="toggleSource()"], .editor-sticky-header .editor-btn[onclick="openModal('spacing')"] { width: 100% !important; height: 36px !important; padding: 0 10px !important; margin: 0 !important; white-space: nowrap !important; font-size: 13px !important; justify-content: center !important; border-radius: 8px !important; }
                select.tb-select { width: 100% !important; height: 34px !important; font-size: 12px !important; padding: 0 5px !important; margin: 0 !important; }
                .color-picker-wrapper { margin: 0 !important; }
                
                .editor-gallery-box { width: 95% !important; height: 90vh !important; }
                .editor-gallery-header { flex-direction: column !important; align-items: stretch !important; gap: 15px !important; padding: 20px 15px !important; }
                .editor-gallery-header > div:first-child { display: flex !important; justify-content: space-between !important; width: 100% !important; margin-bottom: 5px; }
                .editor-gallery-header > div:last-child { display: flex !important; flex-direction: column !important; width: 100% !important; gap: 10px !important; }
                #custom-img-name { width: 100% !important; box-sizing: border-box; height: 40px; }
                .editor-gallery-header > div:last-child .editor-btn { width: 100% !important; height: 40px; font-size: 15px !important; display: flex; justify-content: center; }
                .editor-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; grid-auto-rows: 150px !important; gap: 10px !important; padding: 10px !important; }
                
                .editor-modal-box { width: 95% !important; padding: 15px !important; max-height: 85vh !important; overflow-y: auto !important; z-index: 99999 !important; }
                #general-modal-box > div:last-child { flex-direction: column-reverse !important; gap: 10px !important; }
                #general-modal-box > div:last-child .editor-btn { width: 100% !important; height: 45px !important; font-size: 16px !important; margin: 0 !important; }
                #m-body-editor .editor-btn { height: auto !important; min-height: 45px; white-space: normal !important; line-height: 1.4; padding: 10px !important; }
                #m-body-editor div[style*="display:flex"] { flex-wrap: wrap !important; }
                #m-body-editor div[style*="display:flex"] > div { min-width: 45% !important; flex: 1 1 auto !important; }
                
                #custom-context-menu { max-width: 90vw !important; white-space: normal !important; }
                #float-menu div[style*="display:flex"] { flex-wrap: wrap !important; }
                #float-menu { position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; max-height: 75vh; overflow-y: auto; margin: 0 !important; }
                #edit-badge { display: none !important; }

                /* 手機版工具列實體按鈕 */
                .mobile-tool-stack { display: flex; position: fixed; top: 150px; right: 10px; flex-direction: column; gap: 12px; z-index: 99991; }
                .m-stack-btn { width: 42px; height: 42px; background: white; color: var(--dark); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.15); border: 1px solid #ddd; cursor: pointer; font-size: 16px; transition: 0.2s; }
                .m-stack-btn:hover { background: #f4f6f8; transform: scale(1.05); }
                #m-context-edit-btn { border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 2px solid #fff; margin-bottom: 5px; }
                .btn-green { background: #27ae60 !important; color: white !important; }
                .btn-red { background: #e74c3c !important; color: white !important; }
                .btn-blue { background: #3498db !important; color: white !important; }
                .btn-black { background: #333 !important; color: white !important; }
                .btn-purple { background: #9b59b6 !important; color: white !important; }
            }
            @media (min-width: 1025px) { .mobile-tool-stack { display: none !important; } }
        `;
        document.head.appendChild(style);

        const html = `
        <div id="peiyu-universal-editor-overlay">
            <div id="peiyu-universal-editor-wrapper">
                <div class="ue-top-bar">
                    <h3 id="ue-header-title">編輯器</h3>
                    <div>
                        <button class="ue-btn-cancel" onclick="UnivEditor.close()">取消</button>
                        <button class="ue-btn-save" onclick="UnivEditor.save()">💾 確認儲存</button>
                    </div>
                </div>

                <div class="mobile-tool-stack" id="ue-m-stack">
                    <div id="m-context-edit-btn" style="display: none;" onmousedown="event.preventDefault(); window.triggerContextEdit()" ontouchstart="event.preventDefault(); window.triggerContextEdit()"></div>
                    <div class="m-stack-btn" onmousedown="event.preventDefault(); window.toggleMobileToolbar('text')" ontouchstart="event.preventDefault(); window.toggleMobileToolbar('text')" title="文字"><i class="fas fa-font"></i></div>
                    <div class="m-stack-btn" onmousedown="event.preventDefault(); window.toggleMobileToolbar('para')" ontouchstart="event.preventDefault(); window.toggleMobileToolbar('para')" title="段落"><i class="fas fa-align-left"></i></div>
                    <div class="m-stack-btn" onmousedown="event.preventDefault(); window.toggleMobileToolbar('insert')" ontouchstart="event.preventDefault(); window.toggleMobileToolbar('insert')" title="插入圖表"><i class="fas fa-plus"></i></div>
                    <div class="m-stack-btn" onmousedown="event.preventDefault(); window.toggleMobileToolbar('magic')" ontouchstart="event.preventDefault(); window.toggleMobileToolbar('magic')" title="魔法積木"><i class="fas fa-cube"></i></div>
                </div>

                <style id="dynamic-spacing"></style>
                <div class="editor-wrapper" style="border:none; border-radius:0;">
                    <div class="editor-sticky-header">
                        <div class="toolbar">
                            <div class="tb-group">
                                <button class="editor-btn" onclick="customUndo()" title="復原"><i class="fas fa-undo"></i></button>
                                <button class="editor-btn" onclick="customRedo()" title="重做"><i class="fas fa-redo"></i></button>
                            </div>
                            <div class="tb-group">
                                <select class="tb-select" onchange="applyCustomFont(this.value); this.value='';">
                                    <option value="">字體</option>
                                    <option value="sans-serif">標準黑體</option>
                                    <option value="'Noto Serif TC', serif">優雅明體</option>
                                    <option value="monospace">等寬字體</option>
                                </select>
                                <select class="tb-select" onchange="applyCustomSize(this.value); this.value='';">
                                    <option value="">大小</option>
                                    <option value="10">10pt (偏小)</option>
                                    <option value="12">12pt (標準)</option>
                                    <option value="14">14pt (稍大)</option>
                                    <option value="18">18pt (副標)</option>
                                    <option value="24">24pt (主標)</option>
                                    <option value="36">36pt (巨大)</option>
                                </select>
                            </div>
                            <div class="tb-group">
                                <button class="editor-btn" onclick="exec('bold')"><i class="fas fa-bold"></i></button>
                                <button class="editor-btn" onclick="exec('italic')"><i class="fas fa-italic"></i></button>
                                <button class="editor-btn" onclick="exec('underline')"><i class="fas fa-underline"></i></button>
                            </div>
                            <div class="tb-group">
                                <div class="color-split-btn" style="width: 55px;" title="文字顏色 (左:套用記憶 右:選新色)">
                                    <button class="btn-action action-text-color" onmousedown="saveSelection()" ontouchstart="saveSelection()" onclick="applyTextColor(this.dataset.color)" data-color="#c0392b">
                                        <i class="fas fa-font"></i>
                                    </button>
                                    <div class="btn-picker-native" onmousedown="saveSelection()" ontouchstart="saveSelection()">
                                        <input type="color" class="picker-text-color" onchange="applyTextColor(this.value, true)" value="#c0392b">
                                        <i class="fas fa-caret-down"></i>
                                        <div class="memorized-border memorized-text-border" style="background-color: #c0392b;"></div>
                                    </div>
                                </div>
                                <div class="color-split-btn" style="width: 55px; margin-left: 5px;" title="螢光筆 (左:套用記憶 右:選新色)">
                                    <button class="btn-action action-bg-color" onmousedown="saveSelection()" ontouchstart="saveSelection()" onclick="applyTextBg(this.dataset.color)" data-color="#f39c12">
                                        <i class="fas fa-highlighter"></i>
                                    </button>
                                    <div class="btn-picker-native" onmousedown="saveSelection()" ontouchstart="saveSelection()">
                                        <input type="color" class="picker-bg-color" onchange="applyTextBg(this.value, true)" value="#f39c12">
                                        <i class="fas fa-caret-down"></i>
                                        <div class="memorized-border memorized-bg-border" style="background-color: #f39c12;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="tb-group">
                                <button class="editor-btn" onclick="exec('justifyLeft')"><i class="fas fa-align-left"></i></button>
                                <button class="editor-btn" onclick="exec('justifyCenter')"><i class="fas fa-align-center"></i></button>
                                <button class="editor-btn" onclick="exec('justifyRight')"><i class="fas fa-align-right"></i></button>
                            </div>
                            <div class="tb-group">
                                <button class="editor-btn" onclick="exec('indent')"><i class="fas fa-indent"></i></button>
                                <button class="editor-btn" onclick="exec('outdent')"><i class="fas fa-outdent"></i></button>
                                <button class="editor-btn" onclick="applyFirstLineIndent()" style="font-weight:bold;">⇥ 2</button>
                            </div>
                            <div class="tb-group">
                                <button class="editor-btn" onclick="exec('insertOrderedList')"><i class="fas fa-list-ol"></i></button>
                                <button class="editor-btn" onclick="exec('insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
                            </div>
                            <div class="tb-group">
                                <button class="editor-btn" onclick="openModal('link')" title="插入超連結/按鈕"><i class="fas fa-link"></i></button>
                                <button class="editor-btn" onclick="openGallery()" style="color:var(--info);" title="開啟圖庫"><i class="fas fa-image"></i></button>
                                <button class="editor-btn" onclick="openModal('table')" title="插入表格"><i class="fas fa-table"></i></button>
                                <button class="editor-btn" onclick="openModal('divider')" title="插入分隔線/間距" style="color: #8e44ad; font-size: 16px;"><i class="fas fa-grip-lines"></i></button>
                                <button class="editor-btn" id="btn-format-painter" onclick="toggleFormatPainter()" title="複製格式 (油漆刷)"><i class="fas fa-paint-roller"></i></button>
                                <button class="editor-btn" onclick="exec('removeFormat')" title="清除格式"><i class="fas fa-eraser"></i></button>
                                <button class="editor-btn" onclick="window.toggleSource()" style="background:#333; color:#fff; margin-left:10px;"><i class="fas fa-code"></i> HTML</button>
                            </div>
                        </div>

                        <div class="toolbar" style="background:#fff; border-bottom:1px solid #eee;">
                            <div class="tb-group" style="margin-left: auto;">
                                <button class="editor-btn btn-magic" onclick="openModal('spacing')"><i class="fas fa-sliders-h"></i> 排版設定</button>
                                <button class="editor-btn btn-magic" onclick="openModal('custom-box')" style="color:#d35400;">🔲 自訂外框</button>
                                <button class="editor-btn btn-magic" onclick="openModal('blocks_library')" style="background:#fffcf5; border-color:var(--accent); color:var(--forest);">📦 魔法積木</button>
                                <button class="editor-btn btn-magic" onclick="openModal('maintenance')" style="background:#f4f6f8; border-color:#ddd; color:#555;">🛠️ 格式整理</button>
                            </div>
                        </div>
                        <div id="ue-custom-tools" style="display:none; background:#fffdf9; padding:8px 15px; border-bottom:1px dashed #c6a87c; align-items:center; gap:8px; flex-wrap:wrap;"></div>
                    </div>
                    
                    <div id="editor" contenteditable="true"><p>請在此開始撰寫...</p></div>
                    <div id="float-menu"></div>
                    <div id="edit-badge">
                        <div id="btn-badge-table" class="badge-icon badge-blue" title="編輯外層表格" style="display: none;"><i class="fas fa-table"></i></div>
                        <div id="btn-badge-main" class="badge-icon badge-red" title="編輯此物件"><i class="fas fa-pen"></i></div>
                    </div>
                    <textarea id="source-area" class="source-view"></textarea>
                    <div id="custom-context-menu">
                        <div class="context-menu-item" onclick="contextAction('cut')"><span>✂️ 剪下</span><span class="context-shortcut">Ctrl+X</span></div>
                        <div class="context-menu-item" onclick="contextAction('copy')"><span>📋 複製</span><span class="context-shortcut">Ctrl+C</span></div>
                        <hr style="margin: 5px 0; border: none; border-top: 1px dashed #eee;">
                        <div class="context-menu-item" onclick="contextAction('paste-rich')"><span>📝 貼上 (保留來源格式)</span><span class="context-shortcut">Ctrl+V</span></div>
                        <div class="context-menu-item" onclick="contextAction('paste-plain')" style="color:var(--info);"><span>📄 貼上 (僅貼純文字)</span><span class="context-shortcut">Ctrl+Shift+V</span></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="editor-modal-overlay" id="config-modal">
            <div class="editor-modal-box" id="general-modal-box">
                <div style="font-weight:bold; font-size:1.2rem; margin-bottom:15px; color:var(--forest);" id="m-title-editor">設定</div>
                <div id="m-body-editor"></div>
                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                    <button class="editor-btn" onclick="document.getElementById('config-modal').style.display='none'">取消</button>
                    <button class="editor-btn" style="background:var(--forest); color:white; font-weight:bold; display:none;" id="m-update-btn" onclick="updateTableStyle()">✅ 確認修改</button>
                    <button class="editor-btn" style="background:var(--forest); color:white; font-weight:bold;" id="m-confirm-btn" onclick="confirmInsert()">✅ 確認插入</button>
                </div>
            </div>
        </div>

        <div class="editor-modal-overlay" id="gallery-modal">
            <div class="editor-modal-box editor-gallery-box">
                <div class="editor-gallery-header">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <h3 style="margin:0;">圖庫</h3>
                        <select id="bucket-select" onchange="switchBucket()" style="padding:5px; border-radius:4px;">
                            <option value="site-assets">網站素材 (site-assets)</option>
                            <option value="kb-images">文章配圖 (kb-images)</option>
                            <option value="banners">橫幅 (banners)</option>
                        </select>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="custom-img-name" placeholder="自訂檔名" style="width:200px; padding:5px; border:1px solid #ddd; border-radius:4px;">
                        <input type="file" id="upload-input" accept="image/*" style="display:none" onchange="uploadToDB(this)">
                        <button class="editor-btn" style="background:var(--forest); color:white;" onclick="document.getElementById('upload-input').click()">
                            <i class="fas fa-plus-circle"></i> 插入新圖片
                        </button>
                        <button class="editor-btn" style="background:#fee2e2; color:#e74c3c; border-color:#fca5a5;" onclick="document.getElementById('gallery-modal').style.display='none'">關閉</button>
                    </div>
                </div>
                <div id="gallery-content" class="editor-gallery-grid">載入中...</div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        // =========================================================
        // 🔥 事件綁定全區 (在這裡綁定，保證 HTML 長出來後才掛上去！)
        // =========================================================
        editor = document.getElementById('editor'); 
        floatMenu = document.getElementById('float-menu'); 
        editBadge = document.getElementById('edit-badge');

        if(editor) {
            editor.addEventListener('input', () => { clearTimeout(typingTimeout); typingTimeout = setTimeout(saveHistory, 500); });
            
            editor.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) customRedo(); else customUndo(); }
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); customRedo(); }
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
                    e.preventDefault(); navigator.clipboard.readText().then(text => { document.execCommand('insertText', false, text); saveHistory(); })
                    .catch(err => alert("請改用滑鼠右鍵 ➔ 僅貼純文字！"));
                }
            });

            editor.addEventListener('paste', function(e) {
                const sel = window.getSelection(); if (!sel.rangeCount) return;
                let node = sel.anchorNode; let currentContainer = node.nodeType === 3 ? node.parentNode : node;
                if (!currentContainer.closest) return; 
                let insideInlineBox = currentContainer.closest('span.peiyu-custom-box, a.peiyu-obj, .peiyu-tab-title-edit');
                if (insideInlineBox) {
                    e.preventDefault(); 
                    let text = (e.clipboardData || window.clipboardData).getData('text/plain');
                    text = text.replace(/[\r\n]+/g, ' '); 
                    document.execCommand('insertText', false, text); saveHistory();
                }
            });

            editor.addEventListener('mousedown', (e) => {
                if (!e.target.closest('#edit-badge') && !e.target.closest('#float-menu') && !e.target.closest('.peiyu-obj') && !e.target.closest('.mobile-tool-stack') && !e.target.closest('#m-context-edit-btn')) {
                    lastValidRange = null; currentTarget = null; currentTargetCell = null; pendingTargetType = null;
                    if (editBadge) editBadge.style.display = 'none';
                    if (floatMenu) floatMenu.style.display = 'none';
                    if (window.innerWidth <= 1024) { const editBtn = document.getElementById('m-context-edit-btn'); if (editBtn) editBtn.style.display = 'none'; }
                    document.querySelectorAll('[class*="obj-selected-"]').forEach(el => el.classList.remove('obj-selected-table', 'obj-selected-image', 'obj-selected-block'));
                }
            });

            editor.addEventListener('click', function(e) { 
                if (e.target.closest('.mobile-tool-stack') || e.target.closest('#float-menu') || e.target.closest('#edit-badge') || e.target.closest('#m-context-edit-btn')) return;
                if (e.target.closest('a')) { e.preventDefault(); }
                
                document.querySelectorAll('[class*="obj-selected-"]').forEach(el => el.classList.remove('obj-selected-table', 'obj-selected-image', 'obj-selected-block', 'obj-selected-link'));
                currentTarget = null; currentTargetCell = null; pendingTargetType = null;
                if(floatMenu) floatMenu.style.display = 'none';
                
                let targetImg = e.target.closest('img'); let targetCell = e.target.closest('td, th'); let targetTable = e.target.closest('table'); let targetLink = e.target.closest('a.peiyu-obj'); let targetTabs = (e.target.closest('.peiyu-tab-label-row') || e.target.closest('.peiyu-tab-group-header') || e.target.classList.contains('peiyu-tabs-wrapper')) ? e.target.closest('.peiyu-tabs-wrapper') : null; let rawBlock = e.target.closest('.peiyu-block');
                if (!rawBlock && e.target.closest('h2, h3')) { rawBlock = e.target.closest('h2, h3'); rawBlock.classList.add('peiyu-block', 'peiyu-obj'); }

                if (targetImg) {
                    const sel = window.getSelection(); const range = document.createRange();
                    range.selectNode(targetImg); range.collapse(false); sel.removeAllRanges(); sel.addRange(range);
                    let wrapper = targetImg.closest('.resizable-wrapper');
                    if (!wrapper) { let oldW = targetImg.getAttribute('width') || targetImg.style.width || '100%'; wrapper = document.createElement('div'); wrapper.className = 'resizable-wrapper peiyu-obj'; wrapper.style.cssText = `display:block; width:${oldW}; max-width:100%; margin:15px auto; clear:both;`; targetImg.parentNode.insertBefore(wrapper, targetImg); wrapper.appendChild(targetImg); }
                    currentTarget = wrapper; currentTargetCell = targetCell; pendingTargetType = 'image'; currentTarget.classList.add('obj-selected-image');
                    window.setBadgePosition(currentTarget.getBoundingClientRect(), 'image', targetTable !== null); return;
                }

                const sel = window.getSelection();
                if (sel.rangeCount > 0 && !sel.isCollapsed && editor.contains(sel.anchorNode) && sel.toString().trim().length > 0) {
                    lastValidRange = sel.getRangeAt(0).cloneRange(); pendingTargetType = 'text'; currentTarget = null;
                    window.setBadgePosition(lastValidRange.getBoundingClientRect(), 'text', targetTable !== null);
                    if (typeof updateToolbarState === 'function') updateToolbarState(); return; 
                }
                if (targetLink) { currentTarget = targetLink; currentTargetCell = null; pendingTargetType = 'link'; currentTarget.classList.add('obj-selected-link'); window.setBadgePosition(currentTarget.getBoundingClientRect(), 'link', targetTable !== null); } 
                else if (rawBlock) { currentTarget = rawBlock; currentTargetCell = targetCell; pendingTargetType = 'block'; currentTarget.classList.add('obj-selected-block'); window.setBadgePosition(currentTarget.getBoundingClientRect(), 'block', targetTable !== null); } 
                else if (targetTabs) { currentTarget = targetTabs; currentTargetCell = targetCell; pendingTargetType = 'tabs'; currentTarget.classList.add('obj-selected-block'); window.setBadgePosition(currentTarget.getBoundingClientRect(), 'tabs', targetTable !== null); } 
                else if (targetCell && targetTable) { targetTable.classList.add('peiyu-table', 'peiyu-obj'); if(targetTable.style.display === 'block') targetTable.style.display = 'table'; currentTarget = targetTable; currentTargetCell = targetCell; pendingTargetType = 'table'; targetCell.classList.add('obj-selected-table'); window.setBadgePosition(targetCell.getBoundingClientRect(), 'table', false); }
            });
        }

        if (editBadge) {
            editBadge.addEventListener('mousedown', e => e.preventDefault());
            editBadge.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                if (e.target.closest('#btn-badge-table')) { currentTarget = currentTargetCell ? currentTargetCell.closest('table') : currentTarget; pendingTargetType = 'table'; }
                const rect = editBadge.getBoundingClientRect();
                if (window.showFloatMenu) window.showFloatMenu(rect.left, rect.top + 35, pendingTargetType);
                editBadge.style.display = 'none';
            });
        }

        const hideOnScroll = () => { if (editBadge) editBadge.style.display = 'none'; if (floatMenu) floatMenu.style.display = 'none'; };
        window.addEventListener('scroll', hideOnScroll, true); 
        if(editor) editor.addEventListener('scroll', hideOnScroll, true);

        const closeDrawerHandler = (e) => {
            if (window.innerWidth > 1024) return;
            if (!e.target.closest('.editor-sticky-header') && !e.target.closest('.mobile-tool-stack') && !e.target.closest('.editor-modal-box')) {
                const drawer = document.querySelector('.editor-sticky-header');
                if(drawer) { drawer.classList.remove('show-drawer'); drawer.dataset.activeGroup = ''; }
            }
        };
        const overlay = document.getElementById('peiyu-universal-editor-overlay');
        overlay.addEventListener('mousedown', closeDrawerHandler);
        overlay.addEventListener('touchstart', closeDrawerHandler, { passive: true });


        // 🔥 防止工具列搶奪打字焦點護盾！(修正：放行 toolbar 讓下拉選單可以點擊)
        const toolbarBtns = document.querySelectorAll('.editor-sticky-header .editor-btn');
        toolbarBtns.forEach(btn => {
            btn.addEventListener('mousedown', e => e.preventDefault());
            btn.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
        });

        // 初始化手機排版位置追蹤
        if (window.visualViewport) {
            window.visualViewport.addEventListener('scroll', window.updateMobileUIPosition);
            window.visualViewport.addEventListener('resize', window.updateMobileUIPosition);
        }
        window.addEventListener('scroll', () => { if(window.innerWidth <= 1024) window.updateMobileUIPosition(); });
    },

    open: function(targetId, title = "編輯內容") {
        this.init();
        this.targetInputId = targetId;
        const inputEl = document.getElementById(targetId);
        if (!inputEl) return alert("找不到目標輸入框！");

        document.getElementById('ue-header-title').innerText = title;
        
        let content = inputEl.value || '';
        if (content && !content.includes('<div') && !content.includes('<p') && !content.includes('<br') && !content.includes('<span') && !content.includes('<ul')) {
            content = content.replace(/\r?\n/g, '<br>');
        }
        
        editor.innerHTML = content || '<p><br></p>';
        
        window.history = [editor.innerHTML]; 
        window.historyIndex = 0;
        if(typeof applySpacingToEditor === 'function') applySpacingToEditor();
        
        document.getElementById('peiyu-universal-editor-overlay').style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    },

    close: function() {
        document.getElementById('peiyu-universal-editor-overlay').style.display = 'none';
        document.body.style.overflow = '';
        if(floatMenu) floatMenu.style.display = 'none';
        if(editBadge) editBadge.style.display = 'none';
        const drawer = document.querySelector('.editor-sticky-header');
        if(drawer) { drawer.classList.remove('show-drawer'); drawer.dataset.activeGroup = ''; }
        
        // 🔥 補上這行：關閉時把範本列藏起來
        const customTools = document.getElementById('ue-custom-tools');
        if (customTools) customTools.style.display = 'none';
    },

    save: function() {
        if (!this.targetInputId) return this.close();
        
        editor.querySelectorAll('[class*="obj-selected-"]').forEach(el => el.classList.remove('obj-selected-table', 'obj-selected-image', 'obj-selected-block', 'obj-selected-link'));
        editor.querySelectorAll('td[contenteditable="true"], th[contenteditable="true"]').forEach(cell => cell.removeAttribute('contenteditable'));

        let cleanHtml = editor.innerHTML;
        if (cleanHtml === '<p><br></p>') cleanHtml = '';

        const targetEl = document.getElementById(this.targetInputId);
        targetEl.value = cleanHtml;
        targetEl.dispatchEvent(new Event('change'));
        
        this.close();
    }
};

// ============================================================================
// 全域監聽器：游標反白追蹤與防呆 (放在最外面隨時待命)
// ============================================================================
document.addEventListener('selectionchange', () => {
    if (!editor) return; 
    const sel = window.getSelection();
    
    // 即時儲存游標，讓按按鈕時不會遺失反白
    if (sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
        savedRange = sel.getRangeAt(0);
    }

    if (sel.rangeCount > 0 && !sel.isCollapsed && editor.contains(sel.anchorNode) && sel.toString().trim().length > 0) {
        lastValidRange = sel.getRangeAt(0).cloneRange(); pendingTargetType = 'text'; currentTarget = null;
        if (window.setBadgePosition) window.setBadgePosition(lastValidRange.getBoundingClientRect(), 'text', false);
    } else if (sel.isCollapsed && pendingTargetType === 'text') {
        if(editBadge) editBadge.style.display = 'none';
        if (window.showContextEditButton && window.innerWidth <= 1024) window.showContextEditButton();
    }
});

// ============================================================================
// 手機版工具列切換邏輯 (補回的重要功能)
// ============================================================================
window.toggleMobileToolbar = function(groupName) {
    if(window.restoreSelection) window.restoreSelection(); // 🔥 按下按鈕時馬上還原游標！
    
    const drawer = document.querySelector('.editor-sticky-header');
    if (!drawer) return;
    
    const allGroups = drawer.querySelectorAll('.tb-group');
    for(let i = 1; i < allGroups.length; i++) { 
        allGroups[i].style.setProperty('display', 'none', 'important'); 
    }
    
    if (drawer.classList.contains('show-drawer') && drawer.dataset.activeGroup === groupName) { 
        drawer.classList.remove('show-drawer'); 
        drawer.dataset.activeGroup = ''; 
        return; 
    }
    
    if (groupName === 'text') { 
        if(allGroups[1]) allGroups[1].style.setProperty('display', 'flex', 'important'); 
        if(allGroups[2]) allGroups[2].style.setProperty('display', 'flex', 'important'); 
        if(allGroups[3]) allGroups[3].style.setProperty('display', 'flex', 'important'); 
    } else if (groupName === 'para') { 
        if(allGroups[4]) allGroups[4].style.setProperty('display', 'flex', 'important'); 
        if(allGroups[5]) allGroups[5].style.setProperty('display', 'flex', 'important'); 
        if(allGroups[6]) allGroups[6].style.setProperty('display', 'flex', 'important'); 
    } else if (groupName === 'insert') { 
        if(allGroups[7]) allGroups[7].style.setProperty('display', 'flex', 'important'); 
    } else if (groupName === 'magic') { 
        if(allGroups[8]) allGroups[8].style.setProperty('display', 'flex', 'important'); 
    }
    
    drawer.classList.add('show-drawer'); 
    drawer.dataset.activeGroup = groupName;
};

// 避免鍵盤擋住工具列
window.updateMobileUIPosition = function() {
    if (window.innerWidth > 1024) return;
    const stack = document.getElementById('ue-m-stack');
    const drawer = document.querySelector('.editor-sticky-header');
    const fMenu = document.getElementById('float-menu');
    
    let offsetTop = window.visualViewport ? window.visualViewport.offsetTop : 0;
    let vHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    
    if (stack) stack.style.top = (offsetTop + 120) + 'px';
    if (drawer) {
        drawer.style.top = (offsetTop + 120) + 'px';
        drawer.style.maxHeight = (vHeight - 140) + 'px';
    }
    if (fMenu && fMenu.style.display !== 'none') {
        fMenu.style.top = (offsetTop + (vHeight / 2)) + 'px';
        fMenu.style.left = '50%';
        fMenu.style.transform = 'translate(-50%, -50%)';
    }
};

window.toggleSource = function() {
    const sourceArea = document.getElementById('source-area');
    if (sourceArea.style.display === 'none' || !sourceArea.style.display) {
        sourceArea.value = editor.innerHTML;
        editor.style.display = 'none';
        sourceArea.style.display = 'block';
    } else {
        editor.innerHTML = sourceArea.value;
        sourceArea.style.display = 'none';
        editor.style.display = 'block';
    }
};

// ============================================================================
// 下方 100% 原封不動貼上 kb.html 的所有全域函數
// ============================================================================
function applySpacingToEditor() { 
    const css = `#editor { line-height: ${spacingCfg.lh}; -webkit-text-size-adjust: 100%; } 
    #editor * { -webkit-text-size-adjust: 100%; } 
    #editor p, #editor div:not([class]) { margin-top: 0; margin-bottom: ${spacingCfg.pmb}em; } 
    #editor h1, #editor h2, #editor h3, #editor h4, #editor h5, #editor h6 { margin-top: 1.2em; margin-bottom: 0.5em; line-height: 1.4; font-weight: bold; } 
    #editor h1+h1, #editor h2+h2, #editor h3+h3, #editor h4+h4, #editor h5+h5, #editor h6+h6 { margin-top: 0; } 
    #editor ul, #editor ol { margin-top: ${spacingCfg.lmtb}em; margin-bottom: ${spacingCfg.pmb}em; padding-left: 1.5em; } 
    #editor li { margin-bottom: ${spacingCfg.limb}em; } 
    #editor li > p, #editor li > div:not([class]) { margin-bottom: 0; display: inline; } 

    #editor table { border-collapse: collapse; max-width: 100% !important; box-sizing: border-box !important; table-layout: fixed !important; } 
    #editor table td, #editor table th { vertical-align: middle; padding: 8px 12px; word-wrap: break-word !important; overflow-wrap: break-word !important; max-width: 100% !important; box-sizing: border-box !important; } 
    #editor table td div { margin: 4px 0 !important; } 
    #editor table td p { margin-bottom: 4px !important; } 
    #editor .resizable-wrapper { max-width: 100% !important; clear: both; box-sizing: border-box !important; }
    #editor img { max-width: 100% !important; height: auto !important; box-sizing: border-box !important; }

    @media (max-width: 768px) and (orientation: portrait) { 
        #editor table { width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; } 
        #editor table td, #editor table th { padding-left: 5px !important; padding-right: 5px !important; white-space: normal !important; }
        #editor .resizable-wrapper, #editor img { margin-left: 0 !important; margin-right: 0 !important; }
    }`;
    const styleTag = document.getElementById('dynamic-spacing'); if(styleTag) styleTag.innerHTML = css; 
}

function saveHistory() {
    if (!editor) return; 
    const sel = window.getSelection(); 
    let markedHTML = editor.innerHTML;
    
    if (sel.rangeCount > 0 && editor.contains(sel.anchorNode) && sel.isCollapsed) {
        try { 
            const range = sel.getRangeAt(0); 
            const marker = document.createElement("span"); marker.id = "cursor-marker"; marker.style.display = "none"; 
            range.insertNode(marker); 
            markedHTML = editor.innerHTML; 
            marker.remove(); 
        } catch(e) {}
    }
    
    const currentPure = markedHTML.replace(/<span id="cursor-marker".*?><\/span>/g, ""); 
    const lastPure = history[historyIndex] ? history[historyIndex].replace(/<span id="cursor-marker".*?><\/span>/g, "") : "";
    if (currentPure !== lastPure) { 
        if (historyIndex < history.length - 1) history = history.slice(0, historyIndex + 1); 
        history.push(markedHTML); 
        if (history.length > 50) history.shift(); else historyIndex = history.length - 1; 
    }
}

function customUndo() { clearTimeout(typingTimeout); saveHistory(); if (historyIndex > 0) { historyIndex--; applyHistoryState(); } }
function customRedo() { clearTimeout(typingTimeout); if (historyIndex < history.length - 1) { historyIndex++; applyHistoryState(); } }
function applyHistoryState() {
    editor.innerHTML = history[historyIndex]; const marker = document.getElementById('cursor-marker');
    if (marker) { const range = document.createRange(); const sel = window.getSelection(); range.setStartAfter(marker); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); marker.remove(); }
    editor.focus({ preventScroll: true });
}

function restoreSelection() {
    if(!editor) return;
    editor.focus({ preventScroll: true });
    if (savedRange) { 
        const sel = window.getSelection(); 
        sel.removeAllRanges(); 
        sel.addRange(savedRange); 
    } else { 
        const range = document.createRange(); 
        range.selectNodeContents(editor); 
        range.collapse(false); 
        const sel = window.getSelection(); 
        sel.removeAllRanges(); 
        sel.addRange(range); 
    }
}

function exec(command, value = null) { 
    restoreSelection();
    document.execCommand(command, false, value); 
    saveHistory(); 
}

function applyCustomFont(fontName) {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel.toString()) return alert("⚠️ 請先反白選取要修改的文字喔！");

    document.execCommand('styleWithCSS', false, true);
    document.execCommand('fontName', false, fontName);

    document.querySelectorAll('#editor font[face]').forEach(f => {
        f.style.fontFamily = fontName; 
        f.removeAttribute('face');
    });

    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
        if (container && container.querySelectorAll) {
            container.querySelectorAll('*').forEach(child => {
                if (sel.containsNode(child, true) && child.style.fontFamily) {
                    child.style.fontFamily = fontName;
                }
            });
        }
    }
    editor.focus({ preventScroll: true });
    saveHistory();
    updateToolbarState(); 
}

function applyCustomSize(pt) {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel.toString()) return alert("⚠️ 請先反白選取要修改的文字喔！");

    document.execCommand('styleWithCSS', false, false); 
    document.execCommand('fontSize', false, 7);

    document.querySelectorAll('#editor font[size="7"]').forEach(f => {
        f.style.fontSize = pt + 'pt';
        f.removeAttribute('size');
    });
    
    document.querySelectorAll('#editor span').forEach(s => {
        if (s.style.fontSize === '-webkit-xxx-large' || s.style.fontSize === 'xxx-large' || s.style.fontSize === '48px' || s.style.fontSize === '7em') {
            s.style.fontSize = pt + 'pt';
        }
    });

    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
        if (container && container.querySelectorAll) {
            container.querySelectorAll('*').forEach(child => {
                if (sel.containsNode(child, true) && child.style.fontSize) {
                    child.style.fontSize = pt + 'pt';
                }
            });
        }
    }
    editor.focus({ preventScroll: true });
    saveHistory();
    updateToolbarState(); 
}

function applyFirstLineIndent() { 
    const sel = window.getSelection(); if (!sel.rangeCount) return; 
    let node = sel.focusNode; if(node.nodeType === 3) node = node.parentNode; 
    while(node && node.id !== 'editor' && !['P','DIV','LI'].includes(node.tagName)) node = node.parentNode; 
    if(node && node.id !== 'editor') { node.style.textIndent = node.style.textIndent === '2em' ? '' : '2em'; saveHistory(); } 
    else { exec('formatBlock', 'DIV'); setTimeout(applyFirstLineIndent, 50); } 
}

window.applyTextColor = function(val, isNewPick = false) {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel.toString()) return alert("⚠️ 請先反白選取要修改的文字喔！");
    
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('foreColor', false, val);
    editor.focus({ preventScroll: true });
    saveHistory();

    if (isNewPick) {
        document.querySelectorAll('.action-text-color').forEach(btn => btn.setAttribute('data-color', val));
        document.querySelectorAll('.memorized-text-border').forEach(el => el.style.backgroundColor = val);
        document.querySelectorAll('.picker-text-color').forEach(inp => inp.value = val);
    }
    
    document.querySelectorAll('.action-text-color').forEach(btn => {
        let icon = btn.querySelector('i');
        if (icon) icon.style.color = val;
        btn.style.color = val; 
    });
    setTimeout(updateToolbarState, 50); 
};

window.applyTextBg = function(val, isNewPick = false) {
    restoreSelection(); 
    const sel = window.getSelection(); 
    if (!sel.toString()) return alert("⚠️ 請先反白選取要畫螢光筆的文字喔！"); 
    
    document.execCommand('styleWithCSS', false, true); 
    document.execCommand('hiliteColor', false, val); 
    document.execCommand('backColor', false, val); 
    
    const blocks = editor.querySelectorAll('p, div, li, ul, ol, td, th, tr, table, h2, h3');
    blocks.forEach(block => { if (sel.containsNode(block, true)) { block.style.backgroundColor = ''; } });
    let node = sel.focusNode; if (node && node.nodeType === 3) node = node.parentNode;
    while (node && node.id !== 'editor') { if (['P', 'DIV', 'LI', 'UL', 'OL', 'TD', 'TH'].includes(node.tagName)) { node.style.backgroundColor = ''; } node = node.parentNode; }
    
    editor.focus({ preventScroll: true }); 
    saveHistory();

    if (isNewPick) {
        document.querySelectorAll('.action-bg-color').forEach(btn => btn.setAttribute('data-color', val));
        document.querySelectorAll('.memorized-bg-border').forEach(el => el.style.backgroundColor = val);
        document.querySelectorAll('.picker-bg-color').forEach(inp => inp.value = val);
    }
    
    document.querySelectorAll('.action-bg-color').forEach(btn => {
        let icon = btn.querySelector('i');
        if (val === 'transparent' || val === '' || val === '#ffffff') {
            btn.style.backgroundColor = 'transparent';
            if (icon) icon.style.color = '#333333'; 
        } else {
            btn.style.backgroundColor = val;
            if (icon) icon.style.color = '#ffffff';
        }
    });
    setTimeout(updateToolbarState, 50); 
};

function updateToolbarState() {
    setTimeout(() => {
        const sel = window.getSelection();
        if (!sel.rangeCount || !editor.contains(sel.anchorNode)) return;

        ['bold', 'italic', 'underline'].forEach(cmd => {
            const isActive = document.queryCommandState(cmd);
            document.querySelectorAll(`button[onclick="exec('${cmd}')"]`).forEach(btn => {
                isActive ? btn.classList.add('active') : btn.classList.remove('active');
            });
        });

        let range = sel.getRangeAt(0);
        let node = range.startContainer;
        
        if (node.nodeType === 3 && range.startOffset === node.length && !sel.isCollapsed) {
            node = range.endContainer; 
        }

        if (node.nodeType === 1 && node.childNodes.length > range.startOffset) {
            node = node.childNodes[range.startOffset];
        }
        while (node && node.nodeType === 1 && node.childNodes.length > 0) {
            let validChild = Array.from(node.childNodes).find(n => n.textContent.replace(/\u200B/g, '').trim() !== '');
            if (validChild) node = validChild;
            else break;
        }
        if (node && node.nodeType === 3) node = node.parentNode;
        if (!node || node === editor) return;

        const computed = window.getComputedStyle(node);
        
        let fontStr = computed.fontFamily.toLowerCase();
        let mappedFont = "sans-serif"; 
        if (fontStr.includes('mono') || fontStr.includes('courier')) mappedFont = "monospace";
        else if (fontStr.includes('noto serif tc') || fontStr.includes('ming') || fontStr.includes('song') || (fontStr.includes('serif') && !fontStr.includes('sans-serif'))) mappedFont = "'Noto Serif TC', serif";
        
        let sizePx = parseFloat(computed.fontSize) || 16;
        let pt = sizePx * 0.75; 
        const pts = [10, 12, 14, 18, 24, 36];
        let mappedSize = pts.reduce((p, c) => Math.abs(c - pt) < Math.abs(p - pt) ? c : p).toString();

        let isMixedFont = false;
        let isMixedSize = false;
        let isMixedTextColor = false;
        
        if (!sel.isCollapsed) {
            const container = range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
            if (container && container.querySelectorAll) {
                let elements = container.querySelectorAll('*');
                let firstTextColor = null;

                for (let el of elements) {
                    if (sel.containsNode(el, true)) {
                        let comp = window.getComputedStyle(el);
                        
                        let elFontStr = comp.fontFamily.toLowerCase();
                        let elMappedFont = "sans-serif";
                        if (elFontStr.includes('mono') || elFontStr.includes('courier')) elMappedFont = "monospace";
                        else if (elFontStr.includes('noto serif tc') || elFontStr.includes('ming') || elFontStr.includes('song') || (elFontStr.includes('serif') && !elFontStr.includes('sans-serif'))) elMappedFont = "'Noto Serif TC', serif";
                        if (elMappedFont !== mappedFont) isMixedFont = true;

                        let elSizePx = parseFloat(comp.fontSize) || 16;
                        let elPt = elSizePx * 0.75;
                        let elMappedSize = pts.reduce((p, c) => Math.abs(c - elPt) < Math.abs(p - elPt) ? c : p).toString();
                        if (elMappedSize !== mappedSize) isMixedSize = true;

                        let elColor = rgb2hex(comp.color);
                        if (firstTextColor === null) firstTextColor = elColor;
                        else if (firstTextColor !== elColor) isMixedTextColor = true;
                    }
                }
            }
        }

        if (isMixedFont) mappedFont = "";
        if (isMixedSize) mappedSize = "";

        document.querySelectorAll('.tb-select[onchange*="applyCustomFont"]').forEach(sel => sel.value = mappedFont);
        document.querySelectorAll('.tb-select[onchange*="applyCustomSize"]').forEach(sel => sel.value = mappedSize);

        let textColor = computed.color;
        let hexColor = isMixedTextColor ? '#333333' : (rgb2hex(textColor) || '#333333');
        
        document.querySelectorAll('.action-text-color').forEach(btn => {
            let icon = btn.querySelector('i');
            if (icon) {
                icon.style.color = hexColor;
                if (hexColor === '#ffffff' || hexColor === '#fff') icon.style.textShadow = '0 0 3px rgba(0,0,0,0.8)';
                else icon.style.textShadow = 'none';
            }
            btn.style.color = hexColor; 
        });

        let bgNode = node;
        let bgColor = '';
        while (bgNode && bgNode !== editor) {
            let bg = window.getComputedStyle(bgNode).backgroundColor;
            let cleanBg = bg ? bg.replace(/\s+/g, '') : '';
            if (cleanBg && cleanBg !== 'transparent' && cleanBg !== 'rgba(0,0,0,0)') {
                bgColor = bg;
                break;
            }
            bgNode = bgNode.parentNode;
        }
        let hexBg = isMixedTextColor ? '' : (rgb2hex(bgColor) || ''); 
        
        document.querySelectorAll('.action-bg-color').forEach(btn => {
            let icon = btn.querySelector('i');
            if (hexBg === '' || hexBg === '#ffffff' || hexBg === '#fff') {
                btn.style.backgroundColor = hexBg === '' ? 'transparent' : '#ffffff';
                if (icon) { icon.style.color = '#333333'; icon.style.textShadow = 'none'; }
            } else {
                btn.style.backgroundColor = hexBg;
                if (icon) { icon.style.color = '#ffffff'; icon.style.textShadow = '0 0 2px rgba(0,0,0,0.5)'; }
            }
        });
    }, 10); 
}

function insertHtml(html) {
    restoreSelection(); editor.focus({ preventScroll: true }); 
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) { 
        const range = sel.getRangeAt(0); 
        range.deleteContents(); 
        const el = document.createElement("div"); el.innerHTML = html; 
        let frag = document.createDocumentFragment(), node, lastNode; 
        while ((node = el.firstChild)) lastNode = frag.appendChild(node); 
        range.insertNode(frag); 
        
        if (lastNode) { 
            if (lastNode.nodeType === 1 && lastNode.tagName === 'SPAN') {
                const space = document.createTextNode('\u00A0');
                lastNode.parentNode.insertBefore(space, lastNode.nextSibling);
                range.setStartAfter(space);
            } else {
                range.setStartAfter(lastNode); 
            }
            range.collapse(true); 
            sel.removeAllRanges(); 
            sel.addRange(range); 
        } 
    } else {
        editor.innerHTML += html;
    }
    saveHistory(); 
}

window.insertImageToEditor = function(u) { const html = `<div class="resizable-wrapper peiyu-obj" style="margin-left:auto; margin-right:auto; width:100%;"><img src="${u}"></div><p><br></p>`; insertHtml(html); closeGallery(); }

window.executeClean = function(mode) {
    saveSelection(); 
    let html = editor.innerHTML; 
    const parser = new DOMParser(); 
    const doc = parser.parseFromString(html, 'text/html');

    let cleanCount = 0;
    const validClasses = ['peiyu-article', 'peiyu-table', 'peiyu-obj', 'peiyu-tabs-wrapper', 'peiyu-tab-group-header', 'peiyu-tab-container', 'peiyu-tab-section', 'peiyu-tab-label-row', 'peiyu-tab-title-edit', 'peiyu-tab-body', 'peiyu-block', 'resizable-wrapper', 'kb-btn-del-tab', 'peiyu-custom-box'];
    
    doc.querySelectorAll('*').forEach(el => {
        let isModified = false;
        if (mode === 'bg' || mode === 'all') {
            if (el.style.backgroundColor) { el.style.removeProperty('background-color'); isModified = true; }
            if (el.style.background) { el.style.removeProperty('background'); isModified = true; }
        }
        if (mode === 'ai' || mode === 'all') {
            if (el.className && typeof el.className === 'string') {
                const originalClass = el.className;
                const cleanClasses = el.className.split(' ').filter(c => validClasses.includes(c)).join(' '); 
                if (cleanClasses !== originalClass) {
                    if (cleanClasses) el.className = cleanClasses; else el.removeAttribute('class'); 
                    isModified = true;
                }
            }
            Array.from(el.attributes).forEach(attr => {
                if (!['class', 'style', 'src', 'href', 'width', 'height', 'colspan', 'rowspan', 'data-tab-title', 'data-nat-w', 'contenteditable'].includes(attr.name)) {
                    el.removeAttribute(attr.name);
                    isModified = true;
                }
            });
        }
        if (mode === 'table' || mode === 'all') {
            if (['TABLE', 'TBODY', 'TR', 'TH', 'TD'].includes(el.tagName)) {
                if (el.style.width) { el.style.removeProperty('width'); isModified = true; }
                if (el.style.height) { el.style.removeProperty('height'); isModified = true; }
                if (el.style.minWidth) { el.style.removeProperty('min-width'); isModified = true; }
                if (el.style.maxWidth) { el.style.removeProperty('max-width'); isModified = true; }
                if (el.tagName === 'TD' || el.tagName === 'TH') {
                    el.style.whiteSpace = 'normal'; el.style.wordBreak = 'break-all';
                    if (el.style.padding) { el.style.removeProperty('padding'); isModified = true; }
                    if (el.style.paddingLeft) { el.style.removeProperty('padding-left'); isModified = true; }
                    if (el.style.paddingRight) { el.style.removeProperty('padding-right'); isModified = true; }
                    if (el.style.paddingTop) { el.style.removeProperty('padding-top'); isModified = true; }
                    if (el.style.paddingBottom) { el.style.removeProperty('padding-bottom'); isModified = true; }
                    if (el.style.border) { el.style.removeProperty('border'); isModified = true; }
                    if (el.style.borderWidth) { el.style.removeProperty('border-width'); isModified = true; }
                    if (el.style.borderStyle) { el.style.removeProperty('border-style'); isModified = true; }
                    if (el.style.borderColor) { el.style.removeProperty('border-color'); isModified = true; }
                    if (el.style.textAlign) { el.style.removeProperty('text-align'); isModified = true; }
                }
                if (el.tagName === 'TABLE') {
                    if (el.style.float) { el.style.removeProperty('float'); isModified = true; }
                    if (el.style.margin) { el.style.removeProperty('margin'); isModified = true; }
                    if (el.style.clear) { el.style.removeProperty('clear'); isModified = true; }
                }
            }
        }
        if (mode === 'text' || mode === 'all') {
            if (el.style.lineHeight) { el.style.removeProperty('line-height'); isModified = true; }
            if (el.style.marginBlock) { el.style.removeProperty('margin-block'); isModified = true; }
            if (el.style.letterSpacing) { el.style.removeProperty('letter-spacing'); isModified = true; }
            if (el.style.margin && !el.classList.contains('resizable-wrapper')) { el.style.removeProperty('margin'); isModified = true; }
            if (el.style.marginTop) { el.style.removeProperty('margin-top'); isModified = true; }
            if (el.style.marginBottom) { el.style.removeProperty('margin-bottom'); isModified = true; }
            if (el.style.padding && !el.closest('.peiyu-table') && !el.classList.contains('peiyu-block')) { el.style.removeProperty('padding'); isModified = true; }
            if (mode === 'text') { 
                if (el.style.fontFamily) { el.style.removeProperty('font-family'); isModified = true; }
                if (el.style.fontSize) { el.style.removeProperty('font-size'); isModified = true; }
                if (el.tagName === 'FONT') { el.removeAttribute('face'); el.removeAttribute('size'); el.removeAttribute('color'); isModified = true; }
            }
        }
        if (el.getAttribute('style') === '') { el.removeAttribute('style'); isModified = true; }
        if (isModified) cleanCount++;
    });

    if (mode === 'all' || mode === 'ai' || mode === 'text') {
        doc.querySelectorAll('div, p, span').forEach(el => {
            if (el.textContent.trim() === '' && el.querySelectorAll('img, table, iframe, br').length === 0) { el.remove(); cleanCount++; }
        });
        let hasUnwrapped = true;
        while (hasUnwrapped) {
            hasUnwrapped = false;
            doc.querySelectorAll('div, span').forEach(el => {
                if (el.attributes.length === 0) {
                    const parent = el.parentNode;
                    if(parent) {
                        while (el.firstChild) parent.insertBefore(el.firstChild, el);
                        parent.removeChild(el); hasUnwrapped = true; cleanCount++;
                    }
                }
            });
        }
    }

    editor.innerHTML = doc.body.innerHTML; 
    saveHistory(); 
    document.getElementById('config-modal').style.display = 'none'; 
    const modeNames = { 'all': '🧨 全部', 'ai': '🤖 AI 格式', 'table': '🔲 表格', 'text': '📝 文字', 'bg': '🎨 背景色' };
    alert(`✨ ${modeNames[mode]} 除髒完成！\n\n成功清理了 ${cleanCount} 個項目。`);
};

let modalMode = null;
window.openModal = function(type) {
    saveSelection(); 
    modalMode = type; 
    const body = document.getElementById('m-body-editor'); 
    const confirmBtn = document.getElementById('m-confirm-btn'); 
    const updateBtn = document.getElementById('m-update-btn');
    
    if(floatMenu) floatMenu.style.display = 'none';
    if(editBadge) editBadge.style.display = 'none';

    updateBtn.style.background = 'var(--forest)'; updateBtn.style.borderColor = 'var(--forest)';
    confirmBtn.style.display = 'flex'; updateBtn.style.display = 'none';

    if (type === 'divider') {
        document.getElementById('m-title-editor').innerText = '✂️ 設定分隔線 / 間距';
        let style = 'solid', width = '1px', color = '#dddddd', margin = '30px';
        if (currentTarget && currentTarget.tagName === 'HR' && currentTarget.classList.contains('peiyu-divider')) {
            const comp = window.getComputedStyle(currentTarget);
            if (comp.borderTopStyle === 'none' || comp.borderTopWidth === '0px') { style = 'none'; } 
            else { style = comp.borderTopStyle; width = comp.borderTopWidth; color = rgb2hex(comp.borderTopColor) || color; }
            margin = comp.marginTop; 
            confirmBtn.style.display = 'none';
            updateBtn.style.display = 'block'; 
            updateBtn.innerText = "✅ 確認修改線條"; 
            updateBtn.setAttribute('onclick', 'updateDivider()');
        }
        body.innerHTML = `<div class="editor-form-group"><label>線條樣式</label><select id="div-style" class="editor-form-input"><option value="none" ${style==='none'?'selected':''}>🫥 隱形 (僅作為空白間距)</option><option value="solid" ${style==='solid'?'selected':''}>直線 (Solid)</option><option value="dashed" ${style==='dashed'?'selected':''}>虛線 (Dashed)</option><option value="dotted" ${style==='dotted'?'selected':''}>點線 (Dotted)</option></select></div><div style="display:flex; gap:10px;"><div class="editor-form-group" style="flex:1;"><label>粗細</label><select id="div-width" class="editor-form-input"><option value="1px" ${width==='1px'?'selected':''}>1px</option><option value="2px" ${width==='2px'?'selected':''}>2px</option><option value="4px" ${width==='4px'?'selected':''}>4px</option></select></div><div class="editor-form-group" style="flex:1;"><label>上下間距</label><select id="div-margin" class="editor-form-input"><option value="8px" ${margin==='8px'?'selected':''}>微小 (8px)</option><option value="15px" ${margin==='15px'?'selected':''}>小 (15px)</option><option value="30px" ${margin==='30px'||margin==='25px'?'selected':''}>中 (30px)</option><option value="50px" ${margin==='50px'?'selected':''}>大 (50px)</option><option value="80px" ${margin==='80px'?'selected':''}>超大 (80px)</option></select></div></div><div class="editor-form-group" style="margin-bottom:0;"><label>線條顏色</label><input type="color" id="div-color" class="editor-form-input" value="${color}" style="height:40px; padding:2px;"></div>`;
    }
    else if (type === 'spacing') { 
        document.getElementById('m-title-editor').innerText = "⚙️ 排版設定"; confirmBtn.style.display = 'none'; 
        body.innerHTML = `<div style="background:#f9f9f9; padding:15px; border-radius:8px;"><div class="editor-form-group"><label>文字行高 <span id="val-lh" class="editor-sp-val">${spacingCfg.lh}</span></label><input type="range" id="sp-lh" class="editor-sp-slider" min="1.0" max="3.0" step="0.1" value="${spacingCfg.lh}" oninput="updateSpacingPreview()"></div><div class="editor-form-group"><label>段落間距 <span id="val-pmb" class="editor-sp-val">${spacingCfg.pmb}em</span></label><input type="range" id="sp-pmb" class="editor-sp-slider" min="0" max="3" step="0.1" value="${spacingCfg.pmb}" oninput="updateSpacingPreview()"></div><div class="editor-form-group"><label>清單外距 <span id="val-lmtb" class="editor-sp-val">${spacingCfg.lmtb}em</span></label><input type="range" id="sp-lmtb" class="editor-sp-slider" min="0" max="3" step="0.1" value="${spacingCfg.lmtb}" oninput="updateSpacingPreview()"></div><div class="editor-form-group" style="margin-bottom:0;"><label>清單內距 <span id="val-limb" class="editor-sp-val">${spacingCfg.limb}em</span></label><input type="range" id="sp-limb" class="editor-sp-slider" min="0" max="2" step="0.1" value="${spacingCfg.limb}" oninput="updateSpacingPreview()"></div></div>`; 
    }
    else if (type === 'table') { 
        document.getElementById('m-title-editor').innerText = '插入表格'; 
        body.innerHTML = `<div class="editor-form-group"><label>列數</label><input type="number" id="inp-rows" class="editor-form-input" value="3"></div><div class="editor-form-group"><label>欄數</label><input type="number" id="inp-cols" class="editor-form-input" value="3"></div><div class="editor-form-group"><label>邊框</label><input type="color" id="inp-border" class="editor-form-input" value="#dddddd" style="height:40px;"></div>`; 
    }
    else if (type === 'h2' || type === 'h3') { 
        document.getElementById('m-title-editor').innerText = type === 'h2' ? '插入主標題' : '插入副標題'; 
        body.innerHTML = `<div class="editor-form-group"><label>標題</label><input type="text" id="inp-text" class="editor-form-input"></div><div class="editor-form-group"><label>風格</label><select id="inp-theme" class="editor-form-input"><option value="forest">🌲 經典深綠</option><option value="gold">👑 尊爵金底</option><option value="cream">🍦 溫柔奶油</option></select></div>`; 
    }
    else if (type === 'card') { 
        document.getElementById('m-title-editor').innerText = '插入卡片'; 
        body.innerHTML = `<div class="editor-form-group"><label>標題</label><input type="text" id="inp-title" class="editor-form-input"></div><div class="editor-form-group"><label>標籤 (逗號分隔)</label><input type="text" id="inp-tags" class="editor-form-input"></div><div class="editor-form-group"><label>圖示</label><input type="text" id="inp-icon" class="editor-form-input" value="✨"></div>`; 
    }
    else if (type === 'warn') { 
        document.getElementById('m-title-editor').innerText = '插入警告'; 
        body.innerHTML = `<div class="editor-form-group"><label>標題</label><input type="text" id="inp-title" class="editor-form-input" value="注意"></div><div class="editor-form-group"><label>顏色</label><select id="inp-theme" class="editor-form-input"><option value="red">🔴 紅色</option><option value="yellow">🟡 黃色</option><option value="blue">🔵 藍色</option></select></div>`; 
    }
    else if (type === 'tabs') { 
        document.getElementById('m-title-editor').innerText = '插入內文頁籤'; 
        body.innerHTML = `<div class="editor-form-group"><label>頁籤名稱 (請用逗號分隔)</label><input type="text" id="inp-tabs" class="editor-form-input" placeholder="例如：特質, 提醒, 建議"></div><p style="font-size:12px; color:#888; margin-top:5px;">💡 提示：建立後可點擊黃色外框，使用選單新增或刪除。</p>`; 
    }
    else if (type === 'blocks_library') {
        document.getElementById('m-title-editor').innerText = '📦 選擇要插入的積木';
        confirmBtn.style.display = 'none'; 
        body.innerHTML = `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;"><button class="editor-btn" style="padding:15px; flex-direction:column; gap:5px; background:#fffcf5; border:1px solid #c6a87c;" onclick="openModal('h2')">🟡 <br>主標題</button><button class="editor-btn" style="padding:15px; flex-direction:column; gap:5px; background:#fffcf5; border:1px solid #c6a87c;" onclick="openModal('h3')">🟢 <br>副標題</button><button class="editor-btn" style="padding:15px; flex-direction:column; gap:5px; border:1px solid #ddd;" onclick="openModal('card')">💡 <br>資訊卡</button><button class="editor-btn" style="padding:15px; flex-direction:column; gap:5px; border:1px solid #ddd;" onclick="openModal('warn')">🚨 <br>警告框</button><button class="editor-btn" style="padding:15px; flex-direction:column; gap:5px; grid-column: span 2; border:1px solid #ddd;" onclick="openModal('tabs')">📑 <br>插入內文頁籤群組</button><button class="editor-btn" style="padding:15px; flex-direction:column; gap:5px; border:1px solid #ddd;" onclick="openModal('container-box')">🍱 <br>緊身容器框</button><button class="editor-btn" style="padding:15px; flex-direction:column; gap:5px; grid-column: span 2; background:#e3f2fd; color:#2980b9; border:1px dashed #3498db; font-weight:bold;" onclick="insertHtml('&nbsp;<span class=\\'peiyu-rwd-br peiyu-obj\\' contenteditable=\\'false\\'></span>&nbsp;'); document.getElementById('config-modal').style.display='none';">📱 <br>插入「手機專屬斷行點」</button></div>`;
    }
    else if (type === 'link') {
        document.getElementById('m-title-editor').innerText = '🔗 插入超連結 / 按鈕';
        let linkUrl = 'https://', linkText = '', linkStyle = 'text', isNewTab = true;
        let isEditing = currentTarget && currentTarget.tagName === 'A';
        if (isEditing) {
            linkUrl = currentTarget.href || 'https://'; linkText = currentTarget.innerText;
            linkStyle = currentTarget.classList.contains('peiyu-link-btn') ? 'button' : 'text';
            isNewTab = currentTarget.target === '_blank';
            confirmBtn.style.display = 'none'; updateBtn.style.display = 'flex';
            updateBtn.innerText = "✅ 確認修改連結"; updateBtn.style.background = 'var(--purple)'; updateBtn.style.borderColor = 'var(--purple)'; updateBtn.setAttribute('onclick', 'updateLink()');
        } else {
            const sel = window.getSelection(); linkText = sel.toString().trim(); 
            confirmBtn.style.display = 'flex'; updateBtn.style.display = 'none';
        }
        body.innerHTML = `<div class="editor-form-group"><label>顯示文字</label><input type="text" id="inp-link-text" class="editor-form-input" value="${linkText}" placeholder="例如：點擊前往首頁"></div><div class="editor-form-group"><label>目標網址 (URL)</label><input type="text" id="inp-link-url" class="editor-form-input" value="${linkUrl}"></div><div style="display:flex; gap:10px;"><div class="editor-form-group" style="flex:1;"><label>顯示樣式</label><select id="inp-link-style" class="editor-form-input"><option value="text" ${linkStyle==='text'?'selected':''}>📝 一般文字超連結</option><option value="button" ${linkStyle==='button'?'selected':''}>🔘 圓角按鈕樣式</option></select></div><div class="editor-form-group" style="flex:1; display:flex; align-items:flex-end;"><label style="display:flex; align-items:center; gap:5px; height:38px; margin:0; cursor:pointer;"><input type="checkbox" id="inp-link-tab" ${isNewTab ? 'checked' : ''} style="width:18px; height:18px; margin:0;"> 另開新分頁</label></div></div>`;
    }
    else if (type === 'maintenance') {
        document.getElementById('m-title-editor').innerText = '🛠️ 文章格式大整理';
        confirmBtn.style.display = 'none'; 
        body.innerHTML = `<div style="display:flex; flex-direction:column; gap:12px;"><div style="border-bottom:1px solid #eee; padding-bottom:10px;"><div style="font-size:12px; font-weight:bold; color:#888; margin-bottom:8px;">🚀 救援與轉換</div><div style="display:flex; gap:8px;"><button class="editor-btn" style="flex:1; background:#f0f7ff; color:#0056b3; border:1px solid #cce5ff; padding:10px;" onclick="batchGateTransform(); document.getElementById('config-modal').style.display='none';">🌟 全篇閘門化</button><button class="editor-btn" style="flex:1; background:#f0f7ff; color:#0056b3; border:1px solid #cce5ff; padding:10px;" onclick="normalizeTextFormats(); document.getElementById('config-modal').style.display='none';">🔤 格式轉碼</button><button class="editor-btn" style="flex:1; background:#fffcf5; color:#c6a87c; border:1px solid #c6a87c; padding:10px;" onclick="fixExistingCustomBoxes(); document.getElementById('config-modal').style.display='none';">✨ 舊外框美化</button></div></div><div><div style="font-size:12px; font-weight:bold; color:#888; margin-bottom:8px;">🧹 局部除髒</div><div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;"><button class="editor-btn" style="background:#f4f6f8; border:1px solid #ddd; padding:8px;" onclick="executeClean('ai')">🤖 除 AI 格式</button><button class="editor-btn" style="background:#f4f6f8; border:1px solid #ddd; padding:8px;" onclick="executeClean('bg')">🎨 僅除背景色</button><button class="editor-btn" style="background:#f4f6f8; border:1px solid #ddd; padding:8px;" onclick="executeClean('table')">🔲 表格除髒</button><button class="editor-btn" style="background:#f4f6f8; border:1px solid #ddd; padding:8px;" onclick="executeClean('text')">📝 文字除髒</button></div><button class="editor-btn" style="width:100%; margin-top:8px; background:#fff5f5; border:1px solid #fadbd8; color:#c0392b; font-weight:bold; padding:10px;" onclick="executeClean('all')">🧨 全部強力除髒</button></div></div>`;
    }
    else if (type === 'container-box') {
        document.getElementById('m-title-editor').innerText = '🍱 設定緊身容器框';
        let bg = '#fffdf9', borderCol = '#e3e8ee'; let radius = '8px', borderStyle = 'solid', borderWidth = '1px';
        let isEditing = currentTarget && currentTarget.classList.contains('peiyu-container-box');
        
        if (isEditing) {
            const comp = window.getComputedStyle(currentTarget);
            bg = rgb2hex(comp.backgroundColor) || bg; borderCol = rgb2hex(comp.borderTopColor) || borderCol; radius = comp.borderRadius; borderStyle = comp.borderTopStyle; borderWidth = comp.borderTopWidth;
            confirmBtn.style.display = 'none'; updateBtn.style.display = 'flex'; updateBtn.innerText = "✅ 確認修改容器"; updateBtn.style.background = 'var(--forest)'; updateBtn.style.borderColor = 'var(--forest)'; updateBtn.setAttribute('onclick', 'updateContainerBox()');
        } else { confirmBtn.style.display = 'flex'; updateBtn.style.display = 'none'; }

        body.innerHTML = `<div style="display:flex; gap:10px;"><div class="editor-form-group" style="flex:1;"><label>形狀</label><select id="ct-radius" class="editor-form-input"><option value="0px" ${radius==='0px'?'selected':''}>直角</option><option value="8px" ${radius==='8px'||radius==='6px'?'selected':''}>微圓角</option><option value="20px" ${radius==='20px'?'selected':''}>大圓角</option></select></div><div class="editor-form-group" style="flex:1;"><label>框線</label><select id="ct-style" class="editor-form-input"><option value="none" ${borderStyle==='none'?'selected':''}>無框線</option><option value="solid" ${borderStyle==='solid'?'selected':''}>實線</option><option value="dashed" ${borderStyle==='dashed'?'selected':''}>虛線</option></select></div><div class="editor-form-group" style="flex:1;"><label>粗細</label><select id="ct-width" class="editor-form-input"><option value="1px" ${borderWidth==='1px'?'selected':''}>1px</option><option value="2px" ${borderWidth==='2px'?'selected':''}>2px</option><option value="4px" ${borderWidth==='4px'?'selected':''}>4px</option></select></div></div><div style="display:flex; gap:10px; margin-bottom:0;"><div class="editor-form-group" style="flex:1; margin-bottom:0;"><label>背景色</label><input type="color" id="ct-bg" class="editor-form-input" value="${bg}" style="height:40px; padding:2px;"></div><div class="editor-form-group" style="flex:1; margin-bottom:0;"><label>框線色</label><input type="color" id="ct-border-color" class="editor-form-input" value="${borderCol}" style="height:40px; padding:2px;"></div></div>${!isEditing ? `<div class="editor-form-group" style="margin-top:15px;"><label>預設文字 (若有反白文字則會自動包裝進來)</label><input type="text" id="ct-text" class="editor-form-input" value="請在此輸入內容..." placeholder="會出現在框內的預設文字"></div>` : ''}`;
    }
    else if (type === 'custom-box') {
        document.getElementById('m-title-editor').innerText = '🔲 自訂文字外框';
        let savedPrefs = localStorage.getItem('peiyu_box_prefs'); let prefs = savedPrefs ? JSON.parse(savedPrefs) : {};
        let bg = prefs.bg || '#fffcf5', borderCol = prefs.borderCol || '#c6a87c', textCol = prefs.color || '#1a2f23'; let radius = prefs.radius || '50px', borderStyle = prefs.style || 'solid', borderWidth = prefs.width || '2px'; let displayType = prefs.displayType || 'inline-block'; let textValue = '';
        let isEditingBox = currentTarget && currentTarget.classList.contains('peiyu-custom-box');

        if (isEditingBox) {
            const comp = window.getComputedStyle(currentTarget);
            bg = rgb2hex(comp.backgroundColor) || bg; textCol = rgb2hex(comp.color) || textCol; borderCol = rgb2hex(comp.borderTopColor) || borderCol; radius = comp.borderRadius; borderStyle = comp.borderTopStyle; borderWidth = comp.borderTopWidth; displayType = comp.display === 'block' ? 'block' : 'inline-block';
            confirmBtn.style.display = 'none'; const updateBtn = document.getElementById('m-update-btn'); updateBtn.style.display = 'flex'; updateBtn.innerText = "✅ 確認修改外框"; updateBtn.setAttribute('onclick', 'updateCustomBox()'); textValue = "⚠️ 修改模式：請直接在編輯器內改字或插圖"; 
        } else {
            const sel = window.getSelection(); textValue = sel.toString(); confirmBtn.style.display = 'flex'; document.getElementById('m-update-btn').style.display = 'none';
        }
        const previewText = isEditingBox ? '[文字預覽]' : (textValue || '[文字預覽]');
        const initBorderStr = borderStyle === 'none' ? 'none' : `${borderWidth} ${borderStyle} ${borderCol}`;

        body.innerHTML = `<div style="margin-bottom: 15px; padding: 15px; background: #f0f4f8; border-radius: 8px; text-align: center; border: 1px dashed #ccc; min-height: 80px; display: flex; align-items: center; justify-content: center; flex-direction: column;"><span style="font-size: 12px; color: #888; margin-bottom: 8px; font-weight: bold;">👀 即時預覽</span><div style="width: 100%;"><div id="cb-preview-box" style="display: ${displayType === 'inline-block' ? 'inline-block' : 'block'}; padding: ${displayType === 'inline-block' ? '2px 14px' : '15px 20px'}; border: ${initBorderStr}; border-radius: ${radius}; background-color: ${bg}; color: ${textCol}; font-family: 'Noto Serif TC', serif; font-size: ${displayType === 'inline-block' ? '1.05rem' : '1.1rem'}; font-weight: bold; width: ${displayType === 'block' ? '100%' : 'auto'}; box-sizing: border-box;">${previewText}</div></div></div><div class="editor-form-group"><label>外框類型 (決定換行行為)</label><select id="cb-display" class="editor-form-input" onchange="updateCustomBoxPreview()"><option value="inline-block" ${displayType==='inline-block'?'selected':''}>🏷️ 文字外框 (隨字寬度，適合當標題/標籤)</option><option value="block" ${displayType==='block'?'selected':''}>📦 段落容器 (滿版寬度，按 Enter 可換行)</option></select></div><div class="editor-form-group"><label>文字內容</label><input type="text" id="cb-text" class="editor-form-input" value="${textValue}" placeholder="請輸入內容或先在編輯器反白文字" ${isEditingBox ? 'disabled' : ''} oninput="document.getElementById('cb-preview-box').innerText = this.value || '[文字預覽]';"></div><div style="display:flex; gap:10px;"><div class="editor-form-group" style="flex:1;"><label>形狀</label><select id="cb-radius" class="editor-form-input" onchange="updateCustomBoxPreview()"><option value="0px" ${radius==='0px'?'selected':''}>直角</option><option value="6px" ${radius==='6px'?'selected':''}>微圓角</option><option value="50px" ${radius==='50px'||radius.includes('50')?'selected':''}>膠囊狀</option></select></div><div class="editor-form-group" style="flex:1;"><label>框線</label><select id="cb-style" class="editor-form-input" onchange="updateCustomBoxPreview()"><option value="none" ${borderStyle==='none'?'selected':''}>無框線</option><option value="solid" ${borderStyle==='solid'?'selected':''}>實線</option><option value="dashed" ${borderStyle==='dashed'?'selected':''}>虛線</option><option value="dotted" ${borderStyle==='dotted'?'selected':''}>點線</option></select></div><div class="editor-form-group" style="flex:1;"><label>粗細</label><select id="cb-width" class="editor-form-input" onchange="updateCustomBoxPreview()"><option value="1px" ${borderWidth==='1px'?'selected':''}>1px</option><option value="2px" ${borderWidth==='2px'?'selected':''}>2px</option><option value="4px" ${borderWidth==='4px'?'selected':''}>4px</option><option value="8px" ${borderWidth==='8px'?'selected':''}>8px</option></select></div></div><div style="display:flex; gap:10px; margin-bottom:0;"><div class="editor-form-group" style="flex:1; margin-bottom:0;"><label>字體色</label><input type="color" id="cb-color" class="editor-form-input" value="${textCol}" style="height:40px; padding:2px;" oninput="updateCustomBoxPreview()"></div><div class="editor-form-group" style="flex:1; margin-bottom:0;"><label>背景色</label><input type="color" id="cb-bg" class="editor-form-input" value="${bg}" style="height:40px; padding:2px;" oninput="updateCustomBoxPreview()"></div><div class="editor-form-group" style="flex:1; margin-bottom:0;"><label>框線色</label><input type="color" id="cb-border-color" class="editor-form-input" value="${borderCol}" style="height:40px; padding:2px;" oninput="updateCustomBoxPreview()"></div></div>`;
    }
    document.getElementById('config-modal').style.display = 'flex';
}

window.updateSpacingPreview = function() { 
    const currentScroll = editor.scrollTop; spacingCfg.lh = document.getElementById('sp-lh').value; spacingCfg.pmb = document.getElementById('sp-pmb').value; spacingCfg.lmtb = document.getElementById('sp-lmtb').value; spacingCfg.limb = document.getElementById('sp-limb').value; document.getElementById('val-lh').innerText = spacingCfg.lh; document.getElementById('val-pmb').innerText = spacingCfg.pmb + 'em'; document.getElementById('val-lmtb').innerText = spacingCfg.lmtb + 'em'; document.getElementById('val-limb').innerText = spacingCfg.limb + 'em'; applySpacingToEditor(); editor.scrollTop = currentScroll; saveHistory(); 
}

window.confirmInsert = function() {
    restoreSelection(); let html = '';
    if(modalMode === 'link') {
        const txt = document.getElementById('inp-link-text').value || '超連結';
        const url = document.getElementById('inp-link-url').value || '#';
        const isBtn = document.getElementById('inp-link-style').value === 'button';
        const newTab = document.getElementById('inp-link-tab').checked ? 'target="_blank"' : 'target="_top"';
        const cls = isBtn ? 'peiyu-link-btn peiyu-obj' : 'peiyu-link-text peiyu-obj';
        html = `&nbsp;<a href="${url}" ${newTab} class="${cls}" contenteditable="false">${txt}</a>&nbsp;`;
        insertHtml(html); document.getElementById('config-modal').style.display = 'none'; return;
    }
    else if (modalMode === 'container-box') {
        const radius = document.getElementById('ct-radius').value; const style = document.getElementById('ct-style').value; const width = document.getElementById('ct-width').value; const bg = document.getElementById('ct-bg').value; const borderCol = document.getElementById('ct-border-color').value; const defaultText = document.getElementById('ct-text') ? document.getElementById('ct-text').value : '請在此輸入內容...'; const borderStr = style === 'none' ? 'none' : `${width} ${style} ${borderCol}`;
        restoreSelection(); const sel = window.getSelection(); let innerContent = defaultText;
        if (sel.rangeCount > 0 && !sel.isCollapsed) { const range = sel.getRangeAt(0); const tempDiv = document.createElement('div'); tempDiv.appendChild(range.cloneContents()); if(tempDiv.innerHTML.trim() !== '') { innerContent = tempDiv.innerHTML; } }
        html = `<div class="peiyu-block peiyu-obj peiyu-container-box" style="width: fit-content; background-color: ${bg}; border: ${borderStr}; border-radius: ${radius}; padding: 15px 20px; margin: 15px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">${innerContent}</div><p><br></p>`;
    }
    if(modalMode === 'table') { const r=document.getElementById('inp-rows').value, c=document.getElementById('inp-cols').value, b=document.getElementById('inp-border').value; const bs = b==='#ffffff'?'none':`1px solid ${b}`; let h = ''; for(let i=0;i<r;i++){ let ch=''; for(let j=0;j<c;j++) ch+=`<td style="border:${bs};padding:8px 12px;">文字</td>`; h+=`<tr>${ch}</tr>`; } html = `<table class="peiyu-table peiyu-obj" style="border:${bs};width:100%;">${h}</table><p><br></p>`; }
    else if(modalMode === 'h2' || modalMode === 'h3') { 
        const text = document.getElementById('inp-text').value || '標題'; const theme = document.getElementById('inp-theme').value; const styles = { forest: { bg: '#1a2f23', col: '#fff', bor: '#c6a87c' }, gold: { bg: '#c6a87c', col: '#1a2f23', bor: '#1a2f23' }, cream: { bg: '#fffcf5', col: '#1a2f23', bor: '#c6a87c' } }; const s = styles[theme]; 
        if (modalMode === 'h2') { html = `<div class="peiyu-block peiyu-obj" style="margin: 15px 0 10px 0;"><h2 style="border-left: 8px solid ${s.bor}; background: ${s.bg}; color: ${s.col}; padding: 8px 18px; border-radius: 4px; font-family: 'Noto Serif TC', serif; font-size: 1.4rem; line-height: 1.3; white-space: normal; word-break: break-word; max-width: 100%; box-sizing: border-box; display: inline-block; box-shadow: 4px 4px 0px rgba(0,0,0,0.1); margin: 0;">${text}</h2></div><p><br></p>`; } else { html = `<div class="peiyu-block peiyu-obj" style="margin: 15px 0 5px 0;"><h3 style="border: 2px solid ${s.bor}; background: ${s.bg}; color: ${s.col}; padding: 6px 25px; border-radius: 50px; font-family: 'Noto Serif TC', serif; font-size: 1.1rem; line-height: 1.3; white-space: normal; word-break: break-word; max-width: 100%; box-sizing: border-box; display: inline-block; font-weight: bold; margin: 0;">${text}</h3></div><p><br></p>`; }
    }
    else if(modalMode === 'card') { 
        const title = document.getElementById('inp-title').value || '標題'; const icon = document.getElementById('inp-icon').value || '✨'; const tagsInput = document.getElementById('inp-tags').value; let tagsHtml = tagsInput ? tagsInput.split(/,|，/).map(t => `<span style="background-color: #f0f4f8; color: #34495e; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #dcebf7; margin-left:5px;">${t.trim()}</span>`).join('') : ''; html = `<div class="peiyu-block peiyu-obj" style="background-color: #ffffff; border: 1px solid #e3e8ee; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.03);"><div style="display: flex; align-items: center; flex-wrap: wrap; gap: 5px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 12px;"><span style="font-size: 20px; margin-right:5px;">${icon}</span><strong style="font-size: 17px; color: #2c3e50;">${title}</strong>${tagsHtml}</div><div style="color: #444; font-size: 15px; line-height: 1.8;"><p>請輸入內容...</p><ul><li>重點一</li></ul></div></div><p><br></p>`; 
    }
    else if(modalMode === 'warn') { 
        const title = document.getElementById('inp-title').value || '注意'; const theme = document.getElementById('inp-theme').value; const styles = { red: { bg: '#fdf2f2', bor: '#fadbd8', txt: '#c0392b' }, yellow: { bg: '#fffbe6', bor: '#ffe58f', txt: '#d48806' }, blue: { bg: '#e6f7ff', bor: '#91d5ff', txt: '#096dd9' } }; const s = styles[theme]; html = `<div class="peiyu-block peiyu-obj" style="background-color: ${s.bg}; border: 1px solid ${s.bor}; border-radius: 8px; padding: 20px; margin: 25px 0;"><strong style="color: ${s.txt}; display: block; margin-bottom: 10px; font-size: 16px;">${title}</strong><div style="color: #555; font-size: 15px; line-height: 1.6;">請輸入內容...</div></div><p><br></p>`; 
    }
    else if(modalMode === 'tabs') { 
        const tabsInput = document.getElementById('inp-tabs').value; if (!tabsInput) return alert('請輸入頁籤標題'); const tabs = tabsInput.split(/,|，/).map(t => t.trim()).filter(t => t); let sectionsHtml = tabs.map(t => window.getNewTabSectionHtml(t)).join(''); html = `<div class="peiyu-tabs-wrapper peiyu-obj" style="position:relative;"><div class="peiyu-tab-container" style="width: 100%;">${sectionsHtml}</div></div><p><br></p>`; 
    }
    else if (modalMode === 'custom-box') {
        const text = document.getElementById('cb-text').value || '自訂文字'; const radius = document.getElementById('cb-radius').value; const style = document.getElementById('cb-style').value; const width = document.getElementById('cb-width').value; const color = document.getElementById('cb-color').value; const bg = document.getElementById('cb-bg').value; const borderCol = document.getElementById('cb-border-color').value; const displayType = document.getElementById('cb-display').value; 
        const prefs = { bg, color, borderCol, radius, style, width, displayType }; localStorage.setItem('peiyu_box_prefs', JSON.stringify(prefs)); const borderStr = style === 'none' ? 'none' : `${width} ${style} ${borderCol}`;
        
        if (displayType === 'inline-block') {
            html = `&nbsp;<span class="peiyu-block ue-obj peiyu-custom-box" style="display: inline-block; padding: 2px 14px; margin: 0 4px; border: ${borderStr}; border-radius: ${radius}; background-color: ${bg}; color: ${color}; font-family: 'Noto Serif TC', serif; font-size: 1.05rem; vertical-align: baseline; box-sizing: border-box; font-weight: bold;">${text}</span>&nbsp;`;
            insertHtml(html); document.getElementById('config-modal').style.display = 'none'; return; 
        } else {
            html = `<div class="peiyu-block peiyu-obj peiyu-custom-box" style="display: block; padding: 15px 20px; margin: 15px 0; border: ${borderStr}; border-radius: ${radius}; background-color: ${bg}; color: ${color}; font-family: 'Noto Serif TC', serif; font-size: 1.1rem; line-height: 1.6; word-break: break-word; white-space: normal; max-width: 100%; box-sizing: border-box; font-weight: bold; text-align: justify; text-justify: inter-ideograph;"><div>${text}</div></div><p><br></p>`;
        }
    }
    else if (modalMode === 'divider') {
        const style = document.getElementById('div-style').value; const width = document.getElementById('div-width').value; const margin = document.getElementById('div-margin').value; const color = document.getElementById('div-color').value; let borderCss = style === 'none' ? 'none' : `${width} ${style} ${color}`;
        html = `<hr class="peiyu-block peiyu-obj peiyu-divider" style="border: none; border-top: ${borderCss}; margin: ${margin} 0; clear: both; cursor: pointer; width: 100%;">`;
    }

    restoreSelection(); const sel = window.getSelection(); 
    if (sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
        let range = sel.getRangeAt(0);
        if (!sel.isCollapsed) { range.deleteContents(); range = sel.getRangeAt(0); }
        let node = range.startContainer; let blockNode = node.nodeType === 3 ? node.parentNode : node;
        while (blockNode && blockNode !== editor && !['P', 'DIV', 'H2', 'H3', 'LI', 'TD', 'TH'].includes(blockNode.tagName)) { blockNode = blockNode.parentNode; }
        
        if (blockNode && blockNode !== editor && !blockNode.classList.contains('peiyu-article')) {
            if (blockNode.tagName === 'TD' || blockNode.tagName === 'TH') {
                blockNode.insertAdjacentHTML('beforeend', html); const newP = blockNode.lastElementChild;
                if (newP && newP.tagName === 'P') { const newRange = document.createRange(); newRange.selectNodeContents(newP); newRange.collapse(true); sel.removeAllRanges(); sel.addRange(newRange); }
            } else {
                const isEmpty = blockNode.textContent.trim() === '' && blockNode.querySelectorAll('img, table, iframe').length === 0;
                const preRange = range.cloneRange(); preRange.selectNodeContents(blockNode); preRange.setEnd(range.startContainer, range.startOffset);
                const isAtStart = preRange.toString().trim() === '' && preRange.cloneContents().querySelectorAll('img, table, iframe').length === 0;
                const tempDiv = document.createElement('div'); tempDiv.innerHTML = html; const frag = document.createDocumentFragment(); let lastP = null;
                while (tempDiv.firstChild) { if (tempDiv.firstChild.tagName === 'P') lastP = tempDiv.firstChild; frag.appendChild(tempDiv.firstChild); }

                if (isEmpty) { blockNode.parentNode.insertBefore(frag, blockNode); blockNode.remove(); } 
                else if (isAtStart) { blockNode.parentNode.insertBefore(frag, blockNode); lastP = null; } 
                else { blockNode.parentNode.insertBefore(frag, blockNode.nextSibling); }
                
                if (lastP) { const newRange = document.createRange(); newRange.selectNodeContents(lastP); newRange.collapse(true); sel.removeAllRanges(); sel.addRange(newRange); }
            }
        } else { editor.insertAdjacentHTML('beforeend', html); }
    } else { editor.insertAdjacentHTML('beforeend', html); }
    
    saveHistory(); document.getElementById('config-modal').style.display = 'none';
}

window.updateDivider = function() {
    if (!currentTarget || currentTarget.tagName !== 'HR') return;
    const style = document.getElementById('div-style').value; const width = document.getElementById('div-width').value; const margin = document.getElementById('div-margin').value; const color = document.getElementById('div-color').value;
    currentTarget.style.margin = `${margin} 0`; currentTarget.style.borderTop = style === 'none' ? 'none' : `${width} ${style} ${color}`;
    saveHistory(); document.getElementById('config-modal').style.display = 'none';
};

window.openGallery = async function(){ saveSelection(); document.getElementById('gallery-modal').style.display='flex'; loadGalleryImages(); }
window.closeGallery = function(){ document.getElementById('gallery-modal').style.display='none'; }
window.switchBucket = function(){ currentBucket=document.getElementById('bucket-select').value; loadGalleryImages(); }

async function loadGalleryImages(){ 
    const g = document.getElementById('gallery-content'); g.innerHTML = "讀取中..."; 
    const {data} = await myDB.storage.from(currentBucket).list('',{limit:100, sortBy:{column:'created_at', order:'desc'}}); 
    if(!data){ g.innerHTML="讀取失敗"; return; } 
    g.innerHTML = data.map(f => { 
        if(f.name === '.emptyFolderPlaceholder') return ''; 
        const u = myDB.storage.from(currentBucket).getPublicUrl(f.name).data.publicUrl; 
        return `<div class="editor-gallery-item"><img src="${u}" onclick="insertImageToEditor('${u}')" style="cursor:pointer;" title="點擊插入"><div class="gallery-item-name">${f.name}</div><button onclick="deleteGalleryImage('${f.name}')" style="position:absolute; top:5px; right:5px; background:rgba(231,76,60,0.9); color:white; border:none; border-radius:50%; width:24px; height:24px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.3); z-index:20;"><i class="fas fa-trash"></i></button></div>`; 
    }).join(''); 
}

window.deleteGalleryImage = async function(fileName) {
    if (!confirm(`確定要永久刪除「${fileName}」嗎？\n注意：如果已有文章使用此圖片，將會破圖！`)) return;
    try {
        const { error: storageErr } = await myDB.storage.from(currentBucket).remove([fileName]);
        if (storageErr) throw storageErr;
        await myDB.from('site_content').delete().like('image_url', `%${fileName}%`);
        alert("✅ 圖片已刪除"); loadGalleryImages(); 
    } catch (err) { alert("❌ 刪除失敗：" + err.message); }
}

window.uploadToDB = async function(input){ 
    const file = input.files[0]; if(!file) return; 
    const btn = document.querySelector('.editor-gallery-header button[onclick*="upload-input"]');
    const nameInput = document.getElementById('custom-img-name'); const originalText = btn.innerHTML;
    let rawName = nameInput.value.trim() || file.name.split('.').slice(0, -1).join('.');
    const cleanName = rawName.replace(/[^a-z0-9]/gi, '_').toLowerCase(); const finalID = `art_${Date.now()}_${cleanName}`;
    const targetBucket = currentBucket; const dbCategory = 'kb_asset'; const fName = `${finalID}.jpg`; 

    btn.innerHTML = "⏳ 處理中..."; btn.disabled = true;

    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = function(e) {
        const img = new Image(); img.src = e.target.result;
        img.onload = function() {
            const cvs = document.createElement('canvas'); const ctx = cvs.getContext('2d');
            const MAX = 1200; let w = img.width, h = img.height; 
            if(w > MAX || h > MAX){ if(w > h) { h *= MAX/w; w = MAX; } else { w *= MAX/h; h = MAX; } }
            cvs.width = w; cvs.height = h; ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
            cvs.toBlob(async function(blob){
                try {
                    const { error: storageErr } = await myDB.storage.from(targetBucket).upload(fName, blob, { upsert: true });
                    if(storageErr) throw storageErr;
                    const { data: urlData } = myDB.storage.from(targetBucket).getPublicUrl(fName); const publicUrl = urlData.publicUrl;
                    await myDB.from('site_content').insert([{ title: rawName, category: dbCategory, image_url: publicUrl, body: 'asset' }]);
                    insertImageToEditor(publicUrl); 
                    btn.innerHTML = originalText; btn.disabled = false; nameInput.value = ''; input.value = ''; closeGallery();
                } catch (err) { alert("插入失敗：" + err.message); btn.innerHTML = originalText; btn.disabled = false; }
            }, 'image/jpeg', 0.85); 
        }
    }
}
// 🔥 RWD 視窗縮放修復引擎：回到電腦版大視窗時，強制洗掉手機版的隱藏設定
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            const drawer = document.querySelector('.editor-sticky-header');
            if (drawer) {
                drawer.classList.remove('show-drawer');
                drawer.dataset.activeGroup = '';
                drawer.querySelectorAll('.tb-group').forEach(group => {
                    group.style.removeProperty('display'); // 撕掉強制隱藏/顯示的標籤
                });
            }
            // 同時確保手機版的浮動修改按鈕在電腦版會乖乖隱藏
            const mEditBtn = document.getElementById('m-context-edit-btn');
            if (mEditBtn) mEditBtn.style.display = 'none';
        }
    });

// 確保網頁一讀取完就準備好
document.addEventListener("DOMContentLoaded", () => UnivEditor.init());
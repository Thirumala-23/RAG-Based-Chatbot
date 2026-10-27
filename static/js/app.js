document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const fileEmpty = document.getElementById('fileEmpty');
    const fileCard = document.getElementById('fileCard');
    const fileNameEl = document.getElementById('fileName');
    const fileMetaEl = document.getElementById('fileMeta');
    const clearFileBtn = document.getElementById('clearFileBtn');
    
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const appContainer = document.querySelector('.app-container');
    const newChatBtn = document.getElementById('newChatBtn');
    const shareBtn = document.getElementById('shareBtn');
    
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKeyIndicator = document.getElementById('apiKeyIndicator');
    
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeDropdownMenu = document.getElementById('themeDropdownMenu');
    const themeMenuItems = document.querySelectorAll('.theme-menu-item');
    const historyList = document.getElementById('historyList');
    
    const headerFilename = document.getElementById('headerFilename');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const micBtn = document.getElementById('micBtn');
    const toastContainer = document.getElementById('toastContainer');
    
    // Application State
    let isFileUploaded = false;
    let activePdfId = null;
    let recognition = null;
    let isListening = false;
    let selectedModel = localStorage.getItem('active_model') || '';
    let isOllamaRunning = false;
    let pulledModels = [];
    let currentTheme = localStorage.getItem('theme_preference') || 'dark';

    // Collapse/Expand state for PDF history cards
    const collapsedPdfIds = new Set();
    const initializedPdfIds = new Set();

    // Initialize UI states
    initApiStatus();
    initTheme();
    initSpeechRecognition();
    loadHistory();
    initCollapsibleSidebar();
    initNewChatBtn();
    initShareBtn();
    bindDashboardEvents();

    // Dynamic time-of-day greeting initializer
    updateDynamicGreeting();
    initCursorGlow();

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) {
            return "Good morning";
        } else if (hour < 17) {
            return "Good afternoon";
        } else {
            return "Good evening";
        }
    }

    function updateDynamicGreeting() {
        const greetingText = document.getElementById('greetingText');
        if (greetingText) {
            greetingText.textContent = getGreeting();
        }
    }

    // --- Interactive Spotlight Glow ---
    function initCursorGlow() {
        document.addEventListener('mousemove', (e) => {
            document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
            document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        });
    }

    // --- Collapsible Sidebar Controller ---
    function initCollapsibleSidebar() {
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebarToggleBtn && appContainer) {
            // Function to update overlay state on small screens/zoom
            function updateOverlayState() {
                const isSmallScreen = window.innerWidth <= 850;
                const isSidebarOpen = !appContainer.classList.contains('sidebar-collapsed');
                
                if (sidebarOverlay) {
                    if (isSmallScreen && isSidebarOpen) {
                        sidebarOverlay.classList.remove('hidden');
                    } else {
                        sidebarOverlay.classList.add('hidden');
                    }
                }
            }

            sidebarToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                appContainer.classList.toggle('sidebar-collapsed');
                
                // Only save collapsed state preference if we are on a desktop width
                if (window.innerWidth > 850) {
                    localStorage.setItem('sidebar_collapsed_preference', appContainer.classList.contains('sidebar-collapsed') ? 'true' : 'false');
                }
                
                updateOverlayState();
            });
            
            // Close sidebar when clicking backdrop overlay
            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', () => {
                    appContainer.classList.add('sidebar-collapsed');
                    sidebarOverlay.classList.add('hidden');
                });
            }
            
            // Handle window resizing and zoom levels
            function handleResize() {
                const isSmallScreen = window.innerWidth <= 850;
                
                if (isSmallScreen) {
                    // On small screens/high zoom, always collapse by default to prevent clutter
                    appContainer.classList.add('sidebar-collapsed');
                    if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
                } else {
                    // On desktop, restore the user's preference
                    const isCollapsedPreference = localStorage.getItem('sidebar_collapsed_preference') === 'true';
                    if (isCollapsedPreference) {
                        appContainer.classList.add('sidebar-collapsed');
                    } else {
                        appContainer.classList.remove('sidebar-collapsed');
                    }
                    if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
                }
            }
            
            window.addEventListener('resize', handleResize);
            
            // Initial run on load
            handleResize();
        }
    }

    // --- New Chat Controller ---
    function initNewChatBtn() {
        if (newChatBtn) {
            newChatBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await fetch('/clear', { method: 'POST' });
                    resetUploadZone();
                    showToast('Cleared chat context. Started a new chat!', 'success');
                    showWelcomeDashboard();
                } catch (error) {
                    showToast('Failed to start a new chat.', 'error');
                }
            });
        }
    }

    // --- Share Button Controller ---
    function initShareBtn() {
        const shareModal = document.getElementById('shareModal');
        const closeShareBtn = document.getElementById('closeShareBtn');
        const shareLinkInput = document.getElementById('shareLinkInput');
        const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
        
        const shareWhatsapp = document.getElementById('shareWhatsapp');
        const shareLinkedin = document.getElementById('shareLinkedin');
        const shareTwitter = document.getElementById('shareTwitter');

        if (shareBtn && shareModal) {
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Construct Share URL
                const shareUrl = window.location.origin + (activePdfId ? `/select_pdf/${activePdfId}` : '');
                
                // Populate input
                if (shareLinkInput) {
                    shareLinkInput.value = shareUrl;
                }

                // Configure social URLs
                const encodedUrl = encodeURIComponent(shareUrl);
                const encodedText = encodeURIComponent("Check out this interactive PDF Q&A workspace!");
                
                if (shareWhatsapp) shareWhatsapp.href = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
                if (shareLinkedin) shareLinkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                if (shareTwitter) shareTwitter.href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;

                // Open modal
                shareModal.classList.remove('hidden');
            });
        }

        // Close Share Modal handlers
        if (closeShareBtn && shareModal) {
            closeShareBtn.addEventListener('click', () => {
                shareModal.classList.add('hidden');
            });
        }

        if (shareModal) {
            shareModal.addEventListener('click', (e) => {
                if (e.target === shareModal) {
                    shareModal.classList.add('hidden');
                }
            });
        }

        // Copy Share Link logic
        if (copyShareLinkBtn && shareLinkInput) {
            copyShareLinkBtn.addEventListener('click', () => {
                const url = shareLinkInput.value;
                navigator.clipboard.writeText(url).then(() => {
                    showToast('Share link copied to clipboard!', 'success');
                    
                    // Show "Copied!" feedback state
                    const origHtml = copyShareLinkBtn.innerHTML;
                    copyShareLinkBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Copied!</span>
                    `;
                    copyShareLinkBtn.classList.remove('btn-primary');
                    copyShareLinkBtn.style.backgroundColor = '#10b981'; // Emerald Green
                    copyShareLinkBtn.style.borderColor = '#10b981';
                    
                    setTimeout(() => {
                        copyShareLinkBtn.innerHTML = origHtml;
                        copyShareLinkBtn.classList.add('btn-primary');
                        copyShareLinkBtn.style.backgroundColor = '';
                        copyShareLinkBtn.style.borderColor = '';
                    }, 2000);
                }).catch(() => {
                    showToast('Failed to copy share link.', 'error');
                });
            });
        }
    }

    // --- Theme Controller ---
    
    function initTheme() {
        if (!themeToggleBtn) {
            console.log("themeToggleBtn not found. Skipping theme controller bindings.");
            return;
        }
        
        applyTheme(currentTheme);

        // Toggle active theme directly on clicking the button
        themeToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            let resolvedActiveTheme = currentTheme;
            if (currentTheme === 'system') {
                resolvedActiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            
            const nextTheme = (resolvedActiveTheme === 'light') ? 'dark' : 'light';
            currentTheme = nextTheme;
            localStorage.setItem('theme_preference', nextTheme);
            applyTheme(nextTheme);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (themeDropdownMenu && !e.target.closest('.theme-menu-container')) {
                themeDropdownMenu.classList.add('hidden');
            }
        });

        // Add click events for menu items
        if (themeMenuItems) {
            themeMenuItems.forEach(item => {
                item.addEventListener('click', () => {
                    const selectedTheme = item.dataset.theme;
                    currentTheme = selectedTheme;
                    localStorage.setItem('theme_preference', selectedTheme);
                    applyTheme(selectedTheme);
                    if (themeDropdownMenu) themeDropdownMenu.classList.add('hidden');
                });
            });
        }

        // Listen to system theme updates
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (currentTheme === 'system') {
                applyTheme('system');
            }
        });
    }

    function applyTheme(theme) {
        // Highlight active menu item
        if (themeMenuItems) {
            themeMenuItems.forEach(item => {
                if (item.dataset.theme === theme) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        // Update body class
        if (theme === 'light') {
            document.body.classList.add('theme-light');
        } else if (theme === 'dark') {
            document.body.classList.remove('theme-light');
        } else if (theme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (systemPrefersDark) {
                document.body.classList.remove('theme-light');
            } else {
                document.body.classList.add('theme-light');
            }
        }

        // Dynamically update toggle button icon in header
        if (themeToggleBtn) {
            updateThemeToggleIcon(theme);
        }
    }

    function updateThemeToggleIcon(theme) {
        if (!themeToggleBtn) return;
        let activeTheme = theme;
        if (theme === 'system') {
            activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        if (activeTheme === 'light') {
            themeToggleBtn.innerHTML = `
                <svg class="theme-icon-active" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            `;
        } else {
            themeToggleBtn.innerHTML = `
                <svg class="theme-icon-active" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            `;
        }
    }


    // --- History & PDF Listing Controller ---

    async function loadHistory() {
        try {
            const response = await fetch('/history');
            const data = await response.json();
            if (response.ok && data.success) {
                renderHistoryList(data.pdfs);
                // Auto-restore active PDF focus from session on page refresh
                if (data.active_pdf_id && !activePdfId) {
                    await selectActivePDF(data.active_pdf_id);
                }
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    function renderHistoryList(pdfs) {
        if (!pdfs || pdfs.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No upload history yet.</div>';
            return;
        }

        historyList.innerHTML = '';
        pdfs.forEach(pdf => {
            const itemDiv = document.createElement('div');
            
            // Initialize collapse state if not already initialized
            if (!initializedPdfIds.has(pdf.id)) {
                initializedPdfIds.add(pdf.id);
                if (pdf.id !== activePdfId) {
                    collapsedPdfIds.add(pdf.id);
                }
            }

            const isCollapsed = collapsedPdfIds.has(pdf.id);
            itemDiv.className = `history-item ${activePdfId === pdf.id ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`;
            itemDiv.dataset.pdfId = pdf.id;
            
            // Build question list HTML for this PDF
            let questionsHtml = '';
            if (pdf.questions && pdf.questions.length > 0) {
                questionsHtml = `<div class="history-questions">`;
                pdf.questions.forEach(q => {
                    const isPinned = q.is_pinned === 1;
                    questionsHtml += `
                        <div class="history-q-item ${isPinned ? 'pinned-q' : ''}" data-qa-id="${q.id}" data-question-text="${escapeHTML(q.question)}">
                            <span class="history-q-text" title="${escapeHTML(q.question)}">${escapeHTML(q.question)}</span>
                            <button class="history-q-pin-btn ${isPinned ? 'pinned' : ''}" data-qa-id="${q.id}" data-pinned="${q.is_pinned}" title="${isPinned ? 'Unpin' : 'Pin'} question">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    `;
                });
                questionsHtml += `</div>`;
            }

            itemDiv.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-title clickable-filename" title="${escapeHTML(pdf.filename)} (Click to view PDF in new tab)">${escapeHTML(pdf.filename)}</span>
                    <div class="history-item-actions">
                        <button class="action-btn view-pdf-btn" data-pdf-id="${pdf.id}" title="View PDF in new tab" style="margin-right: 4px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </button>
                        <button class="action-btn delete-pdf-btn" data-pdf-id="${pdf.id}" title="Delete PDF & History">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="history-item-meta">${pdf.total_pages} pages • ${pdf.file_size_mb} MB</div>
                ${questionsHtml}
            `;

            // Attach event listeners
            
            // 1. PDF Title Click (select active PDF)
            const titleEl = itemDiv.querySelector('.history-item-title');
            titleEl.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open('/view_pdf/' + pdf.id, '_blank');
            });

            // 1b. PDF Card Click (select active PDF)
            itemDiv.addEventListener('click', (e) => {
                // Ignore click if it came from actions/pins
                if (e.target.closest('.history-item-actions') || e.target.closest('.history-questions')) return;
                
                if (String(activePdfId) === String(pdf.id)) {
                    // Clicked the active item: toggle collapse state
                    if (collapsedPdfIds.has(pdf.id)) {
                        collapsedPdfIds.delete(pdf.id);
                        itemDiv.classList.remove('collapsed');
                    } else {
                        collapsedPdfIds.add(pdf.id);
                        itemDiv.classList.add('collapsed');
                    }
                } else {
                    // Clicked an inactive item: select it (which will expand it and collapse others)
                    selectActivePDF(pdf.id);
                }
            });

            // 2. View PDF icon click
            const viewPdfBtn = itemDiv.querySelector('.view-pdf-btn');
            viewPdfBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open('/view_pdf/' + pdf.id, '_blank');
            });

            // 3. Delete button click
            const deleteBtn = itemDiv.querySelector('.delete-pdf-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete ${pdf.filename} and all its chat history?`)) {
                    deletePDF(pdf.id);
                }
            });

            // 3. Question item clicks
            const qItems = itemDiv.querySelectorAll('.history-q-item');
            qItems.forEach(qItem => {
                qItem.addEventListener('click', async (e) => {
                    if (e.target.closest('.history-q-pin-btn')) return;
                    
                    const qaId = qItem.dataset.qaId;
                    
                    // If this PDF isn't active, select it first
                    if (String(activePdfId) !== String(pdf.id)) {
                        await selectActivePDF(pdf.id);
                    }
                    
                    // Use setTimeout to ensure the chat feed is fully rendered in the DOM before scrolling
                    setTimeout(() => {
                        const messageElement = document.getElementById(`qa-block-${qaId}`);
                        if (messageElement) {
                            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Add temporary highlighting effect
                            const bubble = messageElement.querySelector('.message-bubble');
                            if (bubble) {
                                bubble.style.borderColor = 'var(--color-medium)';
                                setTimeout(() => {
                                    bubble.style.borderColor = 'var(--border-color)';
                                }, 2000);
                            }
                        }
                    }, 50);
                });
            });

            // 4. Pin toggle clicks
            const pinBtns = itemDiv.querySelectorAll('.history-q-pin-btn');
            pinBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const qaId = btn.dataset.qaId;
                    const isCurrentlyPinned = btn.dataset.pinned === '1';
                    togglePinQuestion(qaId, isCurrentlyPinned ? 0 : 1);
                });
            });

            historyList.appendChild(itemDiv);
        });
    }

    // Toggle Pin state of a question
    async function togglePinQuestion(qaId, pinState) {
        try {
            const response = await fetch('/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qa_id: parseInt(qaId), is_pinned: pinState })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                showToast(pinState ? 'Question pinned to top!' : 'Question unpinned.', 'success');
                
                // If the PDF is the active one, reload chat view to update pins,
                // and refresh the history sidebar tree ordering
                await loadHistory();
                if (activePdfId) {
                    // Update active bubble visual pin icon state if present in DOM
                    const bubblePinBtn = document.querySelector(`#qa-block-${qaId} .bubble-pin-btn`);
                    if (bubblePinBtn) {
                        if (pinState) {
                            bubblePinBtn.classList.add('pinned');
                            bubblePinBtn.querySelector('svg').setAttribute('fill', 'currentColor');
                            bubblePinBtn.title = "Unpin Question";
                        } else {
                            bubblePinBtn.classList.remove('pinned');
                            bubblePinBtn.querySelector('svg').setAttribute('fill', 'none');
                            bubblePinBtn.title = "Pin Question";
                        }
                    }
                }
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            showToast('Failed to toggle pin state.', 'error');
        }
    }

    // Select Active PDF from history
    async function selectActivePDF(pdfId) {
        try {
            const response = await fetch(`/select_pdf/${pdfId}`, { method: 'POST' });
            const data = await response.json();
            if (response.ok && data.success) {
                activePdfId = pdfId;
                isFileUploaded = true;

                // Update UI active layouts
                if (fileEmpty) fileEmpty.classList.add('hidden');
                fileCard.classList.remove('hidden');
                
                fileNameEl.textContent = data.filename;
                fileMetaEl.textContent = `${data.total_pages} pages • ${data.file_size_mb} MB`;
                headerFilename.textContent = data.filename;
                
                // Enable Chat inputs
                userInput.disabled = false;
                sendBtn.disabled = false;
                if (micBtn) micBtn.disabled = false;
                userInput.placeholder = "Ask a question about " + data.filename + "...";
                userInput.focus();
                
                // Clear feed and rebuild conversation from data.chat_history
                rebuildChatFeed(data.chat_history, data.filename);
                
                // Update history listing visual active selections & collapse states
                document.querySelectorAll('.history-item').forEach(item => {
                    const itemId = String(item.dataset.pdfId);
                    const targetId = String(pdfId);
                    if (itemId === targetId) {
                        item.classList.add('active');
                        item.classList.remove('collapsed');
                        collapsedPdfIds.delete(pdfId);
                        collapsedPdfIds.delete(parseInt(pdfId));
                    } else {
                        item.classList.remove('active');
                        item.classList.add('collapsed');
                        collapsedPdfIds.add(parseInt(item.dataset.pdfId));
                    }
                });
                
                showToast(`Switched active PDF to ${data.filename}`, 'success');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            showToast(`Failed to select active PDF: ${error.message}`, 'error');
        }
    }

    // Delete PDF history record
    async function deletePDF(pdfId) {
        try {
            const response = await fetch(`/delete_pdf/${pdfId}`, { method: 'DELETE' });
            const data = await response.json();
            if (response.ok && data.success) {
                showToast('Document deleted.', 'success');
                
                // If we deleted the active document, reset the main chat layout
                if (activePdfId === pdfId) {
                    activePdfId = null;
                    resetUploadZone();
                    messagesContainer.innerHTML = `
                        <div class="message bot-message">
                            <div class="message-avatar">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M12 2v2M8 5h8M12 11V7M12 22v-3"></path>
                                </svg>
                            </div>
                            <div class="message-bubble-wrapper">
                                <div class="message-bubble">
                                    <p>The active document has been deleted. Upload a new PDF or select another from history to continue.</p>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                loadHistory();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            showToast('Failed to delete document.', 'error');
        }
    }

    // Rebuild the main chat feed messages
    function rebuildChatFeed(history, filename) {
        messagesContainer.innerHTML = '';
        
        if (!history || history.length === 0) {
            appendBotMessage(`I've loaded **${filename}**. Ask me any question about it below!`);
            return;
        }

        history.forEach(qa => {
            // Append User Question
            const userMsg = document.createElement('div');
            userMsg.className = 'message user-message';
            userMsg.id = `user-q-block-${qa.id}`;
            userMsg.innerHTML = `
                <div class="message-avatar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="message-bubble-wrapper">
                    <div class="message-bubble">
                        <div class="message-bubble-header" style="justify-content: flex-end; margin-bottom: 0.25rem;">
                            <div class="message-bubble-actions">
                                <button class="bubble-edit-btn" data-qa-id="${qa.id}" title="Edit Question" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0.15rem;border-radius:4px;display:flex;align-items:center;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button class="bubble-reload-btn" data-qa-id="${qa.id}" title="Regenerate Answer" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0.15rem;border-radius:4px;display:flex;align-items:center;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="23 4 23 10 17 10"></polyline>
                                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="user-question-content">${escapeHTML(qa.question)}</div>
                    </div>
                </div>
            `;
            messagesContainer.appendChild(userMsg);

            // Bind click listener for user edit
            const editBtn = userMsg.querySelector('.bubble-edit-btn');
            editBtn.addEventListener('click', () => {
                const questionContent = userMsg.querySelector('.user-question-content');
                if (!questionContent || userMsg.querySelector('.edit-mode-container')) return;

                const currentText = qa.question;
                questionContent.innerHTML = `
                    <div class="edit-mode-container" style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%; margin-top: 0.5rem;">
                        <textarea class="edit-question-textarea" style="width: 100%; min-height: 60px; padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-app); color: var(--text-primary); outline: none; font-family: var(--font-sans); font-size: 0.88rem; resize: vertical;">${escapeHTML(currentText)}</textarea>
                        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                            <button class="btn btn-secondary edit-cancel-btn" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Cancel</button>
                            <button class="btn btn-primary edit-save-btn" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Save & Submit</button>
                        </div>
                    </div>
                `;

                // Focus textarea
                const textarea = questionContent.querySelector('.edit-question-textarea');
                textarea.focus();
                textarea.setSelectionRange(textarea.value.length, textarea.value.length);

                // Cancel button
                questionContent.querySelector('.edit-cancel-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    questionContent.innerHTML = escapeHTML(currentText);
                });

                // Save button
                questionContent.querySelector('.edit-save-btn').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const newText = textarea.value.trim();
                    if (!newText) {
                        showToast("Question cannot be empty.", "error");
                        return;
                    }

                    // Show loader in bot message bubble
                    const botBubble = document.getElementById(`qa-block-${qa.id}`);
                    let oldBotBubbleContent = '';
                    if (botBubble) {
                        const botBubbleInner = botBubble.querySelector('.message-bubble');
                        if (botBubbleInner) {
                            oldBotBubbleContent = botBubbleInner.innerHTML;
                            botBubbleInner.innerHTML = `
                                <div class="message-bubble-header">
                                    <span class="user-name">Assistant</span>
                                </div>
                                <div class="typing-indicator" style="padding: 0.5rem 0;">
                                    <span class="typing-dot"></span>
                                    <span class="typing-dot"></span>
                                    <span class="typing-dot"></span>
                                </div>
                            `;
                        }
                    }

                    questionContent.innerHTML = `<span style="opacity: 0.75;">Saving change...</span>`;

                    try {
                        const headers = { 'Content-Type': 'application/json' };
                        const response = await fetch(`/edit_question/${qa.id}`, {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({ question: newText, model: selectedModel })
                        });

                        if (!response.ok) {
                            const errData = await response.json();
                            throw new Error(errData.error || "Failed to update question.");
                        }

                        // Prepare the bubble for streaming
                        const botBubbleInner = botBubble.querySelector('.message-bubble');
                        botBubbleInner.innerHTML = `
                            <div class="message-bubble-header">
                                <span class="user-name">Assistant</span>
                                <div class="message-bubble-actions">
                                    <button class="bubble-speak-btn hidden" title="Read Aloud">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                        </svg>
                                    </button>
                                    <button class="bubble-pin-btn hidden" title="Pin Question">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="bot-answer-text"></div>
                            <div class="streaming-citation-container"></div>
                        `;

                        const answerTextEl = botBubbleInner.querySelector('.bot-answer-text');
                        const citationContainer = botBubbleInner.querySelector('.streaming-citation-container');
                        let fullAnswerText = "";
                        let relevantPages = [];

                        questionContent.innerHTML = escapeHTML(newText);

                        await readResponseStream(
                            response,
                            (metadata) => {
                                relevantPages = metadata.relevant_pages || [];
                            },
                            (token) => {
                                fullAnswerText += token;
                                answerTextEl.innerHTML = markdownToHTML(fullAnswerText);
                            },
                            async (complete) => {
                                relevantPages = complete.relevant_pages || [];
                                if (relevantPages.length === 0) {
                                    citationContainer.innerHTML = '';
                                } else {
                                    renderStreamingCitations(complete.pdf_id, relevantPages, citationContainer);
                                }
                                setupCompleteBubbleActions(botBubble, qa.id, fullAnswerText, complete.pdf_id, relevantPages);
                                showToast("Question updated and response regenerated!", "success");
                                await loadHistory();
                            },
                            (err) => {
                                throw err;
                            }
                        );

                    } catch (err) {
                        showToast(err.message, "error");
                        questionContent.innerHTML = escapeHTML(currentText);
                        if (botBubble && botBubble.querySelector('.message-bubble')) {
                            botBubble.querySelector('.message-bubble').innerHTML = oldBotBubbleContent;
                        }
                    }
                });
            });

            // Bind click listener for reload/regenerate
            const reloadBtn = userMsg.querySelector('.bubble-reload-btn');
            reloadBtn.addEventListener('click', async () => {
                const botBubble = document.getElementById(`qa-block-${qa.id}`);
                if (!botBubble) return;

                const botBubbleInner = botBubble.querySelector('.message-bubble');
                if (!botBubbleInner) return;

                const oldBotBubbleContent = botBubbleInner.innerHTML;
                botBubbleInner.innerHTML = `
                    <div class="message-bubble-header">
                        <span class="user-name">Assistant</span>
                    </div>
                    <div class="typing-indicator" style="padding: 0.5rem 0;">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                `;

                showToast("Regenerating answer...", "info");

                try {
                    const headers = { 'Content-Type': 'application/json' };
                    const response = await fetch(`/regenerate/${qa.id}`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ model: selectedModel })
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.error || "Failed to regenerate answer.");
                    }

                    // Prepare the bubble for streaming
                    botBubbleInner.innerHTML = `
                        <div class="message-bubble-header">
                            <span class="user-name">Assistant</span>
                            <div class="message-bubble-actions">
                                <button class="bubble-speak-btn hidden" title="Read Aloud">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                    </svg>
                                </button>
                                <button class="bubble-pin-btn hidden" title="Pin Question">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="bot-answer-text"></div>
                        <div class="streaming-citation-container"></div>
                    `;

                    const answerTextEl = botBubbleInner.querySelector('.bot-answer-text');
                    const citationContainer = botBubbleInner.querySelector('.streaming-citation-container');
                    let fullAnswerText = "";
                    let relevantPages = [];

                    await readResponseStream(
                        response,
                        (metadata) => {
                            relevantPages = metadata.relevant_pages || [];
                        },
                        (token) => {
                            fullAnswerText += token;
                            answerTextEl.innerHTML = markdownToHTML(fullAnswerText);
                        },
                        async (complete) => {
                            relevantPages = complete.relevant_pages || [];
                            if (relevantPages.length === 0) {
                                citationContainer.innerHTML = '';
                            } else {
                                renderStreamingCitations(complete.pdf_id, relevantPages, citationContainer);
                            }
                            setupCompleteBubbleActions(botBubble, qa.id, fullAnswerText, complete.pdf_id, relevantPages);
                            showToast("Answer regenerated successfully!", "success");
                            await loadHistory();
                        },
                        (err) => {
                            throw err;
                        }
                    );

                } catch (err) {
                    showToast(err.message, "error");
                    botBubbleInner.innerHTML = oldBotBubbleContent;
                }
            });

            // Append Bot Response
            const botMsg = document.createElement('div');
            botMsg.className = 'message bot-message';
            botMsg.id = `qa-block-${qa.id}`;
            
            let citationCardHtml = '';
            if (qa.relevant_pages && qa.relevant_pages.length > 0) {
                let cardsHtml = '';
                qa.relevant_pages.forEach(pageNum => {
                    cardsHtml += `
                        <div class="citation-pill clickable-citation" data-pdf-id="${qa.pdf_id}" data-page="${pageNum}" title="Click to view ${escapeHTML(filename)} on Page ${pageNum}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span>Page ${pageNum}</span>
                        </div>
                    `;
                });
                
                citationCardHtml = `
                    <div class="citation-section-title" style="font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-top: 1.15rem; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.35rem; border-top: 1px solid var(--border-color); padding-top: 0.85rem; width: 100%;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        Source and Cited Pages
                    </div>
                    <div class="citation-cards-container">
                        ${cardsHtml}
                    </div>
                `;
            }

            const isPinned = qa.is_pinned === 1;

            botMsg.innerHTML = `
                <div class="message-avatar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M12 2v2M8 5h8M12 11V7M12 22v-3"></path>
                    </svg>
                </div>
                <div class="message-bubble-wrapper">
                    <div class="message-bubble">
                        <div class="message-bubble-header">
                            <span class="user-name">Assistant</span>
                            <div class="message-bubble-actions">
                                <button class="bubble-speak-btn" data-qa-id="${qa.id}" title="Read Aloud">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                    </svg>
                                </button>
                                <button class="bubble-pin-btn ${isPinned ? 'pinned' : ''}" data-qa-id="${qa.id}" data-pinned="${qa.is_pinned}" title="${isPinned ? 'Unpin Question' : 'Pin Question'}">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="bot-answer-text">${markdownToHTML(qa.answer)}</div>
                        
                        ${citationCardHtml}
                    </div>
                </div>
            `;
            
            // Attach event listener inside feed bubble pin
            const bubblePin = botMsg.querySelector('.bubble-pin-btn');
            bubblePin.addEventListener('click', () => {
                const qaId = bubblePin.dataset.qaId;
                const isCurrentlyPinned = bubblePin.classList.contains('pinned');
                togglePinQuestion(qaId, isCurrentlyPinned ? 0 : 1);
            });

            // Attach event listener inside feed bubble speak
            const bubbleSpeak = botMsg.querySelector('.bubble-speak-btn');
            bubbleSpeak.addEventListener('click', () => {
                speakAnswer(qa.id, qa.answer, bubbleSpeak);
            });

            // Attach event listener inside clickable citations
            const citationCards = botMsg.querySelectorAll('.clickable-citation');
            citationCards.forEach(card => {
                card.addEventListener('click', () => {
                    const pdfId = card.dataset.pdfId;
                    const page = card.dataset.page;
                    if (pdfId) {
                        window.open(`/view_pdf/${pdfId}#page=${page}`, '_blank');
                    }
                });
            });

            messagesContainer.appendChild(botMsg);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }


    // --- PDF Click to Open Tab Viewers ---
    const openActivePDFViewer = () => {
        if (activePdfId) {
            window.open(`/view_pdf/${activePdfId}`, '_blank');
        } else {
            showToast('Please select or upload a PDF first.', 'warning');
        }
    };

    if (fileNameEl) {
        fileNameEl.addEventListener('click', openActivePDFViewer);
    }
    if (headerFilename) {
        headerFilename.addEventListener('click', openActivePDFViewer);
    }

    // --- Upload Trigger Bindings ---
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }

    async function handleFileUpload(file) {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showToast('Only PDF files are supported.', 'error');
            return;
        }

        // Support up to 500MB textbooks
        const maxLimitBytes = 500 * 1024 * 1024;
        if (file.size > maxLimitBytes) {
            showToast('File size exceeds the 500MB limit for industrial uploads.', 'error');
            return;
        }

        showToast('Uploading industrial manual...', 'info');

        // Append dynamic upload progress bubble in chat
        const progressBubble = document.createElement('div');
        progressBubble.className = 'message bot-message';
        progressBubble.id = 'upload-progress-bubble';
        progressBubble.innerHTML = `
            <div class="message-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M12 2v2M8 5h8M12 11V7M12 22v-3"></path>
                </svg>
            </div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble">
                    <div class="message-bubble-header">
                        <span class="user-name">Assistant</span>
                    </div>
                    <div class="upload-status-text" style="font-weight: 600; font-size: 0.85rem;">Uploading manual: <strong>${escapeHTML(file.name)}</strong>...</div>
                    <div class="progress-container">
                        <div class="progress-bar-fill" id="uploadProgressBarFill" style="width: 0%;"></div>
                    </div>
                    <div class="upload-percentage-text" id="uploadPercentageText" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">0% (0.0 MB of 0.0 MB)</div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(progressBubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Temporarily disable inputs during upload stream
        if (uploadBtn) uploadBtn.disabled = true;
        userInput.placeholder = "Uploading manual bytes... please wait...";

        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        // Track upload progress in real-time
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
                const totalMB = (e.total / (1024 * 1024)).toFixed(1);
                
                const barFill = document.getElementById('uploadProgressBarFill');
                const pctText = document.getElementById('uploadPercentageText');
                if (barFill) barFill.style.width = percent + '%';
                if (pctText) pctText.textContent = `${percent}% (${loadedMB} MB of ${totalMB} MB)`;
            }
        };

        // Extraction status trigger upon completion
        xhr.upload.onload = () => {
            const statusText = progressBubble.querySelector('.upload-status-text');
            if (statusText) {
                statusText.innerHTML = `<span class="extraction-spinner"></span>Extracting text and analyzing manual pages...`;
            }
            const pctText = document.getElementById('uploadPercentageText');
            if (pctText) {
                pctText.textContent = 'Parsing engineering layers and vector assets (under 10 seconds)...';
            }
        };

        xhr.onload = async () => {
            if (uploadBtn) uploadBtn.disabled = false;
            
            let data = {};
            try {
                data = JSON.parse(xhr.responseText);
            } catch (err) {
                data = { error: 'Invalid response from server.' };
            }

            if (xhr.status === 200 && data.success) {
                isFileUploaded = true;
                activePdfId = data.pdf_id;
                
                if (fileEmpty) fileEmpty.classList.add('hidden');
                fileCard.classList.remove('hidden');
                
                fileNameEl.textContent = data.filename;
                fileMetaEl.textContent = `${data.total_pages} pages • ${data.file_size_mb} MB`;
                headerFilename.textContent = data.filename;
                
                userInput.disabled = false;
                sendBtn.disabled = false;
                if (micBtn) micBtn.disabled = false;
                userInput.placeholder = "Ask a question about " + data.filename + "...";
                userInput.focus();
                
                showToast('PDF loaded successfully!', 'success');
                
                // Refresh sidebar history to show the new item
                await loadHistory();
                
                // Remove progress bubble and show complete bot bubble
                progressBubble.remove();
                messagesContainer.innerHTML = '';
                appendBotMessage(`I've processed **${data.filename}** (${data.total_pages} pages). Ask me anything about it!`);
            } else {
                progressBubble.remove();
                showToast(data.error || 'Failed to process document.', 'error');
                appendBotMessage(`**Upload Failed:** ${data.error || 'Failed to parse file.'}`);
                resetUploadZone();
            }
        };

        xhr.onerror = () => {
            if (uploadBtn) uploadBtn.disabled = false;
            progressBubble.remove();
            showToast('Network error during upload.', 'error');
            appendBotMessage('**Upload Failed:** Network connection interrupted.');
            resetUploadZone();
        };

        xhr.send(formData);
    }

    function resetUploadZone() {
        if (fileEmpty) fileEmpty.classList.remove('hidden');
        fileCard.classList.add('hidden');
        fileInput.value = '';
        isFileUploaded = false;
        activePdfId = null;
        
        headerFilename.textContent = 'No PDF Selected';
        
        userInput.disabled = true;
        sendBtn.disabled = true;
        if (micBtn) micBtn.disabled = true;
        userInput.placeholder = "Upload a PDF using '+' or select one...";
        
        // Remove active class on history items
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    clearFileBtn.addEventListener('click', async () => {
        try {
            await fetch('/clear', { method: 'POST' });
            resetUploadZone();
            showToast('Cleared active selection.', 'info');
            showWelcomeDashboard();
        } catch (error) {
            showToast('Failed to clear selection.', 'error');
        }
    });


    // --- API Settings Modal and Storage ---

    async function initApiStatus() {
        try {
            const response = await fetch('/local_models');
            const data = await response.json();
            if (response.ok && data.success) {
                isOllamaRunning = true;
                pulledModels = data.models || [];
                
                populateModelSelector(pulledModels);
                
                if (apiKeyIndicator) {
                    const statusDot = apiKeyIndicator.querySelector('.status-dot');
                    const statusText = apiKeyIndicator.querySelector('.status-text');
                    if (statusDot) statusDot.className = 'status-dot green';
                    if (statusText) statusText.textContent = 'Ollama Workstation Connected';
                }
                
                if (activePdfId) {
                    userInput.disabled = false;
                    sendBtn.disabled = false;
                    if (micBtn) micBtn.disabled = false;
                }
            } else {
                throw new Error(data.error || "Ollama service offline");
            }
        } catch (error) {
            isOllamaRunning = false;
            pulledModels = [];
            populateModelSelector([]);
            
            if (apiKeyIndicator) {
                const statusDot = apiKeyIndicator.querySelector('.status-dot');
                const statusText = apiKeyIndicator.querySelector('.status-text');
                if (statusDot) statusDot.className = 'status-dot red';
                if (statusText) statusText.textContent = 'Ollama Workstation Offline';
            }
        }
    }

    function updateModelSelectorClass(selectedValue) {
        const modelSelector = document.getElementById('modelSelector');
        if (!modelSelector) return;
        
        if (selectedValue && selectedValue.toLowerCase().includes('gemini')) {
            modelSelector.classList.add('model-gemini');
            modelSelector.classList.remove('model-local');
        } else {
            modelSelector.classList.remove('model-gemini');
            modelSelector.classList.add('model-local');
        }
    }

    function populateModelSelector(models) {
        const modelSelector = document.getElementById('modelSelector');
        if (!modelSelector) return;

        if (!models || models.length === 0) {
            modelSelector.innerHTML = '<option value="">No local models</option>';
            modelSelector.disabled = true;
            selectedModel = '';
            updateModelSelectorClass('');
            return;
        }

        modelSelector.disabled = false;
        modelSelector.innerHTML = '';

        let savedModel = localStorage.getItem('active_model') || '';

        // Prioritize and auto-select Gemini 3.5 Flash if available
        if (models.includes("Gemini 3.5 Flash")) {
            savedModel = "Gemini 3.5 Flash";
            localStorage.setItem('active_model', savedModel);
        }

        let foundSaved = false;

        models.forEach(m => {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = m;
            if (m === savedModel) {
                option.selected = true;
                foundSaved = true;
            }
            modelSelector.appendChild(option);
        });

        if (!foundSaved && models.length > 0) {
            selectedModel = models[0];
            localStorage.setItem('active_model', selectedModel);
            modelSelector.value = selectedModel;
        } else {
            selectedModel = modelSelector.value;
        }
        
        updateModelSelectorClass(selectedModel);
    }

    const modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
        modelSelector.addEventListener('change', () => {
            selectedModel = modelSelector.value;
            localStorage.setItem('active_model', selectedModel);
            updateModelSelectorClass(selectedModel);
            showToast(`Switched active local model to ${selectedModel}`, 'info');
        });
    }

    // Connection Diagnostic Panel DOM Elements
    const testApiKeyBtn = document.getElementById('testApiKeyBtn');
    const diagnosticArea = document.getElementById('diagnosticArea');
    const diagnosticStatusDot = document.getElementById('diagnosticStatusDot');
    const diagnosticStatusText = document.getElementById('diagnosticStatusText');
    const diagnosticDetails = document.getElementById('diagnosticDetails');

    // Connection Settings Panel Listeners with safety wrappers
    if (openSettingsBtn && settingsModal) {
        openSettingsBtn.addEventListener('click', () => {
            if (diagnosticArea) {
                diagnosticArea.classList.add('hidden');
            }
            settingsModal.classList.remove('hidden');
        });
    }

    const closeModal = () => {
        if (settingsModal) {
            settingsModal.classList.add('hidden');
        }
        if (diagnosticArea) {
            diagnosticArea.classList.add('hidden');
        }
    };
    
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', closeModal);
    }
    
    if (cancelSettingsBtn) {
        cancelSettingsBtn.addEventListener('click', closeModal);
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            initApiStatus();
            closeModal();
        });
    }

    if (testApiKeyBtn) {
        testApiKeyBtn.addEventListener('click', async () => {
            if (diagnosticArea) {
                diagnosticArea.classList.remove('hidden');
            }
            if (diagnosticStatusDot) {
                diagnosticStatusDot.className = 'status-dot yellow';
            }
            if (diagnosticStatusText) {
                diagnosticStatusText.textContent = 'Connecting and fetching local models...';
            }
            if (diagnosticDetails) {
                diagnosticDetails.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:1rem;"><div class="typing-indicator" style="padding:0;"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>';
            }
            
            testApiKeyBtn.disabled = true;
            testApiKeyBtn.textContent = 'Refreshing...';
            
            try {
                const response = await fetch('/local_models');
                const data = await response.json();
                
                if (response.ok && data.success) {
                    isOllamaRunning = true;
                    pulledModels = data.models || [];
                    populateModelSelector(pulledModels);
                    
                    if (diagnosticStatusDot) {
                        diagnosticStatusDot.className = 'status-dot green';
                    }
                    if (diagnosticStatusText) {
                        diagnosticStatusText.textContent = 'Ollama Connected!';
                    }
                    if (diagnosticDetails) {
                        if (pulledModels.length > 0) {
                            let modelsListHtml = '<p style="font-weight:600;margin-bottom:0.4rem;color:var(--text-primary);">Pulled LLM Models:</p>';
                            modelsListHtml += '<div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-top:0.4rem;">';
                            
                            pulledModels.forEach(m => {
                                modelsListHtml += `
                                    <span class="badge" style="background-color:rgba(59, 130, 246, 0.1);color:var(--color-primary);border:1px solid var(--border-color);padding:0.25rem 0.5rem;border-radius:6px;font-size:0.7rem;font-weight:600;">
                                        ${escapeHTML(m)}
                                    </span>
                                `;
                            });
                            modelsListHtml += '</div>';
                            modelsListHtml += `<p style="margin-top:0.5rem;font-size:0.7rem;color:var(--text-muted);">Synchronized successfully. Select model in the top header switcher.</p>`;
                            diagnosticDetails.innerHTML = modelsListHtml;
                        } else {
                            diagnosticDetails.innerHTML = '<span style="color:var(--color-medium);">No models found. Please pull a model using "ollama run phi3" in your terminal first.</span>';
                        }
                    }
                    initApiStatus();
                } else {
                    throw new Error(data.error || 'Connection failed.');
                }
            } catch (error) {
                isOllamaRunning = false;
                pulledModels = [];
                populateModelSelector([]);
                if (diagnosticStatusDot) {
                    diagnosticStatusDot.className = 'status-dot red';
                }
                if (diagnosticStatusText) {
                    diagnosticStatusText.textContent = 'Connection Failed!';
                }
                if (diagnosticDetails) {
                    diagnosticDetails.innerHTML = `<span style="color:var(--color-low);font-weight:600;">Troubleshooting steps:</span><br>
                    <span style="display:block;margin-top:0.25rem;line-height:1.45;">1. Ensure Ollama application is running.<br>2. Verify "ollama serve" is responding.<br>3. Check backend app logs.</span>`;
                }
                initApiStatus();
            } finally {
                testApiKeyBtn.disabled = false;
                testApiKeyBtn.textContent = 'Refresh Workstation';
            }
        });
    }


    // --- Chat Logic & Form Submissions ---

    // --- Streaming Helpers ---

    async function readResponseStream(response, onMetadata, onToken, onComplete, onError) {
        try {
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop(); // Keep the last partial line in the buffer

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const rawData = line.substring(6).trim();
                        if (!rawData) continue;

                        const parsed = JSON.parse(rawData);
                        if (parsed.type === "metadata") {
                            if (onMetadata) onMetadata(parsed);
                        } else if (parsed.type === "token") {
                            if (onToken) onToken(parsed.text);
                        } else if (parsed.type === "complete") {
                            if (onComplete) onComplete(parsed);
                        } else if (parsed.type === "error") {
                            if (onError) onError(new Error(parsed.text));
                            return;
                        }
                    }
                }
            }
        } catch (err) {
            if (onError) onError(err);
        }
    }

    function renderStreamingCitations(pdfId, pages, container) {
        if (!pages || pages.length === 0) return;
        
        const activeFilename = (headerFilename ? headerFilename.textContent : 'Document').replace('Conversing with:', '').trim();
        let cardsHtml = '';
        pages.forEach(pageNum => {
            cardsHtml += `
                <div class="citation-pill clickable-citation" data-pdf-id="${pdfId}" data-page="${pageNum}" title="Click to view ${escapeHTML(activeFilename)} on Page ${pageNum}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>Page ${pageNum}</span>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="citation-section-title" style="font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-top: 1.15rem; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.35rem; border-top: 1px solid var(--border-color); padding-top: 0.85rem; width: 100%;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Source and Cited Pages
            </div>
            <div class="citation-cards-container">
                ${cardsHtml}
            </div>
        `;

        // Bind clicks to citations
        const citationCards = container.querySelectorAll('.clickable-citation');
        citationCards.forEach(card => {
            card.addEventListener('click', () => {
                const pid = card.dataset.pdfId;
                const page = card.dataset.page;
                if (pid) {
                    window.open(`/view_pdf/${pid}#page=${page}`, '_blank');
                }
            });
        });
    }

    function setupCompleteBubbleActions(botMsg, qaId, answerText, pdfId, pages) {
        const speakBtn = botMsg.querySelector('.bubble-speak-btn');
        const pinBtn = botMsg.querySelector('.bubble-pin-btn');

        if (speakBtn) {
            speakBtn.classList.remove('hidden');
            speakBtn.dataset.qaId = qaId;
            // Clear previous event listeners to prevent duplicate triggers
            const newSpeakBtn = speakBtn.cloneNode(true);
            speakBtn.parentNode.replaceChild(newSpeakBtn, speakBtn);
            newSpeakBtn.addEventListener('click', () => {
                speakAnswer(qaId, answerText, newSpeakBtn);
            });
        }

        if (pinBtn) {
            pinBtn.classList.remove('hidden');
            pinBtn.dataset.qaId = qaId;
            pinBtn.dataset.pinned = '0';
            const newPinBtn = pinBtn.cloneNode(true);
            pinBtn.parentNode.replaceChild(newPinBtn, pinBtn);
            newPinBtn.addEventListener('click', () => {
                const isCurrentlyPinned = newPinBtn.classList.contains('pinned');
                togglePinQuestion(qaId, isCurrentlyPinned ? 0 : 1);
            });
        }
    }

    // --- Chat Logic & Form Submissions ---

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const question = userInput.value.trim();
        if (!question || !isFileUploaded || !activePdfId) return;

        appendUserMessage(question);
        userInput.value = '';

        const typingEl = appendTypingIndicator();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Append a new, empty bot message bubble to stream into
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot-message';
        const tempId = 'streaming-' + Date.now();
        botMsg.id = tempId;
        botMsg.innerHTML = `
            <div class="message-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M12 2v2M8 5h8M12 11V7M12 22v-3"></path>
                </svg>
            </div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble">
                    <div class="message-bubble-header">
                        <span class="user-name">Assistant</span>
                        <div class="message-bubble-actions">
                            <button class="bubble-speak-btn hidden" title="Read Aloud">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                            </button>
                            <button class="bubble-pin-btn hidden" title="Pin Question">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="bot-answer-text"></div>
                    <div class="streaming-citation-container"></div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(botMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        const answerTextEl = botMsg.querySelector('.bot-answer-text');
        const citationContainer = botMsg.querySelector('.streaming-citation-container');
        
        let fullAnswerText = "";
        let relevantPages = [];
        let qaId = null;

        try {
            const headers = { 'Content-Type': 'application/json' };
            const response = await fetch('/ask', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ question, model: selectedModel })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to query local LLM.');
            }

            typingEl.remove();

            await readResponseStream(
                response,
                (metadata) => {
                    relevantPages = metadata.relevant_pages || [];
                },
                (token) => {
                    fullAnswerText += token;
                    answerTextEl.innerHTML = markdownToHTML(fullAnswerText);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                },
                async (complete) => {
                    qaId = complete.id;
                    botMsg.id = `qa-block-${qaId}`;
                    relevantPages = complete.relevant_pages || [];
                    if (relevantPages.length === 0) {
                        citationContainer.innerHTML = '';
                    } else {
                        renderStreamingCitations(complete.pdf_id, relevantPages, citationContainer, complete.source_excerpt);
                    }
                    setupCompleteBubbleActions(botMsg, qaId, fullAnswerText, complete.pdf_id, relevantPages);
                    await loadHistory();
                },
                (err) => {
                    throw err;
                }
            );

        } catch (error) {
            console.error(error);
            typingEl.remove();
            botMsg.remove();
            showToast(error.message, 'error');
            appendBotMessage(`**Error:** ${error.message}`);
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });


    // --- UI Append Helpers ---

    function appendUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble">${escapeHTML(text)}</div>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
    }

    function appendBotMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M12 2v2M8 5h8M12 11V7M12 22v-3"></path>
                </svg>
            </div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble">${markdownToHTML(text)}</div>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function appendTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M12 2v2M8 5h8M12 11V7M12 22v-3"></path>
                </svg>
            </div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        return messageDiv;
    }

    function appendFullBotResponse(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.id = `qa-block-${data.id}`;
        
        const activeFilename = (headerFilename ? headerFilename.textContent : 'Document').replace('Conversing with:', '').trim();

        let citationCardHtml = '';
        if (data.relevant_pages && data.relevant_pages.length > 0) {
            let cardsHtml = '';
            data.relevant_pages.forEach(pageNum => {
                cardsHtml += `
                    <div class="citation-pill clickable-citation" data-pdf-id="${data.pdf_id}" data-page="${pageNum}" title="Click to view ${escapeHTML(activeFilename)} on Page ${pageNum}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <span>Page ${pageNum}</span>
                    </div>
                `;
            });

            citationCardHtml = `
                <div class="citation-section-title" style="font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-top: 1.15rem; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.35rem; border-top: 1px solid var(--border-color); padding-top: 0.85rem; width: 100%;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    Source and Cited Pages
                </div>
                <div class="citation-cards-container">
                    ${cardsHtml}
                </div>
            `;
        }

        const isPinned = data.is_pinned === 1;

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M12 2v2M8 5h8M12 11V7M12 22v-3"></path>
                </svg>
            </div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble">
                    <div class="message-bubble-header">
                        <span class="user-name">Assistant</span>
                        <div class="message-bubble-actions">
                            <button class="bubble-speak-btn" data-qa-id="${data.id}" title="Read Aloud">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                            </button>
                            <button class="bubble-pin-btn ${isPinned ? 'pinned' : ''}" data-qa-id="${data.id}" data-pinned="${data.is_pinned}" title="${isPinned ? 'Unpin Question' : 'Pin Question'}">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="bot-answer-text">${markdownToHTML(data.answer)}</div>
                    
                    ${citationCardHtml}
                </div>
            </div>
        `;
        
        // Attach event listener inside feed bubble pin
        const bubblePin = messageDiv.querySelector('.bubble-pin-btn');
        bubblePin.addEventListener('click', () => {
            const qaId = bubblePin.dataset.qaId;
            const isCurrentlyPinned = bubblePin.classList.contains('pinned');
            togglePinQuestion(qaId, isCurrentlyPinned ? 0 : 1);
        });

        // Attach event listener inside feed bubble speak
        const bubbleSpeak = messageDiv.querySelector('.bubble-speak-btn');
        bubbleSpeak.addEventListener('click', () => {
            speakAnswer(data.id, data.answer, bubbleSpeak);
        });

        // Attach event listener inside clickable citations
        const citationCards = messageDiv.querySelectorAll('.clickable-citation');
        citationCards.forEach(card => {
            card.addEventListener('click', () => {
                const pdfId = card.dataset.pdfId;
                const page = card.dataset.page;
                if (pdfId) {
                    window.open(`/view_pdf/${pdfId}#page=${page}`, '_blank');
                }
            });
        });

        messagesContainer.appendChild(messageDiv);
    }

    // --- Welcome Dashboard Renderers ---

    function showWelcomeDashboard() {
        let displayName = "Workstation User";
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            const matches = logoutBtn.textContent.match(/\(([^)]+)\)/);
            if (matches && matches[1]) {
                displayName = matches[1].trim();
            }
        }

        messagesContainer.innerHTML = `
            <div class="welcome-dashboard">
                <div class="dashboard-header">
                    <!-- Custom Centered 3D Isometric AskVerse Logo with soft blue background -->
                    <div class="dashboard-logo-icon" style="background: rgba(37, 99, 235, 0.08); border-radius: 16px; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto; border: 1px solid rgba(37, 99, 235, 0.15); box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08);">
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: #2563EB;">
                            <polygon points="12 2 22 8.5 22 19.5 12 22 2 19.5 2 8.5"></polygon>
                            <polyline points="12 22 12 12 22 8.5"></polyline>
                            <polyline points="12 12 2 8.5"></polyline>
                            <circle cx="12" cy="12" r="3.5" fill="currentColor" fill-opacity="0.15"></circle>
                        </svg>
                    </div>
                    <!-- Centered Brand Title -->
                    <div class="dashboard-brand" style="font-family: 'Outfit', sans-serif; font-size: 2.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem; letter-spacing: -0.03em; text-align: center;">
                        Ask<span style="color: #2563EB;">Verse</span>
                    </div>
                    <h1 class="dashboard-title"><span id="greetingText">${getGreeting()}</span>, <span class="username-highlight">${displayName}</span></h1>
                    <p class="dashboard-subtitle">Transform engineering manuals, SOPs, and technical documents into instant answers.</p>
                </div>
                
                <div class="dashboard-grid">
                    <div class="dashboard-card" id="cardUpload">
                        <div class="card-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                        <div class="card-details">
                            <h3>Upload New Manual</h3>
                            <p>Ingest textbooks or machinery directories up to 500MB instantly.</p>
                        </div>
                    </div>
                    
                    <div class="dashboard-card card-actionable" data-prompt="Can you give me a concise executive summary of this document?">
                        <div class="card-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div class="card-details">
                            <h3>Summarize Document</h3>
                            <p>Generate a high-level conceptual outline of active chapters.</p>
                        </div>
                    </div>

                    <div class="dashboard-card card-actionable" data-prompt="Find the most important formulas, calculations, or specifications mentioned in this document.">
                        <div class="card-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <div class="card-details">
                            <h3>Locate Key Formulas</h3>
                            <p>Search exact technical equations, specifications, or diagrams.</p>
                        </div>
                    </div>

                    <div class="dashboard-card" id="cardVoice">
                        <div class="card-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        </div>
                        <div class="card-details">
                            <h3>Hands-free Dictation</h3>
                            <p>Click the microphone icon in the chat bar to speak queries.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        bindDashboardEvents();
    }

    function bindDashboardEvents() {
        const cardUpload = document.getElementById('cardUpload');
        if (cardUpload) {
            cardUpload.addEventListener('click', () => {
                fileInput.click();
            });
        }

        const actionableCards = document.querySelectorAll('.card-actionable');
        actionableCards.forEach(card => {
            card.addEventListener('click', () => {
                if (isFileUploaded && activePdfId) {
                    userInput.value = card.dataset.prompt;
                    userInput.focus();
                    // Auto-submit prompt for premium instant response UX
                    chatForm.dispatchEvent(new Event('submit'));
                } else {
                    showToast("Please upload or select a PDF document first!", "warning");
                }
            });
        });

        const cardVoice = document.getElementById('cardVoice');
        if (cardVoice) {
            cardVoice.addEventListener('click', () => {
                if (isFileUploaded && activePdfId) {
                    if (micBtn) micBtn.click();
                } else {
                    showToast("Please upload or select a PDF document first!", "warning");
                }
            });
        }
    }

    // --- Toast Notifications helper ---

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // --- Speech-to-Text Microphone (STT) Controller ---

    function initSpeechRecognition() {
        if (!micBtn) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.log("Speech recognition not supported in this browser.");
            micBtn.style.display = 'none'; // Hide if unsupported
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false; // Single query format
        recognition.interimResults = true; // Enabled interim results for live user feedback!
        recognition.lang = 'en-US';

        let finalTranscript = '';

        recognition.onstart = () => {
            isListening = true;
            micBtn.classList.add('listening');
            userInput.placeholder = "Listening... Speak now...";
            finalTranscript = '';
            showToast("Voice assistant listening...", "info");
        };

        recognition.onresult = (e) => {
            let interimTranscript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) {
                    finalTranscript += e.results[i][0].transcript;
                } else {
                    interimTranscript += e.results[i][0].transcript;
                }
            }
            // Real-time progressive rendering as user speaks
            userInput.value = finalTranscript + interimTranscript;
            userInput.dispatchEvent(new Event('input'));
        };

        recognition.onerror = (e) => {
            console.error("Speech recognition error:", e.error);
            if (e.error === 'no-speech') {
                showToast("No speech detected. Please check your mic volume and settings.", "warning");
            } else if (e.error === 'not-allowed') {
                showToast("Microphone access denied. Please allow microphone permissions.", "error");
            } else {
                showToast("Voice assistant error: " + e.error, "error");
            }
            stopListening();
        };

        recognition.onend = () => {
            stopListening();
        };

        micBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isListening) {
                recognition.stop();
            } else {
                startListening();
            }
        });
    }

    function startListening() {
        if (!recognition) return;
        try {
            recognition.start();
        } catch (err) {
            console.error(err);
        }
    }

    function stopListening() {
        isListening = false;
        micBtn.classList.remove('listening');
        if (activePdfId) {
            userInput.placeholder = "Ask a question about document...";
        } else {
            userInput.placeholder = "Select or upload a PDF to start...";
        }
        userInput.focus();
    }

    // --- Text-to-Speech Voice Assistant (TTS) Controller ---
    let activeUtterance = null;
    let activeSpeakBtn = null;
    let activeSpeakQaId = null;

    function speakAnswer(qaId, rawText, button) {
        if (!('speechSynthesis' in window)) {
            showToast("Text-to-speech is not supported in this browser.", "error");
            return;
        }

        const text = sanitizeForSpeech(rawText);

        // Stop current speech if clicking same button
        if (window.speechSynthesis.speaking && activeSpeakQaId === qaId) {
            window.speechSynthesis.cancel();
            resetActiveSpeakerBtn();
            return;
        }

        // Cancel any active speech before starting new
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            resetActiveSpeakerBtn();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        activeUtterance = utterance;
        activeSpeakBtn = button;
        activeSpeakQaId = qaId;

        // Visual playing states
        button.classList.add('playing');
        button.title = "Stop Reading";
        button.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            </svg>
        `;

        utterance.onend = () => {
            resetActiveSpeakerBtn();
        };

        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            resetActiveSpeakerBtn();
        };

        window.speechSynthesis.speak(utterance);
    }

    function resetActiveSpeakerBtn() {
        if (activeSpeakBtn) {
            activeSpeakBtn.classList.remove('playing');
            activeSpeakBtn.title = "Read Aloud";
            activeSpeakBtn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            `;
        }
        activeUtterance = null;
        activeSpeakBtn = null;
        activeSpeakQaId = null;
    }

    function sanitizeForSpeech(markdown) {
        if (!markdown) return '';
        let text = markdown
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\[Page \d+\]/g, '') // Strip page numbers
            .replace(/Cited Pages: \d+(, \d+)*/g, '')
            .replace(/Accuracy Rating: \d+%/g, '')
            .replace(/<blockquote>/g, '')
            .replace(/<\/blockquote>/g, '')
            .replace(/<br>/g, '\n');
        
        return text;
    }

    // --- Simple text processors ---

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderMath(text) {
        if (!window.katex) return text;
        
        let result = text;
        
        // 1. Parse display math: \[ ... \]
        result = result.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
            try {
                let rawLatex = latex
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#039;/g, "'");
                
                const rendered = window.katex.renderToString(rawLatex.trim(), {
                    displayMode: true,
                    throwOnError: false
                });
                return `<div class="math-block-container">${rendered}</div>`;
            } catch (err) {
                console.error("KaTeX block error:", err);
                return match;
            }
        });
        
        // 2. Parse display math: $$ ... $$
        result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
            try {
                let rawLatex = latex
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#039;/g, "'");
                
                const rendered = window.katex.renderToString(rawLatex.trim(), {
                    displayMode: true,
                    throwOnError: false
                });
                return `<div class="math-block-container">${rendered}</div>`;
            } catch (err) {
                console.error("KaTeX display dollar error:", err);
                return match;
            }
        });
        
        // 3. Parse inline math: \\( ... \\) and \( ... \)
        const renderInline = (match, latex) => {
            try {
                let rawLatex = latex
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#039;/g, "'");
                
                return window.katex.renderToString(rawLatex.trim(), {
                    displayMode: false,
                    throwOnError: false
                });
            } catch (err) {
                console.error("KaTeX inline error:", err);
                return match;
            }
        };

        result = result.replace(/\\\\\(([\s\S]*?)\\\\\)/g, renderInline);
        result = result.replace(/\\\(([\s\S]*?)\\\)/g, renderInline);
        
        // 4. Parse inline math: $ ... $
        result = result.replace(/\$([^\$\n]+?)\$/g, (match, latex) => {
            if (/^\d+$/.test(latex.trim())) return match;
            try {
                let rawLatex = latex
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#039;/g, "'");
                
                return window.katex.renderToString(rawLatex.trim(), {
                    displayMode: false,
                    throwOnError: false
                });
            } catch (err) {
                console.error("KaTeX inline dollar error:", err);
                return match;
            }
        });

        return result;
    }

    function markdownToHTML(text) {
        let html = escapeHTML(text);
        
        // Parse bold, italic, inline-code, and blockquotes
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        html = html.replace(/^\s*&gt;\s*(.*)$/gm, '<blockquote>$1</blockquote>');
        
        // Split text by lines to identify ordered and unordered list blocks
        let lines = html.split('\n');
        let inUnorderedList = false;
        let inOrderedList = false;
        let processedLines = [];
        
        lines.forEach(line => {
            let trimmed = line.trim();
            
            // Check for unordered lists (e.g. - item, * item, &bull; item)
            let unorderedMatch = line.match(/^(\s*)(?:-|\*)\s+(.*)$/);
            if (unorderedMatch) {
                // Close ordered lists if active
                if (inOrderedList) {
                    processedLines.push('</ol>');
                    inOrderedList = false;
                }
                // Open unordered list if not active
                if (!inUnorderedList) {
                    processedLines.push('<ul style="margin-left: 1.5rem; margin-top: 0.4rem; margin-bottom: 0.4rem; list-style-type: disc; display: flex; flex-direction: column; gap: 0.35rem;">');
                    inUnorderedList = true;
                }
                processedLines.push(`<li style="line-height: 1.45; color: var(--text-primary); font-size: 0.92rem; padding-left: 0.15rem;">${unorderedMatch[2]}</li>`);
                return;
            }
            
            // Check for ordered lists (e.g. 1. item)
            let orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
            if (orderedMatch) {
                // Close unordered lists if active
                if (inUnorderedList) {
                    processedLines.push('</ul>');
                    inUnorderedList = false;
                }
                // Open ordered list if not active
                if (!inOrderedList) {
                    processedLines.push('<ol style="margin-left: 1.5rem; margin-top: 0.4rem; margin-bottom: 0.4rem; display: flex; flex-direction: column; gap: 0.35rem;">');
                    inOrderedList = true;
                }
                processedLines.push(`<li style="line-height: 1.45; color: var(--text-primary); font-size: 0.92rem; padding-left: 0.15rem;">${orderedMatch[2]}</li>`);
                return;
            }
            
            // If the line is standard text, close active list tags
            if (inUnorderedList) {
                processedLines.push('</ul>');
                inUnorderedList = false;
            }
            if (inOrderedList) {
                processedLines.push('</ol>');
                inOrderedList = false;
            }
            
            processedLines.push(line);
        });
        
        // Clean close at EOF
        if (inUnorderedList) processedLines.push('</ul>');
        if (inOrderedList) processedLines.push('</ol>');
        
        // Re-join lines with <br> for standard paragraph content
        let finalHtml = '';
        for (let i = 0; i < processedLines.length; i++) {
            let cur = processedLines[i];
            let next = processedLines[i + 1] || '';
            
            finalHtml += cur;
            
            if (i < processedLines.length - 1) {
                let curIsTag = cur.startsWith('<ul') || cur.startsWith('</ul>') || cur.startsWith('<ol') || cur.startsWith('</ol>') || cur.startsWith('<li') || cur.startsWith('</li>');
                let nextIsTag = next.startsWith('<ul') || next.startsWith('</ul>') || next.startsWith('<ol') || next.startsWith('</ol>') || next.startsWith('<li') || next.startsWith('</li>');
                
                if (!curIsTag && !nextIsTag && cur.trim() !== '') {
                    finalHtml += '<br>';
                } else if (cur.trim() === '' && !nextIsTag) {
                    finalHtml += '<br>';
                } else {
                    finalHtml += '\n'; // Preserves spacing structure for elements
                }
            }
        }
        
        return renderMath(finalHtml);
    }
});

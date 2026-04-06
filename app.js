const SHEET_URL = "https://opensheet.elk.sh/1d0pIqGPFrhZp2uos9uUrnygXu2GYuivBxm1ACKOExtk/Sheet1";
let alumniDataset = [];
let currentBatchFilter = "All";
let currentScreen = "home";
let sidebar = null;
let overlayBg = null;

// DOM Elements
const homeContainer = document.getElementById('homeView');
const statsDiv = document.getElementById('statsView');
const formDiv = document.getElementById('formView');
const batchWrapper = document.getElementById('batchChipContainer');
const alumniRenderDiv = document.getElementById('alumniListRender');
const searchBox = document.getElementById('globalSearch');
const totalRegSpan = document.getElementById('totalRegCount');
const totalGuestSpan = document.getElementById('totalGuestCount');
const totalCollectionSpan = document.getElementById('totalCollectionDisplay');
const statsInnerDiv = document.getElementById('batchStatsContainer');
const modal = document.getElementById('detailModal');
const openSidebarBtn = document.getElementById('openSidebarBtn');

// Load Sidebar
async function loadSidebar() {
    try {
        const response = await fetch('sidebar.html');
        const sidebarHtml = await response.text();
        document.getElementById('sidebarContainer').innerHTML = sidebarHtml;
        
        // Get sidebar elements after loading
        sidebar = document.getElementById('premiumSidebar');
        overlayBg = document.getElementById('globalOverlay');
        
        // Initialize donation view
        initDonationView();
        
        // Attach event listeners for sidebar toggle
        attachSidebarEvents();
        
        // Logo error fallback for sidebar logo
        const sidebarLogo = document.getElementById('sidebarLogoImg');
        if (sidebarLogo) {
            sidebarLogo.onerror = () => { 
                sidebarLogo.src = "https://img.icons8.com/fluency/96/school-building.png"; 
            };
        }
    } catch (err) {
        console.error("Failed to load sidebar:", err);
    }
}

function attachSidebarEvents() {
    // Open sidebar button (from header)
    if (openSidebarBtn) {
        const newOpenBtn = openSidebarBtn.cloneNode(true);
        openSidebarBtn.parentNode.replaceChild(newOpenBtn, openSidebarBtn);
        newOpenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }
    
    // Close overlay
    if (overlayBg) {
        overlayBg.addEventListener('click', () => closeSidebar());
    }
    
    // Menu items
    const menuHome = document.getElementById('menuHome');
    const menuStats = document.getElementById('menuStats');
    const menuForm = document.getElementById('menuForm');
    const menuDonation = document.getElementById('menuDonation');
    const closeFooter = document.getElementById('closeSidebarFooter');
    
    if (menuHome) {
        menuHome.addEventListener('click', (e) => {
            e.stopPropagation();
            changeView('home');
            closeSidebar();
        });
    }
    if (menuStats) {
        menuStats.addEventListener('click', (e) => {
            e.stopPropagation();
            changeView('stats');
            closeSidebar();
        });
    }
    if (menuForm) {
        menuForm.addEventListener('click', (e) => {
            e.stopPropagation();
            changeView('form');
            closeSidebar();
        });
    }
    if (menuDonation) {
        menuDonation.addEventListener('click', (e) => {
            e.stopPropagation();
            changeView('donation');
            closeSidebar();
        });
    }
    if (closeFooter) {
        closeFooter.addEventListener('click', () => closeSidebar());
    }
}

function toggleSidebar() { 
    if (sidebar) {
        sidebar.classList.toggle('open');
        if (overlayBg) overlayBg.classList.toggle('show');
    }
}

function closeSidebar() { 
    if (sidebar) {
        sidebar.classList.remove('open');
        if (overlayBg) overlayBg.classList.remove('show');
    }
}

function getOptimizedPhotoUrl(rawUrl) {
    if (!rawUrl) return null;
    const match = rawUrl.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=s400` : null;
}

function changeView(view) {
    currentScreen = view;
    homeContainer.style.display = view === 'home' ? 'block' : 'none';
    statsDiv.style.display = view === 'stats' ? 'block' : 'none';
    formDiv.style.display = view === 'form' ? 'block' : 'none';
    const donationDiv = document.getElementById('donationView');
    if (donationDiv) {
        donationDiv.style.display = view === 'donation' ? 'block' : 'none';
    }
    const batchScroll = document.querySelector('.batch-scroll-x');
    if (batchScroll) batchScroll.style.display = view === 'home' ? 'flex' : 'none';
    if (view === 'stats') buildStatsFullView();
    if (view === 'donation') renderDonationPage();
    
    window.scrollTo(0, 0);
}

// Function to get top donors (5000 BDT and above)
function getTopDonors() {
    if (!alumniDataset.length) return [];
    
    // Filter donors who have Total Amounts >= 5000
    const donors = alumniDataset.filter(member => {
        const amount = parseFloat(member["Total Amounts"]) || 0;
        return amount >= 5000 && member["Name"];
    });
    
    // Sort by amount (highest first)
    donors.sort((a, b) => {
        const amountA = parseFloat(a["Total Amounts"]) || 0;
        const amountB = parseFloat(b["Total Amounts"]) || 0;
        return amountB - amountA;
    });
    
    return donors;
}

// Function to get donation statistics
function getDonationStats() {
    if (!alumniDataset.length) return { totalDonors: 0, totalAmount: 0, avgDonation: 0, topDonor: 0 };
    
    const donors = alumniDataset.filter(member => {
        const amount = parseFloat(member["Total Amounts"]) || 0;
        return amount >= 5000;
    });
    
    const totalDonors = donors.length;
    const totalAmount = donors.reduce((sum, m) => sum + (parseFloat(m["Total Amounts"]) || 0), 0);
    const avgDonation = totalDonors > 0 ? totalAmount / totalDonors : 0;
    const topDonor = donors.length > 0 ? Math.max(...donors.map(m => parseFloat(m["Total Amounts"]) || 0)) : 0;
    
    return { totalDonors, totalAmount, avgDonation, topDonor };
}

// Render Donation Page - Only showing donors list
function renderDonationPage() {
    const donationDiv = document.getElementById('donationView');
    if (!donationDiv) return;
    
    const topDonors = getTopDonors();
    const stats = getDonationStats();
    
    let donorsHtml = '';
    if (topDonors.length === 0) {
        donorsHtml = `
            <div class="no-donors">
                <i class="fas fa-gift fa-3x mb-3" style="color: #f59e0b;"></i>
                <h4 style="color: #374151; margin-bottom: 10px;">No Donors Yet</h4>
                <p style="color: #6b7280;">Be the first to donate 5,000+ BDT and support our school!</p>
            </div>
        `;
    } else {
        topDonors.forEach((donor, index) => {
            const amount = parseFloat(donor["Total Amounts"]) || 0;
            const batch = donor["S.S.C Batch"] || "N/A";
            const position = donor["Current Position"] || donor["Profession"] || "Alumni Member";
            const organization = donor["Organization/Institution"] || donor["Name of Organization/Institution"] || "";
            
            let rankBadge = '';
            let rankClass = '';
            
            if (index === 0) {
                rankBadge = '<i class="fas fa-crown"></i>';
                rankClass = 'gold-medal';
            } else if (index === 1) {
                rankBadge = '<i class="fas fa-medal"></i>';
                rankClass = 'silver-medal';
            } else if (index === 2) {
                rankBadge = '<i class="fas fa-medal"></i>';
                rankClass = 'bronze-medal';
            } else {
                rankBadge = `${index + 1}`;
                rankClass = '';
            }
            
            donorsHtml += `
                <div class="donor-card" onclick='openMemberModal(${JSON.stringify(donor).replace(/\\/g, '\\\\').replace(/'/g, "\\'")})' style="cursor: pointer;">
                    <div class="donor-rank ${rankClass}">
                        ${rankBadge}
                    </div>
                    <div class="donor-info">
                        <div class="donor-name">${escapeHtml(donor["Name"] || "Anonymous")}</div>
                        <div class="donor-batch">
                            <i class="fas fa-graduation-cap"></i> Batch ${batch}
                            <span class="donor-position">• ${escapeHtml(position)}</span>
                        </div>
                        ${organization ? `<div class="donor-org"><i class="fas fa-building"></i> ${escapeHtml(organization)}</div>` : ''}
                    </div>
                    <div class="donor-amount">
                        ৳${amount.toLocaleString()}
                    </div>
                </div>
            `;
        });
    }
    
    donationDiv.innerHTML = `
        <div class="donation-container">
            <!-- Header Section -->
            <div class="donation-header">
                <h2><i class="fas fa-hand-holding-heart"></i> Top Donors</h2>
                <p>Honoring our generous alumni who contributed 5,000 BDT or more</p>
            </div>
            
            <!-- Donation Statistics -->
            <div class="donation-stats">
                <div class="donation-stat-card">
                    <div class="donation-stat-label">
                        <i class="fas fa-users"></i> TOTAL DONORS
                    </div>
                    <div class="donation-stat-number">${stats.totalDonors}</div>
                </div>
                <div class="donation-stat-card">
                    <div class="donation-stat-label">
                        <i class="fas fa-coins"></i> TOTAL COLLECTION
                    </div>
                    <div class="donation-stat-number">৳${stats.totalAmount.toLocaleString()}</div>
                </div>
                <div class="donation-stat-card">
                    <div class="donation-stat-label">
                        <i class="fas fa-chart-line"></i> HIGHEST DONATION
                    </div>
                    <div class="donation-stat-number">৳${stats.topDonor.toLocaleString()}</div>
                </div>
                <div class="donation-stat-card">
                    <div class="donation-stat-label">
                        <i class="fas fa-calculator"></i> AVERAGE DONATION
                    </div>
                    <div class="donation-stat-number">৳${Math.round(stats.avgDonation).toLocaleString()}</div>
                </div>
            </div>
            
            <!-- Donors List -->
            <div class="top-donors-section">
                <div class="top-donors-title">
                    <i class="fas fa-trophy"></i>
                    Donors Gallery (5,000+ BDT)
                    <span class="donor-count-badge">${topDonors.length} Donors</span>
                </div>
                <div class="donors-list">
                    ${donorsHtml}
                </div>
            </div>
            
            <!-- Footer Note -->
            <div class="donation-footer-note">
                <i class="fas fa-heart" style="color: #f59e0b;"></i>
                Thank you for your generous contribution to Shambhupur High School Diamond Jubilee celebration!
            </div>
        </div>
    `;
}

function initDonationView() {
    if (!document.getElementById('donationView')) {
        const donationDiv = document.createElement('div');
        donationDiv.id = 'donationView';
        donationDiv.style.display = 'none';
        document.body.appendChild(donationDiv);
    }
}

function renderHomePage() {
    if (!alumniDataset.length) return;
    const searchTerm = searchBox.value.toLowerCase();
    let filtered = alumniDataset.filter(member => {
        if (!member["Registration Serial No."]) return false;
        const nameMatch = (member["Name"] || "").toLowerCase().includes(searchTerm);
        const batchMatch = (member["S.S.C Batch"] || "").toString().toLowerCase().includes(searchTerm);
        const orgMatch = (member["Organization/Institution"] || member["Name of Organization/Institution"] || "").toLowerCase().includes(searchTerm);
        const matchesSearch = nameMatch || batchMatch || orgMatch;
        const batchCond = currentBatchFilter === "All" || (member["S.S.C Batch"]?.toString() === currentBatchFilter);
        return matchesSearch && batchCond;
    });
    filtered.sort((a, b) => (parseInt(b["Registration Serial No."]) || 0) - (parseInt(a["Registration Serial No."]) || 0));
    const totalReg = filtered.length;
    const totalGuest = filtered.reduce((sum, m) => sum + (parseInt(m["No. of Guest"]) || 0), 0);
    const totalCollection = filtered.reduce((sum, m) => sum + (parseFloat(m["Total Amounts"]) || 0), 0);
    totalRegSpan.innerText = totalReg;
    totalGuestSpan.innerText = totalGuest;
    if (totalCollectionSpan) totalCollectionSpan.innerText = `৳${totalCollection.toLocaleString()}`;
    if (filtered.length === 0) {
        alumniRenderDiv.innerHTML = `<div class="text-center p-4 bg-white rounded-4"><i class="fas fa-user-graduate fa-3x text-secondary mb-2"></i><p>No alumni found.</p></div>`;
        return;
    }
    alumniRenderDiv.innerHTML = filtered.map(m => {
        let imgSrc = getOptimizedPhotoUrl(m["Photo"]);
        if (!imgSrc) imgSrc = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
        const guestVal = m["No. of Guest"] || 0;
        const amountVal = m["Total Amounts"] || 0;
        const orgName = m["Organization/Institution"] || m["Name of Organization/Institution"] || "";
        return `
            <div class="alumni-card-modern" onclick='openMemberModal(${JSON.stringify(m).replace(/\\/g, '\\\\').replace(/'/g, "\\'")})'>
                <div class="photo-avatar"><img src="${imgSrc}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'"></div>
                <div class="alumni-info">
                    <h4>${escapeHtml(m["Name"] || "Anonymous")}</h4>
                    <p>🎓 Batch ${m["S.S.C Batch"] || "—"} | ${m["Current Position"] || "Alumni"}</p>
                    ${orgName ? `<div class="org-tag"><i class="fas fa-building"></i> ${escapeHtml(orgName)}</div>` : ''}
                </div>
                <div class="right-meta">
                    <div class="amount-badge">৳${amountVal}</div>
                    <div class="guest-chip"><i class="fas fa-user-friends"></i> ${guestVal}</div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) { 
    if (!str) return ''; 
    return str.replace(/[&<>]/g, function(m) { 
        if (m === '&') return '&amp;'; 
        if (m === '<') return '&lt;'; 
        if (m === '>') return '&gt;'; 
        return m; 
    }); 
}

function buildBatchChips() {
    const batchSet = new Set();
    alumniDataset.forEach(m => { 
        if (m["S.S.C Batch"]) batchSet.add(m["S.S.C Batch"].toString()); 
    });
    const sorted = Array.from(batchSet).sort((a, b) => a - b);
    batchWrapper.innerHTML = `<div class="batch-pill active"><i class="fas fa-trophy"></i> All Batches</div>`;
    sorted.forEach(b => {
        const chip = document.createElement('div');
        chip.className = 'batch-pill';
        chip.innerHTML = `<i class="fas fa-graduation-cap"></i> ${b}`;
        chip.onclick = () => {
            document.querySelectorAll('.batch-pill').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentBatchFilter = b;
            renderHomePage();
        };
        batchWrapper.appendChild(chip);
    });
    const allChip = batchWrapper.firstChild;
    if (allChip) allChip.onclick = () => {
        document.querySelectorAll('.batch-pill').forEach(c => c.classList.remove('active'));
        allChip.classList.add('active');
        currentBatchFilter = "All";
        renderHomePage();
    };
}

function buildStatsFullView() {
    if (!alumniDataset.length) return;
    const batchCount = new Map();
    let totalValid = 0;
    alumniDataset.forEach(m => {
        if (m["Registration Serial No."]) {
            const batch = m["S.S.C Batch"];
            if (batch) { 
                batchCount.set(batch, (batchCount.get(batch) || 0) + 1); 
                totalValid++; 
            }
        }
    });
    const sortedBatches = Array.from(batchCount.keys()).sort((a, b) => a - b);
    statsInnerDiv.innerHTML = "";
    for (let batch of sortedBatches) {
        const count = batchCount.get(batch);
        const percent = totalValid ? (count / totalValid) * 100 : 0;
        const circumference = 188.5;
        const offset = circumference - (circumference * percent / 100);
        const row = document.createElement('div');
        row.className = 'batch-stat-row';
        row.onclick = () => {
            currentBatchFilter = batch;
            changeView('home');
            renderHomePage();
            setTimeout(() => {
                document.querySelectorAll('.batch-pill').forEach(ch => { 
                    if (ch.innerText.includes(batch)) ch.classList.add('active'); 
                    else ch.classList.remove('active'); 
                });
            }, 40);
        };
        row.innerHTML = `<div><div style="font-weight:800; font-size:1rem;">Batch ${batch}</div><div style="font-size:0.65rem;">${count} Registered</div></div>
            <div class="circle-progress"><svg width="60" height="60" viewBox="0 0 70 70"><circle cx="35" cy="35" r="30" fill="none" stroke="#e2e8f0" stroke-width="6"/><circle cx="35" cy="35" r="30" fill="none" stroke="#2563eb" stroke-width="6" stroke-dasharray="188.5" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 35 35)"/><text x="35" y="41" text-anchor="middle" fill="#2563eb" font-size="12" font-weight="800">${Math.round(percent)}%</text></svg></div>`;
        statsInnerDiv.appendChild(row);
    }
}

// Modal function: hides phone numbers and photo URL
window.openMemberModal = function(record) {
    const photoRaw = record["Photo"] || "";
    let finalPhoto = getOptimizedPhotoUrl(photoRaw);
    if (!finalPhoto) finalPhoto = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
    document.getElementById('modalAvatar').src = finalPhoto;
    document.getElementById('modalFullName').innerText = record["Name"] || "Alumni Member";
    const tableBody = document.getElementById('modalInfoTable');
    tableBody.innerHTML = "";
    
    const sensitiveKeywords = ["phone", "contact number", "mobile", "photo", "Photo"];
    const allKeys = Object.keys(record);
    const displayKeys = allKeys.filter(key => {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeywords.some(ex => lowerKey.includes(ex));
        return !isSensitive && record[key] && record[key].toString().trim() !== "";
    });
    
    const priorityOrder = ["Registration Serial No.", "Name", "S.S.C Batch", "Group", "Current Position", "Organization/Institution", "Name of Organization/Institution", "Profession", "No. of Guest", "Size of T-shirt", "Total Amounts", "Money Received Number", "bKash No./Transection No.", "Father Name", "Mothar Name", "Permanent Address", "Present Address", "Blood Group", "Email"];
    
    const sortedDisplay = [...displayKeys].sort((a, b) => {
        const idxA = priorityOrder.findIndex(p => p.toLowerCase() === a.toLowerCase());
        const idxB = priorityOrder.findIndex(p => p.toLowerCase() === b.toLowerCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });
    
    sortedDisplay.forEach(key => {
        let value = record[key].toString();
        let displayKey = key;
        tableBody.innerHTML += `<tr><td style="color:#5b6e8c; font-weight:600; width:40%; padding:8px 5px;">${escapeHtml(displayKey)}</td><td style="word-break:break-word;">${escapeHtml(value)}</td><tr>`;
    });
    modal.style.display = 'flex';
}

function closeModalFn() { 
    modal.style.display = 'none'; 
}

async function fetchSheetData() {
    try {
        const res = await fetch(SHEET_URL);
        const json = await res.json();
        alumniDataset = json.map(row => {
            let clean = {};
            Object.keys(row).forEach(k => clean[k.trim()] = row[k]);
            return clean;
        });
        buildBatchChips();
        renderHomePage();
        if (currentScreen === 'stats') buildStatsFullView();
    } catch (err) {
        console.error(err);
        alumniRenderDiv.innerHTML = `<div class="alert alert-danger m-3">⚠️ Unable to load data. Please check your connection.</div>`;
    }
}

// Event Listeners
document.getElementById('closeModalIcon').onclick = closeModalFn;
modal.onclick = (e) => { 
    if (e.target === modal) closeModalFn(); 
};
searchBox.addEventListener('input', () => renderHomePage());

// Logo error fallback for header logo
const headerLogo = document.getElementById('schoolLogoImg');
if (headerLogo) {
    headerLogo.onerror = () => { 
        headerLogo.src = "https://img.icons8.com/fluency/96/school-building.png"; 
    };
}

// Initialize the app
loadSidebar().then(() => {
    fetchSheetData();
});
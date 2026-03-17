const firebaseConfig = {
    apiKey: "AIzaSyAmbzRxqYFti6IEksy2WunKCVa_v8Gg0F0",
    authDomain: "market-digital-3d10e.firebaseapp.com",
    projectId: "market-digital-3d10e",
    storageBucket: "market-digital-3d10e.firebasestorage.app",
    messagingSenderId: "368580098929",
    appId: "1:368580098929:web:7e005211ceb83b3b9794d0",
    measurementId: "G-Q985QSMDDT"
};

// Initialize
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let isLoginMode = true;
let currentActiveChatId = null;

// --- 1. ระบบ Authentication ---
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authSubtitle').innerText = isLoginMode ? "เข้าสู่ระบบเพื่อเริ่มใช้งาน" : "สมัครสมาชิกใหม่เพื่อเข้าสู่ตลาด";
    document.getElementById('authBtn').innerText = isLoginMode ? "เข้าสู่ระบบ" : "สมัครสมาชิก";
    document.getElementById('toggleBtn').innerText = isLoginMode ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
    document.getElementById('toggleText').innerText = isLoginMode ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?";
}

async function handleAuth() {
    const email = document.getElementById('emailInp').value;
    const pass = document.getElementById('passInp').value;
    try {
        if (isLoginMode) await auth.signInWithEmailAndPassword(email, pass);
        else await auth.createUserWithEmailAndPassword(email, pass);
    } catch (e) { alert(e.message); }
}

auth.onAuthStateChanged(user => {
    document.getElementById('authView').style.display = user ? 'none' : 'flex';
    document.getElementById('appView').style.display = user ? 'block' : 'none';
    if (user) loadProducts();
});

function logout() { auth.signOut(); }

// --- 2. ระบบคำนวณราคาหาร ---
function calcSplit() {
    const total = document.getElementById('pTotal').value || 0;
    const count = document.getElementById('pCount').value || 1;
    const res = (total / count).toFixed(2);
    document.getElementById('splitResult').innerText = `ยอดต่อคน: ฿${res}`;
}

// --- 3. ระบบประกาศสินค้า ---
async function savePost() {
    const post = {
        title: document.getElementById('pTitle').value,
        cat: document.getElementById('pCat').value,
        totalPrice: Number(document.getElementById('pTotal').value),
        split: Number(document.getElementById('pCount').value),
        desc: document.getElementById('pDesc').value,
        user: auth.currentUser.email,
        time: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("cru_posts").add(post);
    closeModal('postModal');
}

function loadProducts() {
    db.collection("cru_posts").orderBy("time", "desc").onSnapshot(snap => {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = '';
        snap.forEach(doc => {
            const p = doc.data();
            const perPerson = (p.totalPrice / p.split).toFixed(2);
            grid.innerHTML += `
                <div class="card">
                    <small>${p.cat}</small>
                    <h3>${p.title}</h3>
                    <p class="price-tag">฿${perPerson} ${p.split > 1 ? '<small style="font-size:12px;">/คน</small>' : ''}</p>
                    <button class="btn-primary" onclick="openChat('${doc.id}', '${p.title}')">💬 สอบถามแชท</button>
                </div>
            `;
        });
    });
}

// --- 4. ระบบแชท Real-time ---
function openChat(id, title) {
    currentActiveChatId = id;
    document.getElementById('chatBox').style.display = 'flex';
    document.getElementById('chatWith').innerText = title;
    db.collection("cru_posts").doc(id).collection("chats").orderBy("time")
    .onSnapshot(snap => {
        const display = document.getElementById('msgDisplay');
        display.innerHTML = '';
        snap.forEach(m => {
            const data = m.data();
            display.innerHTML += `<div><b>${data.user.split('@')[0]}:</b> ${data.text}</div>`;
        });
        display.scrollTop = display.scrollHeight;
    });
}

async function sendMsg() {
    const text = document.getElementById('msgInp').value;
    if (!text) return;
    await db.collection("cru_posts").doc(currentActiveChatId).collection("messages").add({
        text, user: auth.currentUser.email, time: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('msgInp').value = '';
}

// Helpers
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeChat() { document.getElementById('chatBox').style.display = 'none'; }

// ==========================================================
// إعدادات Firebase
// يرجى استبدال القيم أدناه بالقيم الخاصة بمشروعك في Firebase
// ==========================================================
const firebaseConfig = {
    apiKey: "AIzaSyAoTyK5sqKqeqtPOFuW7nGiU6HZ-EZMJmo",
    authDomain: "qweent2026.firebaseapp.com",
    projectId: "qweent2026",
    storageBucket: "qweent2026.firebasestorage.app",
    messagingSenderId: "155936563315",
    appId: "1:155936563315:web:8f441ebbfaf7dde54eca06"
};

// تهيئة Firebase
// تحقق أولاً إذا تم إضافة الإعدادات (لتجنب الأخطاء إذا كانت فارغة)
let db;
let storage;
if (firebaseConfig.apiKey !== "ضع_مفتاح_API_هنا") {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();
} else {
    alert("تحذير: لم يتم إعداد Firebase بعد. يرجى تعديل ملف universities.js وإضافة كود firebaseConfig الخاص بك.");
}

// DOM Elements
const loginPage = document.getElementById('login-page');
const adminPage = document.getElementById('admin-page');
const universityPage = document.getElementById('university-page');

const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

const logoutAdminBtn = document.getElementById('logout-admin-btn');
const logoutUniBtn = document.getElementById('logout-uni-btn');

// Admin Elements
const newUniName = document.getElementById('new-uni-name');
const newUniUser = document.getElementById('new-uni-user');
const newUniPass = document.getElementById('new-uni-pass');
const newUniColleges = document.getElementById('new-uni-colleges');
const addUniBtn = document.getElementById('add-uni-btn');
const adminUniversitiesList = document.getElementById('admin-universities-list');

// University Elements
const uniWelcomeTitle = document.getElementById('uni-welcome-title');
const uniCollegesList = document.getElementById('uni-colleges-list');

// Initial Data Structure
const initialUniversities = [
    {
        name: 'جامعة المثنى',
        username: 'almuthanna',
        password: '123',
        colleges: ['التربية الانسانية', 'العلوم الصرفة', 'التربية الاساسية', 'التربية البدنية']
    },
    {
        name: 'جامعة ساوة الاهلية',
        username: 'sawa',
        password: '123',
        colleges: ['التربية']
    },
    {
        name: 'جامعة الصادق الاهلية',
        username: 'alsadiq',
        password: '123',
        colleges: ['كلية التربية']
    },
    {
        name: 'جامعة ذي قار',
        username: 'thiqar',
        password: '123',
        colleges: ['التربية الانسانية', 'العلوم الصرفة', 'التربية الاساسية', 'التربية البدنية']
    },
    {
        name: 'جامعة واسط',
        username: 'wasit',
        password: '123',
        colleges: ['التربية الانسانية', 'العلوم الصرفة', 'التربية الاساسية', 'التربية البدنية']
    },
    {
        name: 'جامعة العين',
        username: 'alain',
        password: '123',
        colleges: ['التربية الانسانية', 'العلوم الصرفة', 'التربية الاساسية', 'التربية البدنية']
    },
    {
        name: 'جامعة البصرة',
        username: 'basra',
        password: '123',
        colleges: ['التربية الانسانية', 'العلوم الصرفة', 'التربية الاساسية', 'التربية البدنية']
    }
];

// Initialize Database (Seed initial data if empty)
async function initDatabase() {
    if (!db) return;
    
    try {
        // Check Admin
        const adminDoc = await db.collection('settings').doc('adminCredentials').get();
        if (!adminDoc.exists) {
            await db.collection('settings').doc('adminCredentials').set({
                username: 'admin',
                password: '123'
            });
        }
        
        // Check Universities
        const unisSnapshot = await db.collection('universities').limit(1).get();
        if (unisSnapshot.empty) {
            console.log("Seeding initial universities...");
            for (const uni of initialUniversities) {
                await db.collection('universities').add({
                    ...uni,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

if (db) {
    initDatabase();
}

// Authentication Flow
loginBtn.addEventListener('click', async () => {
    if (!db) {
        showError("قاعدة البيانات غير متصلة.");
        return;
    }
    
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    
    loginError.style.display = 'none';
    
    if (!user || !pass) {
        showError("الرجاء إدخال اسم المستخدم وكلمة المرور.");
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.textContent = "جاري التحقق...";

    try {
        // Check Admin
        const adminDoc = await db.collection('settings').doc('adminCredentials').get();
        if (adminDoc.exists) {
            const adminData = adminDoc.data();
            if (user === adminData.username && pass === adminData.password) {
                showAdminDashboard();
                loginBtn.disabled = false;
                loginBtn.textContent = "تسجيل الدخول";
                return;
            }
        }
        
        // Check Universities
        const unisSnapshot = await db.collection('universities')
            .where('username', '==', user)
            .where('password', '==', pass)
            .get();
            
        if (!unisSnapshot.empty) {
            const uniDoc = unisSnapshot.docs[0];
            const uniData = uniDoc.data();
            showUniversityDashboard(uniData, uniDoc.id);
        } else {
            showError("اسم المستخدم أو كلمة المرور غير صحيحة.");
        }
    } catch (error) {
        console.error("Login error:", error);
        showError("حدث خطأ أثناء تسجيل الدخول.");
    }
    
    loginBtn.disabled = false;
    loginBtn.textContent = "تسجيل الدخول";
});

function showError(msg) {
    loginError.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
    loginError.style.display = 'block';
}

let unsubscribeUniversities = null;

function showAdminDashboard() {
    loginPage.style.display = 'none';
    adminPage.style.display = 'block';
    
    // Listen for real-time updates
    if (db && !unsubscribeUniversities) {
        unsubscribeUniversities = db.collection('universities')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                adminUniversitiesList.innerHTML = '';
                if (snapshot.empty) {
                    adminUniversitiesList.innerHTML = `<tr><td colspan="5" style="text-align: center;">لا توجد جامعات مسجلة.</td></tr>`;
                    return;
                }
                
                snapshot.forEach(doc => {
                    const uni = doc.data();
                    const tr = document.createElement('tr');
                    
                    tr.innerHTML = `
                        <td>${uni.name || ''}</td>
                        <td>${uni.username || ''}</td>
                        <td>${uni.password || ''}</td>
                        <td>${(uni.colleges || []).join('، ')}</td>
                        <td>
                            <button class="btn btn-icon delete-uni-btn" data-id="${doc.id}" style="color: red;" title="حذف">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    adminUniversitiesList.appendChild(tr);
                });
                
                // Attach delete listeners
                document.querySelectorAll('.delete-uni-btn').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const docId = this.getAttribute('data-id');
                        if(confirm("هل أنت متأكد من حذف هذه الجامعة؟")) {
                            try {
                                await db.collection('universities').doc(docId).delete();
                            } catch(e) {
                                alert("حدث خطأ أثناء الحذف.");
                                console.error(e);
                            }
                        }
                    });
                });
                // Render Admin Files View
                const adminFilesContainer = document.getElementById('admin-files-container');
                if(adminFilesContainer) {
                    adminFilesContainer.innerHTML = '';
                    let hasAnyFiles = false;
                    
                    snapshot.forEach(doc => {
                        const uni = doc.data();
                        const filesObj = uni.files || {};
                        const repliesObj = uni.replies || {};
                        
                        let uniHasFiles = false;
                        for(const col of (uni.colleges || [])) {
                            if((filesObj[col] && filesObj[col].length > 0) || (repliesObj[col] && repliesObj[col].length > 0)) {
                                uniHasFiles = true;
                            }
                        }
                        
                        if(uniHasFiles) {
                            hasAnyFiles = true;
                            
                            const uniBlock = document.createElement('div');
                            uniBlock.style.background = '#f8fafc';
                            uniBlock.style.border = '1px solid #cbd5e1';
                            uniBlock.style.borderRadius = '8px';
                            uniBlock.style.padding = '15px';
                            uniBlock.style.marginBottom = '15px';
                            
                            const uniTitle = document.createElement('h5');
                            uniTitle.innerHTML = `<i class="fa-solid fa-building-columns text-blue"></i> ${uni.name}`;
                            uniTitle.style.marginBottom = '10px';
                            uniTitle.style.borderBottom = '2px solid var(--gold-yellow)';
                            uniTitle.style.paddingBottom = '5px';
                            
                            const collegesWrapper = document.createElement('div');
                            collegesWrapper.style.display = 'flex';
                            collegesWrapper.style.flexDirection = 'column';
                            collegesWrapper.style.gap = '10px';
                            
                            (uni.colleges || []).forEach(college => {
                                const collegeFiles = filesObj[college] || [];
                                const collegeReplies = repliesObj[college] || [];
                                
                                if(collegeFiles.length > 0 || collegeReplies.length > 0) {
                                    const colBlock = document.createElement('div');
                                    colBlock.style.background = 'white';
                                    colBlock.style.padding = '10px';
                                    colBlock.style.borderRadius = '6px';
                                    colBlock.style.border = '1px solid #e2e8f0';
                                    
                                    const colTitle = document.createElement('h6');
                                    colTitle.innerHTML = `<i class="fa-solid fa-graduation-cap text-blue"></i> ${college}`;
                                    colTitle.style.marginBottom = '8px';
                                    colTitle.style.color = '#333';
                                    colBlock.appendChild(colTitle);
                                    
                                    // 1. Render University's uploaded files
                                    if(collegeFiles.length > 0) {
                                        const filesList = document.createElement('div');
                                        filesList.style.display = 'flex';
                                        filesList.style.flexDirection = 'column';
                                        filesList.style.gap = '5px';
                                        
                                        collegeFiles.forEach((file, index) => {
                                            const itemDiv = document.createElement('div');
                                            itemDiv.style.display = 'flex';
                                            itemDiv.style.justifyContent = 'space-between';
                                            itemDiv.style.alignItems = 'center';
                                            itemDiv.style.marginBottom = '4px';

                                            const fileLink = document.createElement('a');
                                            fileLink.href = file.url;
                                            fileLink.target = '_blank';
                                            fileLink.style.display = 'inline-block';
                                            fileLink.style.color = 'var(--primary-blue)';
                                            fileLink.style.textDecoration = 'none';
                                            fileLink.style.fontSize = '0.85rem';
                                            fileLink.innerHTML = `<i class="fa-solid fa-file"></i> ${file.name}`;
                                            
                                            fileLink.onmouseover = () => fileLink.style.textDecoration = 'underline';
                                            fileLink.onmouseout = () => fileLink.style.textDecoration = 'none';
                                            
                                            const delBtn = document.createElement('i');
                                            delBtn.className = 'fa-solid fa-trash';
                                            delBtn.style.color = 'red';
                                            delBtn.style.cursor = 'pointer';
                                            delBtn.style.fontSize = '0.8rem';
                                            delBtn.title = 'حذف كمسؤول';
                                            delBtn.onclick = async () => {
                                                if(confirm('هل أنت متأكد من حذف هذا الملف نهائياً؟')) {
                                                    try {
                                                        const newFiles = [...collegeFiles];
                                                        newFiles.splice(index, 1);
                                                        await db.collection('universities').doc(doc.id).update({
                                                            [`files.${college}`]: newFiles
                                                        });
                                                    } catch(e) {
                                                        console.error(e);
                                                        alert('حدث خطأ أثناء الحذف');
                                                    }
                                                }
                                            };
                                            
                                            itemDiv.appendChild(fileLink);
                                            itemDiv.appendChild(delBtn);
                                            filesList.appendChild(itemDiv);
                                        });
                                        colBlock.appendChild(filesList);
                                    }

                                    // 2. Admin Replies Section
                                    const repliesSection = document.createElement('div');
                                    repliesSection.style.marginTop = '15px';
                                    repliesSection.style.paddingTop = '10px';
                                    repliesSection.style.borderTop = '1px dashed #ccc';

                                    const repliesTitle = document.createElement('div');
                                    repliesTitle.innerHTML = '<strong>ردود الإدارة:</strong>';
                                    repliesTitle.style.fontSize = '0.85rem';
                                    repliesTitle.style.marginBottom = '8px';
                                    repliesSection.appendChild(repliesTitle);

                                    // Render existing replies
                                    if(collegeReplies.length > 0) {
                                        const repliesList = document.createElement('div');
                                        repliesList.style.display = 'flex';
                                        repliesList.style.flexDirection = 'column';
                                        repliesList.style.gap = '5px';
                                        repliesList.style.marginBottom = '10px';
                                        
                                        collegeReplies.forEach((file, index) => {
                                            const itemDiv = document.createElement('div');
                                            itemDiv.style.display = 'flex';
                                            itemDiv.style.justifyContent = 'space-between';
                                            itemDiv.style.alignItems = 'center';
                                            itemDiv.style.background = '#eef2ff';
                                            itemDiv.style.padding = '4px 8px';
                                            itemDiv.style.borderRadius = '4px';

                                            const fileLink = document.createElement('a');
                                            fileLink.href = file.url;
                                            fileLink.target = '_blank';
                                            fileLink.style.display = 'inline-block';
                                            fileLink.style.color = '#4338ca';
                                            fileLink.style.textDecoration = 'none';
                                            fileLink.style.fontSize = '0.85rem';
                                            fileLink.innerHTML = `<i class="fa-solid fa-reply"></i> ${file.name}`;
                                            
                                            const delBtn = document.createElement('i');
                                            delBtn.className = 'fa-solid fa-trash';
                                            delBtn.style.color = 'red';
                                            delBtn.style.cursor = 'pointer';
                                            delBtn.style.fontSize = '0.8rem';
                                            delBtn.title = 'حذف الرد';
                                            delBtn.onclick = async () => {
                                                if(confirm('هل أنت متأكد من حذف رد الإدارة هذا؟')) {
                                                    try {
                                                        const newReplies = [...collegeReplies];
                                                        newReplies.splice(index, 1);
                                                        await db.collection('universities').doc(doc.id).update({
                                                            [`replies.${college}`]: newReplies
                                                        });
                                                    } catch(e) {
                                                        console.error(e);
                                                        alert('حدث خطأ أثناء الحذف');
                                                    }
                                                }
                                            };
                                            
                                            itemDiv.appendChild(fileLink);
                                            itemDiv.appendChild(delBtn);
                                            repliesList.appendChild(itemDiv);
                                        });
                                        repliesSection.appendChild(repliesList);
                                    }

                                    // Reply upload control
                                    const uploadControls = document.createElement('div');
                                    uploadControls.style.display = 'flex';
                                    uploadControls.style.alignItems = 'center';
                                    uploadControls.style.gap = '8px';
                                    
                                    const fileInput = document.createElement('input');
                                    fileInput.type = 'file';
                                    fileInput.style.fontSize = '0.75rem';
                                    fileInput.style.maxWidth = '200px';

                                    const uploadBtn = document.createElement('button');
                                    uploadBtn.className = 'btn btn-sm btn-primary';
                                    uploadBtn.innerHTML = 'إرسال رد';
                                    uploadBtn.style.fontSize = '0.75rem';
                                    uploadBtn.style.padding = '4px 8px';

                                    uploadBtn.onclick = async () => {
                                        const file = fileInput.files[0];
                                        if(!file) {
                                            alert('الرجاء اختيار ملف للرد.');
                                            return;
                                        }
                                        
                                        uploadBtn.disabled = true;
                                        uploadBtn.innerHTML = 'جاري الرفع...';
                                        
                                        try {
                                            const storageRef = storage.ref();
                                            const fileRef = storageRef.child(`universities/${doc.id}/${college}/replies/${Date.now()}_${file.name}`);
                                            await fileRef.put(file);
                                            const url = await fileRef.getDownloadURL();
                                            
                                            const newReplies = [...collegeReplies, { name: file.name, url: url }];
                                            await db.collection('universities').doc(doc.id).update({
                                                [`replies.${college}`]: newReplies
                                            });
                                            fileInput.value = '';
                                        } catch (error) {
                                            console.error("Upload error:", error);
                                            alert("حدث خطأ أثناء الرفع.");
                                        }
                                        uploadBtn.disabled = false;
                                        uploadBtn.innerHTML = 'إرسال رد';
                                    };

                                    uploadControls.appendChild(fileInput);
                                    uploadControls.appendChild(uploadBtn);
                                    repliesSection.appendChild(uploadControls);
                                    
                                    colBlock.appendChild(repliesSection);
                                    collegesWrapper.appendChild(colBlock);
                                }
                            });
                            
                            uniBlock.appendChild(uniTitle);
                            uniBlock.appendChild(collegesWrapper);
                            adminFilesContainer.appendChild(uniBlock);
                        }
                    });
                    
                    if(!hasAnyFiles) {
                        adminFilesContainer.innerHTML = '<div class="empty-state" style="padding: 20px;"><i class="fa-solid fa-folder-open empty-icon"></i><p>لا توجد ملفات مرفوعة من قبل الجامعات حتى الآن.</p></div>';
                    }
                }
            });
    }
}

let unsubscribeCurrentUni = null;

function showUniversityDashboard(uniData, uniId) {
    loginPage.style.display = 'none';
    universityPage.style.display = 'block';
    
    uniWelcomeTitle.innerHTML = `<i class="fa-solid fa-building-columns"></i> ${uniData.name}`;
    
    if (unsubscribeCurrentUni) unsubscribeCurrentUni();
    
    unsubscribeCurrentUni = db.collection('universities').doc(uniId).onSnapshot(doc => {
        if (!doc.exists) return;
        const uni = doc.data();
        const filesObj = uni.files || {};
        
        uniCollegesList.innerHTML = '';
        (uni.colleges || []).forEach(college => {
            const div = document.createElement('div');
            div.className = 'glass-panel';
            div.style.padding = '15px';
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.borderTop = '4px solid var(--primary-blue)';
            div.style.background = 'white';
            
            // Title
            const title = document.createElement('h5');
            title.innerHTML = `<i class="fa-solid fa-graduation-cap text-blue"></i> ${college}`;
            title.style.margin = '0 0 15px 0';
            
            // Upload Controls
            const uploadControls = document.createElement('div');
            uploadControls.style.display = 'flex';
            uploadControls.style.flexDirection = 'column';
            uploadControls.style.gap = '10px';
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.className = 'form-control';
            fileInput.style.fontSize = '0.85rem';
            fileInput.title = "يمكنك رفع أي نوع من الملفات (Excel, Word, PDF, وغيرها)";
            
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'btn btn-primary btn-sm';
            uploadBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> رفع الملف';
            
            const progressDiv = document.createElement('div');
            progressDiv.style.fontSize = '0.8rem';
            progressDiv.style.color = '#555';
            progressDiv.style.display = 'none';
            
            // Files List
            const filesListDiv = document.createElement('div');
            filesListDiv.style.marginTop = '15px';
            filesListDiv.style.paddingTop = '10px';
            filesListDiv.style.borderTop = '1px solid #eee';
            
            const collegeFiles = filesObj[college] || [];
            if(collegeFiles.length === 0) {
                filesListDiv.innerHTML = '<span style="color:#888; font-size:0.8rem;">لا توجد ملفات مرفوعة.</span>';
            } else {
                collegeFiles.forEach((file, index) => {
                    const fileItem = document.createElement('div');
                    fileItem.style.display = 'flex';
                    fileItem.style.justifyContent = 'space-between';
                    fileItem.style.alignItems = 'center';
                    fileItem.style.background = '#f8fafc';
                    fileItem.style.padding = '5px 8px';
                    fileItem.style.borderRadius = '4px';
                    fileItem.style.marginBottom = '5px';
                    fileItem.style.fontSize = '0.85rem';
                    
                    fileItem.innerHTML = `
                        <a href="${file.url}" target="_blank" style="color: var(--primary-blue); text-decoration: none; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <i class="fa-solid fa-file"></i> ${file.name}
                        </a>
                        <i class="fa-solid fa-trash" style="color: red; cursor: pointer;" title="حذف" data-idx="${index}"></i>
                    `;
                    
                    fileItem.querySelector('.fa-trash').addEventListener('click', async () => {
                        if(confirm('هل أنت متأكد من حذف هذا الملف؟')) {
                            try {
                                const newFiles = [...collegeFiles];
                                newFiles.splice(index, 1);
                                await db.collection('universities').doc(uniId).update({
                                    [`files.${college}`]: newFiles
                                });
                            } catch(e) { console.error(e); alert('خطأ في الحذف'); }
                        }
                    });
                    filesListDiv.appendChild(fileItem);
                });
            }
            
            // Upload Logic
            uploadBtn.addEventListener('click', async () => {
                const file = fileInput.files[0];
                if(!file) { alert('الرجاء اختيار ملف أولاً.'); return; }
                if(!storage) { alert('خدمة Storage غير مفعلة.'); return; }
                
                uploadBtn.disabled = true;
                fileInput.disabled = true;
                progressDiv.style.display = 'block';
                progressDiv.innerText = 'جاري الرفع... 0%';
                
                const uniqueName = Date.now() + '_' + file.name;
                const storageRef = storage.ref(`uploads/${uniId}/${college}/${uniqueName}`);
                
                const uploadTask = storageRef.put(file);
                
                // إضافة فحص توقف الرفع (Timeout)
                let uploadStuckTimer = setTimeout(() => {
                    alert("الرفع يستغرق وقتاً طويلاً جداً (توقف عند 0%).\n\nالأسباب المحتملة:\n1. لم تقم بتفعيل Storage في منصة Firebase (يجب الضغط على Get Started).\n2. المتصفح يمنع الرفع لأنك تفتح الملف مباشرة (file:///). يرجى استخدام إضافة Live Server في VS Code.");
                    uploadTask.cancel();
                    uploadBtn.disabled = false;
                    fileInput.disabled = false;
                    progressDiv.style.display = 'none';
                }, 15000); // 15 seconds timeout
                
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        progressDiv.innerText = `جاري الرفع... ${Math.round(progress)}%`;
                        
                        if (progress > 0) {
                            clearTimeout(uploadStuckTimer); // إذا تقدم الرفع نلغي مؤقت التوقف
                        }
                    },
                    (error) => {
                        clearTimeout(uploadStuckTimer);
                        console.error('Upload Error:', error);
                        alert('فشل الرفع! يرجى التأكد من اتصالك بالإنترنت، ومن أنك قمت بتعديل القواعد (Rules) في Firebase Storage إلى (allow read, write: if true;)');
                        uploadBtn.disabled = false;
                        fileInput.disabled = false;
                        progressDiv.style.display = 'none';
                    },
                    async () => {
                        clearTimeout(uploadStuckTimer);
                        try {
                            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                            const currentCollegeFiles = filesObj[college] || [];
                            currentCollegeFiles.push({ name: file.name, url: downloadURL });
                            
                            await db.collection('universities').doc(uniId).update({
                                [`files.${college}`]: currentCollegeFiles
                            });
                            
                            fileInput.value = '';
                            progressDiv.innerText = 'تم الرفع بنجاح!';
                            setTimeout(() => progressDiv.style.display = 'none', 3000);
                        } catch(err) {
                            console.error('Firestore Update Error:', err);
                        }
                        uploadBtn.disabled = false;
                        fileInput.disabled = false;
                    }
                );
            });
            
            uploadControls.appendChild(fileInput);
            uploadControls.appendChild(uploadBtn);
            uploadControls.appendChild(progressDiv);
            
            div.appendChild(title);
            div.appendChild(uploadControls);
            div.appendChild(filesListDiv);
            
            // Render Admin Replies
            const repliesObj = uni.replies || {};
            const collegeReplies = repliesObj[college] || [];
            if(collegeReplies.length > 0) {
                const repliesListDiv = document.createElement('div');
                repliesListDiv.style.marginTop = '15px';
                repliesListDiv.style.paddingTop = '10px';
                repliesListDiv.style.borderTop = '1px dashed #ccc';
                
                const repliesTitle = document.createElement('div');
                repliesTitle.innerHTML = '<strong>ردود الإدارة المستلمة:</strong>';
                repliesTitle.style.fontSize = '0.85rem';
                repliesTitle.style.marginBottom = '8px';
                repliesListDiv.appendChild(repliesTitle);

                collegeReplies.forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.style.background = '#eef2ff';
                    fileItem.style.padding = '5px 8px';
                    fileItem.style.borderRadius = '4px';
                    fileItem.style.marginBottom = '5px';
                    fileItem.style.fontSize = '0.85rem';
                    
                    fileItem.innerHTML = `
                        <a href="${file.url}" target="_blank" style="color: #4338ca; text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <i class="fa-solid fa-reply"></i> ${file.name}
                        </a>
                    `;
                    repliesListDiv.appendChild(fileItem);
                });
                
                div.appendChild(repliesListDiv);
            }
            
            uniCollegesList.appendChild(div);
        });
    });
}

// Logout
logoutAdminBtn.addEventListener('click', logout);
logoutUniBtn.addEventListener('click', logout);

function logout() {
    if (unsubscribeUniversities) {
        unsubscribeUniversities();
        unsubscribeUniversities = null;
    }
    if (unsubscribeCurrentUni) {
        unsubscribeCurrentUni();
        unsubscribeCurrentUni = null;
    }
    
    adminPage.style.display = 'none';
    universityPage.style.display = 'none';
    loginPage.style.display = 'block';
    
    usernameInput.value = '';
    passwordInput.value = '';
    loginError.style.display = 'none';
}

// Admin Logic - Add University
addUniBtn.addEventListener('click', async () => {
    if (!db) {
        alert("قاعدة البيانات غير متصلة.");
        return;
    }
    
    const name = newUniName.value.trim();
    const user = newUniUser.value.trim();
    const pass = newUniPass.value.trim();
    const collegesRaw = newUniColleges.value.trim();
    
    if (!name || !user || !pass) {
        alert("يرجى تعبئة جميع الحقول الأساسية (الاسم، اليوزرنيم، الباسوورد).");
        return;
    }
    
    addUniBtn.disabled = true;
    addUniBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
    
    try {
        // Check if username already exists
        const userCheck = await db.collection('universities').where('username', '==', user).get();
        if (!userCheck.empty) {
            alert("اسم المستخدم (اليوزرنيم) محجوز بالفعل، يرجى اختيار اسم آخر.");
            addUniBtn.disabled = false;
            addUniBtn.innerHTML = '<i class="fa-solid fa-check"></i> حفظ الجامعة';
            return;
        }
        
        const collegesList = collegesRaw ? collegesRaw.split(',').map(c => c.trim()).filter(c => c) : [];
        
        await db.collection('universities').add({
            name,
            username: user,
            password: pass,
            colleges: collegesList,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Clear form
        newUniName.value = '';
        newUniUser.value = '';
        newUniPass.value = '';
        newUniColleges.value = '';
        
        alert("تم إضافة الجامعة بنجاح!");
    } catch (error) {
        console.error("Error adding university:", error);
        alert("حدث خطأ أثناء إضافة الجامعة.");
    }
    
    addUniBtn.disabled = false;
    addUniBtn.innerHTML = '<i class="fa-solid fa-check"></i> حفظ الجامعة';
});

// Admin Search Logic
const adminSearch = document.getElementById('admin-search');
if(adminSearch) {
    adminSearch.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const rows = document.querySelectorAll('#admin-universities-list tr');
        rows.forEach(row => {
            const uniName = row.cells[0]?.textContent.toLowerCase() || '';
            const username = row.cells[1]?.textContent.toLowerCase() || '';
            const colleges = row.cells[3]?.textContent.toLowerCase() || '';
            if(uniName.includes(query) || username.includes(query) || colleges.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

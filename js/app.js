// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('orlalock_users')) || [];
        this.init();
    }

    init() {
        // Check if user is logged in
        const savedUser = localStorage.getItem('orlalock_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showAuthPage();
        }
    }

    // CPF Validation
    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }

        // Validate first digit
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        let firstDigit = remainder > 9 ? 0 : remainder;

        if (parseInt(cpf.charAt(9)) !== firstDigit) {
            return false;
        }

        // Validate second digit
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        let secondDigit = remainder > 9 ? 0 : remainder;

        return parseInt(cpf.charAt(10)) === secondDigit;
    }

    // Format CPF
    formatCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length > 11) cpf = cpf.substring(0, 11);
        
        if (cpf.length > 9) {
            return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (cpf.length > 6) {
            return cpf.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
        } else if (cpf.length > 3) {
            return cpf.replace(/(\d{3})(\d{0,3})/, '$1.$2');
        }
        return cpf;
    }

    // Format phone
    formatPhone(phone) {
        phone = phone.replace(/[^\d]+/g, '');
        if (phone.length > 11) phone = phone.substring(0, 11);
        
        if (phone.length > 10) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (phone.length > 6) {
            return phone.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (phone.length > 2) {
            return phone.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        }
        return phone;
    }

    // Register new user
    register(name, cpf, phone, password) {
        // Validate all fields
        if (!name || name.length < 3) {
            alert('Por favor, digite um nome válido (mínimo 3 caracteres)');
            return false;
        }

        if (!this.validateCPF(cpf)) {
            alert('Por favor, digite um CPF válido');
            return false;
        }

        cpf = cpf.replace(/[^\d]+/g, '');

        if (phone.length < 14) {
            alert('Por favor, digite um telefone válido');
            return false;
        }

        if (!password || password.length < 4 || password.length > 6) {
            alert('A senha deve ter entre 4 e 6 dígitos');
            return false;
        }

        // Check if CPF already exists
        if (this.users.find(user => user.cpf === cpf)) {
            alert('Este CPF já está cadastrado');
            return false;
        }

        // Create new user
        const newUser = {
            id: 'user_' + Date.now(),
            name: name,
            cpf: cpf,
            phone: phone,
            password: password,
            balance: 50,
            favorites: [],
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        localStorage.setItem('orlalock_users', JSON.stringify(this.users));

        // Auto login
        this.login(cpf, password);
        return true;
    }

    // Login user
    login(cpf, password) {
        cpf = cpf.replace(/[^\d]+/g, '');

        const user = this.users.find(u => u.cpf === cpf && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('orlalock_current_user', JSON.stringify(user));
            this.showMainApp();
            return true;
        } else {
            alert('CPF ou senha incorretos');
            return false;
        }
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('orlalock_current_user');
        this.showAuthPage();
    }

    // Show auth page
    showAuthPage() {
        document.getElementById('auth').classList.add('active');
        document.getElementById('mapa').classList.remove('active');
        document.getElementById('reservar').classList.remove('active');
        document.getElementById('meu-locker').classList.remove('active');
        document.getElementById('perfil').classList.remove('active');
    }

    // Show main app
    showMainApp() {
        document.getElementById('auth').classList.remove('active');
        document.getElementById('mapa').classList.add('active');
        
        // Update app with user data
        if (window.app) {
            window.app.userData = this.currentUser;
            window.app.userBalance = this.currentUser.balance;
            window.app.updateUI();
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Update user data
    updateUser(data) {
        if (this.currentUser) {
            Object.assign(this.currentUser, data);
            localStorage.setItem('orlalock_current_user', JSON.stringify(this.currentUser));
            
            // Update in users array
            const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                this.users[userIndex] = this.currentUser;
                localStorage.setItem('orlalock_users', JSON.stringify(this.users));
            }
        }
    }
}

// OrlaLock App
class OrlaLockApp {
    constructor() {
        this.currentPage = 'mapa';
        this.selectedLocker = null;
        this.selectedTime = null;
        this.selectedPrice = null;
        this.currentReservation = null;
        
        // Get user from auth system
        const currentUser = authSystem.getCurrentUser();
        this.userData = currentUser;
        this.userBalance = currentUser ? currentUser.balance : 0;
        
        this.lockers = [
            { id: 'locker_001', number: 1, beach: 'Praia de Copacabana', status: 'available', location: 'Posto 5' },
            { id: 'locker_002', number: 2, beach: 'Praia de Copacabana', status: 'occupied', location: 'Posto 5' },
            { id: 'locker_003', number: 3, beach: 'Praia de Copacabana', status: 'available', location: 'Posto 5' },
            { id: 'locker_004', number: 4, beach: 'Praia de Copacabana', status: 'reserved', location: 'Posto 5' },
            { id: 'locker_005', number: 5, beach: 'Praia de Copacabana', status: 'available', location: 'Posto 6' },
            { id: 'locker_006', number: 6, beach: 'Praia de Copacabana', status: 'available', location: 'Posto 6' }
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateLockers();
        this.updateUI();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // Time selection
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                this.selectedTime = parseInt(e.currentTarget.dataset.time);
                this.selectedPrice = parseFloat(e.currentTarget.dataset.price);
                this.updateReservationSummary();
            });
        });

        // Locker selection
        document.getElementById('lockerSelect').addEventListener('change', (e) => {
            this.selectedLocker = e.target.value;
            this.updateReservationSummary();
        });

        // Confirm reservation
        document.getElementById('confirmReservation').addEventListener('click', () => {
            this.confirmReservation();
        });
    }

    generateLockers() {
        const lockersGrid = document.getElementById('lockersGrid');
        const lockerSelect = document.getElementById('lockerSelect');
        
        lockersGrid.innerHTML = '';
        lockerSelect.innerHTML = '<option value="">Escolha um locker</option>';

        this.lockers.forEach(locker => {
            // Create locker element for map
            const lockerElement = document.createElement('div');
            lockerElement.className = `locker ${locker.status}`;
            lockerElement.textContent = locker.number;
            lockerElement.addEventListener('click', () => {
                if (locker.status === 'available') {
                    this.selectLockerForReservation(locker.id);
                }
            });
            lockersGrid.appendChild(lockerElement);

            // Add to select dropdown
            if (locker.status === 'available') {
                const option = document.createElement('option');
                option.value = locker.id;
                option.textContent = `Locker ${locker.number} - ${locker.location}`;
                lockerSelect.appendChild(option);
            }
        });
    }

    selectLockerForReservation(lockerId) {
        this.selectedLocker = lockerId;
        document.getElementById('lockerSelect').value = lockerId;
        this.showPage('reservar');
    }

    updateReservationSummary() {
        const summary = document.getElementById('reservationSummary');
        const confirmBtn = document.getElementById('confirmReservation');

        if (this.selectedLocker && this.selectedTime) {
            const locker = this.lockers.find(l => l.id === this.selectedLocker);
            summary.style.display = 'block';
            document.getElementById('summaryLocker').textContent = `Locker ${locker.number}`;
            document.getElementById('summaryTime').textContent = `${this.selectedTime} minutos`;
            document.getElementById('summaryPrice').textContent = `R$ ${this.selectedPrice.toFixed(2)}`;
            confirmBtn.disabled = false;
        } else {
            summary.style.display = 'none';
            confirmBtn.disabled = true;
        }
    }

    confirmReservation() {
        if (!this.selectedLocker || !this.selectedTime) {
            alert('Por favor, selecione um locker e tempo de reserva.');
            return;
        }

        // Check user balance
        if (this.userBalance < this.selectedPrice) {
            alert('Saldo insuficiente! Adicione mais saldo.');
            return;
        }

        // Simulate payment
        this.userBalance -= this.selectedPrice;
        authSystem.updateUser({ balance: this.userBalance });
        this.createReservation();
    }

    createReservation() {
        const locker = this.lockers.find(l => l.id === this.selectedLocker);
        locker.status = 'occupied';
        
        const endTime = new Date(Date.now() + this.selectedTime * 60000);
        
        this.currentReservation = {
            locker: locker,
            endTime: endTime,
            timeLeft: this.selectedTime * 60000
        };

        this.generateLockers();
        this.updateUI();
        this.showPage('meu-locker');
        this.startTimer();
    }

    startTimer() {
        const timerDisplay = document.getElementById('timerDisplay');
        if (!timerDisplay) return;

        const updateTimer = () => {
            const now = new Date();
            const timeLeft = Math.max(0, this.currentReservation.endTime - now);

            if (timeLeft <= 0) {
                this.completeReservation();
                return;
            }

            timerDisplay.textContent = this.formatTime(timeLeft);
        };

        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    completeReservation() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        if (this.currentReservation) {
            const locker = this.lockers.find(l => l.id === this.currentReservation.locker.id);
            if (locker) {
                locker.status = 'available';
            }
            this.currentReservation = null;
            this.generateLockers();
            this.updateMyLockerPage();
        }
    }

    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Remove active from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected page
        document.getElementById(pageName).classList.add('active');
        
        // Activate nav button
        const navBtn = document.querySelector(`[data-page="${pageName}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        this.currentPage = pageName;

        // Update specific page content
        if (pageName === 'meu-locker') {
            this.updateMyLockerPage();
        } else if (pageName === 'perfil') {
            this.updateProfilePage();
        }
    }

    updateMyLockerPage() {
        const content = document.getElementById('myLockerContent');
        const activeReservation = this.currentReservation;

        if (activeReservation) {
            content.innerHTML = `
                <div class="locker-info">
                    <h3>Locker ${activeReservation.locker.number} - ${activeReservation.locker.location}</h3>
                    <div class="timer">
                        <div class="timer-display" id="timerDisplay">00:00</div>
                        <div class="timer-label">Tempo restante</div>
                    </div>
                    <button class="btn btn-primary" onclick="app.showQRCode()">
                        <i class="fas fa-qrcode"></i> Ver Código QR
                    </button>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="no-locker">
                    <i class="fas fa-lock"></i>
                    <p>Você não tem nenhum locker ativo no momento.</p>
                    <button class="btn btn-primary" onclick="app.showPage('reservar')">Reservar Locker</button>
                </div>
            `;
        }
    }

    updateProfilePage() {
        const currentUser = authSystem.getCurrentUser();
        
        if (currentUser) {
            // Update balance from user data
            document.getElementById('userBalance').textContent = `R$ ${currentUser.balance.toFixed(2)}`;
            
            // Update user info display
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <div class="user-details">
                    <p><strong>Nome:</strong> ${currentUser.name}</p>
                    <p><strong>CPF:</strong> ${authSystem.formatCPF(currentUser.cpf)}</p>
                    <p><strong>Telefone:</strong> ${currentUser.phone}</p>
                </div>
            `;
            
            // Add logout button
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn btn-secondary';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
            logoutBtn.onclick = () => authSystem.logout();
            
            const profileSection = document.querySelector('.profile-content');
            const existingUserInfo = profileSection.querySelector('.user-info');
            const existingLogoutBtn = profileSection.querySelector('button[onclick*="logout"]');
            
            if (existingUserInfo) existingUserInfo.remove();
            if (existingLogoutBtn) existingLogoutBtn.remove();
            
            profileSection.insertBefore(userInfo, profileSection.firstChild);
            profileSection.appendChild(logoutBtn);
        }
    }

    updateUI() {
        // Update balance display
        const balanceElement = document.getElementById('userBalance');
        if (balanceElement) {
            balanceElement.textContent = `R$ ${this.userBalance.toFixed(2)}`;
        }
    }

    showQRCode() {
        alert('Código QR: ' + this.currentReservation.locker.id);
    }
}

// Global auth functions
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function register() {
    const name = document.getElementById('registerName').value;
    const cpf = document.getElementById('registerCPF').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        alert('As senhas não coincidem');
        return;
    }

    authSystem.register(name, cpf, phone, password);
}

function login() {
    const cpf = document.getElementById('loginCPF').value;
    const password = document.getElementById('loginPassword').value;

    authSystem.login(cpf, password);
}

function simulatePixPayment() {
    const modal = document.getElementById('pixModal');
    modal.style.display = 'none';
    alert('Pagamento via Pix simulado com sucesso!');
}

function addBalance() {
    const amount = prompt('Digite o valor para adicionar (R$):');
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        const currentUser = authSystem.getCurrentUser();
        if (currentUser) {
            currentUser.balance += parseFloat(amount);
            authSystem.updateUser({ balance: currentUser.balance });
            if (window.app) {
                window.app.userBalance = currentUser.balance;
                window.app.updateUI();
            }
            alert(`Saldo adicionado! Novo saldo: R$ ${currentUser.balance.toFixed(2)}`);
        }
    }
}

function showPage(pageName) {
    if (window.app) {
        window.app.showPage(pageName);
    }
}

// Format inputs in real-time
document.addEventListener('DOMContentLoaded', function() {
    const registerCPF = document.getElementById('registerCPF');
    const loginCPF = document.getElementById('loginCPF');
    const registerPhone = document.getElementById('registerPhone');

    if (registerCPF) {
        registerCPF.addEventListener('input', function(e) {
            this.value = authSystem.formatCPF(this.value);
        });
    }

    if (loginCPF) {
        loginCPF.addEventListener('input', function(e) {
            this.value = authSystem.formatCPF(this.value);
        });
    }

    if (registerPhone) {
        registerPhone.addEventListener('input', function(e) {
            this.value = authSystem.formatPhone(this.value);
        });
    }
});

// Initialize systems
const authSystem = new AuthSystem();
let app;

document.addEventListener('DOMContentLoaded', () => {
    // Only initialize OrlaLock if user is logged in
    if (authSystem.getCurrentUser()) {
        app = new OrlaLockApp();
    }
});

// Sistema de Autenticação
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('orlalock_users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('orlalock_current_user')) || null;
    }

    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11) return false;
        
        // Verifica dígitos verificadores
        let sum = 0;
        let remainder;
        
        for (let i = 1; i <= 9; i++) {
            sum = sum + parseInt(cpf.substring(i-1, i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        
        if ((remainder === 10) || (remainder === 11)) {
            remainder = 0;
        }
        if (remainder !== parseInt(cpf.substring(9, 10))) {
            return false;
        }
        
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum = sum + parseInt(cpf.substring(i-1, i)) * (12 - i);
        }
        remainder = (sum * 10) % 11;
        
        if ((remainder === 10) || (remainder === 11)) {
            remainder = 0;
        }
        if (remainder !== parseInt(cpf.substring(10, 11))) {
            return false;
        }
        return true;
    }

    formatCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length > 11) cpf = cpf.substring(0, 11);
        
        if (cpf.length <= 3) return cpf;
        if (cpf.length <= 6) return cpf.substring(0, 3) + '.' + cpf.substring(3);
        if (cpf.length <= 9) return cpf.substring(0, 3) + '.' + cpf.substring(3, 6) + '.' + cpf.substring(6);
        return cpf.substring(0, 3) + '.' + cpf.substring(3, 6) + '.' + cpf.substring(6, 9) + '-' + cpf.substring(9);
    }

    formatPhone(phone) {
        phone = phone.replace(/[^\d]+/g, '');
        if (phone.length > 11) phone = phone.substring(0, 11);
        
        if (phone.length <= 2) return phone;
        if (phone.length <= 6) return '(' + phone.substring(0, 2) + ') ' + phone.substring(2);
        if (phone.length <= 10) return '(' + phone.substring(0, 2) + ') ' + phone.substring(2, 6) + '-' + phone.substring(6);
        return '(' + phone.substring(0, 2) + ') ' + phone.substring(2, 7) + '-' + phone.substring(7);
    }

    register(userData) {
        // Validações
        if (!userData.name || userData.name.length < 3) {
            alert('Nome deve ter pelo menos 3 caracteres');
            return false;
        }
        
        const cleanCPF = userData.cpf.replace(/[^\d]+/g, '');
        if (!this.validateCPF(cleanCPF)) {
            alert('CPF inválido');
            return false;
        }
        
        // Verifica se CPF já existe
        if (this.users.find(u => u.cpf === cleanCPF)) {
            alert('CPF já cadastrado');
            return false;
        }
        
        if (!userData.phone || userData.phone.length < 14) {
            alert('Telefone inválido');
            return false;
        }
        
        if (!userData.password || userData.password.length < 4 || userData.password.length > 6) {
            alert('Senha deve ter entre 4 e 6 dígitos');
            return false;
        }
        
        // Cria novo usuário
        const newUser = {
            id: Date.now().toString(),
            name: userData.name,
            cpf: cleanCPF,
            phone: userData.phone,
            password: userData.password,
            balance: 50, // Saldo inicial
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        localStorage.setItem('orlalock_users', JSON.stringify(this.users));
        
        // Faz login automático
        this.currentUser = newUser;
        localStorage.setItem('orlalock_current_user', JSON.stringify(this.currentUser));
        
        return true;
    }

    login(cpf, password) {
        const cleanCPF = cpf.replace(/[^\d]+/g, '');
        const user = this.users.find(u => u.cpf === cleanCPF && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('orlalock_current_user', JSON.stringify(this.currentUser));
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('orlalock_current_user');
    }

    updateUser(userData) {
        if (!this.currentUser) return false;
        
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.currentUser, ...userData };
            this.currentUser = this.users[userIndex];
            localStorage.setItem('orlalock_users', JSON.stringify(this.users));
            localStorage.setItem('orlalock_current_user', JSON.stringify(this.currentUser));
            return true;
        }
        return false;
    }
}

// Classe principal do app
class OrlaLockApp {
    constructor() {
        this.authSystem = new AuthSystem();
        this.currentPage = 'map';
        this.selectedLocker = null;
        this.selectedTime = null;
        this.selectedPrice = null;
        this.currentReservation = null;
        this.reservations = JSON.parse(localStorage.getItem('orlalock_reservations')) || [];
        
        // Dados dos lockers
        this.lockers = [
            { id: 'locker_001', number: 1, beach: 'Praia de Copacabana', status: 'available', location: 'Posto 5' },
            { id: 'locker_002', number: 2, beach: 'Praia de Copacabana', status: 'occupied', location: 'Posto 5' },
            { id: 'locker_003', number: 3, beach: 'Praia de Copacabana', status: 'available', location: 'Posto 5' },
            { id: 'locker_004', number: 4, beach: 'Praia de Copacabana', status: 'available', location: 'Posto 6' },
            { id: 'locker_005', number: 5, beach: 'Praia de Copacabana', status: 'occupied', location: 'Posto 6' },
            { id: 'locker_006', number: 6, beach: 'Praia de Copacabana', status: 'available', location: 'Posto 6' }
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateLockers();
        this.updateUI();
        
        // Se tem usuário logado, mostra o app
        if (this.authSystem.currentUser) {
            this.showMainApp();
        } else {
            this.showAuthPage();
        }
    }

    setupEventListeners() {
        // Formatação automática de campos
        document.getElementById('loginCPF')?.addEventListener('input', (e) => {
            e.target.value = this.authSystem.formatCPF(e.target.value);
        });
        
        document.getElementById('registerCPF')?.addEventListener('input', (e) => {
            e.target.value = this.authSystem.formatCPF(e.target.value);
        });
        
        document.getElementById('registerPhone')?.addEventListener('input', (e) => {
            e.target.value = this.authSystem.formatPhone(e.target.value);
        });
    }

    generateLockers() {
        const grid = document.getElementById('lockersGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        this.lockers.forEach(locker => {
            const lockerElement = document.createElement('div');
            lockerElement.className = `locker ${locker.status}`;
            lockerElement.innerHTML = `
                <span>${locker.number}</span>
            `;
            
            if (locker.status === 'available') {
                lockerElement.style.cursor = 'pointer';
                lockerElement.onclick = () => this.selectLocker(locker);
            }
            
            grid.appendChild(lockerElement);
        });
    }

    selectLocker(locker) {
        this.selectedLocker = locker;
        document.getElementById('selectedLocker').textContent = `Locker ${locker.number} - ${locker.location}`;
        this.updateReservationSummary();
    }

    selectTime(minutes, price) {
        this.selectedTime = minutes;
        this.selectedPrice = price;
        this.updateReservationSummary();
    }

    updateReservationSummary() {
        const summary = document.getElementById('reservationSummary');
        const confirmBtn = document.getElementById('confirmBtn');
        
        if (this.selectedLocker && this.selectedTime) {
            document.getElementById('summaryLocker').textContent = `Locker ${this.selectedLocker.number}`;
            document.getElementById('summaryTime').textContent = `${this.selectedTime} min`;
            document.getElementById('summaryPrice').textContent = `R$ ${this.selectedPrice.toFixed(2)}`;
            confirmBtn.disabled = false;
        } else {
            document.getElementById('summaryLocker').textContent = '-';
            document.getElementById('summaryTime').textContent = '-';
            document.getElementById('summaryPrice').textContent = '-';
            confirmBtn.disabled = true;
        }
    }

    confirmReservation() {
        if (!this.authSystem.currentUser) {
            alert('Você precisa estar logado para reservar');
            return;
        }
        
        if (!this.selectedLocker || !this.selectedTime) {
            alert('Selecione um locker e tempo de reserva');
            return;
        }
        
        // Verifica saldo
        if (this.authSystem.currentUser.balance < this.selectedPrice) {
            alert('Saldo insuficiente. Adicione saldo para continuar.');
            return;
        }
        
        // Deduz do saldo
        this.authSystem.currentUser.balance -= this.selectedPrice;
        this.authSystem.updateUser({ balance: this.authSystem.currentUser.balance });
        
        // Cria reserva
        const endTime = new Date(Date.now() + this.selectedTime * 60000);
        const reservation = {
            id: Date.now().toString(),
            userId: this.authSystem.currentUser.id,
            lockerId: this.selectedLocker.id,
            lockerNumber: this.selectedLocker.number,
            duration: this.selectedTime,
            price: this.selectedPrice,
            startTime: new Date().toISOString(),
            endTime: endTime.toISOString(),
            status: 'active'
        };
        
        // Atualiza locker
        const lockerIndex = this.lockers.findIndex(l => l.id === this.selectedLocker.id);
        if (lockerIndex !== -1) {
            this.lockers[lockerIndex].status = 'occupied';
        }
        
        this.currentReservation = reservation;
        this.reservations.push(reservation);
        localStorage.setItem('orlalock_reservations', JSON.stringify(this.reservations));
        
        // Limpa seleção
        this.selectedLocker = null;
        this.selectedTime = null;
        this.selectedPrice = null;
        
        // Atualiza UI
        this.generateLockers();
        this.updateReservationSummary();
        this.updateMyLockerPage();
        this.updateProfilePage();
        
        alert('Reserva confirmada com sucesso!');
        showPage('mylocker');
        
        // Inicia timer
        this.startTimer();
    }

    startTimer() {
        if (!this.currentReservation) return;
        
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const endTime = new Date(this.currentReservation.endTime).getTime();
            const distance = endTime - now;
            
            if (distance <= 0) {
                clearInterval(timer);
                this.completeReservation();
            } else {
                const minutes = Math.floor(distance / 60000);
                const seconds = Math.floor((distance % 60000) / 1000);
                
                const timerElement = document.getElementById('reservationTimer');
                if (timerElement) {
                    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }

    completeReservation() {
        if (!this.currentReservation) return;
        
        // Libera locker
        const lockerIndex = this.lockers.findIndex(l => l.id === this.currentReservation.lockerId);
        if (lockerIndex !== -1) {
            this.lockers[lockerIndex].status = 'available';
        }
        
        // Atualiza reserva
        this.currentReservation.status = 'completed';
        const reservationIndex = this.reservations.findIndex(r => r.id === this.currentReservation.id);
        if (reservationIndex !== -1) {
            this.reservations[reservationIndex] = this.currentReservation;
            localStorage.setItem('orlalock_reservations', JSON.stringify(this.reservations));
        }
        
        this.currentReservation = null;
        this.generateLockers();
        this.updateMyLockerPage();
        
        alert('Tempo de reserva finalizado! Obrigado por usar o OrlaLock.');
    }

    updateUI() {
        // Atualiza saldo
        const balanceElement = document.getElementById('userBalance');
        if (balanceElement && this.authSystem.currentUser) {
            balanceElement.textContent = `R$ ${this.authSystem.currentUser.balance.toFixed(2)}`;
        }
    }

    updateMyLockerPage() {
        const content = document.getElementById('myLockerContent');
        if (!content) return;
        
        if (this.currentReservation && this.currentReservation.status === 'active') {
            const endTime = new Date(this.currentReservation.endTime);
            const now = new Date();
            const timeLeft = Math.max(0, endTime - now);
            const minutesLeft = Math.floor(timeLeft / 60000);
            const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
            
            content.innerHTML = `
                <div class="active-locker">
                    <div class="locker-info">
                        <h3>Locker ${this.currentReservation.lockerNumber}</h3>
                        <p>Local: ${this.lockers.find(l => l.id === this.currentReservation.lockerId)?.location || 'Praia de Copacabana'}</p>
                        <div class="timer-display">
                            <i class="fas fa-clock"></i>
                            <span id="reservationTimer">${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                    <div class="locker-actions">
                        <button class="btn-primary" onclick="app.showQRCode()">
                            <i class="fas fa-qrcode"></i> Ver QR Code
                        </button>
                    </div>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="no-active-locker">
                    <i class="fas fa-lock"></i>
                    <p>Você não tem nenhum locker ativo no momento.</p>
                    <button class="btn-primary" onclick="showPage('reserve')">
                        <i class="fas fa-plus"></i> Reservar Locker
                    </button>
                </div>
            `;
        }
    }

    updateProfilePage() {
        const profileContainer = document.querySelector('.profile-container');
        if (!profileContainer || !this.authSystem.currentUser) return;
        
        // Atualiza saldo
        const balanceElement = document.getElementById('userBalance');
        if (balanceElement) {
            balanceElement.textContent = `R$ ${this.authSystem.currentUser.balance.toFixed(2)}`;
        }
    }

    showQRCode() {
        if (!this.currentReservation) return;
        
        const modal = document.getElementById('qrModal');
        const qrcodeDiv = document.getElementById('qrcode');
        
        qrcodeDiv.innerHTML = '';
        
        new QRCode(qrcodeDiv, {
            text: this.currentReservation.id,
            width: 200,
            height: 200,
            colorDark: "#1e3c72",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        modal.style.display = 'block';
    }

    showAuthPage() {
        document.getElementById('auth').classList.add('active');
        document.querySelector('.header').style.display = 'none';
        document.querySelector('.main').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('auth').classList.remove('active');
        document.querySelector('.header').style.display = 'block';
        document.querySelector('.main').style.display = 'block';
        this.updateUI();
        this.updateMyLockerPage();
        this.updateProfilePage();
        showPage('map');
    }

    formatTime(minutes) {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
}

// Funções globais
function showRegister() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
}

function showLogin() {
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
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
    
    if (authSystem.register({ name, cpf, phone, password })) {
        app = new OrlaLockApp();
        alert('Cadastro realizado com sucesso!');
    }
}

function login() {
    const cpf = document.getElementById('loginCPF').value;
    const password = document.getElementById('loginPassword').value;
    
    if (authSystem.login(cpf, password)) {
        app = new OrlaLockApp();
    } else {
        alert('CPF ou senha incorretos');
    }
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        authSystem.logout();
        location.reload();
    }
}

function showPage(pageName) {
    // Esconde todas as páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active dos botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostra página selecionada
    document.getElementById(pageName).classList.add('active');
    
    // Ativa botão correspondente
    const btn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => 
        btn.onclick && btn.onclick.toString().includes(`showPage('${pageName}')`)
    );
    if (btn) btn.classList.add('active');
    
    // Atualiza página atual
    if (app) {
        app.currentPage = pageName;
        if (pageName === 'mylocker') app.updateMyLockerPage();
        if (pageName === 'profile') app.updateProfilePage();
    }
}

function selectLocker(locker) {
    if (app) app.selectLocker(locker);
}

function selectTime(minutes, price) {
    if (app) app.selectTime(minutes, price);
    
    // Atualiza botão ativo
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.time-btn').classList.add('active');
}

function confirmReservation() {
    if (app) app.confirmReservation();
}

function confirmPixPayment() {
    if (app) {
        app.authSystem.currentUser.balance += 50; // Adiciona R$50
        app.authSystem.updateUser({ balance: app.authSystem.currentUser.balance });
        app.updateUI();
        closePix();
        alert('Saldo adicionado com sucesso!');
    }
}

function addBalance() {
    document.getElementById('pixModal').style.display = 'block';
    document.getElementById('pixAmount').textContent = 'R$ 50,00';
}

function closePix() {
    document.getElementById('pixModal').style.display = 'none';
}

function closeQR() {
    document.getElementById('qrModal').style.display = 'none';
}

function copyPixCode() {
    navigator.clipboard.writeText('orlalock@exemplo.com');
    alert('Código Pix copiado!');
}

function simulatePixPayment() {
    confirmPixPayment();
}

function showFavorites() {
    alert('Funcionalidade de favoritos em desenvolvimento!');
}

function showHistory() {
    alert('Funcionalidade de histórico em desenvolvimento!');
}

function showSettings() {
    alert('Funcionalidade de configurações em desenvolvimento!');
}

// Inicialização
const authSystem = new AuthSystem();
let app;

document.addEventListener('DOMContentLoaded', function() {
    if (authSystem.currentUser) {
        app = new OrlaLockApp();
    }
});

// Fechar modais ao clicar fora
window.onclick = function(event) {
    const qrModal = document.getElementById('qrModal');
    const pixModal = document.getElementById('pixModal');
    
    if (event.target === qrModal) {
        qrModal.style.display = 'none';
    }
    if (event.target === pixModal) {
        pixModal.style.display = 'none';
    }
}

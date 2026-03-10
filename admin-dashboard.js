document.addEventListener('DOMContentLoaded', () => {

    // ─── STATIC DATA (edit these to reflect real info) ───────────────────────

    const dashboardData = {
        totalPatients: 142,
        appointmentsToday: 18,
        availableDoctors: 5,
        newEnquiries: 7,
        appointmentTrends: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [12, 19, 15, 22, 18, 10, 8]
        },
        topSpecializations: [
            { name: 'General Practice', appointments: 54, percentage: 38 },
            { name: 'Cardiology', appointments: 31, percentage: 22 },
            { name: 'Paediatrics', appointments: 28, percentage: 20 },
            { name: 'Orthopaedics', appointments: 17, percentage: 12 },
            { name: 'Dermatology', appointments: 12, percentage: 8 }
        ],
        recentAppointments: [
            { patientName: 'Emeka Okafor', doctor: 'Dr. Adeyemi', date: '2026-03-05', time: '9:00 AM', status: 'Confirmed' },
            { patientName: 'Ngozi Chukwu', doctor: 'Dr. Bello', date: '2026-03-05', time: '10:30 AM', status: 'Pending' },
            { patientName: 'Tunde Fashola', doctor: 'Dr. Adeyemi', date: '2026-03-05', time: '12:00 PM', status: 'Confirmed' },
            { patientName: 'Amaka Eze', doctor: 'Dr. Okonkwo', date: '2026-03-05', time: '2:00 PM', status: 'Cancelled' },
            { patientName: 'Chidi Nwosu', doctor: 'Dr. Bello', date: '2026-03-05', time: '3:30 PM', status: 'Pending' }
        ]
    };

    const patientsData = {
        total: 142,
        newThisWeek: 9,
        returnRate: 74,
        patients: [
            { name: 'Emeka Okafor', age: 34, contact: '0801 234 5678', email: 'emeka@email.com', lastVisit: '2026-03-01' },
            { name: 'Ngozi Chukwu', age: 28, contact: '0802 345 6789', email: 'ngozi@email.com', lastVisit: '2026-02-20' },
            { name: 'Tunde Fashola', age: 45, contact: '0803 456 7890', email: 'tunde@email.com', lastVisit: '2026-03-05' },
            { name: 'Amaka Eze', age: 52, contact: '0804 567 8901', email: 'amaka@email.com', lastVisit: '2026-02-15' },
            { name: 'Chidi Nwosu', age: 31, contact: '0805 678 9012', email: 'chidi@email.com', lastVisit: '2026-03-04' }
        ]
    };

    const appointmentsData = [
        { id: '1', patientName: 'Emeka Okafor', doctor: 'Dr. Adeyemi', date: '2026-03-05', time: '9:00 AM', status: 'Confirmed' },
        { id: '2', patientName: 'Ngozi Chukwu', doctor: 'Dr. Bello', date: '2026-03-05', time: '10:30 AM', status: 'Pending' },
        { id: '3', patientName: 'Tunde Fashola', doctor: 'Dr. Adeyemi', date: '2026-03-05', time: '12:00 PM', status: 'Confirmed' },
        { id: '4', patientName: 'Amaka Eze', doctor: 'Dr. Okonkwo', date: '2026-03-05', time: '2:00 PM', status: 'Cancelled' },
        { id: '5', patientName: 'Chidi Nwosu', doctor: 'Dr. Bello', date: '2026-03-06', time: '3:30 PM', status: 'Pending' },
        { id: '6', patientName: 'Blessing Uche', doctor: 'Dr. Adeyemi', date: '2026-03-06', time: '11:00 AM', status: 'Confirmed' }
    ];

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    function getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'confirmed': return '#4caf50';
            case 'pending':   return '#ffc107';
            case 'cancelled': return '#f44336';
            default:          return '#2196f3';
        }
    }

    // ─── NAVIGATION ──────────────────────────────────────────────────────────

    document.querySelectorAll('.admin-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;

            document.querySelectorAll('.admin-menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            document.getElementById(section + '-section').classList.add('active');

            if (section === 'dashboard')    loadDashboard();
            if (section === 'patients')     loadPatients();
            if (section === 'appointments') loadAppointments();
        });
    });

    // Logout — just shows a confirmation, no redirect needed
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            alert('You have been logged out.');
        }
    });

    // ─── DASHBOARD ───────────────────────────────────────────────────────────

    function loadDashboard() {
        document.getElementById('totalPatients').textContent      = dashboardData.totalPatients;
        document.getElementById('appointmentsToday').textContent  = dashboardData.appointmentsToday;
        document.getElementById('availableDoctors').textContent   = dashboardData.availableDoctors;
        document.getElementById('newEnquiries').textContent       = dashboardData.newEnquiries;

        if (typeof Chart !== 'undefined') {
            const ctx = document.getElementById('appointmentChart');
            if (ctx) {
                // Destroy old chart instance if it exists to avoid duplicates
                if (ctx._chartInstance) ctx._chartInstance.destroy();
                ctx._chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dashboardData.appointmentTrends.labels,
                        datasets: [{
                            label: 'Appointments',
                            data: dashboardData.appointmentTrends.data,
                            borderColor: '#0066cc',
                            backgroundColor: 'rgba(0, 102, 204, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        }

        // Top specialisations
        const specContainer = document.getElementById('topSpecializationsList');
        if (specContainer) {
            specContainer.innerHTML = dashboardData.topSpecializations.map(spec => `
                <div style="padding:16px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between;">
                    <div>
                        <strong>${spec.name}</strong>
                        <div style="font-size:12px; color:#666;">${spec.appointments} appointments</div>
                    </div>
                    <div style="color:#0066cc; font-weight:600;">${spec.percentage}%</div>
                </div>
            `).join('');
        }

        // Recent appointments
        const recentContainer = document.getElementById('recentAppointmentsTable');
        if (recentContainer) {
            recentContainer.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dashboardData.recentAppointments.map(apt => `
                            <tr>
                                <td>${apt.patientName}</td>
                                <td>${apt.doctor}</td>
                                <td>${new Date(apt.date).toLocaleDateString()}</td>
                                <td>${apt.time}</td>
                                <td><span style="background:${getStatusColor(apt.status)}; color:white; padding:4px 10px; border-radius:4px;">${apt.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    // ─── PATIENTS ────────────────────────────────────────────────────────────

    function loadPatients() {
        document.getElementById('patientsTotalCount').textContent      = patientsData.total;
        document.getElementById('patientsNewCount').textContent        = patientsData.newThisWeek;
        document.getElementById('patientsReturningPercent').textContent = patientsData.returnRate + '%';

        const container = document.getElementById('patientsTable');
        if (container) {
            container.innerHTML = `
                <table>
                    <thead>
                        <tr><th>Name</th><th>Age</th><th>Contact</th><th>Email</th><th>Last Visit</th></tr>
                    </thead>
                    <tbody>
                        ${patientsData.patients.map(p => `
                            <tr>
                                <td>${p.name}</td>
                                <td>${p.age}</td>
                                <td>${p.contact}</td>
                                <td>${p.email}</td>
                                <td>${p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    // ─── APPOINTMENTS ────────────────────────────────────────────────────────

    function renderAppointmentsTable(data) {
        const container = document.getElementById('allAppointmentsTable');
        if (!container) return;
        container.innerHTML = data.length === 0
            ? '<p style="padding:20px; text-align:center; color:#999;">No appointments found.</p>'
            : `
                <table>
                    <thead>
                        <tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${data.map(apt => `
                            <tr id="apt-row-${apt.id}">
                                <td>${apt.patientName}</td>
                                <td>${apt.doctor}</td>
                                <td>${new Date(apt.date).toLocaleDateString()}</td>
                                <td>${apt.time}</td>
                                <td><span style="background:${getStatusColor(apt.status)}; color:white; padding:4px 10px; border-radius:4px;">${apt.status}</span></td>
                                <td style="display:flex; gap:6px;">
                                    <button onclick="updateStatus('${apt.id}', 'Confirmed')" style="padding:4px 10px; background:#4caf50; color:white; border:none; border-radius:4px; cursor:pointer;">Confirm</button>
                                    <button onclick="updateStatus('${apt.id}', 'Cancelled')" style="padding:4px 10px; background:#f44336; color:white; border:none; border-radius:4px; cursor:pointer;">Cancel</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
    }

    function loadAppointments() {
        renderAppointmentsTable(appointmentsData);

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const status = btn.dataset.status;
                const filtered = status === 'all'
                    ? appointmentsData
                    : appointmentsData.filter(a => a.status.toLowerCase() === status);
                renderAppointmentsTable(filtered);
            });
        });
    }

    // Update appointment status in memory (no backend needed)
    window.updateStatus = function(id, newStatus) {
        const apt = appointmentsData.find(a => a.id === id);
        if (apt) {
            apt.status = newStatus;
            renderAppointmentsTable(appointmentsData);
        }
    };

    // ─── INIT ─────────────────────────────────────────────────────────────────
    loadDashboard();

});
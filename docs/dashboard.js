// Dashboard JavaScript
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : 'https://boundari-ai-api.herokuapp.com'; // Update with actual production URL

// State
let projects = [];
let currentView = 'projects';

// DOM Elements
const menuItems = document.querySelectorAll('.menu-item');
const views = document.querySelectorAll('.view');
const newProjectBtn = document.getElementById('new-project-btn');
const newProjectModal = document.getElementById('new-project-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelModalBtn = document.getElementById('cancel-modal');
const createProjectBtn = document.getElementById('create-project-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const translateBtn = document.getElementById('translate-btn');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Menu navigation
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // Modal controls
    newProjectBtn.addEventListener('click', () => {
        newProjectModal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', () => {
        newProjectModal.classList.remove('active');
    });

    cancelModalBtn.addEventListener('click', () => {
        newProjectModal.classList.remove('active');
    });

    createProjectBtn.addEventListener('click', createProject);

    // Analysis
    analyzeBtn.addEventListener('click', analyzeMessage);

    // Translation
    translateBtn.addEventListener('click', translateMessage);

    // Close modal on outside click
    newProjectModal.addEventListener('click', (e) => {
        if (e.target === newProjectModal) {
            newProjectModal.classList.remove('active');
        }
    });
}

// Switch View
function switchView(view) {
    currentView = view;
    
    // Update menu
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
            item.classList.add('active');
        }
    });

    // Update views
    views.forEach(v => {
        v.classList.remove('active');
        const viewId = `${view}-view`;
        if (v.id === viewId) {
            v.classList.add('active');
        }
    });

    // Load data for specific views
    if (view === 'alerts') {
        loadAlerts();
    }
}

// Load Projects
async function loadProjects() {
    try {
        showToast('Loading projects...', 'info');
        
        // For demo purposes, create some sample projects if none exist
        const response = await fetch(`${API_URL}/api/projects`);
        
        if (!response.ok) {
            throw new Error('Failed to load projects');
        }
        
        projects = await response.json();
        
        // If no projects, create sample data
        if (projects.length === 0) {
            await createSampleProjects();
            const reloadResponse = await fetch(`${API_URL}/api/projects`);
            projects = await reloadResponse.json();
        }
        
        renderProjects();
        updateStats();
        populateProjectSelect();
        showToast('Projects loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading projects:', error);
        showToast('Using demo mode - API not connected', 'warning');
        useDemoData();
    }
}

// Create Sample Projects (for demo)
async function createSampleProjects() {
    const sampleProjects = [
        {
            clientId: 'client_acme',
            freelancerId: 'freelancer_john',
            scope: 'Build a responsive landing page with 5 sections including hero, features, testimonials, pricing, and contact form',
            budget: 5000,
            milestones: []
        },
        {
            clientId: 'client_techco',
            freelancerId: 'freelancer_john',
            scope: 'Create a REST API with user authentication, data management, and analytics dashboard',
            budget: 12000,
            milestones: []
        }
    ];

    for (const project of sampleProjects) {
        try {
            await fetch(`${API_URL}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project)
            });
        } catch (error) {
            console.error('Error creating sample project:', error);
        }
    }
}

// Use Demo Data (when API is not available)
function useDemoData() {
    projects = [
        {
            id: 'demo_proj_1',
            clientId: 'client_acme',
            freelancerId: 'freelancer_john',
            scope: 'Build a responsive landing page with 5 sections',
            budget: 5000,
            status: 'active',
            createdAt: new Date().toISOString(),
            scopeChangeCount: 0,
            flags: [],
            renegotiations: []
        },
        {
            id: 'demo_proj_2',
            clientId: 'client_techco',
            freelancerId: 'freelancer_john',
            scope: 'Create a REST API with authentication',
            budget: 12000,
            status: 'active',
            createdAt: new Date().toISOString(),
            scopeChangeCount: 1,
            flags: [],
            renegotiations: []
        }
    ];
    
    renderProjects();
    updateStats();
    populateProjectSelect();
}

// Render Projects
function renderProjects() {
    const projectsList = document.getElementById('projects-list');
    
    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3>No projects yet</h3>
                <p>Create your first project to get started</p>
            </div>
        `;
        return;
    }

    projectsList.innerHTML = projects.map(project => {
        const healthScore = calculateHealthScore(project);
        return `
            <div class="project-card" data-id="${project.id}">
                <div class="project-header">
                    <div class="project-info">
                        <h3>Project: ${project.clientId}</h3>
                        <div class="project-meta">
                            <span>ID: ${project.id.substring(0, 15)}...</span>
                            <span>Created: ${new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="project-status">
                        <span class="status-badge ${project.status}">${project.status}</span>
                        <div class="health-score">
                            <span>Health: ${healthScore}%</span>
                            <div class="health-bar">
                                <div class="health-fill" style="width: ${healthScore}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="project-scope">${project.scope}</div>
                <div class="project-footer">
                    <div class="project-budget">$${project.budget.toLocaleString()}</div>
                    <div class="project-actions">
                        ${project.status === 'active' 
                            ? `<button class="btn-small btn-pause" onclick="pauseProject('${project.id}')">Pause</button>`
                            : `<button class="btn-small btn-resume" onclick="resumeProject('${project.id}')">Resume</button>`
                        }
                        <button class="btn-small btn-view" onclick="viewProjectStats('${project.id}')">Stats</button>
                    </div>
                </div>
                ${project.scopeChangeCount > 0 ? `
                    <div style="margin-top: 1rem; color: var(--warning); font-weight: 600;">
                        ⚠️ ${project.scopeChangeCount} scope change${project.scopeChangeCount > 1 ? 's' : ''} detected
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Calculate Health Score
function calculateHealthScore(project) {
    let score = 100;
    score -= project.scopeChangeCount * 15;
    if (project.status === 'paused') score -= 30;
    return Math.max(0, Math.min(100, score));
}

// Update Stats
function updateStats() {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const pausedProjects = projects.filter(p => p.status === 'paused').length;
    const totalValue = projects.reduce((sum, p) => sum + p.budget, 0);
    const scopeAlerts = projects.reduce((sum, p) => sum + p.scopeChangeCount, 0);

    document.getElementById('active-projects').textContent = activeProjects;
    document.getElementById('paused-projects').textContent = pausedProjects;
    document.getElementById('total-value').textContent = `$${totalValue.toLocaleString()}`;
    document.getElementById('scope-alerts').textContent = scopeAlerts;
}

// Populate Project Select
function populateProjectSelect() {
    const select = document.getElementById('project-select');
    select.innerHTML = '<option value="">-- Select a project --</option>' +
        projects.map(p => `<option value="${p.id}">${p.clientId} - ${p.id.substring(0, 15)}...</option>`).join('');
}

// Create Project
async function createProject() {
    const clientId = document.getElementById('client-id').value;
    const freelancerId = document.getElementById('freelancer-id').value;
    const scope = document.getElementById('project-scope').value;
    const budget = parseFloat(document.getElementById('project-budget').value);

    if (!clientId || !freelancerId || !scope || !budget) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, freelancerId, scope, budget, milestones: [] })
        });

        if (!response.ok) {
            throw new Error('Failed to create project');
        }

        const project = await response.json();
        projects.push(project);
        
        // Clear form
        document.getElementById('client-id').value = '';
        document.getElementById('freelancer-id').value = '';
        document.getElementById('project-scope').value = '';
        document.getElementById('project-budget').value = '';
        
        // Close modal
        newProjectModal.classList.remove('active');
        
        // Update UI
        renderProjects();
        updateStats();
        populateProjectSelect();
        
        showToast('Project created successfully!', 'success');
    } catch (error) {
        console.error('Error creating project:', error);
        showToast('Error creating project', 'error');
    }
}

// Pause Project
async function pauseProject(projectId) {
    try {
        const response = await fetch(`${API_URL}/api/projects/${projectId}/pause`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Manual pause by freelancer' })
        });

        if (!response.ok) {
            throw new Error('Failed to pause project');
        }

        const updatedProject = await response.json();
        const index = projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            projects[index] = updatedProject;
        }

        renderProjects();
        updateStats();
        showToast('Project paused successfully', 'success');
    } catch (error) {
        console.error('Error pausing project:', error);
        showToast('Error pausing project', 'error');
    }
}

// Resume Project
async function resumeProject(projectId) {
    try {
        const response = await fetch(`${API_URL}/api/projects/${projectId}/resume`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('Failed to resume project');
        }

        const updatedProject = await response.json();
        const index = projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            projects[index] = updatedProject;
        }

        renderProjects();
        updateStats();
        showToast('Project resumed successfully', 'success');
    } catch (error) {
        console.error('Error resuming project:', error);
        showToast('Error resuming project', 'error');
    }
}

// View Project Stats
async function viewProjectStats(projectId) {
    try {
        const response = await fetch(`${API_URL}/api/projects/${projectId}/stats`);
        
        if (!response.ok) {
            throw new Error('Failed to load stats');
        }

        const stats = await response.json();
        
        alert(`Project Statistics:\n\n` +
            `Status: ${stats.status}\n` +
            `Scope Changes: ${stats.scopeChangeCount}\n` +
            `Budget: $${stats.currentBudget}\n` +
            `Additional Cost: $${stats.additionalCost}\n` +
            `Health Score: ${stats.healthScore}%`
        );
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Error loading project stats', 'error');
    }
}

// Analyze Message
async function analyzeMessage() {
    const projectId = document.getElementById('project-select').value;
    const sender = document.getElementById('sender-select').value;
    const message = document.getElementById('message-input').value;

    if (!projectId || !message) {
        showToast('Please select a project and enter a message', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/analyze-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, message, sender })
        });

        if (!response.ok) {
            throw new Error('Failed to analyze message');
        }

        const analysis = await response.json();
        displayAnalysisResult(analysis);
        showToast('Message analyzed', 'success');
    } catch (error) {
        console.error('Error analyzing message:', error);
        showToast('Error analyzing message', 'error');
    }
}

// Display Analysis Result
function displayAnalysisResult(analysis) {
    const resultDiv = document.getElementById('analysis-result');
    
    const icon = analysis.isScopeCreep ? '🚨' : '✅';
    const title = analysis.isScopeCreep ? 'Scope Creep Detected!' : 'All Clear';
    
    resultDiv.innerHTML = `
        <div class="result-header">
            <div class="result-icon">${icon}</div>
            <div>
                <div class="result-title">${title}</div>
                <div class="subtitle">Confidence: ${analysis.confidence}%</div>
            </div>
        </div>
        
        <div class="result-badges">
            ${analysis.isScopeCreep ? '<span class="result-badge badge-danger">Scope Creep</span>' : '<span class="result-badge badge-success">Within Scope</span>'}
            <span class="result-badge badge-warning">${analysis.confidence}% Confidence</span>
            <span class="result-badge badge-info">+${analysis.estimatedAdditionalHours} Hours</span>
        </div>
        
        <div class="result-details">
            <div class="detail-row">
                <span class="detail-label">Original Message:</span>
                <span class="detail-value">"${analysis.message}"</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Estimated Hours:</span>
                <span class="detail-value">${analysis.estimatedAdditionalHours} hours</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Flags:</span>
                <span class="detail-value">${analysis.flags.join(', ')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Recommended Action:</span>
                <span class="detail-value">${analysis.recommendedAction}</span>
            </div>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
}

// Translate Message
async function translateMessage() {
    const message = document.getElementById('translate-input').value;

    if (!message) {
        showToast('Please enter a message to translate', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/translate-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error('Failed to translate message');
        }

        const result = await response.json();
        displayTranslationResult(result);
        showToast('Message translated', 'success');
    } catch (error) {
        console.error('Error translating message:', error);
        showToast('Error translating message', 'error');
    }
}

// Display Translation Result
function displayTranslationResult(result) {
    const resultDiv = document.getElementById('translation-result');
    
    resultDiv.innerHTML = `
        <div class="result-header">
            <div class="result-icon">📝</div>
            <div>
                <div class="result-title">Translation Complete</div>
                <div class="subtitle">Billable Hours: ${result.translated.billableHours}</div>
            </div>
        </div>
        
        <h4>Original Message:</h4>
        <div class="detail-row">
            <span class="detail-value">"${result.original}"</span>
        </div>
        
        <h4 style="margin-top: 1.5rem;">Professional Translation:</h4>
        <div class="translation-box">${result.translated.formalVersion}</div>
        
        <div class="result-details" style="margin-top: 1.5rem;">
            <div class="detail-row">
                <span class="detail-label">Estimated Billable Hours:</span>
                <span class="detail-value">${result.translated.billableHours} hours</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Analysis:</span>
                <span class="detail-value">${result.translated.analysis}</span>
            </div>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
}

// Load Alerts
async function loadAlerts() {
    const alertsList = document.getElementById('alerts-list');
    
    alertsList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">🔔</div>
            <h3>No alerts yet</h3>
            <p>Alerts will appear here when scope creep is detected</p>
        </div>
    `;
}

// Show Toast Notification
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast show';
    
    if (type === 'error') {
        toast.style.backgroundColor = 'var(--danger)';
    } else if (type === 'success') {
        toast.style.backgroundColor = 'var(--success)';
    } else if (type === 'warning') {
        toast.style.backgroundColor = 'var(--warning)';
    } else {
        toast.style.backgroundColor = 'var(--muted-teal)';
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Make functions globally available
window.pauseProject = pauseProject;
window.resumeProject = resumeProject;
window.viewProjectStats = viewProjectStats;

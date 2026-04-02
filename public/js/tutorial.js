/**
 * tutorial.js
 * Core engine for standalone UI tutorials using spotlights and floating cards.
 */

class TutorialManager {
    constructor(pageName, steps) {
        this.pageName = pageName;
        this.steps = steps;
        this.currentStepIndex = 0;
        this.resizeHandler = this.updatePositions.bind(this);
        this.updateTick = this.updatePositionsDynamic.bind(this);
        this.isUpdating = false;
        
        // DOM elements
        this.overlay = null;
        this.spotlight = null;
        this.card = null;
    }

    start() {
        if (!this.steps || this.steps.length === 0) return;
        this.currentStepIndex = 0;
        this.buildDOM();
        this.isUpdating = true;
        requestAnimationFrame(this.updateTick);
        window.addEventListener('resize', this.resizeHandler);
        // Add scroll listener to update fast immediately without waiting for tick visually
        window.addEventListener('scroll', this.resizeHandler, true);
        this.renderStep();
    }

    stop() {
        this.isUpdating = false;
        if (this.spotlight) this.spotlight.remove();
        if (this.card) this.card.remove();
        this.clearTargetHighlight();
        window.removeEventListener('resize', this.resizeHandler);
        window.removeEventListener('scroll', this.resizeHandler, true);
        
        // Mark as completed
        localStorage.setItem(`tutorial_done_${this.pageName}`, 'true');
    }

    updatePositionsDynamic() {
        if (this.isUpdating) {
            this.updatePositions();
            requestAnimationFrame(this.updateTick);
        }
    }

    buildDOM() {
        // Spotlight overlay cut-out
        this.spotlight = document.createElement('div');
        this.spotlight.className = 'tutorial-spotlight';
        document.body.appendChild(this.spotlight);

        // Global Card Wrapper
        this.card = document.createElement('div');
        this.card.className = 'tutorial-card';
        
        // Setup internal card HTML structure
        this.card.innerHTML = `
            <div class="tutorial-header">
                <a class="tutorial-skip" id="tut-skip">Skip tutorial</a>
                <span class="tutorial-counter" id="tut-counter"></span>
            </div>
            <h3 class="tutorial-title" id="tut-title"></h3>
            <p class="tutorial-desc" id="tut-desc"></p>
            <div class="tutorial-footer">
                <button class="tutorial-btn tutorial-btn-ghost" id="tut-prev">Previous</button>
                <button class="tutorial-btn tutorial-btn-primary" id="tut-next">Next</button>
            </div>
        `;
        document.body.appendChild(this.card);

        // Bind events
        document.getElementById('tut-skip').onclick = () => this.stop();
        document.getElementById('tut-prev').onclick = () => this.prevStep();
        document.getElementById('tut-next').onclick = () => this.nextStep();
    }

    clearTargetHighlight() {
        if (this.currentTargetEl) {
            this.currentTargetEl.classList.remove('tutorial-target-highlighted');
            this.currentTargetEl = null;
        }
    }

    renderStep() {
        const step = this.steps[this.currentStepIndex];
        if (!step) {
            this.stop();
            return;
        }

        // Clean previous target
        this.clearTargetHighlight();

        // Update Card Text
        document.getElementById('tut-counter').innerText = `Step ${this.currentStepIndex + 1} of ${this.steps.length}`;
        document.getElementById('tut-title').innerText = step.title || '';
        document.getElementById('tut-desc').innerText = step.description || '';

        // Buttons state
        const prevBtn = document.getElementById('tut-prev');
        const nextBtn = document.getElementById('tut-next');
        
        prevBtn.style.display = this.currentStepIndex === 0 ? 'none' : 'block';
        nextBtn.innerText = this.currentStepIndex === this.steps.length - 1 ? 'Got it' : 'Next';

        // Auto-scroll target into view if offscreen
        if (step.targetSelector) {
            const el = document.querySelector(step.targetSelector);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Brief delay before showing to allow DOM paints and scroll start
        this.card.classList.remove('show');
        
        setTimeout(() => {
            this.updatePositions();
            this.card.classList.add('show');
        }, 150);
    }

    updatePositions() {
        const step = this.steps[this.currentStepIndex];
        if (!step || !this.card || !this.spotlight) return;

        let targetEl = null;
        if (step.targetSelector) {
            targetEl = document.querySelector(step.targetSelector);
        }

        if (targetEl) {
            this.currentTargetEl = targetEl;
            targetEl.classList.add('tutorial-target-highlighted');
            
            // Spotlight metrics
            const rect = targetEl.getBoundingClientRect();
            // Pad the spotlight slightly
            const pad = 6; 
            
            this.spotlight.style.opacity = '1';
            this.spotlight.style.top = `${rect.top - pad}px`;
            this.spotlight.style.left = `${rect.left - pad}px`;
            this.spotlight.style.width = `${rect.width + (pad * 2)}px`;
            this.spotlight.style.height = `${rect.height + (pad * 2)}px`;

            // Card Positioning
            this.card.setAttribute('data-attached', 'true');
            if (window.innerWidth <= 600) {
                // Mobile stacked positioning is handled by CSS
                this.card.style.top = '';
                this.card.style.left = '';
                this.card.style.transform = '';
            } else {
                // Desktop positioning
                const cardWidth = 360;
                let top = rect.bottom + 20;
                let left = rect.left;

                // Adjust based on requested position
                if (step.position === 'top') {
                    top = rect.top - this.card.offsetHeight - 20;
                } else if (step.position === 'left') {
                    top = rect.top;
                    left = rect.left - cardWidth - 20;
                } else if (step.position === 'right') {
                    top = rect.top;
                    left = rect.right + 20;
                }
                
                // Boundaries fix
                if (left + cardWidth > window.innerWidth) left = window.innerWidth - cardWidth - 20;
                if (left < 20) left = 20;
                
                this.card.style.top = `${top}px`;
                this.card.style.left = `${left}px`;
            }
        } else {
            // No target: reset spotlight and center card
            this.spotlight.style.opacity = '0';
            this.spotlight.style.width = '0';
            this.spotlight.style.height = '0';
            
            this.card.removeAttribute('data-attached');
            this.card.style.top = '50%';
            this.card.style.left = '50%';
        }
    }

    nextStep() {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.currentStepIndex++;
            this.renderStep();
        } else {
            this.stop();
        }
    }

    prevStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.renderStep();
        }
    }
}

// Global API
window.startTutorial = function(pageName, steps) {
    if (window._activeTutorial) {
        window._activeTutorial.stop();
    }
    window._currentTutorialPage = pageName;
    window._currentTutorialSteps = steps;
    
    window._activeTutorial = new TutorialManager(pageName, steps);
    window._activeTutorial.start();
};

window.initPageTutorial = function(pageName, steps) {
    window._currentTutorialPage = pageName;
    window._currentTutorialSteps = steps;
    
    // Only auto-play if never seen before
    const isDone = localStorage.getItem(`tutorial_done_${pageName}`);
    if (!isDone) {
        window.startTutorial(pageName, steps);
    }
};

// Help Button Global Registration
document.addEventListener('DOMContentLoaded', () => {
    // Inject the global help button if not present
    if (!document.getElementById('global-tutorial-btn')) {
        const btn = document.createElement('button');
        btn.id = 'global-tutorial-btn';
        btn.className = 'tutorial-help-btn';
        btn.innerHTML = '?';
        btn.title = "Replay Tutorial";
        
        btn.onclick = () => {
            if (window._currentTutorialPage && window._currentTutorialSteps) {
                window.startTutorial(window._currentTutorialPage, window._currentTutorialSteps);
            }
        };
        document.body.appendChild(btn);
    }
});

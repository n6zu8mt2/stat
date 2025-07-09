document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const startStopBtn = document.getElementById('start_stop_btn');
    const resetBtn = document.getElementById('reset_btn');
    const trialsInput = document.getElementById('num_trials');
    const trialCountSpan = document.getElementById('trial-count');
    const currentAverageSpan = document.getElementById('current-average');
    const diceFaceDiv = document.querySelector('.dice-face');

    // --- グローバル変数 ---
    let p5Instance = null;
    let simulationState = {};
    let animationFrameId = null;

    // --- シミュレーションの状態をリセット ---
    function resetSimulation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        simulationState = {
            isRunning: false,
            maxTrials: parseInt(trialsInput.value) || 1000,
            trialCount: 0,
            sumOfRolls: 0,
            averageHistory: [],
            lastRoll: 0,
        };
        
        updateUI(simulationState.lastRoll);
        drawGraph();

        startStopBtn.textContent = '開始';
        startStopBtn.classList.remove('running');
        startStopBtn.disabled = false;
    }

    // --- UIの更新 ---
    function updateUI(lastRoll) {
        trialCountSpan.textContent = simulationState.trialCount.toLocaleString();
        if (simulationState.trialCount > 0) {
            const avg = simulationState.sumOfRolls / simulationState.trialCount;
            let precision = 2;
            if (simulationState.trialCount > 100) precision = 3;
            if (simulationState.trialCount > 1000) precision = 4;
            if (simulationState.trialCount > 10000) precision = 5;
            currentAverageSpan.textContent = avg.toFixed(precision);
        } else {
            currentAverageSpan.textContent = 'N/A';
        }
        // Only draw dice when simulation is stopped or has just finished
        if (!simulationState.isRunning) {
            drawDice(lastRoll);
        } else {
            drawDice(0); // Hide dice face during simulation
        }
    }
    
    // --- サイコロの描画関数 ---
    function drawDice(faceValue) {
        diceFaceDiv.dataset.face = faceValue.toString();
    }

    // --- シミュレーションの1ステップ ---
    function simulationStep() {
        if (!simulationState.isRunning) {
            return;
        }
        
        let stepsPerFrame = 1;
        if (simulationState.maxTrials > 2000) stepsPerFrame = 10;
        if (simulationState.maxTrials > 10000) stepsPerFrame = 50;
        if (simulationState.maxTrials > 50000) stepsPerFrame = 250;

        for (let i = 0; i < stepsPerFrame; i++) {
            if (simulationState.trialCount >= simulationState.maxTrials) {
                simulationState.isRunning = false; // Stop simulation
                startStopBtn.textContent = '開始';
                startStopBtn.classList.remove('running');
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                updateUI(simulationState.lastRoll); // Show last roll when trials complete
                drawGraph();
                return;
            }

            simulationState.trialCount++;
            const roll = Math.floor(Math.random() * 6) + 1;
            simulationState.sumOfRolls += roll;
            simulationState.lastRoll = roll;
            
            if (simulationState.trialCount % Math.ceil(stepsPerFrame / 10) === 0 || simulationState.trialCount < 100) {
                const currentAverage = simulationState.sumOfRolls / simulationState.trialCount;
                simulationState.averageHistory.push({ trial: simulationState.trialCount, average: currentAverage });
            }
        }
        
        updateUI(simulationState.lastRoll);
        drawGraph();

        animationFrameId = requestAnimationFrame(simulationStep);
    }

    // --- シミュレーションの開始/停止 ---
    function startStopSimulation() {
        simulationState.isRunning = !simulationState.isRunning;
        if (simulationState.isRunning) {
            if (simulationState.trialCount >= simulationState.maxTrials) {
                resetSimulation();
            }
            startStopBtn.textContent = '停止';
            startStopBtn.classList.add('running');
            simulationState.maxTrials = parseInt(trialsInput.value);
            animationFrameId = requestAnimationFrame(simulationStep);
        } else {
            startStopBtn.textContent = '再開';
            startStopBtn.classList.remove('running');
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            updateUI(simulationState.lastRoll); // Show last roll when stopping
        }
    }

    // --- グラフの描画 ---
    function drawGraph() {
        if (!p5Instance) {
            const container = document.getElementById('graph-container');
            const sketch = (p) => {
                p.setup = () => {
                    p.createCanvas(container.offsetWidth > 600 ? container.offsetWidth : 600, 400);
                    p.noLoop();
                };

                p.draw = () => {
                    p.background(255);
                    const padding = { top: 20, bottom: 50, left: 50, right: 20 };
                    const graphWidth = p.width - padding.left - padding.right;
                    const graphHeight = p.height - padding.top - padding.bottom;

                    p.stroke(220); p.strokeWeight(1);
                    for (let i = 1; i <= 6; i++) {
                        const y = p.map(i, 0, 7, p.height - padding.bottom, padding.top);
                        p.line(padding.left, y, p.width - padding.right, y);
                    }
                    
                    p.stroke(0);
                    p.line(padding.left, padding.top, padding.left, p.height - padding.bottom);
                    p.line(padding.left, p.height - padding.bottom, p.width - padding.right, p.height - padding.bottom);

                    p.noStroke(); p.fill(0); p.textAlign(p.RIGHT, p.CENTER);
                    for (let i = 1; i <= 6; i++) {
                        const y = p.map(i, 0, 7, p.height - padding.bottom, padding.top);
                        p.text(i.toFixed(1), padding.left - 10, y);
                    }
                    p.textAlign(p.CENTER, p.TOP);
                    p.text('試行回数', p.width / 2, p.height - padding.bottom + 25);
                    p.push(); p.translate(padding.left - 35, p.height / 2); p.rotate(-p.HALF_PI);
                    p.textAlign(p.CENTER, p.CENTER); p.text('出目の平均値', 0, 0); p.pop();
                    
                    const numXTicks = 5;
                    p.textAlign(p.CENTER, p.TOP);
                    for (let i = 0; i <= numXTicks; i++) {
                        const trialValue = Math.round((simulationState.maxTrials / numXTicks) * i);
                        const xPos = p.map(trialValue, 0, simulationState.maxTrials, padding.left, p.width - padding.right);
                        p.text(trialValue.toLocaleString(), xPos, p.height - padding.bottom + 5);
                    }
                    
                    const meanY = p.map(3.5, 0, 7, p.height - padding.bottom, padding.top);
                    p.stroke(255, 0, 0); p.strokeWeight(2);
                    p.line(padding.left, meanY, p.width - padding.right, meanY);
                    
                    p.fill(255, 0, 0); p.noStroke();
                    p.textAlign(p.LEFT, p.CENTER);
                    p.text('期待値 3.5', padding.left + 5, meanY - 10);
                    
                    p.stroke(0, 123, 255); p.strokeWeight(1.5); p.noFill();
                    p.beginShape();
                    simulationState.averageHistory.forEach(point => {
                        const x = p.map(point.trial, 0, simulationState.maxTrials, padding.left, p.width - padding.right);
                        const y = p.map(point.average, 0, 7, p.height - padding.bottom, padding.top);
                        p.vertex(x, y);
                    });
                    p.endShape();
                };
            };
            p5Instance = new p5(sketch, container);
        } else {
            p5Instance.draw();
        }
    }
    
    // --- イベントリスナー設定 ---
    startStopBtn.addEventListener('click', startStopSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    trialsInput.addEventListener('change', () => {
        if (!simulationState.isRunning) {
            resetSimulation();
        }
    });

    // --- 初期化 ---
    resetSimulation();
});
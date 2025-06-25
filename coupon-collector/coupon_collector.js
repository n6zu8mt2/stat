document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const runFullSimBtn = document.getElementById('run_full_simulation_btn');
    const startAnimationBtn = document.getElementById('start_animation_btn');
    const toggleLogBtn = document.getElementById('toggle_log_btn');
    const nInput = document.getElementById('num_coupons_n');
    const kInput = document.getElementById('num_simulations_k');
    const summaryBlock = document.getElementById('summary-results-block');
    const animationLogContainer = document.getElementById('animation-log-container');

    // --- グローバル変数 ---
    let histogramSketchInstance = null;
    let animationFrameId = null;
    let lastSimulationResults = null;

    // --- 理論値計算 ---
    function getTheoreticalValues(n) {
        let expectedValue = 0;
        let variance = 0;
        for (let i = 1; i <= n; i++) {
            expectedValue += n / i;
        }
        for (let k = 0; k < n; k++) {
            const p_k = (n - k) / n;
            variance += (1 - p_k) / (p_k * p_k);
        }
        return {
            mean: expectedValue,
            variance: variance,
            stdDev: Math.sqrt(variance)
        };
    }

    // --- 1回のシミュレーション（アニメーション付き） ---
    function runAnimatedSimulation() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        startAnimationBtn.disabled = true;

        const n = parseInt(nInput.value);
        if (isNaN(n) || n < 2 || n > 100) {
            alert('クーポンの種類数は2以上100以下で入力してください。');
            startAnimationBtn.disabled = false;
            return;
        }

        const grid = document.getElementById('coupon-grid');
        const drawCountSpan = document.getElementById('draw-count');
        const collectedCountSpan = document.getElementById('collected-count');
        const totalTypesSpan = document.getElementById('total-types');
        const logBody = document.getElementById('animation-log-body');

        grid.innerHTML = '';
        logBody.innerHTML = '';
        totalTypesSpan.textContent = n;

        for (let i = 0; i < n; i++) {
            const item = document.createElement('div');
            item.className = 'coupon-item';
            item.id = `coupon-${i}`;
            item.textContent = i + 1;
            grid.appendChild(item);
        }

        let collected = new Set();
        let draws = 0;
        let lastUpdateTime = 0;
        const updateInterval = 50;

        function step(timestamp) {
            if (timestamp - lastUpdateTime > updateInterval) {
                lastUpdateTime = timestamp;
                
                if (collected.size === n) {
                    startAnimationBtn.disabled = false;
                    cancelAnimationFrame(animationFrameId);
                    return;
                }
                
                draws++;
                const newCoupon = Math.floor(Math.random() * n);

                const newRow = logBody.insertRow(0);
                newRow.className = `log-color-${newCoupon % 10}`;
                newRow.insertCell().textContent = draws;
                newRow.insertCell().textContent = `景品 ${newCoupon + 1}`;
                
                if (!collected.has(newCoupon)) {
                    collected.add(newCoupon);
                    const el = document.getElementById(`coupon-${newCoupon}`);
                    if (el) {
                        el.classList.add('collected');
                        el.classList.add('just-collected');
                        newRow.style.fontWeight = 'bold';
                        setTimeout(() => el.classList.remove('just-collected'), 500);
                    }
                }
                
                drawCountSpan.textContent = draws;
                collectedCountSpan.textContent = collected.size;
            }
            animationFrameId = requestAnimationFrame(step);
        }
        animationFrameId = requestAnimationFrame(step);
    }

    // --- 全シミュレーションの実行（バックグラウンド） ---
    function runFullSimulation() {
        runFullSimBtn.disabled = true;
        runFullSimBtn.textContent = '計算中...';
        summaryBlock.style.display = 'none';

        setTimeout(() => {
            const n = parseInt(nInput.value);
            const k = parseInt(kInput.value);
            if (isNaN(n) || isNaN(k) || n < 2 || k < 1) {
                alert('有効なパラメータを入力してください。');
                runFullSimBtn.disabled = false;
                runFullSimBtn.textContent = '多数回シミュレーションを実行';
                return;
            }

            const completionTimes = [];
            for (let i = 0; i < k; i++) {
                let collected = new Set();
                let draws = 0;
                while (collected.size < n) {
                    draws++;
                    collected.add(Math.floor(Math.random() * n));
                }
                completionTimes.push(draws);
            }

            const sumTimes = completionTimes.reduce((sum, time) => sum + time, 0);
            const experimentalMean = sumTimes / k;
            
            const theoretical = getTheoreticalValues(n);
            
            lastSimulationResults = {
                completionTimes,
                experimentalMean,
                theoretical,
                params: { n, k }
            };

            displaySummaryStats(lastSimulationResults);
            redrawHistogramWithOptions();

            runFullSimBtn.disabled = false;
            runFullSimBtn.textContent = '多数回シミュレーションを実行';
        }, 10);
    }
    
    // --- 結果表示関連 ---
    function displaySummaryStats(results) {
        const { experimentalMean } = results;
        const { mean: theoMean, stdDev: theoStdDev } = results.theoretical;
        const expVar = results.completionTimes.reduce((sum, time) => sum + Math.pow(time - experimentalMean, 2), 0) / results.params.k;
        const expStdDev = Math.sqrt(expVar);

        document.getElementById('total-sims-span').textContent = results.params.k.toLocaleString();
        const tableBody = document.getElementById('summary-stats-body');
        tableBody.innerHTML = `
            <tr><td>期待値 $E[T]$</td><td>${theoMean.toFixed(2)}</td><td>${experimentalMean.toFixed(2)}</td></tr>
            <tr><td>標準偏差 $\\sigma[T]$</td><td>${theoStdDev.toFixed(2)}</td><td>${expStdDev.toFixed(2)}</td></tr>
        `;
        summaryBlock.style.display = 'block';
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([tableBody]).catch(err => console.error(err));
        }
    }

    function redrawHistogramWithOptions() {
        if (!lastSimulationResults) return;

        const stdDevCheckboxes = document.querySelectorAll('.stddev-checkbox:checked');
        const stdDevRanges = Array.from(stdDevCheckboxes).map(cb => parseInt(cb.value));

        drawResultsHistogram({
            data: lastSimulationResults.completionTimes,
            k: lastSimulationResults.params.k,
            expMean: lastSimulationResults.experimentalMean,
            theoMean: lastSimulationResults.theoretical.mean,
            theoStdDev: lastSimulationResults.theoretical.stdDev,
            stdDevRanges: stdDevRanges,
        });
    }

    // ★★★ ヒストグラム描画関数を修正 ★★★
    function drawResultsHistogram(options) {
        const { data, k, expMean, theoMean, theoStdDev, stdDevRanges } = options;
        const container = document.getElementById('results-histogram-container');
        if (histogramSketchInstance) {
            histogramSketchInstance.remove();
        }

        const sketch = (p) => {
            let bins, maxRelFreq, minVal, maxVal;

            p.setup = () => {
                p.createCanvas(container.offsetWidth > 400 ? container.offsetWidth : 400, 320);
                minVal = Math.min(...data);
                maxVal = Math.max(...data);
                const numBins = Math.min(50, Math.floor(maxVal - minVal) + 1);
                bins = new Array(numBins).fill(0);
                const binWidth = (maxVal - minVal) / numBins;
                if(binWidth === 0) binWidth = 1;

                data.forEach(val => {
                    const binIndex = Math.min(Math.floor((val - minVal) / binWidth), numBins - 1);
                    if(bins[binIndex] !== undefined) bins[binIndex]++;
                });
                
                // 最大度数ではなく、最大「相対」度数を計算
                const maxCount = Math.max(...bins);
                maxRelFreq = maxCount / k;
                
                p.noLoop();
            };

            p.draw = () => {
                p.background(255);
                const padding = { top: 40, bottom: 40, left: 50, right: 20 };
                const graphWidth = p.width - padding.left - padding.right;
                const graphHeight = p.height - padding.top - padding.bottom;
                
                // 棒の描画
                const barPixelWidth = graphWidth / bins.length;
                bins.forEach((count, i) => {
                    const relFreq = count / k;
                    const barHeight = p.map(relFreq, 0, maxRelFreq, 0, graphHeight);
                    const x = padding.left + i * barPixelWidth;
                    const y = p.height - padding.bottom - barHeight;
                    p.fill(66, 133, 244, 150);
                    p.stroke(66, 133, 244);
                    p.rect(x, y, barPixelWidth, barHeight);
                });
                
                p.stroke(0); p.strokeWeight(1);
                p.line(padding.left, p.height - padding.bottom, p.width - padding.right, p.height - padding.bottom); // 横軸
                p.line(padding.left, padding.top, padding.left, p.height - padding.bottom); // 縦軸

                p.noStroke(); p.fill(0); p.textAlign(p.CENTER, p.TOP);
                p.text("コンプリートまでの回数", p.width/2, p.height - padding.bottom + 15);
                
                // 縦軸ラベル
                p.push();
                p.translate(padding.left - 35, p.height / 2);
                p.rotate(-p.HALF_PI);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("相対度数", 0, 0);
                p.pop();

                // 横軸・縦軸の数値ラベル
                const numTicks = 8;
                for(let i = 0; i <= numTicks; i++){
                    const ratio = i / numTicks;
                    // 横軸
                    p.textAlign(p.CENTER, p.TOP);
                    const xVal = Math.round(minVal + (maxVal - minVal) * ratio);
                    const xPos = padding.left + ratio * graphWidth;
                    p.text(xVal, xPos, p.height - padding.bottom + 5);
                    
                    // 縦軸
                    if (i > 0 && numTicks > 2 && i % 2 === 0) { // ラベルの数を調整
                        p.textAlign(p.RIGHT, p.CENTER);
                        const yVal = ratio * maxRelFreq;
                        const yPos = p.height - padding.bottom - ratio * graphHeight;
                        p.text(yVal.toFixed(3), padding.left - 5, yPos);
                    }
                }

                function drawVLine(val, label, color, yOffset, lineStyle = 'solid') {
                    if (val >= minVal && val <= maxVal) {
                        const x = p.map(val, minVal, maxVal, padding.left, padding.left + graphWidth);
                        p.stroke(color); p.strokeWeight(2);
                        if(lineStyle === 'dashed') p.drawingContext.setLineDash([5, 5]);
                        p.line(x, padding.top - 10, x, p.height - padding.bottom);
                        p.drawingContext.setLineDash([]);
                        
                        p.fill(color); p.noStroke();
                        p.textAlign(p.CENTER, p.BOTTOM);
                        p.text(label, x, padding.top + yOffset);
                    }
                }
                
                drawVLine(theoMean, '理論上の期待値', p.color(255, 0, 0), 0);
                drawVLine(expMean, '実験の平均値', p.color(0, 150, 0), 12);

                if (stdDevRanges && stdDevRanges.length > 0) {
                     stdDevRanges.forEach(i => {
                        drawVLine(theoMean + i * theoStdDev, `+${i}σ`, p.color(30, 130, 30, 150), 0, 'dashed');
                        drawVLine(theoMean - i * theoStdDev, `-${i}σ`, p.color(30, 130, 30, 150), 12, 'dashed');
                    });
                }
            };
        };
        histogramSketchInstance = new p5(sketch, container);
    }

    // --- イベントリスナー設定 ---
    runFullSimBtn.addEventListener('click', () => {
        runFullSimulation(parseInt(nInput.value), parseInt(kInput.value));
    });

    startAnimationBtn.addEventListener('click', () => {
        runAnimatedSimulation(parseInt(nInput.value));
    });
    
    toggleLogBtn.addEventListener('click', () => {
        const isHidden = animationLogContainer.style.display === 'none';
        animationLogContainer.style.display = isHidden ? 'block' : 'none';
        toggleLogBtn.textContent = isHidden ? '試行ログを非表示' : '試行ログを表示';
    });

    document.querySelectorAll('.stddev-checkbox').forEach(cb => {
        cb.addEventListener('change', redrawHistogramWithOptions);
    });

    // 初期表示
    runFullSimulation(parseInt(nInput.value), parseInt(kInput.value));
});
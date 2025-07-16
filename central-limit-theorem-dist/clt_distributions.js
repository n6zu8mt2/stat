document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const runBtn = document.getElementById('run_simulation_btn');
    const distTypeSelect = document.getElementById('distribution_type');
    const nSampleSizeInput = document.getElementById('sample_size_n');
    const nSampleSizeSlider = document.getElementById('sample_size_n_slider');
    const nSampleSizeValueSpan = document.getElementById('sample_size_n_value');
    const kTrialsInput = document.getElementById('num_trials_k');
    const paramsContainer = document.getElementById('params-container');
    
    let p5Instance = null;

    // --- 各確率分布の設定 ---
    const distributions = {
        'uniform-discrete': {
            name: '離散一様分布 (サイコロ)',
            params: ['m_sides'],
            random_variate: (params) => Math.floor(Math.random() * params.m_sides) + 1,
            get_theoretical_stats: (params) => {
                const m = params.m_sides;
                const mean = (m + 1) / 2;
                const variance = (m**2 - 1) / 12;
                return { mean, variance };
            },
            isDiscrete: true
        },
        'bernoulli': {
            name: 'ベルヌーイ分布',
            params: ['p_bern'],
            random_variate: (params) => (Math.random() < params.p_bern) ? 1 : 0,
            get_theoretical_stats: (params) => {
                const p = params.p_bern;
                return { mean: p, variance: p * (1 - p) };
            },
            isDiscrete: true
        },
        'binomial': {
            name: '二項分布',
            params: ['k_bino', 'p_bino'],
            random_variate: (params) => {
                let successes = 0;
                for (let i = 0; i < params.k_bino; i++) {
                    if (Math.random() < params.p_bino) successes++;
                }
                return successes;
            },
            get_theoretical_stats: (params) => {
                const k = params.k_bino;
                const p = params.p_bino;
                return { mean: k * p, variance: k * p * (1 - p) };
            },
            isDiscrete: true
        },
        'geometric': {
            name: '幾何分布',
            params: ['p_geom'],
            random_variate: (params) => Math.floor(Math.log(1.0 - Math.random()) / Math.log(1.0 - params.p_geom)) + 1,
            get_theoretical_stats: (params) => {
                const p = params.p_geom;
                return { mean: 1 / p, variance: (1 - p) / (p**2) };
            },
            isDiscrete: true
        },
        'poisson': {
            name: 'ポアソン分布',
            params: ['lambda_p'],
            random_variate: (params) => {
                const L = Math.exp(-params.lambda_p);
                let k = 0;
                let p = 1;
                do {
                    k++;
                    p *= Math.random();
                } while (p > L);
                return k - 1;
            },
            get_theoretical_stats: (params) => {
                const lambda = params.lambda_p;
                return { mean: lambda, variance: lambda };
            },
            isDiscrete: true
        },
        'uniform-continuous': {
            name: '連続一様分布 (ジッター)',
            params: [],
            random_variate: () => Math.random() * 2 - 1,
            get_theoretical_stats: () => {
                return { mean: 0, variance: (1 - (-1))**2 / 12 };
            },
            isDiscrete: false
        },
        'exponential': {
            name: '指数分布',
            params: ['lambda_e'],
            random_variate: (params) => -Math.log(1.0 - Math.random()) / params.lambda_e,
            get_theoretical_stats: (params) => {
                const lambda = params.lambda_e;
                return { mean: 1 / lambda, variance: 1 / (lambda**2) };
            },
            isDiscrete: false
        },
        'chi-squared': {
            name: 'カイ二乗分布',
            params: ['df_chi'],
            _boxMuller: () => {
                let u1 = 0, u2 = 0;
                while(u1 === 0) u1 = Math.random();
                while(u2 === 0) u2 = Math.random();
                const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
                return z0;
            },
            random_variate: function(params) {
                let sum = 0;
                for (let i = 0; i < params.df_chi; i++) {
                    sum += this._boxMuller()**2;
                }
                return sum;
            },
            get_theoretical_stats: (params) => {
                const df = params.df_chi;
                return { mean: df, variance: 2 * df };
            },
            isDiscrete: false
        }
    };

    // --- UI制御 ---
    function updateParamUI() {
        const selectedType = distTypeSelect.value;
        paramsContainer.querySelectorAll('.param-group').forEach(el => el.style.display = 'none');
        const elToShow = document.getElementById(`params-${selectedType}`);
        if(elToShow) elToShow.style.display = 'block';
    }

    // --- メインのシミュレーション関数 ---
    function runSimulation() {
        runBtn.disabled = true;
        runBtn.textContent = '計算中...';

        try {
            const distKey = distTypeSelect.value;
            const n = parseInt(nSampleSizeInput.value);
            const k = parseInt(kTrialsInput.value);

            const distConfig = distributions[distKey];
            const params = {};
            distConfig.params.forEach(paramId => {
                const value = parseFloat(document.getElementById(paramId)?.value);
                if (isNaN(value)) throw new Error(`Invalid parameter value for ${paramId}`);
                params[paramId] = value;
            });

            if (isNaN(n) || isNaN(k) || n < 1 || k < 1) {
                throw new Error('Sample size and number of trials must be positive integers.');
            }

            const sums = new Array(k);
            let totalSum = 0;
            for (let i = 0; i < k; i++) {
                let currentSum = 0;
                for (let j = 0; j < n; j++) {
                    currentSum += distConfig.random_variate(params);
                }
                sums[i] = currentSum;
                totalSum += currentSum;
            }

            const experimentalMean = totalSum / k;
            const sumOfSquaredDiffs = sums.reduce((acc, val) => acc + (val - experimentalMean) ** 2, 0);
            const experimentalStdDev = Math.sqrt(sumOfSquaredDiffs / k);

            const singleStats = distConfig.get_theoretical_stats(params);
            const theoretical = {
                mean: n * singleStats.mean,
                variance: n * singleStats.variance,
                stdDev: Math.sqrt(n * singleStats.variance)
            };
            
            displaySummaryStats(theoretical, { mean: experimentalMean, stdDev: experimentalStdDev });
            drawHistogram(sums, theoretical, distKey, params);

        } catch (error) {
            alert(`エラー: ${error.message}`);
        } finally {
            runBtn.disabled = false;
            runBtn.textContent = 'シミュレーション実行';
        }
    }

    // --- 統計情報の表示 ---
    function displaySummaryStats(theoretical, experimental) {
        const tableBody = document.getElementById('summary-stats-body');
        tableBody.innerHTML = `
            <tr>
                <td>期待値 (平均)</td>
                <td>${theoretical.mean.toFixed(3)}</td>
                <td>${experimental.mean.toFixed(3)}</td>
            </tr>
            <tr>
                <td>標準偏差</td>
                <td>${theoretical.stdDev.toFixed(3)}</td>
                <td>${experimental.stdDev.toFixed(3)}</td>
            </tr>
        `;
    }

    // --- ヒストグラムの描画 ---
    function drawHistogram(data, theoretical, distKey, params) {
        const container = document.getElementById('histogram-container');
        // Clear previous canvas content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const sketch = (p) => {
            let bins, maxCount, binWidthInUnits;
            let displayMin, displayMax;

            p.setup = () => {
                p.createCanvas(container.offsetWidth > 600 ? container.offsetWidth : 600, 400);
                
                const simMin = Math.min(...data);
                const simMax = Math.max(...data);
                
                const n = parseInt(nSampleSizeInput.value);
                let numBins;
                if (distKey === 'uniform-discrete' && n === 1) {
                    // For discrete uniform with n=1, set bins to match possible outcomes (1 to m_sides)
                    const m_sides = params.m_sides;
                    numBins = m_sides;
                    displayMin = 1;
                    displayMax = m_sides;
                    binWidthInUnits = 1;
                } else if (distKey === 'binomial' && n === 1) {
                    // For binomial with n=1, set bins to match possible outcomes (0 to k_bino)
                    const k_bino = params.k_bino;
                    numBins = k_bino + 1;
                    displayMin = 0;
                    displayMax = k_bino;
                    binWidthInUnits = 1;
                } else {
                    // Standard binning for other cases
                    const isDiscrete = distributions[distKey].isDiscrete;
                    const theoMin = theoretical.mean - 4 * theoretical.stdDev;
                    const theoMax = theoretical.mean + 4 * theoretical.stdDev;
                    displayMin = Math.min(simMin, theoMin);
                    displayMax = Math.max(simMax, theoMax);
                    numBins = isDiscrete ? Math.min(100, Math.max(20, Math.round((simMax - simMin) * Math.sqrt(n)))) : 100;
                    binWidthInUnits = (displayMax - displayMin) / numBins;
                    if (binWidthInUnits <= 0) binWidthInUnits = isDiscrete ? 1 : 0.1;
                }

                bins = new Array(numBins).fill(0);
                data.forEach(val => {
                    const binIndex = Math.floor((val - displayMin) / binWidthInUnits);
                    const safeIndex = Math.min(Math.max(binIndex, 0), numBins - 1);
                    if (bins[safeIndex] !== undefined) bins[safeIndex]++;
                });
                maxCount = Math.max(...bins);
                p.noLoop();
            };

            p.draw = () => {
                p.background(255);
                const padding = { top: 20, bottom: 40, left: 50, right: 20 };
                const graphWidth = p.width - padding.left - padding.right;
                const graphHeight = p.height - padding.top - padding.bottom;
                
                const barPixelWidth = graphWidth / bins.length;
                bins.forEach((count, i) => {
                    if (count === 0) return;
                    const barHeight = p.map(count, 0, maxCount, 0, graphHeight);
                    const x = padding.left + i * barPixelWidth;
                    const y = p.height - padding.bottom - barHeight;
                    p.fill(66, 133, 244, 150);
                    p.stroke(66, 133, 244);
                    p.rect(x, y, barPixelWidth, barHeight);
                });
                
                if (theoretical.stdDev > 0.001 && !(distKey === 'uniform-discrete' && parseInt(nSampleSizeInput.value) === 1) && !(distKey === 'binomial' && parseInt(nSampleSizeInput.value) === 1)) {
                    p.stroke(255, 0, 0); 
                    p.strokeWeight(2); 
                    p.noFill();
                    p.beginShape();
                    const totalCounts = data.length;
                    for (let x = displayMin; x <= displayMax; x += (displayMax - displayMin) / 200) {
                        const pdf = (1 / (theoretical.stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - theoretical.mean) ** 2) / (2 * theoretical.variance));
                        const theoreticalCount = pdf * totalCounts * binWidthInUnits;
                        const yPos = p.map(theoreticalCount, 0, maxCount, 0, graphHeight);
                        const xPos = p.map(x, displayMin, displayMax, padding.left, padding.left + graphWidth);
                        p.vertex(xPos, p.height - padding.bottom - yPos);
                    }
                    p.endShape();
                }

                p.stroke(0); 
                p.strokeWeight(1);
                p.line(padding.left, p.height - padding.bottom, p.width - padding.right, p.height - padding.bottom);
                p.line(padding.left, padding.top, padding.left, p.height - padding.bottom);
                
                p.noStroke(); 
                p.fill(0); 
                p.textAlign(p.CENTER, p.TOP);
                p.text("合計値", p.width/2, p.height - padding.bottom + 15);
                p.push(); 
                p.translate(padding.left - 35, p.height / 2); 
                p.rotate(-p.HALF_PI);
                p.textAlign(p.CENTER, p.CENTER); 
                p.text("度数", 0, 0); 
                p.pop();

                p.textAlign(p.CENTER, p.TOP);
                for (let i = 0; i <= 6; i++) {
                    const val = displayMin + (displayMax - displayMin) * (i/6);
                    const x = p.map(val, displayMin, displayMax, padding.left, padding.left + graphWidth);
                    p.text(val.toFixed(distributions[distKey].isDiscrete ? 0 : 1), x, p.height - padding.bottom + 5);
                }
            };
        };

        // Create new p5 instance only if none exists
        if (!p5Instance) {
            p5Instance = new p5(sketch, container);
        } else {
            p5Instance.remove();
            p5Instance = new p5(sketch, container);
        }
    }
    
    // --- イベントリスナー設定 ---
    runBtn.addEventListener('click', runSimulation);
    distTypeSelect.addEventListener('change', () => {
        updateParamUI();
        runSimulation();
    });
    nSampleSizeInput.addEventListener('input', (e) => {
        nSampleSizeSlider.value = e.target.value;
        nSampleSizeValueSpan.textContent = e.target.value;
    });
    nSampleSizeInput.addEventListener('change', runSimulation);
    nSampleSizeSlider.addEventListener('input', (e) => {
        nSampleSizeInput.value = e.target.value;
        nSampleSizeValueSpan.textContent = e.target.value;
        runSimulation();
    });
    kTrialsInput.addEventListener('change', runSimulation);

    paramsContainer.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', runSimulation);
    });

    // --- 初期表示 ---
    updateParamUI();
    nSampleSizeValueSpan.textContent = nSampleSizeInput.value;
    runSimulation();
});
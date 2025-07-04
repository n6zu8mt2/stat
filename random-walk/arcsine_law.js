document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('run_simulation_btn');
    
    let samplePathsSketchInstance = null;
    let histogramSketchInstance = null;

    function runSimulation() {
        runBtn.disabled = true;
        runBtn.textContent = 'シミュレーション実行中...';

        setTimeout(() => {
            const p = parseFloat(document.getElementById('prob_p').value);
            const n = parseInt(document.getElementById('num_steps_n').value);
            const k = parseInt(document.getElementById('num_simulations_k').value);

            if (isNaN(p) || isNaN(n) || isNaN(k) || p < 0 || p > 1 || k < 1000) {
                alert('有効な値を入力してください。kは1000以上を推奨します。');
                runBtn.disabled = false;
                runBtn.textContent = 'シミュレーション実行';
                return;
            }
            
            document.getElementById('total-sims-span').textContent = k.toLocaleString();

            const leadTimeCounts = new Array(n + 1).fill(0);
            const samplePaths = [];

            for (let i = 0; i < k; i++) {
                let position = 0;
                let positiveTime = 0;
                const path = [{ t: 0, x: 0 }];

                for (let t = 1; t <= n; t++) {
                    position += (Math.random() < p) ? 1 : -1;
                    if (i < 5) {
                        path.push({ t: t, x: position });
                    }
                    if (position >= 0) {
                        positiveTime++;
                    }
                }
                leadTimeCounts[positiveTime]++;
                if (i < 5) {
                    samplePaths.push(path);
                }
            }

            populateLeadTimeTable(leadTimeCounts, k, n);
            drawSamplePaths(samplePaths, n);
            drawLeadTimeHistogram(leadTimeCounts, k, n);

            runBtn.disabled = false;
            runBtn.textContent = 'シミュレーション実行';
        }, 10);
    }

    function populateLeadTimeTable(counts, k, n) {
        const tableBody = document.getElementById('lead-time-body');
        tableBody.innerHTML = '';
        counts.forEach((count, time) => {
            const row = tableBody.insertRow();
            const ratio = time / n;
            row.insertCell().textContent = `${ratio.toFixed(2)} (${time}/${n} ステップ)`;
            row.insertCell().textContent = count.toLocaleString();
            row.insertCell().textContent = (count / k).toFixed(4);
        });
    }

    function drawSamplePaths(paths, n) {
        const container = document.getElementById('sample-paths-container');
        if (samplePathsSketchInstance) {
            samplePathsSketchInstance.remove();
        }
        const sketch = (p) => {
            const yPositions = paths.flatMap(path => path.map(pt => pt.x));
            const yMax = Math.max(...yPositions.map(Math.abs), 1);
            const colors = [
                p.color(255, 100, 100, 150),
                p.color(100, 150, 255, 150),
                p.color(100, 200, 100, 150),
                p.color(200, 100, 200, 150),
                p.color(255, 150, 50, 150)
            ];

            p.setup = () => {
                p.createCanvas(400, 300);
                p.noLoop();
            };

            p.draw = () => {
                p.background(255);
                const padding = { top: 20, bottom: 50, left: 50, right: 20 };

                // 横軸（x = 0に対応）
                const yZero = p.map(0, -yMax, yMax, p.height - padding.bottom, padding.top);
                p.stroke(200);
                p.line(padding.left, yZero, p.width - padding.right, yZero);

                // 横軸の目盛りとラベル
                p.noStroke(); p.fill(0); p.textAlign(p.CENTER, p.TOP);
                for (let i = 0; i <= 5; i++) {
                    const t = (i * n) / 5;
                    const x = p.map(t, 0, n, padding.left, p.width - padding.right);
                    p.line(x, yZero - 5, x, yZero + 5);
                    p.text(Math.round(t), x, yZero + 10);
                }
                p.text('時間 (t)', p.width / 2, p.height - padding.bottom + 20);

                // 縦軸と目盛り
                p.stroke(200);
                p.line(padding.left, padding.top, padding.left, p.height - padding.bottom);
                p.noStroke(); p.fill(0); p.textAlign(p.RIGHT, p.CENTER);
                for (let i = -2; i <= 2; i++) {
                    const yVal = (i * yMax) / 2;
                    const y = p.map(yVal, -yMax, yMax, p.height - padding.bottom, padding.top);
                    p.line(padding.left - 5, y, padding.left + 5, y);
                    p.text(yVal.toFixed(1), padding.left - 10, y);
                }
                p.push();
                p.translate(padding.left - 35, p.height / 2);
                p.rotate(-p.HALF_PI);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('位置 (x)', 0, 0);
                p.pop();

                // ランダムウォークの軌跡
                paths.forEach((path, index) => {
                    p.stroke(colors[index % colors.length]);
                    p.noFill();
                    p.strokeWeight(1.5);
                    p.beginShape();
                    path.forEach(point => {
                        const x = p.map(point.t, 0, n, padding.left, p.width - padding.right);
                        const y = p.map(point.x, -yMax, yMax, p.height - padding.bottom, padding.top);
                        p.vertex(x, y);
                    });
                    p.endShape();
                });
            };
        };
        samplePathsSketchInstance = new p5(sketch, container);
    }

    function drawLeadTimeHistogram(counts, k, n) {
        const container = document.getElementById('lead-time-histogram-container');
        if (histogramSketchInstance) {
            histogramSketchInstance.remove();
        }
        const sketch = (p) => {
            const binCount = Math.min(n + 1, 50);
            const binnedCounts = new Array(binCount).fill(0);
            counts.forEach((count, time) => {
                const binIndex = Math.floor((time / n) * binCount);
                if (binIndex < binCount) binnedCounts[binIndex] += count;
            });
            const relativeFreqs = binnedCounts.map(c => c / k);
            const maxFreq = Math.max(...relativeFreqs);

            p.setup = () => {
                p.createCanvas(400, 300);
                p.noLoop();
            };

            p.draw = () => {
                p.background(255);
                const padding = { top: 20, bottom: 50, left: 50, right: 20 };
                const graphHeight = p.height - padding.top - padding.bottom;
                const graphWidth = p.width - padding.left - padding.right;

                // 棒グラフの描画
                relativeFreqs.forEach((freq, index) => {
                    const barHeight = p.map(freq, 0, maxFreq, 0, graphHeight);
                    const barWidth = graphWidth / binCount;
                    const x = padding.left + index * barWidth;
                    const y = p.height - padding.bottom - barHeight;
                    p.fill(66, 133, 244, 150);
                    p.stroke(66, 133, 244);
                    p.rect(x, y, barWidth, barHeight);
                });

                // 理論曲線（逆正弦法則）の描画
                p.stroke(255, 0, 0); p.noFill(); p.strokeWeight(2);
                p.beginShape();
                for (let x_ratio = 0.01; x_ratio < 0.99; x_ratio += 0.01) {
                    const arcsine_pdf = 1 / (Math.PI * Math.sqrt(x_ratio * (1 - x_ratio)));
                    const x = padding.left + x_ratio * graphWidth;
                    const hist_bar_width = 1 / binCount;
                    const scaled_y = arcsine_pdf * hist_bar_width;
                    const y = p.height - padding.bottom - p.map(scaled_y, 0, maxFreq, 0, graphHeight);
                    if (y > padding.top) {
                        p.vertex(x, y);
                    }
                }
                p.endShape();

                // 軸とラベル
                p.stroke(0); p.strokeWeight(1);
                p.line(padding.left, p.height - padding.bottom, p.width - padding.right, p.height - padding.bottom);
                p.line(padding.left, padding.top, padding.left, p.height - padding.bottom);

                p.noStroke(); p.fill(0);
                p.textAlign(p.CENTER, p.TOP);
                p.text("プラス領域にいた時間の割合 (t/n)", p.width/2, p.height - padding.bottom + 20);

                // 横軸の数値ラベル
                for (let i = 0; i <= 5; i++) {
                    let ratio = i / 5;
                    let x = padding.left + ratio * graphWidth;
                    p.textAlign(p.CENTER, p.TOP);
                    p.text(ratio.toFixed(1), x, p.height - padding.bottom + 5);
                }

                // 縦軸の数値ラベルとタイトル
                p.textAlign(p.RIGHT, p.CENTER);
                for (let i = 0; i <= 4; i++) {
                    const ratio = i / 4;
                    const val = ratio * maxFreq;
                    const y = p.height - padding.bottom - ratio * graphHeight;
                    p.text(val.toFixed(3), padding.left - 5, y);
                }
                p.push();
                p.translate(padding.left - 35, p.height / 2);
                p.rotate(-p.HALF_PI);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("相対度数", 0, 0);
                p.pop();
            };
        };
        histogramSketchInstance = new p5(sketch, container);
    }
    
    runBtn.addEventListener('click', runSimulation);
    runSimulation();
});
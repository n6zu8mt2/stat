document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('run_simulation_btn');
    
    // p5.jsのインスタンスを保持する変数
    let samplePathsSketchInstance = null;
    let histogramSketchInstance = null;

    function runSimulation() {
        runBtn.disabled = true;
        runBtn.textContent = 'シミュレーション実行中...';

        // 描画処理が重いので、非同期処理にしてUIのフリーズを防ぐ
        setTimeout(() => {
            const p = parseFloat(document.getElementById('prob_p').value);
            const n = parseInt(document.getElementById('num_steps_n').value);
            const k = parseInt(document.getElementById('num_simulations_k').value);

            if (isNaN(p) || isNaN(n) || isNaN(k) || p < 0 || p > 1 || n < 2 || k < 1) {
                alert('有効な値を入力してください。');
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
                    if (i < 10) { // 最初の10件のシミュレーションだけ軌跡を保存
                        path.push({ t: t, x: position });
                    }
                    if (position > 0) {
                        positiveTime++;
                    }
                }
                leadTimeCounts[positiveTime]++;
                if (i < 10) {
                    samplePaths.push(path);
                }
            }

            // 結果テーブルの描画
            populateLeadTimeTable(leadTimeCounts, k, n);

            // 軌跡グラフの描画
            drawSamplePaths(samplePaths, n);

            // 逆正弦法則のヒストグラム描画
            drawLeadTimeHistogram(leadTimeCounts, k, n);

            runBtn.disabled = false;
            runBtn.textContent = 'シミュレーション実行';
        }, 10); // 10ミリ秒後に実行開始
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
            const yMax = Math.max(...yPositions.map(Math.abs));

            p.setup = () => {
                p.createCanvas(400, 300);
            };

            p.draw = () => {
                p.background(255);
                const padding = { top: 20, bottom: 30, left: 30, right: 20 };

                // 軸
                p.stroke(200);
                p.line(padding.left, p.height / 2, p.width - padding.right, p.height / 2); // x=0 line
                
                p.noStroke(); p.fill(0); p.textAlign(p.CENTER, p.TOP);
                p.text('時間 (t)', p.width / 2, p.height - padding.bottom + 5);

                paths.forEach((path, index) => {
                    p.stroke(p.color(100 + index * 15, 100, 200 - index * 15, 150));
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
                p.noLoop();
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
            const relativeFreqs = counts.map(c => c / k);
            const barWidth = (p.width - 60) / (n + 1);
            const maxFreq = Math.max(...relativeFreqs);

            p.setup = () => {
                p.createCanvas(400, 300);
            };

            p.draw = () => {
                p.background(255);
                const padding = { top: 20, bottom: 40, left: 40, right: 20 };
                const graphHeight = p.height - padding.top - padding.bottom;
                const graphWidth = p.width - padding.left - padding.right;

                // 棒グラフの描画
                relativeFreqs.forEach((freq, time) => {
                    const barHeight = p.map(freq, 0, maxFreq, 0, graphHeight);
                    const x = padding.left + time * (graphWidth / n);
                    const y = p.height - padding.bottom - barHeight;
                    p.fill(66, 133, 244, 150);
                    p.stroke(66, 133, 244);
                    p.rect(x, y, graphWidth / n, barHeight);
                });

                // 理論曲線（逆正弦法則）の描画
                p.stroke(255, 0, 0);
                p.noFill();
                p.strokeWeight(2);
                p.beginShape();
                for (let x_ratio = 0.01; x_ratio < 1; x_ratio += 0.01) {
                    const arcsine_y = 1 / (Math.PI * Math.sqrt(x_ratio * (1 - x_ratio)));
                    const x = padding.left + x_ratio * graphWidth;
                    // ヒストグラムの面積=1と比較するため、確率密度をスケール調整
                    const scaled_y = arcsine_y / (n + 1); 
                    const y = p.height - padding.bottom - p.map(scaled_y, 0, maxFreq, 0, graphHeight);

                    if (y > padding.top) { // グラフ上部をはみ出さないように
                         p.vertex(x, y);
                    }
                }
                p.endShape();

                // 軸とラベル
                p.stroke(0); p.strokeWeight(1);
                p.line(padding.left, p.height - padding.bottom, p.width - padding.right, p.height - padding.bottom);
                p.noStroke(); p.fill(0); p.textAlign(p.CENTER, p.TOP);
                p.text("プラス領域にいた時間の割合 (t/n)", p.width/2, p.height - padding.bottom + 10);
                
                for(let i = 0; i <= 5; i++){
                    let ratio = i/5;
                    let x = padding.left + ratio * graphWidth;
                    p.textAlign(p.CENTER, p.TOP);
                    p.text(ratio.toFixed(1), x, p.height - padding.bottom + 5);
                }
                p.noLoop();
            };
        };
        histogramSketchInstance = new p5(sketch, container);
    }
    
    runBtn.addEventListener('click', runSimulation);
    // 初期表示
    runSimulation();
});
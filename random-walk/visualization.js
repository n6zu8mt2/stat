document.addEventListener('DOMContentLoaded', () => {
    // HTMLの表と一致する5試合のサンプルデータ
    const sampleWalks = [
        [0, 1, 0, -1, 0, 1],       // 試合1: 新定義でリード時間 3/5 = 0.6
        [0, -1, -2, -1, 0, -1],    // 試合2: 新定義でリード時間 1/5 = 0.2
        [0, 1, 2, 3, 2, 1],        // 試合3: 新定義でリード時間 5/5 = 1.0
        [0, -1, 0, 1, 0, -1],      // 試合4: 新定義でリード時間 2/5 = 0.4
        [0, -1, -2, -1, 0, 1]      // 試合5: 新定義でリード時間 1/5 = 0.2
    ];

    let currentWalkIndex = 0;
    let p5Instance = null;

    const prevBtn = document.getElementById('prev-walk-btn');
    const nextBtn = document.getElementById('next-walk-btn');
    const walkIndexSpan = document.getElementById('walk-index');
    const leadTimeSpan = document.getElementById('lead-time-value');
    const leadRatioSpan = document.getElementById('lead-ratio-value');
    const container = document.getElementById('walk-graph-container');

    function drawWalk(index) {
        const path = sampleWalks[index];
        const n = path.length - 1; // ステップ数（n=5）

        // リード時間の計算 (S_t >= 0 かつ S_{t-1} >= 0 のステップ数、t=1からt=nまで)
        let leadTime = 0;
        for (let t = 1; t <= n; t++) {
            if (path[t] >= 0 && path[t-1] >= 0) {
                leadTime++;
            }
        }
        
        // UIの更新
        walkIndexSpan.textContent = index + 1;
        leadTimeSpan.textContent = `${leadTime} ステップ`;
        leadRatioSpan.textContent = (leadTime / n).toFixed(2) + ` (${leadTime}/${n})`;

        // p5.jsでグラフを描画
        if (p5Instance) {
            p5Instance.remove();
        }

        const sketch = (p) => {
            const allYValues = path.concat(0); // 0を必ず含める
            const yMax = Math.max(...allYValues.map(Math.abs), 3); // 最小yMaxを3に設定
            const padding = { top: 20, bottom: 50, left: 50, right: 20 };

            p.setup = () => {
                p.createCanvas(450, 250);
                p.noLoop();
            };

            p.draw = () => {
                p.background(255);
                const graphWidth = p.width - padding.left - padding.right;
                const graphHeight = p.height - padding.top - padding.bottom;
                
                // リードしていた区間を緑色で塗る（S_t >= 0 かつ S_{t-1} >= 0 の区間 [t-1, t]）
                p.noStroke();
                for (let t = 1; t <= n; t++) {
                    if (path[t] >= 0 && path[t-1] >= 0) {
                        const x1 = p.map(t - 1, 0, n, padding.left, p.width - padding.right);
                        const x2 = p.map(t, 0, n, padding.left, p.width - padding.right);
                        p.fill(223, 240, 216, 150); // 透明度を下げて視認性向上
                        p.rect(x1, padding.top, x2 - x1, graphHeight);
                    }
                }
                
                // 軸線
                p.stroke(150);
                p.line(padding.left, padding.top, padding.left, p.height - padding.bottom); // 縦軸
                const yZero = p.map(0, -yMax, yMax, p.height - padding.bottom, padding.top);
                p.line(padding.left, yZero, p.width - padding.right, yZero); // 横軸（スコア差=0）

                // 横軸の目盛りとラベル
                p.noStroke(); p.fill(0); p.textAlign(p.CENTER, p.TOP);
                for (let t = 0; t <= n; t++) {
                    const x = p.map(t, 0, n, padding.left, p.width - padding.right);
                    p.stroke(150);
                    p.line(x, yZero - 5, x, yZero + 5); // 目盛り
                    p.noStroke();
                    p.text(t, x, yZero + 10);
                }
                p.text('時間 (t)', p.width / 2, p.height - padding.bottom + 20);

                // 縦軸の目盛りとラベル
                p.stroke(150);
                for (let i = -Math.ceil(yMax); i <= Math.ceil(yMax); i++) {
                    const y = p.map(i, -yMax, yMax, p.height - padding.bottom, padding.top);
                    p.line(padding.left - 5, y, padding.left + 5, y); // 目盛り
                    p.noStroke();
                    p.textAlign(p.RIGHT, p.CENTER);
                    p.text(i, padding.left - 10, y);
                }
                p.push();
                p.translate(padding.left - 35, p.height / 2);
                p.rotate(-p.HALF_PI);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('Aチームのリード（スコア差）', 0, 0);
                p.pop();

                // 軌跡の描画
                p.stroke(0, 123, 255);
                p.strokeWeight(2.5);
                p.noFill();
                p.beginShape();
                path.forEach((val, t) => {
                    const x = p.map(t, 0, n, padding.left, p.width - padding.right);
                    const y = p.map(val, -yMax, yMax, p.height - padding.bottom, padding.top);
                    p.vertex(x, y);
                });
                p.endShape();
                
                // 軌跡の点を強調
                path.forEach((val, t) => {
                    const x = p.map(t, 0, n, padding.left, p.width - padding.right);
                    const y = p.map(val, -yMax, yMax, p.height - padding.bottom, padding.top);
                    p.fill(255);
                    p.stroke(0, 123, 255);
                    p.circle(x, y, 6);
                });
            };
        };

        p5Instance = new p5(sketch, container);
    }

    prevBtn.addEventListener('click', () => {
        currentWalkIndex = (currentWalkIndex - 1 + sampleWalks.length) % sampleWalks.length;
        drawWalk(currentWalkIndex);
    });

    nextBtn.addEventListener('click', () => {
        currentWalkIndex = (currentWalkIndex + 1) % sampleWalks.length;
        drawWalk(currentWalkIndex);
    });

    // 初期描画
    if (container) {
        drawWalk(currentWalkIndex);
    }
});
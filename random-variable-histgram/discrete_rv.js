/**
 * 確率分布のデータから統計量を計算するクラス
 */
class DistributionCalculator {
    constructor(xValues, pValues) {
        this.xValues = xValues;
        this.pValues = pValues;
        this.expectedValue = 0;
        this.variance = 0;
        this.stdDeviation = 0;
        this.calculate();
    }

    calculate() {
        this.expectedValue = this.xValues.reduce((sum, x, i) => sum + x * this.pValues[i], 0);
        this.variance = this.xValues.reduce((sum, x, i) => sum + Math.pow(x - this.expectedValue, 2) * this.pValues[i], 0);
        this.stdDeviation = Math.sqrt(this.variance);
    }

    getStatsHTML() {
        return `
            <h4>統計量</h4>
            <p><span class="stat-label">期待値 $E[X]$:</span> <span class="stat-value">${this.expectedValue.toFixed(3)}</span></p>
            <p><span class="stat-label">分散 $V[X]$:</span> <span class="stat-value">${this.variance.toFixed(3)}</span></p>
            <p><span class="stat-label">標準偏差 $\\sigma[X]$:</span> <span class="stat-value">${this.stdDeviation.toFixed(3)}</span></p>
        `;
    }

    getFormulasHTML() {
        const evString = this.xValues.map((x, i) => `(${x} \\times ${this.pValues[i]})`).join(' + ');
        const varString = this.xValues.map((x, i) => `(${x.toFixed(2)} - ${this.expectedValue.toFixed(2)})^2 \\times ${this.pValues[i]}`).join(' + ');

        return `
            <h4>計算式</h4>
            <p><b>期待値 E[X]</b></p>
            <p>$$ E[X] = \\sum_{i} x_i P(X=x_i) $$</p>
            <p>$$ = ${evString} = ${this.expectedValue.toFixed(3)} $$</p>
            <hr>
            <p><b>分散 V[X]</b></p>
            <p>$$ V[X] = \\sum_{i} (x_i - E[X])^2 P(X=x_i) $$</p>
            <p>$$ = ${varString} \\approx ${this.variance.toFixed(3)} $$</p>
            <hr>
            <p><b>標準偏差 σ[X]</b></p>
            <p>$$ \\sigma[X] = \\sqrt{V[X]} \\approx \\sqrt{${this.variance.toFixed(3)}} \\approx ${this.stdDeviation.toFixed(3)} $$</p>
        `;
    }
}

/**
 * p5.jsを使ってヒストグラムを描画する関数
 */
function drawHistogram(container, xValues, pValues, options) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    const sketch = (p) => {
        const data = xValues.map((x, i) => ({ x, prob: pValues[i] })).sort((a, b) => a.x - b.x);
        const { width, height } = options.dimensions;
        
        p.setup = () => {
            p.createCanvas(width, height);
            p.noLoop();
        };

        p.draw = () => {
            p.background(250);
            if (options.mode === 'custom') {
                drawCustomHistogram(p, data, options);
            } else {
                drawStandardHistogram(p, data, options);
            }
        };
    };

    new p5(sketch, container);
}

/**
 * σの範囲を描画するためのヘルパー関数
 */
function drawSigmaLines(p, mapFunc, options) {
    const { expectedValue, stdDeviation, stdDevRanges } = options;
    if (!stdDevRanges || stdDevRanges.length === 0 || typeof expectedValue !== 'number' || typeof stdDeviation !== 'number' || stdDeviation <= 0) {
        return;
    }
    
    p.stroke(0, 130, 0, 200);
    p.strokeWeight(1.5);
    p.drawingContext.setLineDash([4, 4]);

    stdDevRanges.forEach(i => {
        const sigmaMultiple = parseInt(i, 10);
        const upperVal = expectedValue + sigmaMultiple * stdDeviation;
        const lowerVal = expectedValue - sigmaMultiple * stdDeviation;
        
        // +側と-側の両方を描画
        mapFunc(upperVal, `+${sigmaMultiple}σ`);
        mapFunc(lowerVal, `-${sigmaMultiple}σ`);
    });
    p.drawingContext.setLineDash([]);
}

/**
 * カスタム形式のヒストグラムを描画（横軸:確率, 縦軸:x）
 */
function drawCustomHistogram(p, data, options) {
    const { width, height } = options.dimensions;
    const totalProbWidth = width * 0.95;
    const allX = data.map(d => d.x).concat(
        // σの範囲も考慮に入れてy軸のスケールを決定
        options.stdDevRanges ? options.stdDevRanges.flatMap(i => [options.expectedValue + i * options.stdDeviation, options.expectedValue - i * options.stdDeviation]) : [],
        options.expectedValue
    );
    const yMin = Math.min(...allX);
    const yMax = Math.max(...allX);
    const yRange = yMax - yMin;
    
    const padding = { left: 5, right: 35, top: 20, bottom: 20 };
    const graphHeight = height - padding.top - padding.bottom;
    const valueScale = yRange > 0 ? graphHeight / yRange : 0;
    
    let currentXPos = padding.left;

    // 0のラインを描画
    p.stroke(200);
    const zeroY = height - padding.bottom - (0 - yMin) * valueScale;
    p.line(padding.left, zeroY, width - padding.right, zeroY);

    for (let i = 0; i < data.length; i++) {
        const { x, prob } = data[i];
        const barWidth = prob * totalProbWidth;
        const barHeight = Math.abs(x) * valueScale;
        const yPos = (x >= 0) ? zeroY - barHeight : zeroY;

        p.fill(66, 133, 244, 150); p.stroke(66, 133, 244);
        p.rect(currentXPos, yPos, barWidth, barHeight);

        p.fill(0); p.noStroke(); p.textSize(10);
        p.textAlign(p.CENTER, p.BOTTOM);
        if (x >= 0) {
            p.text(`${x}`, currentXPos + barWidth / 2, yPos - 2);
        } else {
            p.textAlign(p.CENTER, p.TOP);
            p.text(`${x}`, currentXPos + barWidth / 2, yPos + barHeight + 2);
        }
        
        p.textAlign(p.CENTER, p.TOP);
        p.text(`${prob.toFixed(2)}`, currentXPos + barWidth / 2, height - padding.bottom + 2);
        currentXPos += barWidth;
    }

    if (typeof options.expectedValue === 'number') {
        const expectedValueY = height - padding.bottom - (options.expectedValue - yMin) * valueScale;
        p.stroke(255, 0, 0); p.strokeWeight(2);
        p.line(padding.left, expectedValueY, width - padding.right, expectedValueY);
        p.fill(255, 0, 0); p.noStroke();
        p.textAlign(p.RIGHT, p.CENTER); p.text('E[X]', width - padding.right, expectedValueY - 5);
    }
    
    if (options.stdDevRanges && options.stdDevRanges.length > 0) {
        drawSigmaLines(p, (val, label) => {
            const y = height - padding.bottom - (val - yMin) * valueScale;
            p.line(padding.left, y, width - padding.right, y);
            p.fill(0, 130, 0); p.noStroke();
            p.textAlign(p.RIGHT, p.CENTER); p.text(label, width - padding.right, y - 5);
        }, options);
    }
}

/**
 * 標準形式のヒストグラムを描画（横軸:x, 縦軸:確率）
 */
function drawStandardHistogram(p, data, options) {
    const { width, height } = options.dimensions;
    const padding = { left: 40, right: 20, top: 20, bottom: 40 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const allX = data.map(d => d.x).concat(
        options.stdDevRanges ? options.stdDevRanges.flatMap(i => [options.expectedValue + i * options.stdDeviation, options.expectedValue - i * options.stdDeviation]) : [],
        options.expectedValue
    );
    const xMin = Math.min(...allX);
    const xMax = Math.max(...allX);
    const pMax = data.length > 0 ? Math.max(...data.map(d => d.prob)) : 0;
    const xRange = xMax - xMin;

    p.stroke(0); p.strokeWeight(1);
    p.line(padding.left, height - padding.bottom, width - padding.right, height - padding.bottom);
    p.line(padding.left, padding.top, padding.left, height - padding.bottom);
    
    p.textAlign(p.CENTER, p.TOP); p.textSize(10);
    p.fill(0); p.noStroke();
    p.text("x の値", padding.left + graphWidth/2, height - padding.bottom + 15);
    p.push(); p.translate(padding.left - 25, padding.top + graphHeight / 2); p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER, p.CENTER); p.text("確率", 0, 0); p.pop();

    let barWidth;
    if (data.length > 1 && xRange > 0) {
        const sortedUniqueX = [...new Set(data.map(d => d.x))].sort((a, b) => a - b);
        let minXGap = Infinity;
        for (let i = 0; i < sortedUniqueX.length - 1; i++) {
            minXGap = Math.min(minXGap, sortedUniqueX[i+1] - sortedUniqueX[i]);
        }
        const minPixelGap = p.map(xMin + minXGap, xMin, xMax, 0, graphWidth);
        barWidth = Math.min(graphWidth / (data.length * 1.5), minPixelGap * 0.8);
    } else {
        barWidth = graphWidth / 5;
    }
    barWidth = Math.max(5, barWidth);

    for (let i = 0; i < data.length; i++) {
        const { x, prob } = data[i];
        let xPos = padding.left + p.map(x, xMin, xMax, 0, graphWidth);
        if (xRange === 0) xPos = padding.left + graphWidth / 2;
        
        const barHeight = p.map(prob, 0, pMax, 0, graphHeight);
        const yPos = height - padding.bottom - barHeight;
        
        p.fill(66, 133, 244, 150); p.stroke(66, 133, 244);
        p.rect(xPos - barWidth / 2, yPos, barWidth, barHeight);

        p.fill(0); p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.text(x, xPos, height - padding.bottom + 5);
    }

    if (typeof options.expectedValue === 'number' && xRange > 0) {
        const expectedValueX = p.map(options.expectedValue, xMin, xMax, padding.left, padding.left + graphWidth);
        p.stroke(255, 0, 0); p.strokeWeight(2);
        p.line(expectedValueX, padding.top, expectedValueX, height - padding.bottom);
        p.fill(255, 0, 0); p.noStroke();
        p.textAlign(p.CENTER, p.BOTTOM); p.text('E[X]', expectedValueX, padding.top - 2);
    }

    if (options.stdDevRanges && options.stdDevRanges.length > 0 && xRange > 0) {
        drawSigmaLines(p, (val, label) => {
            const x = p.map(val, xMin, xMax, padding.left, padding.left + graphWidth);
            p.line(x, padding.top, x, height - padding.bottom);
            p.fill(0, 130, 0); p.noStroke();
            p.textAlign(p.CENTER, p.BOTTOM); p.text(label, x, padding.top - 2);
        }, options);
    }
}


/**
 * 特定の分布グループのイベントリスナー等をセットアップする関数
 */
function setupDistributionGroup(groupDiv) {
    const addColBtn = groupDiv.querySelector('.add-col-btn');
    const removeColBtn = groupDiv.querySelector('.remove-col-btn');
    const calculateBtn = groupDiv.querySelector('.calculate-btn');
    const showFormulaBtn = groupDiv.querySelector('.show-formula-btn');
    const showVarianceHistBtn = groupDiv.querySelector('.show-variance-hist-btn');
    const stdDevCheckboxes = groupDiv.querySelectorAll('.stddev-checkbox');
    const tableBody = groupDiv.querySelector('tbody');

    addColBtn.addEventListener('click', () => {
        tableBody.rows[0].insertCell().innerHTML = '<input type="number" class="x-value" value="0">';
        tableBody.rows[1].insertCell().innerHTML = '<input type="number" class="p-value" value="0" step="0.1" min="0" max="1">';
    });

    removeColBtn.addEventListener('click', () => {
        if (tableBody.rows[0].cells.length > 2) {
            tableBody.rows[0].deleteCell(-1);
            tableBody.rows[1].deleteCell(-1);
        } else {
            alert('これ以上列は削除できません。');
        }
    });
    
    const calculateAndDraw = () => {
        const xInputs = tableBody.rows[0].querySelectorAll('.x-value');
        const pInputs = tableBody.rows[1].querySelectorAll('.p-value');
        const xValues = Array.from(xInputs).map(input => parseFloat(input.value));
        const pValues = Array.from(pInputs).map(input => parseFloat(input.value));

        if (xValues.some(isNaN) || pValues.some(isNaN) || pValues.some(p => p < 0 || p > 1)) {
            alert('入力が無効です。すべてのxとP(X=x)に数値を入力してください。');
            return null;
        }
        const pSum = pValues.reduce((sum, p) => sum + p, 0);
        if (Math.abs(pSum - 1) > 0.001) {
            alert(`確率の合計が1になるようにしてください。\n現在の合計: ${pSum.toFixed(3)}`);
            return null;
        }

        const calculator = new DistributionCalculator(xValues, pValues);
        const statsWrapper = groupDiv.querySelector('.statistics-wrapper');
        statsWrapper.innerHTML = calculator.getStatsHTML();
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([statsWrapper]).catch(err => console.error(err));
        }
        
        const mode = groupDiv.querySelector('input[name^="hist-mode"]:checked').value;
        const checkedRanges = Array.from(stdDevCheckboxes)
                                   .filter(cb => cb.checked)
                                   .map(cb => parseInt(cb.value));

        drawHistogram(
            groupDiv.querySelector('.histogram-wrapper'),
            xValues, pValues,
            { 
                mode, 
                expectedValue: calculator.expectedValue,
                stdDeviation: calculator.stdDeviation,
                stdDevRanges: checkedRanges,
                dimensions: { width: 350, height: 220 } 
            }
        );
        return calculator;
    };

    calculateBtn.addEventListener('click', calculateAndDraw);
    groupDiv.querySelectorAll('input[name^="hist-mode"]').forEach(radio => {
        radio.addEventListener('change', calculateAndDraw);
    });
    stdDevCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', calculateAndDraw);
    });

    showFormulaBtn.addEventListener('click', () => {
        const formulaDisplay = groupDiv.querySelector('.formula-display');
        const calculator = calculateAndDraw();
        if (calculator) {
            formulaDisplay.innerHTML = calculator.getFormulasHTML();
            const isHidden = formulaDisplay.style.display === 'none';
            formulaDisplay.style.display = isHidden ? 'block' : 'none';
            if (isHidden && typeof MathJax !== 'undefined') {
                MathJax.typesetPromise([formulaDisplay]).catch(err => console.error(err));
            }
        }
    });

    showVarianceHistBtn.addEventListener('click', () => {
        const varianceHistWrapper = groupDiv.querySelector('.variance-histogram-wrapper');
        const calculator = calculateAndDraw();
        if (calculator) {
            const varianceXValues = calculator.xValues.map(x => Math.pow(x - calculator.expectedValue, 2));
            const variancePCanvas = varianceHistWrapper.querySelector('.variance-histogram-canvas');
            const expectedValueOfY = calculator.variance;

            drawHistogram(
                variancePCanvas,
                varianceXValues, calculator.pValues,
                { 
                    mode: 'standard', 
                    expectedValue: expectedValueOfY,
                    stdDeviation: null,
                    stdDevRanges: [],
                    dimensions: { width: 350, height: 220 } 
                }
            );
            const isHidden = varianceHistWrapper.style.display === 'none';
            varianceHistWrapper.style.display = isHidden ? 'block' : 'none';
        }
    });
}

/**
 * ページ読み込み完了後に実行されるメインの処理
 */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.distribution-group').forEach(group => {
        setupDistributionGroup(group);
        group.querySelector('.calculate-btn').click();
    });

    const addDistributionBtn = document.getElementById('add-distribution-btn');
    const distributionsContainer = document.getElementById('distributions-container');
    let distributionCount = document.querySelectorAll('.distribution-group').length;

    addDistributionBtn.addEventListener('click', () => {
        distributionCount++;
        const newGroupDiv = document.createElement('div');
        newGroupDiv.className = 'distribution-group';
        newGroupDiv.id = `dist-group-${distributionCount}`;
        newGroupDiv.innerHTML = `
            <h4>分布 ${distributionCount}</h4>
            <div class="table-controls">
                <button type="button" class="add-col-btn">列を追加</button>
                <button type="button" class="remove-col-btn">列を削除</button>
            </div>
            <table>
                <tbody>
                    <tr><th>$x$ の値</th><td><input type="number" class="x-value" value="0"></td><td><input type="number" class="x-value" value="10"></td></tr>
                    <tr><th>$P(X=x)$</th><td><input type="number" class="p-value" value="0.5" step="0.1" min="0" max="1"></td><td><input type="number" class="p-value" value="0.5" step="0.1" min="0" max="1"></td></tr>
                </tbody>
            </table>
            <div class="main-controls">
                <button type="button" class="calculate-btn">計算と表示</button>
                <button type="button" class="show-formula-btn">計算式を表示</button>
                <button type="button" class="show-variance-hist-btn">分散を可視化</button>
            </div>
            <div class="results-container">
                <div class="display-options">
                    <fieldset class="histogram-options">
                        <legend>ヒストグラム表示</legend>
                        <label><input type="radio" name="hist-mode-${distributionCount}" value="custom" checked> 横軸:確率, 縦軸:$x$</label>
                        <label><input type="radio" name="hist-mode-${distributionCount}" value="standard"> 横軸:$x$, 縦軸:確率</label>
                    </fieldset>
                    <fieldset class="stddev-options">
                        <legend>$\\sigma$の範囲</legend>
                        <label><input type="checkbox" class="stddev-checkbox" value="1"> ±1σ</label>
                        <label><input type="checkbox" class="stddev-checkbox" value="2"> ±2σ</label>
                        <label><input type="checkbox" class="stddev-checkbox" value="3"> ±3σ</label>
                    </fieldset>
                </div>
                <div class="histogram-wrapper"></div>
                <div class="statistics-wrapper"></div>
                <div class="formula-display" style="display: none;"></div>
                <div class="variance-histogram-wrapper" style="display: none;">
                    <h4>期待値との差の2乗 $(X-E[X])^2$ の分布</h4>
                    <div class="variance-histogram-canvas"></div>
                </div>
            </div>
        `;
        distributionsContainer.appendChild(newGroupDiv);
        setupDistributionGroup(newGroupDiv);
    });
});
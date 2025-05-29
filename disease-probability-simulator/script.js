let canvas;

function getDiseaseProbability() {
    const p = parseFloat(document.getElementById('diseaseProbability').value);
    return isNaN(p) || p < 0 || p > 1 ? 0.1 : p;
}

function getPositiveGivenDisease() {
    const q = parseFloat(document.getElementById('positiveGivenDisease').value);
    return isNaN(q) || q < 0 || q > 1 ? 0.9 : q;
}

function getNegativeGivenNoDisease() {
    const r = parseFloat(document.getElementById('negativeGivenNoDisease').value);
    return isNaN(r) || r < 0 || r > 1 ? 0.7 : r;
}

function getStepSize() {
    const step = parseFloat(document.getElementById('stepSize').value);
    // ユーザー入力によってはstepが0以下になる可能性も考慮
    return (isNaN(step) || step <= 0) ? 0.1 : step;
}

function calculateConditionalProbability(p, q, r) {
    const positiveGivenNoDisease = 1 - r;
    const positiveProbability = q * p + positiveGivenNoDisease * (1 - p);
    if (positiveProbability === 0) {
        // 分母が0の場合、p*q も0であれば0/0でNaN、p*q > 0 なら Infinity。
        // 条件付き確率としては0とするのが適切か、あるいは定義不能か。
        // ここでは0を返すことでグラフが途切れないようにする。
        return 0;
    }
    return (q * p) / positiveProbability;
}

function calculateProbability() {
    const p = getDiseaseProbability();
    const q = getPositiveGivenDisease();
    const r = getNegativeGivenNoDisease();

    const conditionalProbability = calculateConditionalProbability(p, q, r);
    // 表示形式の変更
    document.getElementById('result').innerHTML = `検査結果が陽性である条件のもとで病気aにかかっている確率: ${conditionalProbability.toFixed(2)} (=${(conditionalProbability * 100).toFixed(0)}%)`;

    updateTable(q, r);
}

function updateTable(q, r) {
    const tableDiv = document.getElementById('probabilityTable');
    const canvasContainer = document.getElementById('canvasContainer');
    const toggle = document.getElementById('tableToggle').checked;

    if (!toggle) {
        tableDiv.style.display = 'none';
        canvasContainer.style.display = 'none';
        if (canvas) {
            canvas.remove();
            canvas = null;
        }
        return;
    }

    tableDiv.style.display = 'block';
    canvasContainer.style.display = 'block';

    if (canvas) {
        canvas.remove();
        canvas = null;
    }

    const step = getStepSize();
    const maxP = 1.0;

    let tableHTML = '<table><tr><th>P(A)</th><th>P(A|B)</th></tr>';
    for (let p_iter = 0; p_iter <= maxP; p_iter += step) {
        let current_p = parseFloat(p_iter.toFixed(4)); // 内部計算用に桁数を保持
        if (current_p > maxP) current_p = maxP;

        const prob = calculateConditionalProbability(current_p, q, r);
        // P(A) と P(A|B) を小数点以下2桁で表示
        tableHTML += `<tr><td>${current_p.toFixed(2)}</td><td>${prob.toFixed(2)}</td></tr>`;
        
        if (current_p === maxP && p_iter >= maxP) break; // 1.0丁度の処理後、p_iterがそれを超えていたら終了
    }
    tableHTML += '</table>';
    tableDiv.innerHTML = tableHTML;
    
    // MathJaxの処理 (もしテーブルヘッダーなどに数式があれば)
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([tableDiv]).catch(err => console.error('MathJax typesetting error in updateTable:', err));
    }

    // p5.js グラフ描画処理 (変更なし)
    const p5_step = step; // p5.js内のstep変数名が衝突しないように (元々大丈夫ならそのままでOK)
    const p5_maxP = maxP; // 同上

    canvas = new p5((sketch) => {
        sketch.setup = () => {
            let cnv = sketch.createCanvas(400, 220).parent('canvasContainer');
        };

        sketch.draw = () => {
            sketch.background(255);
            sketch.stroke(0); 
            sketch.noFill();  

            const padding = { top: 20, right: 20, bottom: 50, left: 50 };
            const graphWidth = sketch.width - padding.left - padding.right;
            const graphHeight = sketch.height - padding.top - padding.bottom;

            sketch.line(padding.left, padding.top + graphHeight, padding.left + graphWidth, padding.top + graphHeight);
            sketch.line(padding.left, padding.top, padding.left, padding.top + graphHeight);

            sketch.fill(0); 
            sketch.noStroke(); 
            sketch.textSize(12);
            
            sketch.textAlign(sketch.CENTER, sketch.TOP);
            sketch.text('P(A)', padding.left + graphWidth / 2, padding.top + graphHeight + 10);

            sketch.push(); 
            sketch.translate(padding.left - 30, padding.top + graphHeight / 2);
            sketch.rotate(-sketch.HALF_PI);
            sketch.textAlign(sketch.CENTER, sketch.BOTTOM); 
            sketch.text('P(A|B)', 0, 0);
            sketch.pop(); 

            const numTicks = 5; 
            sketch.stroke(0); 
            sketch.fill(0);   
            for (let i = 0; i <= numTicks; i++) {
                let val = i / numTicks;

                let x = padding.left + val * graphWidth;
                sketch.line(x, padding.top + graphHeight, x, padding.top + graphHeight + 5);
                sketch.textAlign(sketch.CENTER, sketch.TOP);
                sketch.noStroke(); 
                sketch.text(val.toFixed(1), x, padding.top + graphHeight + 10);
                sketch.stroke(0); 

                let y = padding.top + graphHeight - val * graphHeight;
                sketch.line(padding.left - 5, y, padding.left, y);
                sketch.textAlign(sketch.RIGHT, sketch.CENTER);
                sketch.noStroke(); 
                sketch.text(val.toFixed(1), padding.left - 10, y);
                sketch.stroke(0); 
            }

            const pValues = [];
            const dataPoints = [];
            // p5_step, q, r はこの関数のスコープからクロージャでキャプチャされる
            for (let p_iter_graph = 0; p_iter_graph <= p5_maxP; p_iter_graph += p5_step) {
                let current_p_graph = parseFloat(p_iter_graph.toFixed(4));
                if (current_p_graph > p5_maxP) current_p_graph = p5_maxP;

                pValues.push(current_p_graph);
                let probValue = calculateConditionalProbability(current_p_graph, q, r);
                if (isNaN(probValue)) { 
                    probValue = 0; 
                }
                dataPoints.push(probValue);
                if (current_p_graph === p5_maxP && p_iter_graph >= p5_maxP) break;
            }

            sketch.stroke(0, 0, 255); 
            sketch.strokeWeight(1.5); 
            sketch.noFill();          
            sketch.beginShape();
            for (let i = 0; i < dataPoints.length; i++) {
                if (typeof pValues[i] === 'undefined' || typeof dataPoints[i] === 'undefined') continue;

                const x_coord = padding.left + sketch.map(pValues[i], 0, 1, 0, graphWidth);
                const y_coord = padding.top + graphHeight - sketch.map(dataPoints[i], 0, 1, 0, graphHeight); 
                sketch.vertex(x_coord, y_coord);
            }
            sketch.endShape();
            sketch.strokeWeight(1); 
        };
    });
}

function reset() {
    document.getElementById('diseaseProbability').value = '0.1';
    document.getElementById('positiveGivenDisease').value = '0.9';
    document.getElementById('negativeGivenNoDisease').value = '0.7';
    document.getElementById('stepSize').value = '0.1';
    document.getElementById('tableToggle').checked = false;
    document.getElementById('result').innerHTML = '';
    
    const tableDiv = document.getElementById('probabilityTable');
    tableDiv.innerHTML = '';
    tableDiv.style.display = 'none';
    
    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.style.display = 'none';

    if (canvas) {
        canvas.remove(); // p5.jsのcanvasを削除
    }
    canvas = null; // canvas変数をリセット
}

document.getElementById('tableToggle').addEventListener('change', () => {
    // トグル時に現在の入力値でqとrを再取得してグラフを更新
    const q = getPositiveGivenDisease();
    const r = getNegativeGivenNoDisease();
    updateTable(q, r);
});
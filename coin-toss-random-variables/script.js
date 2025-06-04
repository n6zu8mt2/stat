/**
 * 階乗を計算する関数
 * @param {number} n - 非負の整数
 * @returns {number} nの階乗
 */
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

/**
 * 組み合わせの数 (nCr) を計算する関数
 * @param {number} n - 全体の数
 * @param {number} r - 選ぶ数
 * @returns {number} nCr
 */
function combinations(n, r) {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    if (r > n / 2) r = n - r; // 計算量を減らすための最適化
    return factorial(n) / (factorial(r) * factorial(n - r));
}

/**
 * 「各試行の結果」テーブルの表示/非表示を切り替える関数
 */
function toggleIndividualTrialsTable() {
    const tableContainer = document.getElementById('individualTrialsTableContainer');
    const button = document.getElementById('toggleIndividualTrials');
    if (tableContainer.style.display === 'none') {
        tableContainer.style.display = 'block';
        button.textContent = '各試行の結果を非表示にする';
    } else {
        tableContainer.style.display = 'none';
        button.textContent = '各試行の結果を表示する';
    }
}


/**
 * シミュレーションを実行し、結果を表示する関数
 */
function runSimulation() {
    const n = parseInt(document.getElementById('numCoins_n').value) || 2;
    const m = parseInt(document.getElementById('multiplier_m').value) || 100;
    const k = parseInt(document.getElementById('numTrials_k').value) || 1000;

    if (n <= 0 || m <= 0 || k <= 0) {
        alert("コインの枚数、乗数、シミュレーション回数は1以上の正の整数を入力してください。");
        return;
    }

    const individualTrialsBody = document.getElementById('individualTrialsBody');
    const summaryBody = document.getElementById('summaryBody');
    const statisticsBody = document.getElementById('statisticsBody');

    individualTrialsBody.innerHTML = '';
    summaryBody.innerHTML = '';
    statisticsBody.innerHTML = '';

    const xCounts = {};
    for (let i = 0; i <= n; i++) {
        xCounts[i * m] = 0;
    }

    let sumX = 0;
    let sumXSquared = 0;

    for (let i = 0; i < k; i++) {
        let heads = 0;
        for (let j = 0; j < n; j++) {
            if (Math.random() < 0.5) {
                heads++;
            }
        }
        const xValue = heads * m;
        xCounts[xValue]++;
        sumX += xValue;
        sumXSquared += xValue * xValue;

        if (i < 100) {
            const row = individualTrialsBody.insertRow();
            // 表の枚数に応じてクラスを設定
            if (heads >= 0 && heads <= 4) { // CSSで定義した色の範囲
                row.className = `heads-count-${heads}`;
            } else {
                row.className = 'heads-count-default'; // 定義範囲外の場合のデフォルトクラス
            }

            row.insertCell().textContent = i + 1;
            const cellHeads = row.insertCell();
            cellHeads.textContent = heads;
            row.insertCell().textContent = xValue;
        }
    }
    
    const xValuesSorted = Object.keys(xCounts).map(Number).sort((a, b) => a - b);

    const rowData = {
        // XをMathJaxのインライン数式デリミタで囲む
        xValue: ['\\(X\\) の値 (円)'],
        realized: ['実現回数'],
        relativeFreq: ['相対度数'],
        theoreticalProb: ['理論上の確率']
    };

    for (const val of xValuesSorted) {
        const headsCount = val / m;
        rowData.xValue.push(val);
        rowData.realized.push(xCounts[val]);
        rowData.relativeFreq.push((xCounts[val] / k).toFixed(Math.max(3, k.toString().length -1))); 
        const probTheoretical = combinations(n, headsCount) * Math.pow(0.5, n);
        rowData.theoreticalProb.push(probTheoretical.toFixed(Math.max(3, n + 1)));
    }
    
    for (const key in rowData) {
        const row = summaryBody.insertRow();
        rowData[key].forEach(cellData => {
            const cell = row.insertCell();
            cell.textContent = cellData;
        });
    }

    const pCoin = 0.5;
    const theoreticalMeanX = n * pCoin * m;
    const theoreticalVarianceX = n * pCoin * (1 - pCoin) * Math.pow(m, 2);
    const theoreticalStdDevX = Math.sqrt(theoreticalVarianceX);

    const experimentalMeanX = sumX / k;
    const experimentalVarianceX = (sumXSquared / k) - Math.pow(experimentalMeanX, 2);
    const experimentalStdDevX = Math.sqrt(experimentalVarianceX);

    function addStatRow(label, theoretical, experimental, precision = 2) {
        const row = statisticsBody.insertRow();
        row.insertCell().textContent = label; // ラベルはここで設定
        row.insertCell().textContent = theoretical.toFixed(precision);
        row.insertCell().textContent = experimental.toFixed(precision);
    }

    // ラベル文字列をMathJaxのインライン数式デリミタで囲む
    addStatRow("期待値 \\(E[X]\\)", theoreticalMeanX, experimentalMeanX);
    addStatRow("分散 \\(V[X]\\)", theoreticalVarianceX, experimentalVarianceX);
    // sigma もLaTeXコマンドにし、インライン数式デリミタで囲む
    addStatRow("標準偏差 \\(\\sigma[X]\\)", theoreticalStdDevX, experimentalStdDevX);

    // 動的に生成されたコンテンツに対してMathJaxの再処理を呼び出す
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        console.log('Typesetting dynamically added math content in tables...');
        // summaryBody と statisticsBody の内容が更新されたので、これらを対象にする
        MathJax.typesetPromise([summaryBody, statisticsBody])
            .catch((err) => console.error('MathJax typesetting error for dynamic content:', err));
    }
}

window.onload = function() {
    runSimulation();
    // 初期状態では「各試行の結果」テーブルを非表示にするため、
    // ボタンのテキストを適切に設定（HTMLでstyle="display:none"にしたのでこれでOK）
};
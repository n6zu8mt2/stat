function runSimulation() {
    // 入力値を取得
    const numTrials = parseInt(document.getElementById('num-trials').value);

    // 入力値のバリデーション
    if (isNaN(numTrials) || numTrials < 1) {
        alert('試行回数は1以上の値を指定してください。');
        return;
    }

    // カウント初期化
    const counts = { 0: 0, 1: 0, 2: 0 }; // 表が0枚、1枚、2枚の回数

    // シミュレーション実行
    for (let i = 0; i < numTrials; i++) {
        // コインを2枚投げる
        const coin1 = Math.random() < 0.5 ? 0 : 1; // 0: 裏, 1: 表
        const coin2 = Math.random() < 0.5 ? 0 : 1;
        const heads = coin1 + coin2; // 表の枚数
        counts[heads]++;
    }

    // 結果を表示
    const resultBody = document.getElementById('result-body');
    resultBody.innerHTML = '';

    // 表を作成
    for (let heads = 0; heads <= 2; heads++) {
        const row = document.createElement('tr');
        const percentage = (counts[heads] / numTrials * 100).toFixed(2);

        // 表の枚数
        const cellHeads = document.createElement('td');
        cellHeads.textContent = heads;
        cellHeads.classList.add(`heads-${heads}`);
        row.appendChild(cellHeads);

        // 回数
        const cellCount = document.createElement('td');
        cellCount.textContent = counts[heads];
        row.appendChild(cellCount);

        // 割合
        const cellPercentage = document.createElement('td');
        cellPercentage.textContent = `${percentage}%`;
        row.appendChild(cellPercentage);

        resultBody.appendChild(row);
    }
}
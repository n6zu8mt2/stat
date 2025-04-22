let draws = []; // ガチャ結果を保持
let numItems; // 景品の種類数
let totalDraws = 0; // 現在の総ガチャ回数

// 初回ガチャシミュレーション
function runSimulation() {
    // 入力値を取得
    numItems = parseInt(document.getElementById('num-items').value);
    const numDraws = parseInt(document.getElementById('num-draws').value);

    // 入力値のバリデーション
    if (isNaN(numItems) || numItems < 1) {
        alert('景品の種類数は1以上の値を指定してください。');
        return;
    }
    if (isNaN(numDraws) || numDraws < 1) {
        alert('ガチャを引く回数は1以上の値を指定してください。');
        return;
    }

    // 初期化
    draws = [];
    totalDraws = 0;

    // ガチャを引く
    drawGacha(numDraws);

    // 結果を表示
    displayResults();
}

// 追加ガチャ
function additionalDraw() {
    const additionalDraws = parseInt(document.getElementById('additional-draws').value);

    // 入力値のバリデーション
    if (isNaN(additionalDraws) || additionalDraws < 1) {
        alert('追加で引く回数は1以上の値を指定してください。');
        return;
    }

    // ガチャを引く
    drawGacha(additionalDraws);

    // 結果を表示
    displayResults();
}

// ガチャを引く処理
function drawGacha(numDraws) {
    for (let i = 0; i < numDraws; i++) {
        const prize = Math.floor(Math.random() * numItems); // 0からnumItems-1までのランダムな景品
        draws.push({ drawNumber: totalDraws + 1, prize: prize });
        totalDraws++;
    }
}

// 結果を表示
function displayResults() {
    // 表形式で結果を表示
    const table = document.getElementById('gacha-table');
    table.innerHTML = '';

    // 列数を決定（総ガチャ回数に応じて調整）
    const columns = Math.min(20, Math.ceil(Math.sqrt(totalDraws)));
    const rows = Math.ceil(totalDraws / columns);

    // 表を作成
    let drawIndex = 0;
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < columns; j++) {
            const cell = document.createElement('td');
            if (drawIndex < draws.length) {
                const draw = draws[drawIndex];
                cell.textContent = `${draw.drawNumber}番: 景品${draw.prize + 1}`;
                // 景品ごとに色を割り当て（10色を循環）
                cell.classList.add(`color-${draw.prize % 10}`);
            }
            row.appendChild(cell);
            drawIndex++;
        }
        table.appendChild(row);
    }

    // 集めた種類数を計算
    const collectedPrizes = new Set(draws.map(draw => draw.prize));
    const collectedCount = collectedPrizes.size;

    // 結果概要を表示
    const summaryText = document.getElementById('summary-text');
    summaryText.textContent = `総ガチャ回数: ${totalDraws}回、集めた景品の種類数: ${collectedCount}種類`;
}

// リセット
function resetSimulation() {
    draws = [];
    totalDraws = 0;

    // 表と結果をクリア
    const table = document.getElementById('gacha-table');
    table.innerHTML = '';
    const summaryText = document.getElementById('summary-text');
    summaryText.textContent = '';
}
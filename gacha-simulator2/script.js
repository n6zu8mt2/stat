let totalDraws = 0;
let successCount = 0;
let firstSuccessDraw = null;
let results = [];

function getProbability() {
    const p = parseFloat(document.getElementById('probability').value);
    return isNaN(p) || p <= 0 || p >= 1 ? 0.01 : p;
}

function getExtraDraws() {
    const m = parseInt(document.getElementById('extraDraws').value);
    return isNaN(m) || m < 1 ? 10 : m;
}

function draw() {
    const p = getProbability();
    totalDraws++;
    const isSuccess = Math.random() < p;
    if (isSuccess) {
        if (firstSuccessDraw === null) firstSuccessDraw = totalDraws;
        successCount++;
    }
    results.push({ draw: totalDraws, success: isSuccess });
    updateTable();
    return isSuccess;
}

function drawTen() {
    for (let i = 0; i < 10; i++) {
        draw();
    }
    updateSummary();
}

function drawM() {
    const m = getExtraDraws();
    for (let i = 0; i < m; i++) {
        draw();
    }
    updateSummary();
}

function drawUntilSuccess() {
    const button = document.querySelector('button[onclick="drawUntilSuccess()"]');
    button.disabled = true;
    const interval = setInterval(() => {
        if (draw()) {
            clearInterval(interval);
            button.disabled = false;
            updateSummary();
            alert(`欲しいキャラが${totalDraws}回で出ました！`);
        }
    }, 100);
}

function updateTable() {
    const tableDiv = document.getElementById('resultTable');
    const toggle = document.getElementById('tableToggle').checked;
    if (!toggle) {
        tableDiv.style.display = 'none';
        return;
    }
    tableDiv.style.display = 'block';
    let tableHTML = '<table><tr><th>回数</th></tr>';
    const cols = Math.ceil(Math.sqrt(totalDraws)) || 1;
    const rows = Math.ceil(totalDraws / cols);

    for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
            const index = i * cols + j;
            if (index < results.length) {
                const result = results[index];
                tableHTML += `<td class="${result.success ? 'success' : ''}">${result.draw}${result.success ? ' (成功)' : ''}</td>`;
            } else {
                tableHTML += '<td></td>';
            }
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    tableDiv.innerHTML = tableHTML;
}

function updateSummary() {
    const summaryDiv = document.getElementById('summary');
    let summaryHTML = `集計: ${totalDraws}回ガチャを引いて、${successCount}回欲しいキャラが出ました (成功率: ${(successCount / totalDraws * 100).toFixed(2)}%)<br>`;
    if (firstSuccessDraw) {
        summaryHTML += `初めて欲しいキャラが出たのは${firstSuccessDraw}回目です。`;
    }
    summaryDiv.innerHTML = summaryHTML;
}

function reset() {
    totalDraws = 0;
    successCount = 0;
    firstSuccessDraw = null;
    results = [];
    document.getElementById('resultTable').innerHTML = '';
    document.getElementById('summary').innerHTML = '';
    updateTable();
}

document.getElementById('tableToggle').addEventListener('change', updateTable);
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
    return isNaN(step) || step < 0.01 || step > 0.5 ? 0.01 : step;
}

function calculateConditionalProbability(p, q, r) {
    const positiveGivenNoDisease = 1 - r;
    const positiveProbability = q * p + positiveGivenNoDisease * (1 - p);
    if (positiveProbability === 0) return 0;
    const conditionalProbability = (q * p) / positiveProbability;
    return conditionalProbability;
}

function calculateProbability() {
    const p = getDiseaseProbability();
    const q = getPositiveGivenDisease();
    const r = getNegativeGivenNoDisease();

    const conditionalProbability = calculateConditionalProbability(p, q, r);
    document.getElementById('result').innerHTML = `検査結果が陽性である条件のもとで病気aにかかっている確率: ${(conditionalProbability * 100).toFixed(2)}%`;

    updateTable(q, r);
}

function updateTable(q, r) {
    const tableDiv = document.getElementById('probabilityTable');
    const toggle = document.getElementById('tableToggle').checked;
    if (!toggle) {
        tableDiv.style.display = 'none';
        return;
    }
    tableDiv.style.display = 'block';

    const step = getStepSize();
    let tableHTML = '<table><tr><th>p (病気aの確率)</th><th>病気aである確率 (%)</th></tr>';
    for (let p = 0; p <= 1; p += step) {
        const prob = calculateConditionalProbability(p, q, r);
        tableHTML += `<tr><td>${p.toFixed(2)}</td><td>${(prob * 100).toFixed(2)}</td></tr>`;
    }
    tableHTML += '</table>';
    tableDiv.innerHTML = tableHTML;
}

function reset() {
    document.getElementById('diseaseProbability').value = '0.1';
    document.getElementById('positiveGivenDisease').value = '0.9';
    document.getElementById('negativeGivenNoDisease').value = '0.7';
    document.getElementById('stepSize').value = '0.01';
    document.getElementById('tableToggle').checked = false;
    document.getElementById('result').innerHTML = '';
    document.getElementById('probabilityTable').innerHTML = '';
    document.getElementById('probabilityTable').style.display = 'none';
}

document.getElementById('tableToggle').addEventListener('change', () => {
    const q = getPositiveGivenDisease();
    const r = getNegativeGivenNoDisease();
    updateTable(q, r);
});
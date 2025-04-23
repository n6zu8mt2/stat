let recentSwaps = []; // 直近10回分の席替え結果を保存

function runSimulation() {
    // 入力値を取得
    const numPeople = parseInt(document.getElementById('num-people').value);
    const numTrials = parseInt(document.getElementById('num-trials').value);

    // 入力値のバリデーション
    if (isNaN(numPeople) || numPeople < 2) {
        alert('人数は2以上の値を指定してください。');
        return;
    }
    if (isNaN(numTrials) || numTrials < 1) {
        alert('席替え回数は1以上の値を指定してください。');
        return;
    }

    // 同じ席になる試行回数をカウント
    let sameSeatCount = 0;
    recentSwaps = []; // 席替え結果をリセット

    // シミュレーション実行
    for (let trial = 0; trial < numTrials; trial++) {
        // 元の席（0からnumPeople-1）
        const originalSeats = Array.from({ length: numPeople }, (_, i) => i);
        // 席をシャッフル
        const shuffledSeats = shuffle([...originalSeats]);

        // 同じ席に座る人がいるか確認
        let hasSameSeat = false;
        for (let i = 0; i < numPeople; i++) {
            if (originalSeats[i] === shuffledSeats[i]) {
                hasSameSeat = true;
                break;
            }
        }
        if (hasSameSeat) {
            sameSeatCount++;
        }

        // 席替え結果を保存（直近10回分）
        if (recentSwaps.length < 10) {
            recentSwaps.push({ trial: trial + 1, original: originalSeats, shuffled: shuffledSeats });
        } else {
            recentSwaps.shift();
            recentSwaps.push({ trial: trial + 1, original: originalSeats, shuffled: shuffledSeats });
        }
    }

    // 割合を計算
    const sameSeatPercentage = (sameSeatCount / numTrials * 100).toFixed(2);
    // 理論値（1 - 1/e ≈ 0.6321）
    const theoreticalPercentage = ((1 - 1 / Math.E) * 100).toFixed(2);

    // 結果を表示
    const resultBody = document.getElementById('result-body');
    resultBody.innerHTML = '';

    const rows = [
        { label: '総試行回数', value: numTrials },
        { label: '同じ席になる試行回数', value: sameSeatCount, class: 'same-seat' },
        { label: '同じ席になる割合', value: `${sameSeatPercentage}%`, class: 'same-seat' },
        { label: '理論値', value: `${theoreticalPercentage}%` }
    ];

    // 結果表を作成
    rows.forEach(row => {
        const tr = document.createElement('tr');
        const tdLabel = document.createElement('td');
        const tdValue = document.createElement('td');
        tdLabel.textContent = row.label;
        tdValue.textContent = row.value;
        if (row.class) {
            tdLabel.classList.add(row.class);
            tdValue.classList.add(row.class);
        }
        tr.appendChild(tdLabel);
        tr.appendChild(tdValue);
        resultBody.appendChild(tr);
    });

    // 席替え結果表を表示
    displaySwapResults(numPeople);
}

// Fisher-Yatesシャッフルアルゴリズム
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 席替え結果表を表示
function displaySwapResults(numPeople) {
    const tableHead = document.getElementById('swap-table-head');
    const tableBody = document.getElementById('swap-table-body');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    // ヘッダーを作成
    const headerRow = document.createElement('tr');
    const thTrial = document.createElement('th');
    thTrial.textContent = '席替え回数　＼　席替え前の座席';
    headerRow.appendChild(thTrial);
    for (let i = 1; i <= numPeople; i++) {
        const th = document.createElement('th');
        th.textContent = `${i}番`;
        headerRow.appendChild(th);
    }
    tableHead.appendChild(headerRow);

    // 席替え結果を表示（直近10回分）
    recentSwaps.forEach(swap => {
        const row = document.createElement('tr');
        const tdTrial = document.createElement('td');
        tdTrial.textContent = `${swap.trial}回目`;
        row.appendChild(tdTrial);

        // 各人の席を表示
        for (let i = 0; i < numPeople; i++) {
            const td = document.createElement('td');
            const newSeat = swap.shuffled[i] + 1; // 1-based index
            td.textContent = `${newSeat}番`;
            // 元の席と同じ場合は強調
            if (swap.original[i] === swap.shuffled[i]) {
                td.classList.add('same-seat');
            }
            row.appendChild(td);
        }
        tableBody.appendChild(row);
    });
}
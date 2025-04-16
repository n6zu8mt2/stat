function runSimulation() {
    // 入力値を取得
    const numTickets = parseInt(document.getElementById('num-tickets').value);

    // 入力値のバリデーション
    if (isNaN(numTickets) || numTickets < 1) {
        alert('購入口数は1以上の値を指定してください。');
        return;
    }

    // ボタンを無効化して処理中であることを示す
    const button = document.querySelector('button');
    button.disabled = true;
    button.textContent = '処理中...';

    // 購入費用を計算（1口200円）
    const totalCost = numTickets * 200;

    // ランダムに購入する数字を生成（各口ごとに6つの数字）
    const tickets = [];
    let currentTicket = 0;

    function generateTickets() {
        const batchSize = 1000; // 1回に処理するチケット数
        const ticketsToProcess = Math.min(batchSize, numTickets - currentTicket);

        for (let i = 0; i < ticketsToProcess; i++) {
            const ticket = generateRandomNumbers(6);
            tickets.push(ticket);
            currentTicket++;
        }

        if (currentTicket < numTickets) {
            // 次のバッチを処理
            setTimeout(generateTickets, 0);
        } else {
            // チケット生成が完了したら抽選を実行
            processDraw();
        }
    }

    function processDraw() {
        // 抽選を1回実行
        let wins = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalWinnings = 0;

        // 本数字とボーナス数字を生成
        const { mainNumbers, bonusNumber } = drawLoto6Numbers();

        // 各口について当選判定
        let currentIndex = 0;

        function processTickets() {
            const batchSize = 1000; // 1回に処理するチケット数
            const ticketsToProcess = Math.min(batchSize, numTickets - currentIndex);

            for (let i = 0; i < ticketsToProcess; i++) {
                const ticket = tickets[currentIndex];
                const matchedMain = ticket.filter(num => mainNumbers.includes(num)).length;
                const matchedBonus = ticket.includes(bonusNumber);
                let winAmount = 0;

                if (matchedMain === 6) {
                    wins[1]++;
                    winAmount = 200000000; // 1等: 2億円
                } else if (matchedMain === 5 && matchedBonus) {
                    wins[2]++;
                    winAmount = 10000000; // 2等: 1000万円
                } else if (matchedMain === 5) {
                    wins[3]++;
                    winAmount = 300000; // 3等: 30万円
                } else if (matchedMain === 4) {
                    wins[4]++;
                    winAmount = 6800; // 4等: 6800円
                } else if (matchedMain === 3) {
                    wins[5]++;
                    winAmount = 1000; // 5等: 1000円
                }

                totalWinnings += winAmount;
                currentIndex++;
            }

            if (currentIndex < numTickets) {
                // 次のバッチを処理
                setTimeout(processTickets, 0);
            } else {
                // 処理が完了したら結果を表示
                const balance = totalWinnings - totalCost;

                document.getElementById('total-cost').textContent = totalCost.toLocaleString() + '円';
                document.getElementById('win-1st').textContent = wins[1] + '回';
                document.getElementById('win-2nd').textContent = wins[2] + '回';
                document.getElementById('win-3rd').textContent = wins[3] + '回';
                document.getElementById('win-4th').textContent = wins[4] + '回';
                document.getElementById('win-5th').textContent = wins[5] + '回';
                document.getElementById('total-winnings').textContent = totalWinnings.toLocaleString() + '円プラス';
                document.getElementById('total-spent').textContent = totalCost.toLocaleString() + '円使う';
                document.getElementById('balance').textContent = (balance >= 0 ? '+' : '') + balance.toLocaleString() + '円';

                // ボタンを再有効化
                button.disabled = false;
                button.textContent = 'シミュレーション実行';
            }
        }

        // 最初のバッチを開始
        setTimeout(processTickets, 0);
    }

    // チケット生成を開始
    setTimeout(generateTickets, 0);
}

// ランダムに異なる数字を生成する関数
function generateRandomNumbers(count) {
    const numbers = [];
    const allNumbers = Array.from({ length: 43 }, (_, i) => i + 1);
    while (numbers.length < count) {
        const randomIndex = Math.floor(Math.random() * allNumbers.length);
        numbers.push(allNumbers.splice(randomIndex, 1)[0]);
    }
    return numbers.sort((a, b) => a - b);
}

// ロト6の抽選を行う関数
function drawLoto6Numbers() {
    // 本数字をランダムに選ぶ（1～43から6個）
    const mainNumbers = generateRandomNumbers(6);

    // ボーナス数字を選ぶ（本数字と重複しない）
    const remainingNumbers = Array.from({ length: 43 }, (_, i) => i + 1).filter(num => !mainNumbers.includes(num));
    const bonusNumber = remainingNumbers[Math.floor(Math.random() * remainingNumbers.length)];

    return { mainNumbers, bonusNumber };
}
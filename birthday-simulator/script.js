function runSimulation() {
    // 入力値を取得
    const numPeople = parseInt(document.getElementById('num-people').value);

    // 入力値のバリデーション
    if (isNaN(numPeople) || numPeople < 1) {
        alert('人数は1以上の値を指定してください。');
        return;
    }

    // ボタンを無効化
    const button = document.querySelector('button');
    button.disabled = true;
    button.textContent = '処理中...';

    // 誕生日をランダムに割り当て（1月1日～12月31日）
    const birthdays = [];
    for (let i = 0; i < numPeople; i++) {
        const dayOfYear = Math.floor(Math.random() * 365) + 1; // 1～365
        const date = dayOfYearToDate(dayOfYear);
        birthdays.push({ id: i + 1, date: date, dayOfYear: dayOfYear });
    }

    // 誕生日でグループ化
    const birthdayGroups = {};
    birthdays.forEach(person => {
        const key = person.dayOfYear;
        if (!birthdayGroups[key]) {
            birthdayGroups[key] = [];
        }
        birthdayGroups[key].push(person);
    });

    // 同じ誕生日の組を抽出
    const sameBirthdayGroups = Object.values(birthdayGroups).filter(group => group.length > 1);

    // 表形式で誕生日を表示
    const table = document.getElementById('birthday-table');
    table.innerHTML = '';

    // 列数を決定（人数に応じて調整）
    const columns = Math.min(10, Math.ceil(Math.sqrt(numPeople))); // 最大10列
    const rows = Math.ceil(numPeople / columns);

    // 色インデックスを割り当て
    const colorMap = {};
    let colorIndex = 0;
    sameBirthdayGroups.forEach(group => {
        const key = group[0].dayOfYear;
        colorMap[key] = colorIndex % 10; // 10色を循環
        colorIndex++;
    });

    // 表を作成
    let personIndex = 0;
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < columns; j++) {
            const cell = document.createElement('td');
            if (personIndex < numPeople) {
                const person = birthdays[personIndex];
                cell.textContent = `${person.id}番: ${person.date}`;
                const groupSize = birthdayGroups[person.dayOfYear].length;
                if (groupSize > 1) {
                    cell.classList.add(`color-${colorMap[person.dayOfYear]}`);
                }
            }
            row.appendChild(cell);
            personIndex++;
        }
        table.appendChild(row);
    }

    // 結果を表示
    const resultText = document.getElementById('result-text');
    if (sameBirthdayGroups.length > 0) {
        const groupDetails = sameBirthdayGroups.map(group => {
            const date = group[0].date;
            const count = group.length;
            return `${date}: ${count}人`;
        }).join('、');
        resultText.textContent = `同じ誕生日の組が${sameBirthdayGroups.length}組ありました。${groupDetails}`;
    } else {
        resultText.textContent = '同じ誕生日の組はありませんでした。';
    }

    // ボタンを再有効化
    button.disabled = false;
    button.textContent = 'シミュレーション実行';
}

// 日数を日付（月/日）に変換する関数
function dayOfYearToDate(dayOfYear) {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // うるう年なし
    let month = 1;
    let day = dayOfYear;

    for (let i = 0; i < daysInMonth.length; i++) {
        if (day <= daysInMonth[i]) {
            break;
        }
        day -= daysInMonth[i];
        month++;
    }

    return `${month}月${day}日`;
}
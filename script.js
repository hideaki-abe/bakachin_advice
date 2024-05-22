document.addEventListener('DOMContentLoaded', () => {
    const startRecognitionButton = document.getElementById('startRecognition');
    const stopRecognitionButton = document.getElementById('stopRecognition');
    const saveMemoButton = document.getElementById('saveMemo');
    const loadMemoButton = document.getElementById('loadMemo');
    const deleteMemoButton = document.getElementById('deleteMemo');
    const summaryTextarea = document.getElementById('summary');
    const memoList = document.getElementById('memoList');

    // 音声認識を設定
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';  // 日本語認識
    recognition.interimResults = false;  // 中間結果を受け取らない

    // 音声認識開始
    startRecognitionButton.addEventListener('click', () => {
        recognition.start();
        console.log("音声認識開始");
    });

    // 音声認識停止
    stopRecognitionButton.addEventListener('click', () => {
        recognition.stop();
        console.log("音声認識停止");
    });

    recognition.addEventListener('result', async (event) => {
        // 音声認識の結果取得
        const transcript = event.results[0][0].transcript;
        console.log("認識結果: ", transcript);
        try {
            // ChatGPT APIを使用してバカチンガーアドバイスを取得
            const summary = await getSummaryFromAPI(transcript);
            // アドバイスをテキストエリアに表示
            summaryTextarea.value = `${new Date().toLocaleString()}\n${summary}`;
        } catch (error) {
            console.error("アドバイスの取得に失敗: ", error);
        }
    });

    recognition.addEventListener('error', (event) => {
        console.error("音声認識エラー: ", event.error);
    });

    recognition.addEventListener('end', () => {
        console.log("音声認識終了");
    });

    // ChatGPT APIを使用してアドバイスを取得
    async function getSummaryFromAPI(transcript) {
        const apiKey = 'ここにAPIキーを入力してください';
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',  // ChatGPT 3.5 turboを使用
                messages: [
                    { role: 'system', content: '次の相談の語尾に"、バカチンガー！"とつけて端的に優しく解答: ' },
                    { role: 'user', content: transcript }
                ],
                max_tokens: 300  // 最大トークン数を指定（1文字=1～3トークン）
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();  // 要約を返す
        } else {
            throw new Error("APIレスポンスにアドバイスが含まれていません。");
        }
    }

    // アドバイスを保存
    saveMemoButton.addEventListener('click', () => {
        const summaryText = summaryTextarea.value;
        if (summaryText) {
            const memos = JSON.parse(localStorage.getItem('memos')) || [];  // ローカルストレージからアドバイスを取得
            memos.push(summaryText);
            localStorage.setItem('memos', JSON.stringify(memos));  // ローカルストレージに保存
            loadMemoList();  // アドバイスリストを更新
            alert('保存完了');
        } else {
            alert('アドバイスがありません。');
        }
    });

    // アドバイスリストをロード
    function loadMemoList() {
        const memos = JSON.parse(localStorage.getItem('memos')) || [];
        memoList.innerHTML = '<option value="">保存したアドバイスを選択</option>';
        memos.forEach((memo, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = memo.split('\n')[0];  // アドバイスの日時部分を表示
            memoList.appendChild(option);
        });
    }

    loadMemoList();  // ページ読み込み時にアドバイスリストをロード

    // アドバイスを表示
    loadMemoButton.addEventListener('click', () => {
        const selectedMemoIndex = memoList.value;
        if (selectedMemoIndex !== '') {
            const memos = JSON.parse(localStorage.getItem('memos')) || [];
            summaryTextarea.value = memos[selectedMemoIndex];
        } else {
            alert('アドバイスを選択してください。');
        }
    });

    // アドバイスを削除
    deleteMemoButton.addEventListener('click', () => {
        const selectedMemoIndex = memoList.value;
        if (selectedMemoIndex !== '') {
            let memos = JSON.parse(localStorage.getItem('memos')) || [];
            memos.splice(selectedMemoIndex, 1);
            localStorage.setItem('memos', JSON.stringify(memos));
            loadMemoList();
            summaryTextarea.value = '';
            alert('アドバイスを削除しました。');
        } else {
            alert('アドバイスを選択してください。');
        }
    });
});
document.addEventListener('DOMContentLoaded', function () {
    // Mở hoặc tạo cơ sở dữ liệu IndexedDB
    var db;
    var request = indexedDB.open('votesDB', 1);

    request.onerror = function (event) {
        console.error('Error opening database:', event.target.errorCode);
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log('Database opened successfully');

        // Lấy và hiển thị dữ liệu từ IndexedDB
        displayVotes();
    };

    request.onupgradeneeded = function (event) {
        db = event.target.result;

        // Tạo bảng votes nếu chưa tồn tại
        var objectStore = db.createObjectStore('votes', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('actorName', 'actorName', { unique: false });
        objectStore.createIndex('score', 'score', { unique: false });

        console.log('Database upgrade complete');
    };

    // Bắt sự kiện khi nút vote được nhấn
    var voteButtons = document.querySelectorAll('.vote-button');
    voteButtons.forEach(function (button, index) {
        button.addEventListener('click', function () {
            // Lấy tên diễn viên từ phần tử cha
            var actorName = this.parentNode.querySelector('h3').textContent;

            // Tăng điểm và cập nhật dữ liệu
            increaseScore(actorName);
        });
    });

    function increaseScore(actorName) {
        // Mở giao dịch để thêm hoặc cập nhật điểm
        var transaction = db.transaction(['votes'], 'readwrite');
        var objectStore = transaction.objectStore('votes');
        var request = objectStore.index('actorName').get(actorName);

        request.onsuccess = function () {
            var vote = request.result;

            if (vote) {
                // Nếu đã tồn tại vote cho diễn viên, tăng điểm
                vote.score += 1;
                objectStore.put(vote);
            } else {
                // Nếu chưa có vote cho diễn viên, thêm mới
                var newVote = { actorName: actorName, score: 1 };
                objectStore.add(newVote);
            }

            // Sau khi thay đổi điểm, hiển thị lại bảng xếp hạng
            displayVotes();
        };

        transaction.onerror = function (event) {
            console.error('Transaction error:', event.target.error);
        };
    }

    function displayVotes() {
        // Lấy và hiển thị dữ liệu từ IndexedDB
        var transaction = db.transaction(['votes'], 'readonly');
        var objectStore = transaction.objectStore('votes');
        var request = objectStore.getAll();

        request.onsuccess = function () {
            // Hiển thị dữ liệu trên bảng xếp hạng
            var rankingTable = document.querySelector('tbody');
            rankingTable.innerHTML = '';

            var votes = request.result;
            votes.sort(function (a, b) {
                return b.score - a.score;
            });

            votes.forEach(function (vote, index) {
                var row = rankingTable.insertRow();
                var sttCell = row.insertCell(0);
                var actorCell = row.insertCell(1);
                var scoreCell = row.insertCell(2);

                sttCell.textContent = index + 1;
                actorCell.textContent = vote.actorName;
                scoreCell.textContent = vote.score;
            });
        };

        transaction.onerror = function (event) {
            console.error('Transaction error:', event.target.error);
        };
    }
});

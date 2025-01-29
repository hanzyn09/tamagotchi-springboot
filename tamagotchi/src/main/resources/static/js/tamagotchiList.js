var alertMessage = "";
var action = "";

// 타이틀 클릭 시 현재 페이지 새로 고침
function refreshPage() {
	location.reload(); // 페이지 새로 고침
}

// 각 열의 정렬 상태를 관리하는 객체
var sortDirections = {
	0: 'asc',
	1: 'asc',
	2: 'asc',
	3: 'asc',
	4: 'asc'
};

// 테이블 정렬
function sortTable(columnIndex) {
	var table = document.getElementById("tamagotchiTable");
	var rows = table.getElementsByTagName("tr");
	var switching = true;
	var dir = sortDirections[columnIndex]; // 해당 열의 현재 정렬 방향

	while (switching) {
		switching = false;
		var rowsArray = Array.from(rows).slice(1); // 헤더를 제외한 행들을 배열로 변환

		for (var i = 0; i < rowsArray.length - 1; i++) {
			var x = rowsArray[i].getElementsByTagName("td")[columnIndex];
			var y = rowsArray[i + 1].getElementsByTagName("td")[columnIndex];

			var xContent = x ? x.textContent.trim() : '';
			var yContent = y ? y.textContent.trim() : '';

			var shouldSwitch = false;
			if (isNaN(xContent) || isNaN(yContent)) {
				// 문자열 비교
				if ((dir === "asc" && xContent.toLowerCase() > yContent.toLowerCase()) ||
					(dir === "desc" && xContent.toLowerCase() < yContent.toLowerCase())) {
					shouldSwitch = true;
				}
			} else {
				// 숫자 비교
				if ((dir === "asc" && parseInt(xContent) > parseInt(yContent)) ||
					(dir === "desc" && parseInt(xContent) < parseInt(yContent))) {
					shouldSwitch = true;
				}
			}

			if (shouldSwitch) {
				rowsArray[i].parentNode.insertBefore(rowsArray[i + 1], rowsArray[i]);
				switching = true;
				break;
			}
		}

		if (!switching) {
			sortDirections[columnIndex] = (dir === "asc" ? "desc" : "asc");
		}
	}
}

// 이름 검색 기능
function searchTamagotchi() {
    var input = document.getElementById('searchInput');
    var filter = input.value.toLowerCase();
    var table = document.getElementById('tamagotchiTable');
    var rows = table.getElementsByTagName('tr');
    var noDataRow = document.getElementById('noDataRow'); // 안내 문구

    var found = false;

    for (var i = 1; i < rows.length; i++) {
        var td = rows[i].getElementsByTagName('td')[1]; // 이름 열
        if (td) {
            var txtValue = td.textContent || td.innerText;
            // 검색어에 맞는 이름을 찾으면 해당 행을 표시하고, 아니면 숨깁니다.
            if (txtValue.toLowerCase().includes(filter)) {
                rows[i].style.display = "";  // 검색어가 포함된 경우 표시
                found = true;
            } else {
                rows[i].style.display = "none";  // 검색어가 포함되지 않은 경우 숨김
            }
        }
    }

    // 검색 결과가 없으면 안내 문구 표시
    noDataRow.style.display = found ? "none" : "table-row"; // 검색 결과가 있으면 안내 문구 숨기고, 없으면 표시

    // 타마고치 수 업데이트
    updateActiveTamaCount();
}

// 공통 폼 제출 함수
function submitForm(action, state) {
	let frm = $("#frm")[0];
	frm.action = action;

	let stateInput = frm.querySelector('input[name="state"]');
	if (stateInput) {
		stateInput.value = state;
	} else {
		alertMessage = "폼에 'state' 필드가 없습니다.";
		action = "error";
		displayAlert(alertMessage, action);
	}

	frm.submit(); // 폼 제출
}

// 하루 건너뛰기 버튼 클릭 시
$(function() {
	$("#btnDay").on("click", function(event) {
		event.preventDefault();

		var tamagotchiRows = document.getElementById("tamagotchiTableBody").getElementsByTagName("tr");
		var hasData = Array.from(tamagotchiRows).some(row => row.style.display !== 'table-row' && row.id !== 'noDataRow');

		if (!hasData) {
			alertMessage = "현재 키우는 타마가 없습니다.<br>새로 입양해주세요.";
			action = "error";
			displayAlert(alertMessage, action);
		} else {
			alertMessage = '하루를 건너뜁니다.<br><button id="confirmAdopt" class="btn btn-success">확인</button><button id="cancelAdopt" class="btn btn-danger">취소</button>';
			action = "info";
			displayAlert(alertMessage, action);

			$("#confirmAdopt").on("click", function() {
				submitForm("updateDate.do", "day");
				toastr.clear();
			});

			$("#cancelAdopt").on("click", function() {
				toastr.clear();
			});
		}
	});
});

// 타마고치 수 업데이트 함수
function updateActiveTamaCount() {
	var activeTamaCount = Array.from(document.querySelectorAll('#tamagotchiTable tbody tr'))
		.filter(row => row.id !== 'noDataRow' && row.getAttribute('data-deleted') !== 'true')
		.length;

	document.getElementById('activeTamaCount').textContent = activeTamaCount;
}

// 데이터를 10초마다 갱신하는 함수
function fetchTamagotchi() {
	$.ajax({
		url: '/tamagotchi/fetchTamagotchi.do',
		method: 'GET',
		success: function(data) {
			alertMessage = "하루가 경과했습니다!<br>타마들의 상태를 확인해주세요.";
			action = "info";
			displayAlert(alertMessage, action);

			updateTable(data);
		},
		error: function() {
			console.log("데이터를 가져오는 데 실패했습니다.");
		}
	});
}

// 테이블을 최신 데이터로 업데이트하는 함수
function updateTable(data) {
	const tbody = document.getElementById('tamagotchiTableBody');
	const noDataRow = document.getElementById('noDataRow');  // '조회된 다마고치가 없습니다.' 안내 문구

	// 기존 데이터를 지움
	tbody.innerHTML = '';

	// 'noDataRow'가 null인지 확인
	if (noDataRow) {
		// 데이터가 없거나 빈 배열인 경우 안내 문구 표시
		if (!data || (Array.isArray(data) && data.length === 0)) {
			noDataRow.style.display = "block";  // 데이터가 없으면 안내 문구 표시
		} else {
			noDataRow.style.display = "table-row"; // 데이터가 있으면 안내 문구 숨기기
			// 새로 받은 데이터를 테이블에 추가
			data.forEach(tamagotchi => {
				const row = document.createElement('tr');
				row.innerHTML = `
                    <td>${tamagotchi.tamagotchiId}</td>
                    <td>${tamagotchi.name}</td>
                    <td>Lv. ${tamagotchi.levelNumber}</td>
                    <td style="color: ${tamagotchi.hunger >= 80 ? 'red' : 'black'}">${tamagotchi.hunger}%</td>
                    <td style="color: ${tamagotchi.fatigue >= 80 ? 'red' : 'black'}">${tamagotchi.fatigue}%</td>
                    <td style="color: ${tamagotchi.happiness <= 30 ? 'red' : 'black'}">${tamagotchi.happiness}%</td>
                    <td>
                        <span class="status ${((100 - tamagotchi.hunger) * 0.2 + (100 - tamagotchi.fatigue) * 0.3 + tamagotchi.happiness * 0.5) / 3 >= 16.6 ? 'active' : 'inactive'}">
                            <span class="${((100 - tamagotchi.hunger) * 0.2 + (100 - tamagotchi.fatigue) * 0.3 + tamagotchi.happiness * 0.5) / 3 >= 16.6 ? 'fas fa-smile-beam fa-2x' : 'fas fa-sad-tear fa-2x'}"></span>
                        </span>
                    </td>
                    <td>
                        <a href="/tamagotchi/openTamagotchiDetail.do?tamagotchiId=${tamagotchi.tamagotchiId}" class="btn btn-secondary">보살피기</a>
                    </td>
                `;
				tbody.appendChild(row);
			});
		}

		// 타마고치 수 업데이트
		updateActiveTamaCount();
	} else {
		console.error("noDataRow element not found!");
	}
}

$(document).ready(function() {
    // 페이지 로드 시 테이블의 데이터 상태를 확인
    var tamagotchiRows = document.getElementById("tamagotchiTableBody").getElementsByTagName("tr");
    var noDataRow = document.getElementById('noDataRow');
    
    // 데이터가 있으면 '조회된 다마고치가 없습니다.'를 숨기고, 없으면 보이게
    var hasData = Array.from(tamagotchiRows).some(row => row.id !== 'noDataRow' && row.style.display !== 'none');
    
    // 'noDataRow' 상태 변경
    noDataRow.style.display = hasData ? "none" : "table-row";
    
    // 타마고치 수 업데이트
    updateActiveTamaCount();
    
    // 데이터 30초마다 갱신
    setInterval(fetchTamagotchi, 30000); // 30초마다 데이터 갱신
});

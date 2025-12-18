const graphCanvas = document.getElementById('graphCanvas');
const gCtx = graphCanvas.getContext('2d');
const beakerCanvas = document.getElementById('beakerCanvas');
const bCtx = beakerCanvas.getContext('2d');

// 물질별 용해도 데이터 (0~100도 사이의 근사 곡선 함수)
// 물 100g 당 용해도(g)
const solubilityData = {
    NaNO3: (t) => 73 + 0.9 * t,
    KNO3: (t) => 13.3 + 0.3 * t + 0.015 * Math.pow(t, 2), 
    CuSO4: (t) => 14.3 + 0.4 * t,
    NaCl: (t) => 35.7 + 0.01 * t
};

// 입력 요소
const inputs = ['temp', 'water', 'solute', 'substance'];
const elements = {};
inputs.forEach(id => { elements[id] = document.getElementById(id); });

function update() {
    const temp = parseFloat(elements.temp.value);
    const water = parseFloat(elements.water.value);
    const solute = parseFloat(elements.solute.value);
    const subKey = elements.substance.value;

    document.getElementById('tempVal').innerText = temp;
    document.getElementById('waterVal').innerText = water;
    document.getElementById('soluteVal').innerText = solute;

    // 현재 온도에서의 100g당 용해도
    const solPer100 = solubilityData[subKey](temp);
    // 현재 물의 양에 대한 최대 용해도
    const maxSol = (solPer100 * water) / 100;
    const precipitated = Math.max(0, solute - maxSol); // 석출량

    drawGraph(temp, solute, water, subKey);
    drawBeaker(water, solute, precipitated, subKey);
    
    document.getElementById('statusText').innerText = 
        precipitated > 0 ? `석출량: ${precipitated.toFixed(1)}g (과포화)` : "모두 용해됨 (불포화/포화)";
}

function drawGraph(currT, currS, currW, subKey) {
    gCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    const w = graphCanvas.width = 500;
    const h = graphCanvas.height = 400;
    const padding = 50;

    // 축 그리기
    gCtx.beginPath();
    gCtx.moveTo(padding, h - padding);
    gCtx.lineTo(w - padding, h - padding);
    gCtx.lineTo(w - padding, padding);
    gCtx.stroke();

    // 곡선 그리기
    gCtx.strokeStyle = '#3498db';
    gCtx.lineWidth = 2;
    gCtx.beginPath();
    for (let t = 0; t <= 100; t++) {
        let x = padding + (t / 100) * (w - 2 * padding);
        let y = (h - padding) - (solubilityData[subKey](t) / 250) * (h - 2 * padding);
        if (t === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
    }
    gCtx.stroke();

    // 현재 위치 점 표시 (물 100g 기준으로 환산)
    const relativeSolute = (currS / currW) * 100;
    const pointX = padding + (currT / 100) * (w - 2 * padding);
    const pointY = (h - padding) - (relativeSolute / 250) * (h - 2 * padding);

    gCtx.fillStyle = 'red';
    gCtx.beginPath();
    gCtx.arc(pointX, pointY, 5, 0, Math.PI * 2);
    gCtx.fill();
    
    gCtx.fillStyle = 'black';
    gCtx.fillText("온도 (°C)", w/2, h - 10);
    gCtx.save();
    gCtx.rotate(-Math.PI/2);
    gCtx.fillText("용해도 (g/물100g)", -h/2 - 50, 20);
    gCtx.restore();
}

function drawBeaker(water, solute, precip, subKey) {
    bCtx.clearRect(0, 0, beakerCanvas.width, beakerCanvas.height);
    const w = beakerCanvas.width = 200;
    const h = beakerCanvas.height = 200;

    // 비커 그리기
    bCtx.strokeStyle = '#555';
    bCtx.lineWidth = 3;
    bCtx.strokeRect(50, 40, 100, 120);

    // 물 그리기
    const waterHeight = (water / 200) * 100;
    bCtx.fillStyle = 'rgba(173, 216, 230, 0.6)';
    bCtx.fillRect(52, 160 - waterHeight, 96, waterHeight);

    // 석출물(가루) 그리기
    if (precip > 0) {
        bCtx.fillStyle = subKey === 'CuSO4' ? '#3498db' : '#ddd'; // 황산구리는 파란색 가루
        const precipHeight = Math.min(waterHeight, (precip / 100) * 30);
        bCtx.fillRect(52, 160 - precipHeight, 96, precipHeight);
    }
}

// 이벤트 리스너 등록
[...inputs].forEach(id => {
    document.getElementById(id).addEventListener('input', update);
});

// 초기화 호출
update();
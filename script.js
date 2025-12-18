const graphCanvas = document.getElementById('graphCanvas');
const gCtx = graphCanvas.getContext('2d');
const beakerCanvas = document.getElementById('beakerCanvas');
const bCtx = beakerCanvas.getContext('2d');

const solubilityData = {
    NaNO3: (t) => 73 + 0.65 * t + 0.004 * Math.pow(t, 2),
    KNO3: (t) => 13.3 + 0.54 * t + 0.0175 * Math.pow(t, 2), 
    CuSO4: (t) => 14.3 + 0.25 * t + 0.0035 * Math.pow(t, 2),
    NaCl: (t) => 35.7 + 0.035 * t
};

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

    const solPer100 = solubilityData[subKey](temp);
    const maxSol = (solPer100 * water) / 100;
    const precipitated = Math.max(0, solute - maxSol);

    drawGraph(temp, solute, water, subKey);
    drawBeaker(water, solute, precipitated, subKey);
    
    const statusEl = document.getElementById('statusText');
    if (precipitated > 0) {
        statusEl.innerText = `결과: ${precipitated.toFixed(1)}g 석출됨`;
        statusEl.style.color = "#d63031";
    } else {
        statusEl.innerText = "결과: 모두 용해됨";
        statusEl.style.color = "#27ae60";
    }
}

function drawGraph(currT, currS, currW, subKey) {
    const w = graphCanvas.width = 500;
    const h = graphCanvas.height = 450;
    const padding = 65;
    const chartW = w - 2 * padding;
    const chartH = h - 2 * padding;

    gCtx.clearRect(0, 0, w, h);

    // 보조선
    gCtx.lineWidth = 0.5;
    for (let t = 0; t <= 100; t += 10) {
        let x = padding + (t / 100) * chartW;
        gCtx.strokeStyle = (t % 50 === 0) ? "#bbb" : "#eee";
        gCtx.beginPath(); gCtx.moveTo(x, padding); gCtx.lineTo(x, h - padding); gCtx.stroke();
        gCtx.fillStyle = "#888"; gCtx.textAlign = "center";
        gCtx.fillText(t, x, h - padding + 20);
    }
    for (let s = 0; s <= 250; s += 10) {
        let y = (h - padding) - (s / 250) * chartH;
        gCtx.strokeStyle = (s % 50 === 0) ? "#bbb" : "#eee";
        gCtx.beginPath(); gCtx.moveTo(padding, y); gCtx.lineTo(w - padding, y); gCtx.stroke();
        if (s % 50 === 0) { gCtx.textAlign = "right"; gCtx.fillText(s, padding - 10, y + 5); }
    }

    // 축 제목
    gCtx.fillStyle = "#333";
    gCtx.font = "bold 14px 'Malgun Gothic'";
    gCtx.textAlign = "center";
    gCtx.fillText("온도 (°C)", padding + chartW / 2, h - 15);
    gCtx.save();
    gCtx.translate(20, padding + chartH / 2);
    gCtx.rotate(-Math.PI / 2);
    gCtx.fillText("용해도 (g / 물 100g)", 0, 0);
    gCtx.restore();

    // 곡선
    gCtx.strokeStyle = '#3498db';
    gCtx.lineWidth = 3;
    gCtx.beginPath();
    for (let t = 0; t <= 100; t++) {
        let x = padding + (t / 100) * chartW;
        let y = (h - padding) - (solubilityData[subKey](t) / 250) * chartH;
        if (t === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
    }
    gCtx.stroke();

    // 현재 점
    const relativeSolute = (currS / currW) * 100;
    const pointX = padding + (currT / 100) * chartW;
    const pointY = (h - padding) - (Math.min(relativeSolute, 250) / 250) * chartH;
    gCtx.fillStyle = '#ff3e3e';
    gCtx.beginPath(); gCtx.arc(pointX, pointY, 7, 0, Math.PI * 2); gCtx.fill();
    gCtx.strokeStyle = "white"; gCtx.lineWidth = 2; gCtx.stroke();
}

function drawBeaker(water, solute, precip, subKey) {
    // 캔버스 너비를 300으로 확장
    const w = beakerCanvas.width = 300;
    const h = beakerCanvas.height = 200;
    bCtx.clearRect(0, 0, w, h);

    const beakerWidth = 180; // 비커 자체 너비 확장 (기존 약 80 -> 180)
    const beakerLeft = (w - beakerWidth) / 2;
    const beakerBottom = 180;

    // 1. 비커 외형 (선명하게)
    bCtx.strokeStyle = '#2d3436';
    bCtx.lineWidth = 5;
    bCtx.lineCap = 'round';
    bCtx.beginPath();
    bCtx.moveTo(beakerLeft, 40);
    bCtx.lineTo(beakerLeft, beakerBottom);
    bCtx.lineTo(beakerLeft + beakerWidth, beakerBottom);
    bCtx.lineTo(beakerLeft + beakerWidth, 40);
    bCtx.stroke();

    // 2. 용액 그리기 (색상 더 진하게)
    const waterLevel = (water / 250) * 120;
    // 일반 물은 하늘색(진하게), 황산구리는 파란색(진하게)
    bCtx.fillStyle = subKey === 'CuSO4' ? 'rgba(9, 132, 227, 0.6)' : 'rgba(129, 236, 236, 0.7)';
    bCtx.fillRect(beakerLeft + 3, beakerBottom - waterLevel, beakerWidth - 6, waterLevel);

    // 3. 석출물 가루 (색상 더 진하게)
    if (precip > 0) {
        // 황산구리는 진한 파랑, 나머지는 진한 회색/흰색 대비 강조
        bCtx.fillStyle = subKey === 'CuSO4' ? '#0652dd' : '#dfe6e9';
        const pHeight = Math.min(waterLevel, (precip / 100) * 50 + 8);
        
        bCtx.beginPath();
        bCtx.moveTo(beakerLeft + 3, beakerBottom);
        // 바닥에 깔린 가루 모양을 위해 베지에 곡선 사용
        bCtx.quadraticCurveTo(w/2, beakerBottom - pHeight * 1.5, beakerLeft + beakerWidth - 3, beakerBottom);
        bCtx.fill();
        
        // 가루 질감을 위해 작은 점들 추가 (선택 사항)
        bCtx.fillStyle = subKey === 'CuSO4' ? '#00008b' : '#b2bec3';
        for(let i=0; i<15; i++) {
            bCtx.fillRect(beakerLeft + Math.random()*beakerWidth, beakerBottom - Math.random()*5, 2, 2);
        }
    }
}

[...inputs].forEach(id => {
    document.getElementById(id).addEventListener('input', update);
});

update();
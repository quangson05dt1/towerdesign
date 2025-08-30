let map;
let markers = [];
let polylines = [];
let rectangles = [];
let initialLayout = {};

function initMap() {
        const center = { lat: -25.744104, lng:   32.671572 };
        map = new google.maps.Map(document.getElementById("map"), {
            center: center,
            zoom: 18,
            mapTypeId: 'satellite',
            disableDefaultUI: true,
            gestureHandling: "greedy"
        });
        veBanDo();
}

function toCartesian(distance, angle) {
        const angleRad = (angle * Math.PI) / 180;
        return { dx: distance * Math.sin(angleRad), dy: distance * Math.cos(angleRad) };
}

function toLatLng(lat, lng, dx, dy) {
        const earthRadius = 6371000;
        const newLat = lat + (dy / earthRadius) * (180 / Math.PI);
        const newLng = lng + (dx / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
        return { lat: newLat, lng: newLng };
}
    
function clearMap() {
        markers.forEach(m => m.setMap(null));
        polylines.forEach(p => p.setMap(null));
        rectangles.forEach(r => r.setMap(null));
        markers = [];
        polylines = [];
        rectangles = [];
}

    // Hàm tạo icon SVG hình vuông có thể xoay, có thêm đường viền để giữ hình dạng
function createRotatedSquareIcon(color, size, angle) {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <rect width="${size}" height="${size}" fill="${color}" stroke="#000000" stroke-width="1" transform="rotate(${angle}, ${size/2}, ${size/2})"/>
            </svg>
        `.trim();
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}
    
function veBanDo() {
	clearMap();
	const lat = parseFloat(document.getElementById('lat').value);
	const lng = parseFloat(document.getElementById('lng').value);
	const loaiCot = document.getElementById('loaiCot').value;
	const huongCuaTram = parseFloat(document.getElementById('huongCuaTram').value);
	const soMongCo = parseInt(document.getElementById('soMongCo').value);
	const doCaoCot = parseFloat(document.getElementById('doCaoCot').value);
	const kichThuocHangRaoRong = parseFloat(document.getElementById('kichThuocHangRaoRong').value);
	const kichThuocHangRaoDai = parseFloat(document.getElementById('kichThuocHangRaoDai').value);

	document.getElementById('infoPanel').innerHTML = `
		<p><strong>Loại cột:</strong> ${loaiCot === 'day_co' ? 'Dây co' : 'Tự đứng'}</p>
		<p><strong>Hướng cửa trạm:</strong> ${huongCuaTram}°</p>
		<p><strong>Kích thước hàng rào:</strong> ${kichThuocHangRaoRong} x ${kichThuocHangRaoDai} m</p>
		<p><strong>Số móng co:</strong> ${soMongCo}</p>
		<p><strong>Độ cao cột:</strong> ${doCaoCot} m</p>
		<p><strong>Longitude:</strong> ${lng}</p>
		<p><strong>Latiude:</strong> ${lat} </p>
	`;

	const tamCot = { lat: lat, lng: lng };
	map.setCenter(tamCot);

	const banKinhRaMong = doCaoCot / 3;
	const mongs = [];
	const originalAngles = [];

	if (loaiCot === 'day_co' && soMongCo === 3) {
		[180, 300, 60].forEach(a => {
			const { dx, dy } = toCartesian(banKinhRaMong, a);
			mongs.push(toLatLng(lat, lng, dx, dy));
			originalAngles.push(a);
		});
	} else if (loaiCot === 'day_co' && soMongCo === 4) {
		const tiLeCanh = 1.73;
		const half_w = banKinhRaMong / Math.sqrt(tiLeCanh * tiLeCanh + 1);
		const half_l = tiLeCanh * half_w;
		[
			{ x: half_l, y: half_w, a: 45 }, { x: -half_l, y: half_w, a: 135 },
			{ x: -half_l, y: -half_w, a: 225 }, { x: half_l, y: -half_w, a: 315 }
		].forEach(c => {
			mongs.push(toLatLng(lat, lng, c.x, c.y));
			originalAngles.push(c.a);
		});
	} else if (loaiCot === 'tu_dung') {
		const step = 360 / soMongCo;
		for (let i = 0; i < soMongCo; i++) {
			const angle = i * step;
			const { dx, dy } = toCartesian(banKinhRaMong, angle);
			mongs.push(toLatLng(lat, lng, dx, dy));
			originalAngles.push(angle);
		}
	}

	initialLayout = { center: tamCot, mongs, originalAngles, banKinhRaMong };
	drawMarkersAndLines();
}

function drawMarkersAndLines() {
	clearMap();
	
	// Tâm cột
	const huongCuaTram = parseFloat(document.getElementById('huongCuaTram').value);
	const tamCotMarker = new google.maps.Marker({
		position: initialLayout.center,
		map: map,
		icon: {
			url: createRotatedSquareIcon('red', 16, huongCuaTram),
			scaledSize: new google.maps.Size(16, 16),
			anchor: new google.maps.Point(8, 8)
		},
		title: 'Tâm cột',
		draggable: false
	});
	markers.push(tamCotMarker);

	// Móng
	initialLayout.mongs.forEach((mong, i) => {
		const m = new google.maps.Marker({
			position: mong,
			map: map,
			icon: {
				url: createRotatedSquareIcon('#FF0000', 12, 0),
				scaledSize: new google.maps.Size(12, 12),
				anchor: new google.maps.Point(6, 6)
			},
			title: `Móng ${i + 1}`,
			draggable: true
		});
		markers.push(m);
		const line = new google.maps.Polyline({
			path: [initialLayout.center, mong],
			geodesic: true,
			strokeColor: '#FF0000',
			strokeOpacity: 1.0,
			strokeWeight: 2,
			map: map
		});
		polylines.push(line);

		// Trong lúc kéo → thay đổi góc tạm
		google.maps.event.addListener(m, 'drag', (e) => onDrag(e, i + 1));

		// Sau khi thả → “snap” về bán kính h/3
		google.maps.event.addListener(m, 'dragend', (e) => {
			const center = markers[0].getPosition();
			const dragged = e.latLng;
			const dx = dragged.lng() - center.lng();
			const dy = dragged.lat() - center.lat();
			const newAngle = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
			const angleChange = newAngle - initialLayout.originalAngles[i];

			const newMongs = [];
			initialLayout.originalAngles.forEach((orig, j) => {
				const ang = (orig + angleChange + 360) % 360;
				const { dx, dy } = toCartesian(initialLayout.banKinhRaMong, ang);
				newMongs.push(toLatLng(center.lat(), center.lng(), dx, dy));
			});
			initialLayout.mongs = newMongs;

			// Cập nhật vị trí marker & line về đúng bán kính h/3
			initialLayout.mongs.forEach((mong, j) => {
				markers[j + 1].setPosition(mong);
				polylines[j].setPath([initialLayout.center, mong]);
			});
			updateFence();
		});
	});

	updateFence();
}

function onDrag(event, index) {
	const center = markers[0].getPosition();
	const dragged = event.latLng;
	const dx = dragged.lng() - center.lng();
	const dy = dragged.lat() - center.lat();
	const newAngle = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
	const angleChange = newAngle - initialLayout.originalAngles[index - 1];

	const newMongs = [];
	initialLayout.originalAngles.forEach((orig, i) => {
		const ang = (orig + angleChange + 360) % 360;
		const { dx, dy } = toCartesian(initialLayout.banKinhRaMong, ang);
		newMongs.push(toLatLng(center.lat(), center.lng(), dx, dy));
	});
	initialLayout.mongs = newMongs;

	initialLayout.mongs.forEach((mong, i) => {
		markers[i + 1].setPosition(mong);
		polylines[i].setPath([initialLayout.center, mong]);
	});
	updateFence();
}

function updateFence() {
	const c = initialLayout.center;
	const w = parseFloat(document.getElementById('kichThuocHangRaoRong').value);
	const l = parseFloat(document.getElementById('kichThuocHangRaoDai').value);
	const az = parseFloat(document.getElementById('huongCuaTram').value);
	const { dx: dx2, dy: dy2 } = toCartesian(w, az - 90);
	const { dx: dx4, dy: dy4 } = toCartesian(l, az);
	const corner1 = c;
	const corner2 = toLatLng(c.lat, c.lng, dx2, dy2);
	const corner4 = toLatLng(c.lat, c.lng, dx4, dy4);
	const corner3 = toLatLng(c.lat, c.lng, dx2 + dx4, dy2 + dy4);
	
	const { dx: dx41, dy: dy41 } = toCartesian(l - 1, az);
	const corner31 = toLatLng(c.lat, c.lng, dx2 + dx41, dy2 + dy41);
	
	const { dx: dx42, dy: dy42 } = toCartesian(l + 5, az);
	const corner42 = toLatLng(c.lat, c.lng, dx42, dy42);

	if (rectangles[0]) {
		rectangles[0].setPath([corner1, corner2, corner3, corner4]);
	} else {
		const poly = new google.maps.Polygon({
			paths: [corner1, corner2, corner3, corner4],
			strokeColor: '#0000FF',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#0000FF',
			fillOpacity: 0.25,
			map: map
		});
		rectangles.push(poly);
	}

	if (window.arrowMarker) {
		window.arrowMarker.setMap(null);
	}
	window.arrowMarker = new google.maps.Marker({
		position: corner3,
		map: map,
		icon: {
			url: createRotatedSquareIcon('#FF9900', 10, az),
			scaledSize: new google.maps.Size(10, 10),
			anchor: new google.maps.Point(5, 5)
		},
		title: 'Cửa'
	});
	markers.push(window.arrowMarker);
	
	const dirline = new google.maps.Polyline({
		path: [initialLayout.center, corner42],
		geodesic: true,
		strokeColor: 'white',
		strokeOpacity: 1.0,
		strokeWeight: 3,
		map: map
	});
	polylines.push(dirline);
	
	if (window.arrowMarkerDir) {
		window.arrowMarkerDir.setMap(null);
	}
	window.arrowMarkerDir = new google.maps.Marker({
		position: corner42,
		map: map,
		icon: {
			path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
			fillColor: '#FF9900',
			fillOpacity: 1,
			strokeWeight: 0,
			scale: 6,
			rotation: az
		},
		title: 'Hướng'
	});
	markers.push(window.arrowMarkerDir);
}

function loadGoogleMaps(){
    if(typeof CONFIG==="undefined"){ console.error("CONFIG chưa load!"); return; }
    const script=document.createElement("script");
    script.src=`https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_KEY}&callback=initMap&libraries=geometry`;
    script.async=true;
    script.defer=true;
    document.head.appendChild(script);
}
loadGoogleMaps();

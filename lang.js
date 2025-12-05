// ===========================
//  DICTIONARY FOR 3 LANGUAGES
// ===========================

const translations = {
    vi: {
        title: "Thiết kế vị trí cột và anten",
        header: "Thiết kế vị trí cột và anten",

        tab1: "Thiết kế móng cột",
        tab2: "Thiết kế anten",

        lat: "Tọa độ tâm cột (Vĩ độ):",
        lng: "Tọa độ tâm cột (Kinh độ):",

        towerType: "Loại cột:",
        guyed: "Dây co",
        self: "Tự đứng",

        gateAzimuth: "Hướng cửa trạm (góc Azimuth):",
        fence: "Kích thước hàng rào (rộng x dài) (m):",
        anchors: "Số móng co:",

        height: "Độ cao cột (m):",

        drawMap1: "Vẽ bản đồ",
        drawMap2: "Vẽ bản đồ",

        antenCount: "Số lượng anten:",
        addAnten: "Thêm anten"
    },

    en: {
        title: "Tower and Antenna Design",
        header: "Tower and Antenna Design",

        tab1: "Tower Foundation Design",
        tab2: "Antenna Design",

        lat: "Tower center latitude:",
        lng: "Tower center longitude:",

        towerType: "Tower type:",
        guyed: "Guyed tower",
        self: "Self-supporting tower",

        gateAzimuth: "Site gate azimuth (degrees):",
        fence: "Fence size (width x length) (m):",
        anchors: "Number of anchor blocks:",

        height: "Tower height (m):",

        drawMap1: "Draw map",
        drawMap2: "Draw map",

        antenCount: "Number of antennas:",
        addAnten: "Add antenna"
    },

    pt: {
        title: "Design da torre e antena",
        header: "Design da torre e antena",

        tab1: "Design das fundações da torre",
        tab2: "Design da antena",

        lat: "Latitude do centro da torre:",
        lng: "Longitude do centro da torre:",

        towerType: "Tipo de torre:",
        guyed: "Torre estaiada",
        self: "Torre autoportante",

        gateAzimuth: "Azimute do portão do site (graus):",
        fence: "Tamanho da cerca (largura x comprimento) (m):",
        anchors: "Número de fundações:",

        height: "Altura da torre (m):",

        drawMap1: "Desenhar mapa",
        drawMap2: "Desenhar mapa",

        antenCount: "Número de antenas:",
        addAnten: "Adicionar antena"
    }
};


// ===========================
// APPLY LANGUAGE
// ===========================

function changeLanguage() {
    const lang = document.getElementById("languageSelect").value;

    // Tìm các phần tử có thuộc tính data-lang
    document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.getAttribute("data-lang");

        // Nếu trong text
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Cập nhật <title>
    document.title = translations[lang].title;
}

// Apply language at page load
window.onload = function () {
    changeLanguage();
};

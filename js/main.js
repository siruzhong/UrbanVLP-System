// 设置Mapbox的访问令牌
mapboxgl.accessToken = 'pk.eyJ1Ijoic2lydXpob25nIiwiYSI6ImNsamJpNXdvcTFoc24zZG14NWU5azdqcjMifQ.W_2t66prRsaq8lZMSdfKzg';

// 创建地图
const map = new mapboxgl.Map({
    container: 'map', // 地图容器的ID
    style: 'mapbox://styles/siruzhong/clninpw8y026c01qn8q8rhtgo', // 地图样式的URL
    center: [116.405285, 39.904989], // 初始位置 [经度, 纬度]
    zoom: 14, // 初始缩放级别
    projection: 'globe' // 初始投影方式
});

// 当地图加载完成时执行
map.on('load', function () {
    addStationsLayer(); // 添加站点数据层
    addStationsLayer2()
});

// 创建弹出窗口
var popup = new mapboxgl.Popup({
    closeOnClick: false,
    closeButton: false,
});

// 当鼠标悬停在站点上时显示数据
map.on('mouseenter', '1085-stations-1cyyg4', function (e) {
    const clickedData = e.features[0].properties;

    popup.setLngLat(e.lngLat)
        .setHTML(generatePopupContent(clickedData, e.lngLat))
        .addTo(map);

    map.getCanvas().style.cursor = 'pointer';
});

// 当鼠标离开站点时移除数据
map.on('mouseleave', '1085-stations-1cyyg4', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
});

// 添加点击事件监听器
map.on('click', function (e) {
    // 获取点击的经纬度
    var lngLat = e.lngLat;

    // 检查点击的经纬度是否在某个站点的1km正方形方框内
    const stationWithinBounds = getStationWithinBounds(lngLat);

    if (stationWithinBounds) {
        // 使用站点的经纬度查询数据
        fetchDataForLocation(stationWithinBounds.geometry.coordinates, stationWithinBounds, function (data) {
            // 创建一个信息窗口
            new mapboxgl.Popup({offset: [0, -125], keepInView: false})
                .setLngLat(stationWithinBounds.geometry.coordinates)
                .setHTML(generatePopupContent(data, lngLat))
                .addTo(map)
                .on('open', () => {
                    // Initialize Swiper after the popup is opened
                    initSwiper();
                });

        });
        generateClickBoundary(stationWithinBounds)
    }
});

// Swiper initialization function
function initSwiper() {
    // Make sure this code runs after the popup's HTML is part of the DOM
    setTimeout(() => {
        new Swiper('.swiper-container', {
            loop: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            // Ensure Swiper loads correctly in hidden elements if necessary
            observer: true,
            observeParents: true,
        });
    }, 100); // You might need to adjust the timeout
}




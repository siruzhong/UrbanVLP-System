// 自定义不同地理位置的经纬度坐标
const locations = {
    Beijing: [116.405285, 39.904989], // 北京的坐标
    Shanghai: [121.473701, 31.230416], // 上海的坐标
    Guangzhou: [113.264385, 23.129110], // 广州的坐标
    Shenzhen: [114.057868, 22.543099] // 深圳的坐标
};

// 获取位置选择框中的链接元素
const locationLinks = document.querySelectorAll('.submenu__item a[data-location]');

// 为每个链接添加点击事件监听器
for (const link of locationLinks) {
    link.addEventListener('click', function (e) {
        e.preventDefault(); // 阻止默认的链接点击行为
        const location = this.getAttribute('data-location');

        // 检查所选位置是否在locations中定义
        if (locations.hasOwnProperty(location)) {
            const coordinates = locations[location];
            map.setCenter(coordinates); // 设置地图中心点为所选位置的坐标
        } else {
            console.error('Undefined location:', location);
        }
    });
}

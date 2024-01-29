// 定义坐标地理编码器
const coordinatesGeocoder = function (query) {
    const zoomLevel = 13;

    const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
    );
    if (!matches) {
        return null;
    }

    function coordinateFeature(lng, lat, zoom) {
        return {
            center: [lng, lat],
            geometry: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            place_name: 'Lat: ' + lat + ' Lng: ' + lng,
            place_type: ['coordinate'],
            properties: {},
            type: 'Feature',
            zoom: zoom // 这里添加了zoom属性
        };
    }

    const coord1 = Number(matches[1]);
    const coord2 = Number(matches[2]);
    const geocodes = [];

    if (coord1 < -90 || coord1 > 90) {
        geocodes.push(coordinateFeature(coord1, coord2, zoomLevel));
    }

    if (coord2 < -90 || coord2 > 90) {
        geocodes.push(coordinateFeature(coord2, coord1, zoomLevel));
    }

    if (geocodes.length === 0) {
        geocodes.push(coordinateFeature(coord1, coord2, zoomLevel));
        geocodes.push(coordinateFeature(coord2, coord1, zoomLevel));
    }

    return geocodes;
};


// 将位置搜索框添加到地图
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: coordinatesGeocoder,
        zoom: 14,
        placeholder: 'Search here ...',
        mapboxgl: mapboxgl,
        reverseGeocode: true
    })
);

// 将缩放和旋转控件添加到地图
map.addControl(new mapboxgl.NavigationControl());

// 将比例尺控件添加到地图
map.addControl(new mapboxgl.ScaleControl());
// 定义 geojsonData 作为全局变量
let geojsonData;

// 使用Fetch API获取CSV文件并将其转换为GeoJSON
function csvToGeoJSON(fileUrl, callback) {
    const geojson = {
        type: 'FeatureCollection',
        features: []
    };

    // 使用Fetch API获取CSV文件
    fetch(fileUrl)
        .then(response => response.text())
        .then(csvData => {
            // 使用PapaParse解析CSV数据
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    results.data.forEach(row => {
                        const coordinates = row['WGS84 coordinate']
                            .match(/\(([^,]+),\s([^)]+)\)/)
                            .slice(1)
                            .map(parseFloat);

                        if (coordinates.length === 2) {
                            // 将字符串转换为数组
                            const streetviewImgNames = row['streetview_img_names'] ? row['streetview_img_names'].split(', ') : [];

                            const feature = {
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: coordinates.reverse() // 注意颠倒坐标顺序
                                },
                                properties: {
                                    carbon_emissions: parseFloat(row['carbon_emissions (ton)']),
                                    population: parseInt(row['population (unit)']),
                                    gdp: parseFloat(row['gdp (million yuan)']),
                                    caption: row['caption'],
                                    streetview_img_names: streetviewImgNames
                                }
                            };
                            geojson.features.push(feature);
                        }
                    });
                    geojsonData = geojson
                    callback(null, geojson);
                },
                error: function (error) {
                    callback(error, null);
                }
            });
        })
        .catch(error => {
            callback(error, null);
        });
}

// 添加站点数据图层
function addStationsLayer() {
    // 将CSV数据转换为GeoJSON
    csvToGeoJSON('./data/integrated_all.csv', (error, geojsonData) => {
        if (error) {
            console.error('Error:', error);
        } else {
            // 添加数据源
            map.addSource('stations', {
                type: 'geojson',
                data: geojsonData
            });

            // 添加数据图层，使用基于PM2.5值的动态圆圈颜色
            map.addLayer({
                id: '1085-stations-1cyyg4',
                type: 'circle',
                source: 'stations',
                paint: {
                    'circle-radius': 5,
                    'circle-color': 'rgb(248,19,19)',
                    'circle-stroke-color': 'white',
                    'circle-stroke-width': 1
                },
            });
        }
    });
}

// 获取点击点处在哪一个站点为中心的1km正方形方框内
function getStationWithinBounds(lngLat) {
    const halfSize = 0.005; // 大约等于0.5km的经纬度差

    // 遍历站点，检查是否在某个站点的1km正方形方框内
    for (const station of geojsonData.features) {
        const stationLng = station.geometry.coordinates[0];
        const stationLat = station.geometry.coordinates[1];
        const bounds = [
            [stationLng - halfSize, stationLat - halfSize],
            [stationLng + halfSize, stationLat + halfSize]
        ];

        if (
            lngLat.lng >= bounds[0][0] &&
            lngLat.lng <= bounds[1][0] &&
            lngLat.lat >= bounds[0][1] &&
            lngLat.lat <= bounds[1][1]
        ) {
            return station;
        }
    }
    return null; // 没有站点在点击点的范围内
}

// 模拟真实数据查询
function fetchDataForLocation(lngLat, station, callback) {
    const data = {
        carbon_emissions: station.properties.carbon_emissions,
        population: station.properties.population,
        gdp: station.properties.gdp,
        caption: station.properties.caption,
        streetview_img_names: station.properties.streetview_img_names
    };
    callback(data);
}

let boundarySourceId = null; // 用于存储边界数据源的ID
let boundaryLayerId = null;   // 用于存储边界图层的ID
function generateClickBoundary(station) {
    const stationLng = station.geometry.coordinates[0];
    const stationLat = station.geometry.coordinates[1];

    const EARTH_RADIUS_KM = 8071;
    // 计算0.5km的经纬度差
    const latDiff = 0.5 / EARTH_RADIUS_KM * (180 / Math.PI);
    const lngDiff = 0.5 / EARTH_RADIUS_KM * (180 / Math.PI) / Math.cos(stationLat * (Math.PI / 180));

    const bounds = [
        [stationLng - lngDiff, stationLat - latDiff],
        [stationLng + lngDiff, stationLat + latDiff]
    ];

    // 如果之前有添加过边界，先删除它
    if (boundarySourceId && boundaryLayerId) {
        map.removeLayer(boundaryLayerId);
        map.removeSource(boundarySourceId);
    }

    // 创建一个 GeoJSON 数据对象表示边界
    const boundaryGeoJSON = {
        'type': 'Feature',
        'geometry': {
            'type': 'Polygon',
            'coordinates': [
                [
                    [bounds[0][0], bounds[0][1]],
                    [bounds[0][0], bounds[1][1]],
                    [bounds[1][0], bounds[1][1]],
                    [bounds[1][0], bounds[0][1]],
                    [bounds[0][0], bounds[0][1]]
                ]
            ]
        }
    };

    // 添加一个新的数据源和图层来显示边界
    boundarySourceId = 'boundary-source-' + new Date().getTime(); // 为数据源生成唯一ID
    boundaryLayerId = 'boundary-layer-' + new Date().getTime();     // 为图层生成唯一ID
    // 添加一个新的数据源和图层来显示边界
    map.addSource(boundarySourceId, {
        'type': 'geojson',
        'data': boundaryGeoJSON
    });

    // 添加图层来显示边界
    map.addLayer({
        'id': boundaryLayerId,
        'type': 'line',
        'source': boundarySourceId,
        'layout': {},
        'paint': {
            'line-color': '#ff0000',
            'line-width': 8,   // 增加线宽
            // 'line-opacity': 1,   // 调整透明度
            'line-blur': 2,   // 添加模糊效果以模拟阴影
            // 'line-dasharray': [2, 2]   // 使用虚线
        }
    });
}

// 生成弹出框内容
function generatePopupContent(data, lnglat) {
    const carbonEmissions = data.carbon_emissions.toFixed(2); // 保留两位小数
    const population = data.population.toFixed(0); // 保留零位小数
    const gdp = data.gdp.toFixed(2); // 保留两位小数
    const caption = data.caption
    const streetViewImages = data.streetview_img_names

    // Build the HTML for street view images
    let imagesHtml = '<div class="street-view-images"><div class="swiper-container"><div class="swiper-wrapper">';
    if (streetViewImages.length > 0) {
        streetViewImages.forEach(url => {
            imagesHtml += `<div class="swiper-slide"><img src="http://111.230.109.230:9666/${url}" alt="Street View"></div>`;
        });
    } else {
        imagesHtml = '<p>No street view images available.</p>';
    }
    imagesHtml += '</div><div class="swiper-pagination"></div></div>';

    const content = `
    <div class="popup-content">
        <div class="popup-header">
            Region #1254, Beijing (<u>with ${streetViewImages.length} street-view images</u>).
        </div>
        <div class="popup-street-view">
            ${imagesHtml}
        </div>
        <div class="data">
            <div class="data-item">
                <img src="assets/carbon.png" alt="Carbon Icon" class="icon">
                <strong style="color: green">Carbon: </strong><span style="margin-right: 4px">${carbonEmissions}</span> tons
            </div>
            <div class="data-item">
                <img src="assets/population.png" alt="Population Icon" class="icon">
                <strong style="color: purple">Population: </strong><span style="margin-right: 4px">${population}</span> units
            </div>
            <div class="data-item">
                <img src="assets/gdp.png" alt="GDP Icon" class="icon">
                <strong style="color: blue">GDP: </strong><span style="margin-right: 4px">${gdp}</span> million
            </div>                
        </div>
        <div class="popup-caption">
            <strong style="color: red">Text Description: </strong> ${caption}
        </div>
        <p class="popup-description">
            <i class="fas fa-info-circle"></i>
            This is a 1km x 1km region centered around 
            <strong>coordinate (${lnglat.lng.toFixed(3)}&deg;E, ${lnglat.lat.toFixed(3)}&deg;N)</strong>
            <u style="margin-left: 30px">Popular POIs</u>: Beijing Hospital, Dongdan Park, Dongdan Sports Center etc.
        </p>
    </div>
`;

    return content;
}
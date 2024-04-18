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
                            const streetViewImageCaptions = row['streetview_img_captions'] ? row['streetview_img_captions'].split(', \n') : [];

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
                                    nightlight: parseFloat(row['nightlight']),
                                    poi: row['poi'],
                                    houseprice: parseFloat(row['houseprice']),
                                    caption: row['caption'],
                                    streetview_img_names: streetviewImgNames,
                                    streetview_img_captions: streetViewImageCaptions
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
    csvToGeoJSON('./data/integrated_all_updated.csv', (error, geojsonData) => {
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
                id: '1085-stations-1cyyg42',
                type: 'circle',
                source: 'stations',
                paint: {
                    'circle-radius': 5,
                    'circle-color': 'rgb(30,144,255)',
                    'circle-stroke-color': 'white',
                    'circle-stroke-width': 1
                },
            });
        }
    });
}


function csvToGeoJSON2(fileUrl, callback) {
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
                        const coordinates = row['coordinate'].split(',');
                        const latitude = parseFloat(coordinates[1]);
                        const longitude = parseFloat(coordinates[0]);

                        if (!isNaN(latitude) && !isNaN(longitude)) {
                            const feature = {
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: [longitude, latitude]
                                },
                                properties: {
                                    streetview_img_name: row['streetview_img_name'],
                                    streetview_img_caption: row['caption']
                                }
                            };
                            geojson.features.push(feature);
                        }
                    });
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
function addStationsLayer2() {
    // 将CSV数据转换为GeoJSON
    csvToGeoJSON2('./data/integrated_streetview_captions_with_coordinates.csv', (error, geojsonData) => {
        if (error) {
            console.error('Error:', error);
        } else {
            map.addSource('stations2', {
                type: 'geojson',
                data: geojsonData
            });

            map.addLayer({
                id: '1085-stations-2nd-layer',
                type: 'circle',
                source: 'stations2',
                paint: {
                    'circle-radius': 5,
                    'circle-color': 'rgb(255,204,0)',
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
        houseprice: station.properties.houseprice,
        poi: station.properties.poi,
        nightlight: station.properties.nightlight,
        caption: station.properties.caption,
        streetview_img_names: station.properties.streetview_img_names,
        streetview_img_captions: station.properties.streetview_img_captions
    };
    callback(data);
}

let boundarySourceId = null; // 用于存储边界数据源的ID
let boundaryLayerId = null;   // 用于存储边界图层的ID
let maskLayerId = null;

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
    if (boundarySourceId && boundaryLayerId && maskLayerId) {
        map.removeLayer(boundaryLayerId);
        map.removeSource(boundarySourceId);
        map.removeLayer(maskLayerId);
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

    // 边界以外区域的GeoJSON对象，作为遮罩
    const maskGeoJSON = {
        'type': 'Feature',
        'geometry': {
            'type': 'Polygon',
            'coordinates': [[
                [-180, -90],
                [-180, 90],
                [180, 90],
                [180, -90],
                [-180, -90]
            ], boundaryGeoJSON.geometry.coordinates[0]] // The hole is the boundary
        }
    };

    // 为数据源和图层生成唯一ID
    const timestamp = new Date().getTime();
    boundarySourceId = 'boundary-source-' + timestamp;
    boundaryLayerId = 'boundary-layer-' + timestamp;
    maskLayerId = 'mask-layer-' + timestamp;

    // 添加一个新的数据源和图层来显示边界
    map.addSource(boundarySourceId, {
        'type': 'geojson',
        'data': boundaryGeoJSON
    });

    map.addLayer({
        'id': boundaryLayerId,
        'type': 'line',
        'source': boundarySourceId,
        'layout': {},
        'paint': {
            'line-color': '#4290dc', // Switch to deep blue color
            'line-width': 5, // Slightly thinner line
            'line-opacity': 0.85, // Increase opacity for better visibility
            'line-blur': 0, // Remove blur for a sharper line
            // Removed line-dasharray for a solid line
        }
    });

    // 添加一个新的数据源和图层来显示边界外的暗色遮罩
    map.addSource('mask-source-' + timestamp, {
        'type': 'geojson',
        'data': maskGeoJSON
    });

    map.addLayer({
        'id': maskLayerId,
        'type': 'fill',
        'source': 'mask-source-' + timestamp,
        'layout': {},
        'paint': {
            'fill-color': '#000000',
            'fill-opacity': 0.5
        }
    }, boundaryLayerId); // 确保遮罩层在边界层下方

}


function getNearbyPlaces(lnglat) {
    var mapboxAccessToken = 'pk.eyJ1Ijoic2lydXpob25nIiwiYSI6ImNsamJpNXdvcTFoc24zZG14NWU5azdqcjMifQ.W_2t66prRsaq8lZMSdfKzg'; // 替换为你的Mapbox Access Token
    var types = 'poi'; // 指定你想搜索的类型为兴趣点（POI）
    var limit = 3; // 限制返回结果数量
    var url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lnglat.lng},${lnglat.lat}.json?` +
        `access_token=${mapboxAccessToken}&limit=${limit}&types=${types}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features && Array.isArray(data.features)) {
                var places = data.features.map(feature => feature.text).slice(0, 3);
                updatePopupContent(places);
            } else {
                console.error('Received data is not an array:', data);
            }
        })
        .catch(error => console.error('Error:', error));
}

function updatePopupContent(places) {
    if (Array.isArray(places)) {
        document.querySelector('#placesList').innerHTML = '<strong style="color: #007bff; ">Popular POIs</strong>: ' + places.join(', ');
    } else {
        console.error('places is not an array:', places);
    }
}

// 生成弹出框内容
function generatePopupContent(data, lnglat) {
    const carbonEmissions = data.carbon_emissions.toFixed(1); // 保留两位小数
    const population = data.population.toFixed(0); // 保留零位小数
    const gdp = data.gdp.toFixed(1); // 保留两位小数
    const housePrice = data.houseprice.toFixed(1);
    const nightLight = data.nightlight.toFixed(1);
    const poi = data.poi; // 假设data.poi是一个JSON字符串
    const caption = data.caption
    const streetViewImageNames = data.streetview_img_names
    const streetViewImageCaptions = data.streetview_img_captions
    getNearbyPlaces(lnglat)

    // Build the HTML for street view images
    let imagesHtml = '<div class="street-view-images"><div class="swiper-container"><div class="swiper-wrapper">';
    if (streetViewImageNames.length > 0) {
        streetViewImageNames.forEach((url, index) => {
            const imageDescription = streetViewImageCaptions[index] || 'No description available.';
            const escapedImageDescription = imageDescription.replace(/"/g, '&quot;');
            // Truncate the description if it's too long
            const maxLength = 250; // Max characters to display
            const truncatedDescription = imageDescription.length > maxLength
                ? imageDescription.substring(0, maxLength) + '...'
                : imageDescription;
            imagesHtml += `
            <div class="swiper-slide">
                <img src="http://111.230.109.230:9666/${url}" alt="Street View" title="${escapedImageDescription}">
                <div class="image-description" title="${imageDescription}">${truncatedDescription}</div>
            </div>
        `;
        });
    } else {
        imagesHtml = '<p>No street view images available.</p>';
    }
    imagesHtml += '</div><div class="swiper-pagination"></div></div>';

    const content = `
    <div class="popup-content">
        <div></div>
        <div class="popup-header">
            Region #1254, Beijing (<u>with ${streetViewImageNames.length} street-view images</u>).
        </div>
        <div class="popup-street-view">
            ${imagesHtml}
        </div>
<div class="data" style="display: flex; justify-content: space-between;">
    <div class="data-item" style="flex: 1; overflow: hidden;">
        <div style="display: flex; align-items: center;">
            <img src="assets/carbon.png" alt="Carbon Emission" class="icon" style="margin-right: 4px;">
            <strong style="color: green; font-size: 16px">CO2e: </strong>
            <button id="carbonButton" onclick="toggleDataVisibility('carbon')" style="background-color: #efefef; color: black; height: 25px; padding: 2px 5px 2px 5px; border: 1px solid gray">Prediction</button>
            <span id="carbonValue" style="font-size: 16px; display: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" 
                  title="${carbonEmissions} tons">&nbsp;${carbonEmissions} tons</span>
        </div>
    </div>
    <div class="data-item" style="flex: 1; overflow: hidden;">
        <div style="display: flex; align-items: center;">
            <img src="assets/population.png" alt="Population" class="icon" style="margin-right: 4px;">
            <strong style="color: purple; font-size: 16px">Pop: </strong>
            <button id="populationButton" onclick="toggleDataVisibility('population')" style="background-color: #efefef; color: black; height: 25px; padding: 2px 5px 2px 5px; border: 1px solid gray">Prediction</button>
            <span id="populationValue" style="font-size: 16px; display: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" 
                  title="${population} units">&nbsp;${population} units</span>
        </div>
    </div>
    <div class="data-item" style="flex: 1; overflow: hidden;">
        <div style="display: flex; align-items: center;">
            <img src="assets/gdp.png" alt="GDP" class="icon" style="margin-right: 4px;">
            <strong style="color: #0a59d0; font-size: 16px">GDP: </strong>
            <button id="gdpButton" onclick="toggleDataVisibility('gdp')" style="background-color: #efefef; color: black; height: 25px; padding: 2px 5px 2px 5px; border: 1px solid gray">Prediction</button>
            <span id="gdpValue" style="font-size: 16px; display: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" 
                  title="${gdp} million">&nbsp;${gdp} million</span>
        </div>
    </div>
</div>
<div class="data" style="display: flex; justify-content: space-between;">
    <div class="data-item" style="flex: 1; overflow: hidden;">
        <div style="display: flex; align-items: center;">
            <img src="assets/nlight.png" alt="Night Light" class="icon" style="margin-right: 4px;">
            <strong style="color: #dc9004; font-size: 16px">NLight: </strong>
            <button id="nlightButton" onclick="toggleDataVisibility('nlight')" style="background-color: #efefef; color: black; height: 25px; padding: 2px 5px 2px 5px; border: 1px solid gray">Prediction</button>
            <span id="nlightValue" style="font-size: 16px; display: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;" 
                  title="${nightLight} nw/cm²/sr">&nbsp;${nightLight} nw/cm²/sr</span>
        </div>
    </div>
    <div class="data-item" style="flex: 1; overflow: hidden;">
        <div style="display: flex; align-items: center;">
            <img src="assets/hprice.png" alt="House Price" class="icon" style="margin-right: 4px;">
            <strong style="color: #ea4141; font-size: 16px">HPrice: </strong>
            <button id="hpriceButton" onclick="toggleDataVisibility('hprice')" style="background-color: #efefef; color: black; height: 25px; padding: 2px 5px 2px 5px; border: 1px solid gray">Prediction</button>
            <span id="hpriceValue" style="font-size: 16px; display: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;" 
                  title="${housePrice} cny/m^2">&nbsp;${housePrice} cny/m²</span>
        </div>
    </div>
    <div class="data-item" style="flex: 1; overflow: hidden;">
        <div style="display: flex; align-items: center;">
            <img src="assets/poi.png" alt="POI" class="icon" style="margin-right: 4px;">
            <strong style="color: #894ec2; font-size: 16px">POI: </strong>
            <button id="poiButton" onclick="toggleDataVisibility('poi')" style="background-color: #efefef; color: black; height: 25px; padding: 2px 5px 2px 5px; border: 1px solid gray">Prediction</button>
            <span id="poiValue" style="font-size: 16px; display: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;" 
                  title="${poi} counts">&nbsp;${poi}</span>
        </div>
    </div>
</div>

        <div class="popup-caption">
            <strong style="color: rgb(229,46,89); font-size: 16px">Satellite Image Region Descrption: </strong> ${caption}
        </div>
        <p class="popup-description">
            <i class="fas fa-info-circle"></i>
            This is a 1km x 1km region centered around 
            <strong>coordinate (${lnglat.lng.toFixed(3)}&deg;E, ${lnglat.lat.toFixed(3)}&deg;N)</strong>
            <div id="placesList" style="font-size: 16px; color: #198cff"></div>
        </p>
    </div>
`;

    return content;
}


function toggleDataVisibility(dataKey) {
    var valueSpan = document.getElementById(dataKey + 'Value');
    var button = document.getElementById(dataKey + 'Button');
    if (valueSpan.style.display === 'none') {
        valueSpan.style.display = 'inline';
        button.textContent = 'Hide';
    } else {
        valueSpan.style.display = 'none';
        button.textContent = 'Prediction';
    }
}

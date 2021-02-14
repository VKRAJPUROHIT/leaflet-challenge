// Store our API endpoint inside queryUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
// Query to retrieve the faultline data
var faultlinequery = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";
// RedYellowGreen color scale generated on ColorBrewer
function getColor(d){
  let color = '';
  if(d<1){
    color = '#1a9850';}
    else if (d<2){
      color = '#91cf60';}
      else if (d<3){
        color = '#d9ef8b';}
        else if (d<4){
          color = '#fee08b';}
          else if (d<5){
            color = '#fc8d59';}
            else {color = '#d73027';}
            return color
}
function getRadius(d){
  return 15000*d;
}
// Perform a GET request to the query URL
d3.json(queryUrl, function(earthquakeData){
  //second query to get plate data 
  d3.json(faultlinequery, function(plateData){
    console.log(plateData);
    createFeatures(earthquakeData.features, plateData.features);
  });
});
function createFeatures(earthquakeData,plateData){
  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the pointToLayer function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData,{
    pointToLayer: function (feature,latlng){
      var color = getColor(feature.properties.mag);
      //add circles to map
      return L.circle(latlng,{
        weight: 1,
        opacity: 0.75,
        fillOpacity: 0.75,
        color: color,
        fillColor: color,
        //adjust radius
        radius: getRadius(feature.properties.mag)}).bindPopup("<h4> Magnitude: " + feature.properties.mag + "<br>Location:  " + feature.properties.place +
        "</h4><hr><p>" + new Date(feature.properties.time) + "</p>");}
        //end pointtolayer
  });
  var plates = L.geoJSON(plateData,{
    style: function (feature){
      return {
        color:"orange",
        weight:1
      };
    }
  });
  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes, plates);
}
function createMap(earthquakes,plates){
  var outdoorsMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service',
    maxZoom: 18
  });
  var satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
  });
  var grayscaleMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 18
  });
  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Satellite": satelliteMap,
    "Gray Scale": grayscaleMap,
    "Outdoors": outdoorsMap
  };
   // Create overlay object to hold our overlay layer
   var overlayMaps = {
    'Earthquakes': earthquakes,
    'Plate boundary': plates
  };
  // Create our map, giving it the satellite and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 3,
    layers: [satelliteMap, earthquakes, plates]
  });
  var legend = L.control({
    position: 'bottomright'
  });
  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend');
    var magnitudes = [0, 1, 2, 3, 4, 5];
    var labels = ['0-1', '1-2', '2-3', '3-4', '4-5', '5+'];

    // loop through our magnitude intervals and generate a label with a colored square for each interval
    for (var i = 0; i < magnitudes.length; i++) {
      div.innerHTML +=
        '<i style="background:' + getColor(magnitudes[i]) + '"></i> ' + labels[i] + '<br>';
    }
    return div;
  }; // end legend.onAdd
  legend.addTo(myMap);
  myMap.on('overlayremove', function (eventLayer) {
    if (eventLayer.name === 'Earthquakes') {
      this.removeControl(legend);
    }
  });
  myMap.on('overlayadd', function (eventLayer) {
    // Turn on the legend...
    if (eventLayer.name === 'Earthquakes') {
      legend.addTo(this);
    }
  });
  // Create a layer control  
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
}
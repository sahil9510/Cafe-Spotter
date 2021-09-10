// https://thawing-cove-80784.herokuapp.com/
import dayMapStyles from "./dayMapStyles";
import nightMapStyles from "./nightMapStyles";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";


import usePlacesAutoComplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";

import "@reach/combobox/styles.css";

import "./App.css";
import { useCallback, useRef, useState } from "react";

let mapStyles;
const currentHour = new Date().getHours();
const isNight= currentHour >= 18 || currentHour < 6
mapStyles=isNight? nightMapStyles : dayMapStyles;

const libraries = ["places"];
const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};

const center = {
  lat: 28.62087393986197,
  lng: 77.09249204850958,
};

const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};



function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyDVZA7fUR_moMbcupIBbXm8Y2KPYugGTw0",
    libraries,
  });

  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);
  const [marker, setMarker] = useState(null);

  const nearbySearch = useCallback(async ({ lat, lng }) => {
    const response = await fetch(
      "https://thawing-cove-80784.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" +
        lat.toString() +
        "," +
        lng.toString() +
        "&radius=2000&keyword=cafe&key=AIzaSyDVZA7fUR_moMbcupIBbXm8Y2KPYugGTw0",
      {
        method: "get",
      }
    );
    const data = await response.json();
    const resultsRecieved = await data.results;
    resultsRecieved.forEach(result => {
      if(result.types[0]==="restaurant" || result.types[0]==="meal_delivery" || result.types[0]==="meal_takeaway"  || result.types[1]==="restaurant"  || result.types[0]==="bakery" ){
        result.icon ="tableware.png";
      }
      else if(result.types[0]==="cafe"){
        result.icon="coffee.png";
      }
      else if(result.types[0]==="food"){
        result.icon="shopping-bags.png"
      }
      else if(result.types[0]==="bar" || result.types[0]==="night_club"){
        result.icon="champagne.png"
      }

    });
    setResults(resultsRecieved);
    console.log(resultsRecieved[0]);
  }, []);

  const panTo = useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(15);
    setMarker({lat,lng,time: new Date()});
    nearbySearch({lat,lng})
  }, [nearbySearch]);



  const onMapClick = useCallback((event) => {
    setMarker({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
      time: new Date(),
    });
    panTo({lat: event.latLng.lat(),lng :event.latLng.lng()});
    nearbySearch({lat:event.latLng.lat(),lng:event.latLng.lng()})
  }, [nearbySearch,panTo]);

  const mapRef = useRef();
  const onMapLoad = useCallback((map) => {
    setMarker({...center,time: new Date()});
    nearbySearch(center);

    mapRef.current = map;
  }, [nearbySearch]);




  if (loadError) return "Error Loading Maps";
  if (!isLoaded) return "Loading maps"; 

  return (
    <div>
      <h1>
        Café Spotter{" "}
        <span role="img" aria-label="cap">
          <img src="cafe.png" alt="cafe-pic"/>
        </span>
      </h1>


      <Locate panTo={panTo} />

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={15}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >


        {results.map((result) => (
          <Marker style={`background-color: ${result.icon_background_color}`}
            key={result.place_id}
            position={{
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
            }}
            animation={2}
            icon={{
              url: result.icon,
              scaledSize: new window.google.maps.Size(35, 35),
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(17.5, 17.5), 
            }}
            onClick={() => {

              setSelected(result);
            }}
          />
        ))}

        {marker && <Marker
          
          key={marker.time.toISOString()}
          position={{ lat: marker.lat, lng: marker.lng }}
          icon={{
            url: "./person (1).png",
            scaledSize: new window.google.maps.Size(60, 60),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(30, 30),
          }}

        />}
        {selected && (
          <InfoWindow
            position={{
              lat: selected.geometry.location.lat,
              lng: selected.geometry.location.lng,
            }}
            onCloseClick={() => setSelected(null)}
          >
            <div>
              <h2>{selected.name}</h2>
              {selected.opening_hours && <h4>{selected.opening_hours.open_now? "OPEN": "CLOSED"}</h4>}
              <p>
                Rating: <strong>{selected.rating}</strong>
              </p>
              <address>{selected.vicinity}</address>
            </div>
          </InfoWindow>
        )}

        
      </GoogleMap>
      <Search panTo={panTo} />
      <code>v0.91 ^BETA^</code>
    </div>
  );
}

export default App;






const Locate = ({ panTo }) => {
  return (
    <button
      className="locate"
      onClick={() => {
        navigator.geolocation.getCurrentPosition((position) => {
          panTo({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          
        });
      }}
    >
      <img src="position.png" alt="compass-locate me" />
    </button>
  );
};

const Search = ({ panTo }) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutoComplete({
    requestOptions: {
      location: {
        lat: () => 28.62087393986197,
        lng: () => 77.09249204850958,
      },
      radius: 200 * 1000,
    },
  });

  return (
    <div className="search zIndex">
      <Combobox 
         className="zIndex" onSelect={async (address) => {
          setValue(address, false);
          clearSuggestions();
          try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            panTo({ lat, lng });
          } catch (err) {
            console.log("error!");
          }
          address=""
        }}
      >
        <ComboboxInput
          className="zIndex"
          onClick={()=>{
            setValue("",false)}}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          disabled={!ready}
          placeholder="Enter an address"
        />
        <ComboboxPopover className="zIndex"
        portal={false}> 
          <ComboboxList className="zIndex" >
            {status === "OK" &&
              data.map(({ id, description }) => (
                <ComboboxOption className="zIndex"
                  key={Math.random().toString()}
                  value={description}

                />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
};

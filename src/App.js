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
if (currentHour > 18 || currentHour < 6) {
  mapStyles = nightMapStyles;
} else {
  mapStyles = dayMapStyles;
}

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
    googleMapsApiKey: process.env.REACT_APP_API,
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
        "&radius=2000&radius=10000&keyword=cafe&key="+process.env.REACT_APP_API,
      {
        method: "get",
      }
    );
    const data = await response.json();
    const resultsRecieved = await data.results;
    setResults(resultsRecieved);
  }, []);

  const onMapClick = useCallback((event) => {
    setMarker({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
      time: new Date(),
    });
    nearbySearch({lat:event.latLng.lat(),lng:event.latLng.lng()})
  }, [nearbySearch]);

  const mapRef = useRef();
  const onMapLoad = useCallback((map) => {
    setMarker({...center,time: new Date()});
    nearbySearch(center);

    mapRef.current = map;
  }, [nearbySearch]);

  const panTo = useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
    setMarker({lat,lng,time: new Date()});
    nearbySearch({lat,lng})
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

      <Search panTo={panTo} />
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
          <Marker
            key={result.place_id}
            position={{
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
            }}
            icon={{
              url: result.icon,
              scaledSize: new window.google.maps.Size(30, 30),
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(15, 15),
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
            url: "./person.png",
            scaledSize: new window.google.maps.Size(40, 40),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(20, 20),
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
              <h4>{selected.opening_hours.open_now? "OPEN": "CLOSED"}</h4>
              <p>
                Rating: <strong>{selected.rating}</strong>
              </p>
              <address>{selected.vicinity}</address>
            </div>
          </InfoWindow>
        )}

        
      </GoogleMap>
      <code>v0.9 ^BETA^</code>
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
      <img src="compass.png" alt="compass-locate me" />
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
    <div className="search">
      <Combobox 
        onSelect={async (address) => {
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
          onClick={()=>{
            setValue("",false)}}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          disabled={!ready}
          placeholder="Enter an address"
        />
        <ComboboxPopover portal={false}> 
          <ComboboxList>
            {status === "OK" &&
              data.map(({ id, description }) => (
                <ComboboxOption
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

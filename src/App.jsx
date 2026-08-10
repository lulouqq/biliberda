import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function App() {
  const mapRef = useRef(null);
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [mode, setMode] = useState("draw");
  const linesRef = useRef([]);
  const currentLineRef = useRef([]);
  const geoPos = useRef(null);
  const RADIUS_METERS = 50;
  const circleRef = useRef(null);
  const hasCenteredRef = useRef(false);

  function goToUser(){
    if (!geoPos.current) return;
    const userLatLng = L.latLng(geoPos.current.latitude, geoPos.current.longitude);
    mapRef.current.setView(userLatLng, 17);
  }

  useEffect(() => {
    if(mapRef.current){
      mode === "draw"
      ? mapRef.current.dragging.disable()
      : mapRef.current.dragging.enable();
    }
  }, [mode]);

  useEffect(() => {
    // --- ИНИЦИАЛИЗАЦИЯ КАРТЫ ---
    mapRef.current = L.map("map", {
      zoomAnimation: false
    }).setView(
      [-33.8688, 151.2093], // СПб
      12
    );

    mapRef.current.on("move", () => {
      redraw();
    });

    mode === "draw"
      ? mapRef.current.dragging.disable()
      : mapRef.current.dragging.enable();

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapRef.current);

    //--- ГЕО ---

    function handleGeoUpdate(pos) {
      // Обновляем актуальные координаты пользователя
      geoPos.current = pos.coords;

      const { latitude, longitude } = pos.coords;

      const userLatLng = L.latLng(latitude, longitude);

      // Центрируем карту только при первом получении позиции
      if(!hasCenteredRef.current){
        mapRef.current.setView(userLatLng, 17);
        hasCenteredRef.current = true;
      }

      // DEBUG: лог обновления геопозиции
      // console.log("Geo update:", geoPos);

      // Создаём круг один раз, далее только обновляем его позицию
      if(!circleRef.current){
        circleRef.current = L.circle(userLatLng, 
        {radius: RADIUS_METERS});
        circleRef.current.addTo(mapRef.current);
      }else{
        circleRef.current.setLatLng(userLatLng);
      }

      // Перерисовываем canvas с учётом новой позиции
      redraw();
    }

    function handleGeoError(err) {
      console.log("Geolocation error:", err.code, err.message);
    }
    const watchId = navigator.geolocation.watchPosition(
      handleGeoUpdate,
      handleGeoError
    );

    // --- CANVAS ---
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function getGeoCenterPoint(){
      if (!geoPos.current) return null;
      const centerP = [];
      centerP.push(geoPos.current.latitude);
      centerP.push(geoPos.current.longitude);
      const centerPxy = mapRef.current.latLngToContainerPoint(centerP);
      return centerPxy;
    }

    const redraw = () => {
      console.log("map moved");

      const centerPxy = getGeoCenterPoint();
      if(!centerPxy) return;

      ctx.clearRect(0,0, canvas.width, canvas.height);

      for(let k = 0; k < linesRef.current.length; k++){
        const line = linesRef.current[k];
        if(!line || line.length === 0) continue;

        ctx.beginPath();

        const firstPoint = mapRef.current.latLngToContainerPoint(line[0]);
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for(let i = 1; i < line.length; i++){
          const p = mapRef.current.latLngToContainerPoint(line[i]);
          ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    };

    mapRef.current.on("zoom", redraw);
    mapRef.current.on("zoomend", redraw);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    redraw();

    // --- РИСОВАНИЕ ---
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();

      if(e.touches){
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }

      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const getEventPoint = (e) => {
      // если touch — берем первый палец, иначе обычный event
      return e.touches ? e.touches[0] : e;
    };

    const startDraw = (e) => {
      //alert("touchstart");
      e.preventDefault();
      if(!mapRef.current) return;

      currentLineRef.current = [];

      const src = getEventPoint(e);
      const point = mapRef.current.mouseEventToContainerPoint(src);
      const latlng = mapRef.current.containerPointToLatLng(point);
      console.log("latlng: ", latlng);

      drawing.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      e.preventDefault();
      if(!mapRef.current) return;
      if(!drawing.current) return;
      if(!geoPos.current) return;

      const src = getEventPoint(e);
      const point = mapRef.current.mouseEventToContainerPoint(src);
      const latlng = mapRef.current.containerPointToLatLng(point);
      const pos = getPos(e);

      const centerPxy = getGeoCenterPoint();
      if(!centerPxy) return;

      const userLatLng = L.latLng(geoPos.current.latitude, geoPos.current.longitude);

      const distance = userLatLng.distanceTo(latlng);

      if(distance > RADIUS_METERS){
        console.log("Out of border");
        drawing.current = false;
        ctx.closePath();
      } else {
        currentLineRef.current.push(latlng);

        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    };

    const endDraw = () => {
      drawing.current = false;
      ctx.closePath();
      if(currentLineRef.current.length > 0){
        linesRef.current.push(currentLineRef.current);
      }
      console.log("Array: ", currentLineRef.current);
      console.log(linesRef.current);
    };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);

    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", endDraw, { passive: false });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      navigator.geolocation.clearWatch(watchId);
      if (mapRef.current) {
        mapRef.current.off("zoom", redraw);
        mapRef.current.off("zoomend", redraw);
      }
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div id="map" style={{ width: "100%", height: "100%" }} />
      <div style={{position: "absolute", top: 10, left: 10, zIndex: 2000}}>
        Current mode: {mode}
      </div>
      <button 
        style={{position: "absolute", top: 100, left: 10, zIndex: 2000}}
        onClick={mode === "draw" ? () => setMode("move") : () => setMode("draw")}>
      </button>
      <button
        style={{ position: "absolute", top: 150, left: 10, zIndex: 2000 }}
        onClick={goToUser}
      >
        📍
      </button>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1000,
          pointerEvents: mode === "draw" ? "auto" : "none",
        }}
      />
    </div>
  );
}

export default App;
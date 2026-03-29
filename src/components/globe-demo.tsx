"use client";
import React, { Suspense, useEffect, useState } from "react";
import { motion } from "motion/react";
import { World, type GlobeConfig } from "@/components/ui/globe";

export default function GlobeDemo() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const globeConfig: GlobeConfig = {
    pointSize: 4,
    globeColor: "#062056",
    showAtmosphere: true,
    atmosphereColor: "#FFFFFF",
    atmosphereAltitude: 0.1,
    emissive: "#062056",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    polygonColor: "rgba(255,255,255,0.7)",
    ambientLight: "#38bdf8",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
  };
  const colors = ["#06b6d4", "#3b82f6", "#6366f1"];

  // Remarque: pour n'afficher que des points (pays Fireball), on peut créer des "arcs"
  // dont start/end sont identiques; les points sont dérivés de ces arcs.
  const countryPoints = [
    // Exemple: Canada, USA, France, UK, Korea, Australia...
    { lat: 45.4215, lng: -75.6972 }, // Canada (Ottawa)
    { lat: 38.9072, lng: -77.0369 }, // USA (DC)
    { lat: 48.8566, lng: 2.3522 },   // France (Paris)
    { lat: 51.5072, lng: -0.1276 },  // UK (London)
    { lat: 37.5665, lng: 126.9780 }, // Korea (Seoul)
    { lat: -33.8688, lng: 151.2093 },// Australia (Sydney)
    { lat: 22.3193, lng: 114.1694 }, // Hong Kong
    { lat: 35.6762, lng: 139.6503 }, // Japan (Tokyo)
    { lat: 52.3676, lng: 4.9041 },   // Netherlands (Amsterdam)
    { lat: 40.7128, lng: -74.0060 }, // USA (NYC)
  ];

  const sampleArcs = countryPoints.map((p, i) => ({
    order: (i % 5) + 1,
    startLat: p.lat,
    startLng: p.lng,
    endLat: p.lat,   // identique → pas d'arc visible, mais le point sera rendu
    endLng: p.lng,
    arcAlt: 0.1,
    color: colors[i % colors.length],
  }));

  return (
    <div className="flex flex-row items-center justify-center py-12 md:py-20 relative w-full bg-transparent">
      <div className="max-w-7xl mx-auto w-full relative overflow-hidden h-full md:h-[40rem] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-center text-xl md:text-4xl font-bold text-pearl">
            Fireball à travers le monde
          </h2>
          <p className="text-center text-base md:text-lg font-normal text-silver/80 max-w-xl mt-2 mx-auto">
            Présence internationale en expansion — partenaires et clients sur plusieurs continents.
          </p>
        </motion.div>
        <div className="absolute w-full bottom-0 inset-x-0 h-40 bg-gradient-to-b pointer-events-none select-none from-transparent to-transparent z-40" />
        <div className="absolute w-full -bottom-20 h-72 md:h-full z-10">
          {mounted ? (
            <Suspense fallback={null}>
              <World data={sampleArcs} globeConfig={globeConfig} />
            </Suspense>
          ) : null}
        </div>
      </div>
    </div>
  );
}


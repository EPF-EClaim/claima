
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Item",
    "sap/ui/core/Fragment"
], function (Controller, MessageToast, Item, Fragment) {
    "use strict";

    return Controller.extend("claima.controller.mileagecalculator", {

        /* ---------- Host wiring ---------- */

        /**
         * Called by the host (App.controller) to pass references and helpers:
         * - oHost: the host controller (to push values back, read models, etc.)
         * - sFragIdPrefix: the view id used when loading the fragment
         */
        setHost: function (oHost, sFragIdPrefix) {
            this._host = oHost;
            this._fragPrefix = sFragIdPrefix;

            // Override byId so it resolves Fragment DOM/controls
            this.byId = function (sId) {
                return Fragment.byId(this._fragPrefix, sId);
            };
        },

        setSubmitHandler: function (fn) {
            this._fnSubmit = typeof fn === "function" ? fn : null;
        },

        prefill: function (o) {
            if (!o) return;
            var oFrom = this.byId("inputFrom");
            var oTo = this.byId("inputTo");
            if (oFrom) oFrom.setValue(o.from || "");
            if (oTo) oTo.setValue(o.to || "");
            var oPicker = this.byId("routePicker");
            if (oPicker) { oPicker.setVisible(false); oPicker.destroyItems(); }
            var oTxt = this.byId("txtDistance");
            if (oTxt) oTxt.setText("Distance Calculated: -");
        },

        open: function () {
            this.byId("helloDialog").open();
        },
        close: function () {
            var dlg = this.byId("helloDialog");
            if (dlg) dlg.close();
        },

        /* ---------- Dialog lifecycle ---------- */
        onMileageDialogAfterOpen: function () {
            // Reset runtime state
            this._map = null;
            this._geocoder = null;
            this._markerFrom = null;
            this._markerTo = null;
            this._routes = [];
            this._routePolylines = [];
            this._selectedRouteIndex = 0;
            this._originPlace = null;
            this._destinationPlace = null;
            this._autocompleteFrom = null;
            this._autocompleteTo = null;

            // Load SDK if needed
            if (!window.google || !window.google.maps) {
                const script = document.createElement("script");
                script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCq2oZylfVF7F1lW9IuUlL62q6UJC9s3tc&libraries=places";
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    this._enableAutocompleteAfterRender();
                    this._initializeMap();
                };
                script.onerror = () => MessageToast.show("Failed to load Google Maps.");
                document.head.appendChild(script);
            } else {
                this._enableAutocompleteAfterRender();
                this._initializeMap();
            }
        },

        onMileageDialogAfterClose: function () {
            if (this._routePolylines && this._routePolylines.length) {
                this._routePolylines.forEach(pl => pl.setMap(null));
            }
            this._routePolylines = [];
        },

        /* ---------- AUTOCOMPLETE (from your project) ---------- */
        _enableAutocompleteAfterRender: function () {
            const oInputFrom = this.byId("inputFrom");
            const oInputTo = this.byId("inputTo");

            const attachAutocomplete = (oInput, isOrigin) => {
                if (!oInput) return;

                oInput.addEventDelegate({
                    onAfterRendering: () => {
                        const dom = oInput.getFocusDomRef();
                        if (!dom) return;

                        if (isOrigin && this._autocompleteFrom) return;
                        if (!isOrigin && this._autocompleteTo) return;

                        const ac = new google.maps.places.Autocomplete(dom, {
                            fields: ["geometry", "formatted_address"]
                        });

                        ac.addListener("place_changed", () => {
                            const place = ac.getPlace();
                            if (!(place && place.geometry && place.geometry.location)) {
                                MessageToast.show("Please choose a suggestion from the list.");
                                return;
                            }

                            if (isOrigin) {
                                this._originPlace = place;
                                this._ensureMarkers();
                                this._setMarker(this._markerFrom, place.geometry.location, "A");
                                this._setInputValue("inputFrom", place.formatted_address || "");
                            } else {
                                this._destinationPlace = place;
                                this._ensureMarkers();
                                this._setMarker(this._markerTo, place.geometry.location, "B");
                                this._setInputValue("inputTo", place.formatted_address || "");
                            }

                            this._fitBoundsIfBothMarkers();
                            if (this._originPlace?.geometry && this._destinationPlace?.geometry) {
                                this.onCalculateRoute();
                            }
                        });

                        if (isOrigin) this._autocompleteFrom = ac;
                        else this._autocompleteTo = ac;
                    }
                });
            };

            attachAutocomplete(oInputFrom, true);
            attachAutocomplete(oInputTo, false);
        },

        /* ---------- MAP + MARKERS ---------- */
        _initializeMap: function () {
            if (this._map) return;

            const html = this.byId("mapContainer");
            const mapDiv = html && html.getDomRef();
            if (!mapDiv) return;

            this._map = new google.maps.Map(mapDiv, {
                zoom: 11,
                center: { lat: 3.139, lng: 101.6869 },
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
            });
            this._geocoder = new google.maps.Geocoder();
            this._ensureMarkers();
        },

        _ensureMarkers: function () {
            if (!this._map) return;

            if (!this._markerFrom) {
                this._markerFrom = new google.maps.Marker({
                    map: this._map, draggable: true, label: "A", visible: false
                });
                this._markerFrom.addListener("dragend", () => this._onMarkerDragEnd(true));
            }

            if (!this._markerTo) {
                this._markerTo = new google.maps.Marker({
                    map: this._map, draggable: true, label: "B", visible: false
                });
                this._markerTo.addListener("dragend", () => this._onMarkerDragEnd(false));
            }
        },

        _setMarker: function (marker, latLng, label) {
            if (!marker || !latLng) return;
            marker.setPosition(latLng);
            marker.setLabel(label);
            marker.setVisible(true);
        },

        _onMarkerDragEnd: function (isOrigin) {
            const marker = isOrigin ? this._markerFrom : this._markerTo;
            if (!marker) return;

            const pos = marker.getPosition();
            const place = { geometry: { location: pos } };
            if (isOrigin) this._originPlace = place;
            else this._destinationPlace = place;

            this._reverseGeocode(pos, (addr) => {
                this._setInputValue(isOrigin ? "inputFrom" : "inputTo", addr);
            });

            this._fitBoundsIfBothMarkers();
            if (this._originPlace?.geometry && this._destinationPlace?.geometry) {
                this.onCalculateRoute();
            }
        },

        _reverseGeocode: function (latLng, cb) {
            if (!this._geocoder || !latLng) return;
            this._geocoder.geocode({ location: latLng }, (results, status) => {
                if (status === "OK" && results && results[0]) {
                    cb(results[0].formatted_address);
                } else {
                    cb(`${latLng.lat().toFixed(6)}, ${latLng.lng().toFixed(6)}`);
                }
            });
        },

        _fitBoundsIfBothMarkers: function () {
            if (!this._markerFrom?.getVisible() || !this._markerTo?.getVisible()) return;
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(this._markerFrom.getPosition());
            bounds.extend(this._markerTo.getPosition());
            this._map.fitBounds(bounds);
        },

        _setInputValue: function (id, value) {
            const input = this.byId(id);
            if (input && typeof input.setValue === "function") {
                input.setValue(value || "");
            }
        },

        /* ---------- ROUTE RENDERING (alternatives) ---------- */
        _clearPolylines: function () {
            if (this._routePolylines && this._routePolylines.length) {
                this._routePolylines.forEach(pl => pl.setMap(null));
            }
            this._routePolylines = [];
        },

        _stylePolylineByIndex: function (idx, selected) {
            const poly = this._routePolylines[idx];
            if (!poly) return;
            poly.setOptions(selected ? {
                strokeColor: "#1a73e8", strokeOpacity: 1.0, strokeWeight: 6, zIndex: 2
            } : {
                strokeColor: "#80868b", strokeOpacity: 0.7, strokeWeight: 4, zIndex: 1
            });
        },

        _renderRoutes: function (routes) {
            this._clearPolylines();
            this._routes = routes || [];
            const bounds = new google.maps.LatLngBounds();

            this._routes.forEach((route, idx) => {
                const path = this._decodePolyline(route.polyline.encodedPolyline);
                const poly = new google.maps.Polyline({ path, map: this._map, clickable: true });
                this._routePolylines.push(poly);

                poly.addListener("click", () => {
                    this._selectRoute(idx);
                    const picker = this.byId("routePicker");
                    if (picker) picker.setSelectedKey(String(idx));
                });

                path.forEach(p => bounds.extend(p));
            });

            if (!bounds.isEmpty()) this._map.fitBounds(bounds);

            this._selectedRouteIndex = 0;
            this._routePolylines.forEach((_, i) => this._stylePolylineByIndex(i, i === 0));

            this._updateRoutePicker();
            this._updateDistanceForSelected();
        },

        _updateRoutePicker: function () {
            const picker = this.byId("routePicker");
            if (!picker) return;

            picker.destroyItems();
            this._routes.forEach((r, idx) => {
                const text = this._buildRouteLabel(r, idx);
                picker.addItem(new Item({ key: String(idx), text }));
            });

            picker.setVisible(this._routes.length > 1);
            picker.setSelectedKey("0");
        },

        _buildRouteLabel: function (route, idx) {
            const meters = route.distanceMeters || 0;
            const km = (meters / 1000).toFixed(1);
            const durS = (route.duration || "0s").replace("s", "");
            const mins = Math.round((parseInt(durS, 10) || 0) / 60);

            const label = (route.routeLabels || []).includes("DEFAULT_ROUTE")
                ? "Default"
                : `Alternate ${idx}`;

            return `${label} — ${km} km, ${mins} min`;
        },

        _selectRoute: function (idx) {
            if (!this._routes.length) return;

            this._selectedRouteIndex = idx;
            this._routePolylines.forEach((_, i) => this._stylePolylineByIndex(i, i === idx));

            const poly = this._routePolylines[idx];
            if (poly) {
                const b = new google.maps.LatLngBounds();
                poly.getPath().forEach(p => b.extend(p));
                if (!b.isEmpty()) this._map.fitBounds(b);
            }

            this._updateDistanceForSelected();
        },

        _updateDistanceForSelected: function () {
            const r = this._routes[this._selectedRouteIndex];
            if (!r) return;
            const km = (r.distanceMeters / 1000).toFixed(2);
            const s = parseInt((r.duration || "0s").replace("s", ""), 10) || 0;
            const mins = Math.round(s / 60);
            const txt = this.byId("txtDistance");
            if (txt) txt.setText(`Distance: ${km} km (${mins} min)`);
            this._computedKm = parseFloat(km);
        },

        onRoutePicked: function (oEvent) {
            const key = oEvent.getParameter("selectedItem").getKey();
            const idx = parseInt(key, 10);
            if (!isNaN(idx)) this._selectRoute(idx);
        },

        /* ---------- Routes API ---------- */
        onCalculateRoute: async function () {
            await this._tryGeocodeFromInputsIfMissing();

            if (!this._originPlace?.geometry || !this._destinationPlace?.geometry) {
                MessageToast.show("Please select both locations (autocomplete or drag markers).");
                return;
            }

            const origin = {
                location: {
                    latLng: {
                        latitude: this._originPlace.geometry.location.lat(),
                        longitude: this._originPlace.geometry.location.lng()
                    }
                }
            };

            const destination = {
                location: {
                    latLng: {
                        latitude: this._destinationPlace.geometry.location.lat(),
                        longitude: this._destinationPlace.geometry.location.lng()
                    }
                }
            };

            try {
                this._clearPolylines();

                const response = await fetch(
                    "https://routes.googleapis.com/directions/v2:computeRoutes",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            // TODO: Use a restricted server-side proxy/key for production
                            "X-Goog-Api-Key": "AIzaSyCq2oZylfVF7F1lW9IuUlL62q6UJC9s3tc",
                            "X-Goog-FieldMask": [
                                "routes.distanceMeters",
                                "routes.duration",
                                "routes.polyline.encodedPolyline",
                                "routes.routeLabels"
                            ].join(",")
                        },
                        body: JSON.stringify({
                            origin,
                            destination,
                            travelMode: "DRIVE",
                            routingPreference: "TRAFFIC_AWARE_OPTIMAL",
                            computeAlternativeRoutes: true
                        })
                    }
                );

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(errText || "Routes API error");
                }

                const data = await response.json();
                const routes = (data && data.routes) || [];
                if (!routes.length) throw new Error("No routes found");

                this._renderRoutes(routes);
                this._updateDistanceForSelected();

            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
                MessageToast.show("Failed to calculate routes");
            }
        },

        /* ---------- Helpers ---------- */
        _decodePolyline: function (encoded) {
            let points = [];
            let index = 0, lat = 0, lng = 0;

            while (index < encoded.length) {
                let b, shift = 0, result = 0;
                do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
                lat += (result & 1) ? ~(result >> 1) : (result >> 1);

                shift = 0; result = 0;
                do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
                lng += (result & 1) ? ~(result >> 1) : (result >> 1);

                points.push({ lat: lat / 1e5, lng: lng / 1e5 });
            }
            return points;
        },

        _tryGeocodeFromInputsIfMissing: function () {
            return new Promise((resolve) => {
                if (this._originPlace?.geometry && this._destinationPlace?.geometry) { resolve(); return; }
                if (!this._geocoder) { resolve(); return; }

                const ops = [];
                const tryGeocode = (id, setter) => {
                    const input = this.byId(id);
                    const value = input ? input.getValue() : "";
                    if (!value) return;

                    ops.push(new Promise((res) => {
                        this._geocoder.geocode({ address: value }, (results, status) => {
                            if (status === "OK" && results && results[0]) {
                                const loc = results[0].geometry.location;
                                setter({ geometry: { location: loc }, formatted_address: results[0].formatted_address });
                                this._ensureMarkers();
                                if (id === "inputFrom") this._setMarker(this._markerFrom, loc, "A");
                                else this._setMarker(this._markerTo, loc, "B");
                            }
                            res();
                        });
                    }));
                };

                if (!this._originPlace?.geometry) tryGeocode("inputFrom", (p) => { this._originPlace = p; });
                if (!this._destinationPlace?.geometry) tryGeocode("inputTo", (p) => { this._destinationPlace = p; });

                Promise.all(ops).then(() => { this._fitBoundsIfBothMarkers(); resolve(); });
            });
        },

        /* ---------- Buttons ---------- */
        onAddMileage: function () {
            const sFrom = this.byId("inputFrom").getValue();
            const sTo = this.byId("inputTo").getValue();
            const lbl   = this.byId("txtDistance").getText() || "";
            const km    = parseFloat((lbl.match(/Distance:\s*([0-9.]+)/) || [])[1] || "0");

            if (this._fnSubmit) {
                this._fnSubmit({ from: sFrom, to: sTo, km: isNaN(km) ? 0 : km });
            }
            this.close();
        },

        onCancelMileage: function () {
            this.close();
        }

    });
});

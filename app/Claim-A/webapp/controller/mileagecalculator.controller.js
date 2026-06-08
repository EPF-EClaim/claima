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
            this._oHost = oHost;
            this._sFragIdPrefix = sFragIdPrefix;

            // Override byId so it resolves Fragment DOM/controls
            this.byId = function (sId) {
                return Fragment.byId(this._sFragIdPrefix, sId);
            };
        },

        setSubmitHandler: function (fnSubmit) {
            this._fnSubmit = typeof fnSubmit === "function" ? fnSubmit : null;
        },

        prefill: function (oData) {
            if (!oData) {
                return;
            }

            var oInputFrom = this.byId("inputFrom");
            var oInputTo = this.byId("inputTo");

            if (oInputFrom) {
                oInputFrom.setValue(oData.from || "");
            }

            if (oInputTo) {
                oInputTo.setValue(oData.to || "");
            }

            var oRoutePicker = this.byId("routePicker");
            if (oRoutePicker) {
                oRoutePicker.setVisible(false);
                oRoutePicker.destroyItems();
            }

            var oTxtDistance = this.byId("txtDistance");
            if (oTxtDistance) {
                oTxtDistance.setText("Distance Calculated: -");
            }
        },

        open: function () {
            this.byId("helloDialog").open();
        },

        close: function () {
            var oDialog = this.byId("helloDialog");
            if (oDialog) {
                oDialog.close();
            }
        },

        /* ---------- Dialog lifecycle ---------- */

        onMileageDialogAfterOpen: function () {
            // Reset runtime state
            this._oMap = null;
            this._oGeocoder = null;
            this._oMarkerFrom = null;
            this._oMarkerTo = null;
            this._aRoutes = [];
            this._aRoutePolylines = [];
            this._iSelectedRouteIndex = 0;
            this._oOriginPlace = null;
            this._oDestinationPlace = null;
            this._oAutocompleteFrom = null;
            this._oAutocompleteTo = null;
            this._fComputedKm = 0;

            // Load SDK if needed
            if (!window.google || !window.google.maps) {
                const oScript = document.createElement("script");
                oScript.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCq2oZylfVF7F1lW9IuUlL62q6UJC9s3tc&libraries=places";
                oScript.async = true;
                oScript.defer = true;
                oScript.onload = () => {
                    this._enableAutocompleteAfterRender();
                    this._initializeMap();
                };
                oScript.onerror = () => MessageToast.show("Failed to load Google Maps.");
                document.head.appendChild(oScript);
            } else {
                this._enableAutocompleteAfterRender();
                this._initializeMap();
            }
        },

        onMileageDialogAfterClose: function () {
            if (this._aRoutePolylines && this._aRoutePolylines.length) {
                this._aRoutePolylines.forEach(function (oPolyline) {
                    oPolyline.setMap(null);
                });
            }
            this._aRoutePolylines = [];
        },

        /* ---------- AUTOCOMPLETE ---------- */

        _enableAutocompleteAfterRender: function () {
            const oInputFrom = this.byId("inputFrom");
            const oInputTo = this.byId("inputTo");

            const fnAttachAutocomplete = (oInput, bIsOrigin) => {
                if (!oInput) {
                    return;
                }

                oInput.addEventDelegate({
                    onAfterRendering: () => {
                        const oDomRef = oInput.getFocusDomRef();
                        if (!oDomRef) {
                            return;
                        }

                        if (bIsOrigin && this._oAutocompleteFrom) {
                            return;
                        }

                        if (!bIsOrigin && this._oAutocompleteTo) {
                            return;
                        }

                        const oAutocomplete = new google.maps.places.Autocomplete(oDomRef, {
                            fields: ["geometry", "formatted_address"]
                        });

                        oAutocomplete.addListener("place_changed", () => {
                            const oPlace = oAutocomplete.getPlace();

                            if (!(oPlace && oPlace.geometry && oPlace.geometry.location)) {
                                MessageToast.show("Please choose a suggestion from the list.");
                                return;
                            }

                            if (bIsOrigin) {
                                this._oOriginPlace = oPlace;
                                this._ensureMarkers();
                                this._setMarker(this._oMarkerFrom, oPlace.geometry.location, "A");
                                this._setInputValue("inputFrom", oPlace.formatted_address || "");
                            } else {
                                this._oDestinationPlace = oPlace;
                                this._ensureMarkers();
                                this._setMarker(this._oMarkerTo, oPlace.geometry.location, "B");
                                this._setInputValue("inputTo", oPlace.formatted_address || "");
                            }

                            this._fitBoundsIfBothMarkers();

                            if (this._oOriginPlace?.geometry && this._oDestinationPlace?.geometry) {
                                this.onCalculateRoute();
                            }
                        });

                        if (bIsOrigin) {
                            this._oAutocompleteFrom = oAutocomplete;
                        } else {
                            this._oAutocompleteTo = oAutocomplete;
                        }
                    }
                });
            };

            fnAttachAutocomplete(oInputFrom, true);
            fnAttachAutocomplete(oInputTo, false);
        },

        /* ---------- MAP + MARKERS ---------- */

        _initializeMap: function () {
            if (this._oMap) {
                return;
            }

            const oHtml = this.byId("mapContainer");
            const oMapDiv = oHtml && oHtml.getDomRef();

            if (!oMapDiv) {
                return;
            }

            this._oMap = new google.maps.Map(oMapDiv, {
                zoom: 11,
                center: { lat: 3.139, lng: 101.6869 },
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
            });

            this._oGeocoder = new google.maps.Geocoder();
            this._ensureMarkers();
        },

        _ensureMarkers: function () {
            if (!this._oMap) {
                return;
            }

            if (!this._oMarkerFrom) {
                this._oMarkerFrom = new google.maps.Marker({
                    map: this._oMap,
                    draggable: true,
                    label: "A",
                    visible: false
                });

                this._oMarkerFrom.addListener("dragend", () => this._onMarkerDragEnd(true));
            }

            if (!this._oMarkerTo) {
                this._oMarkerTo = new google.maps.Marker({
                    map: this._oMap,
                    draggable: true,
                    label: "B",
                    visible: false
                });

                this._oMarkerTo.addListener("dragend", () => this._onMarkerDragEnd(false));
            }
        },

        _setMarker: function (oMarker, oLatLng, sLabel) {
            if (!oMarker || !oLatLng) {
                return;
            }

            oMarker.setPosition(oLatLng);
            oMarker.setLabel(sLabel);
            oMarker.setVisible(true);
        },

        _onMarkerDragEnd: function (bIsOrigin) {
            const oMarker = bIsOrigin ? this._oMarkerFrom : this._oMarkerTo;
            if (!oMarker) {
                return;
            }

            const oPosition = oMarker.getPosition();
            const oPlace = {
                geometry: {
                    location: oPosition
                }
            };

            if (bIsOrigin) {
                this._oOriginPlace = oPlace;
            } else {
                this._oDestinationPlace = oPlace;
            }

            this._reverseGeocode(oPosition, (sAddress) => {
                this._setInputValue(bIsOrigin ? "inputFrom" : "inputTo", sAddress);
            });

            this._fitBoundsIfBothMarkers();

            if (this._oOriginPlace?.geometry && this._oDestinationPlace?.geometry) {
                this.onCalculateRoute();
            }
        },

        _reverseGeocode: function (oLatLng, fnCallback) {
            if (!this._oGeocoder || !oLatLng) {
                return;
            }

            this._oGeocoder.geocode({ location: oLatLng }, function (aResults, sStatus) {
                if (sStatus === "OK" && aResults && aResults[0]) {
                    fnCallback(aResults[0].formatted_address);
                } else {
                    fnCallback(oLatLng.lat().toFixed(6) + ", " + oLatLng.lng().toFixed(6));
                }
            });
        },

        _fitBoundsIfBothMarkers: function () {
            if (!this._oMarkerFrom?.getVisible() || !this._oMarkerTo?.getVisible()) {
                return;
            }

            const oBounds = new google.maps.LatLngBounds();
            oBounds.extend(this._oMarkerFrom.getPosition());
            oBounds.extend(this._oMarkerTo.getPosition());
            this._oMap.fitBounds(oBounds);
        },

        _setInputValue: function (sId, sValue) {
            const oInput = this.byId(sId);
            if (oInput && typeof oInput.setValue === "function") {
                oInput.setValue(sValue || "");
            }
        },

        /* ---------- ROUTE RENDERING ---------- */

        _clearPolylines: function () {
            if (this._aRoutePolylines && this._aRoutePolylines.length) {
                this._aRoutePolylines.forEach(function (oPolyline) {
                    oPolyline.setMap(null);
                });
            }
            this._aRoutePolylines = [];
        },

        _stylePolylineByIndex: function (iIndex, bSelected) {
            const oPolyline = this._aRoutePolylines[iIndex];
            if (!oPolyline) {
                return;
            }

            oPolyline.setOptions(bSelected ? {
                strokeColor: "#1a73e8",
                strokeOpacity: 1.0,
                strokeWeight: 6,
                zIndex: 2
            } : {
                strokeColor: "#80868b",
                strokeOpacity: 0.7,
                strokeWeight: 4,
                zIndex: 1
            });
        },

        _renderRoutes: function (aRoutes) {
            this._clearPolylines();
            this._aRoutes = aRoutes || [];

            const oBounds = new google.maps.LatLngBounds();

            this._aRoutes.forEach((oRoute, iIndex) => {
                const aPath = this._decodePolyline(oRoute.polyline.encodedPolyline);
                const oPolyline = new google.maps.Polyline({
                    path: aPath,
                    map: this._oMap,
                    clickable: true
                });

                this._aRoutePolylines.push(oPolyline);

                oPolyline.addListener("click", () => {
                    this._selectRoute(iIndex);

                    const oRoutePicker = this.byId("routePicker");
                    if (oRoutePicker) {
                        oRoutePicker.setSelectedKey(String(iIndex));
                    }
                });

                aPath.forEach(function (oPoint) {
                    oBounds.extend(oPoint);
                });
            });

            if (!oBounds.isEmpty()) {
                this._oMap.fitBounds(oBounds);
            }

            this._iSelectedRouteIndex = 0;

            this._aRoutePolylines.forEach((oPolyline, iIndex) => {
                this._stylePolylineByIndex(iIndex, iIndex === 0);
            });

            this._updateRoutePicker();
            this._updateDistanceForSelected();
        },

        _updateRoutePicker: function () {
            const oRoutePicker = this.byId("routePicker");
            if (!oRoutePicker) {
                return;
            }

            oRoutePicker.destroyItems();

            this._aRoutes.forEach((oRoute, iIndex) => {
                const sText = this._buildRouteLabel(oRoute, iIndex);
                oRoutePicker.addItem(new Item({
                    key: String(iIndex),
                    text: sText
                }));
            });

            oRoutePicker.setVisible(this._aRoutes.length > 1);
            oRoutePicker.setSelectedKey("0");
        },

        _buildRouteLabel: function (oRoute, iIndex) {
            const iMeters = oRoute.distanceMeters || 0;
            const sKm = (iMeters / 1000).toFixed(1);
            const sDuration = (oRoute.duration || "0s").replace("s", "");
            const iMinutes = Math.round((parseInt(sDuration, 10) || 0) / 60);

            const sLabel = (oRoute.routeLabels || []).includes("DEFAULT_ROUTE")
                ? "Default"
                : "Alternate " + iIndex;

            return sLabel + " — " + sKm + " km, " + iMinutes + " min";
        },

        _selectRoute: function (iIndex) {
            if (!this._aRoutes.length) {
                return;
            }

            this._iSelectedRouteIndex = iIndex;

            this._aRoutePolylines.forEach((oPolyline, iPolylineIndex) => {
                this._stylePolylineByIndex(iPolylineIndex, iPolylineIndex === iIndex);
            });

            const oSelectedPolyline = this._aRoutePolylines[iIndex];
            if (oSelectedPolyline) {
                const oBounds = new google.maps.LatLngBounds();
                oSelectedPolyline.getPath().forEach(function (oPoint) {
                    oBounds.extend(oPoint);
                });

                if (!oBounds.isEmpty()) {
                    this._oMap.fitBounds(oBounds);
                }
            }

            this._updateDistanceForSelected();
        },

        _updateDistanceForSelected: function () {
            const oSelectedRoute = this._aRoutes[this._iSelectedRouteIndex];
            if (!oSelectedRoute) {
                return;
            }

            const sKm = (oSelectedRoute.distanceMeters / 1000).toFixed(2);
            const iSeconds = parseInt((oSelectedRoute.duration || "0s").replace("s", ""), 10) || 0;
            const iMinutes = Math.round(iSeconds / 60);
            const oTxtDistance = this.byId("txtDistance");

            if (oTxtDistance) {
                oTxtDistance.setText("Distance: " + sKm + " km (" + iMinutes + " min)");
            }

            this._fComputedKm = parseFloat(sKm);
        },

        onRoutePicked: function (oEvent) {
            const sKey = oEvent.getParameter("selectedItem").getKey();
            const iIndex = parseInt(sKey, 10);

            if (!isNaN(iIndex)) {
                this._selectRoute(iIndex);
            }
        },

        /* ---------- Routes API ---------- */

        onCalculateRoute: async function () {
            await this._tryGeocodeFromInputsIfMissing();

            if (!this._oOriginPlace?.geometry || !this._oDestinationPlace?.geometry) {
                MessageToast.show("Please select both locations (autocomplete or drag markers).");
                return;
            }

            const oOrigin = {
                location: {
                    latLng: {
                        latitude: this._oOriginPlace.geometry.location.lat(),
                        longitude: this._oOriginPlace.geometry.location.lng()
                    }
                }
            };

            const oDestination = {
                location: {
                    latLng: {
                        latitude: this._oDestinationPlace.geometry.location.lat(),
                        longitude: this._oDestinationPlace.geometry.location.lng()
                    }
                }
            };

            try {
                this._clearPolylines();

                const oResponse = await fetch(
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
                            origin: oOrigin,
                            destination: oDestination,
                            travelMode: "DRIVE",
                            routingPreference: "TRAFFIC_AWARE_OPTIMAL",
                            computeAlternativeRoutes: true
                        })
                    }
                );

                if (!oResponse.ok) {
                    const sErrorText = await oResponse.text();
                    throw new Error(sErrorText || "Routes API error");
                }

                const oData = await oResponse.json();
                const aRoutes = (oData && oData.routes) || [];

                if (!aRoutes.length) {
                    throw new Error("No routes found");
                }

                this._renderRoutes(aRoutes);
                this._updateDistanceForSelected();

            } catch (oError) {
                // eslint-disable-next-line no-console
                console.error(oError);
                MessageToast.show("Failed to calculate routes");
            }
        },

        /* ---------- Helpers ---------- */

        _decodePolyline: function (sEncoded) {
            let aPoints = [];
            let iIndex = 0;
            let iLat = 0;
            let iLng = 0;

            while (iIndex < sEncoded.length) {
                let iCharCode;
                let iShift = 0;
                let iResult = 0;

                do {
                    iCharCode = sEncoded.charCodeAt(iIndex++) - 63;
                    iResult |= (iCharCode & 0x1f) << iShift;
                    iShift += 5;
                } while (iCharCode >= 0x20);

                iLat += (iResult & 1) ? ~(iResult >> 1) : (iResult >> 1);

                iShift = 0;
                iResult = 0;

                do {
                    iCharCode = sEncoded.charCodeAt(iIndex++) - 63;
                    iResult |= (iCharCode & 0x1f) << iShift;
                    iShift += 5;
                } while (iCharCode >= 0x20);

                iLng += (iResult & 1) ? ~(iResult >> 1) : (iResult >> 1);

                aPoints.push({
                    lat: iLat / 1e5,
                    lng: iLng / 1e5
                });
            }

            return aPoints;
        },

        _tryGeocodeFromInputsIfMissing: function () {
            return new Promise((fnResolve) => {
                if (this._oOriginPlace?.geometry && this._oDestinationPlace?.geometry) {
                    fnResolve();
                    return;
                }

                if (!this._oGeocoder) {
                    fnResolve();
                    return;
                }

                const aOperations = [];

                const fnTryGeocode = (sId, fnSetter) => {
                    const oInput = this.byId(sId);
                    const sValue = oInput ? oInput.getValue() : "";

                    if (!sValue) {
                        return;
                    }

                    aOperations.push(new Promise((fnOperationResolve) => {
                        this._oGeocoder.geocode({ address: sValue }, (aResults, sStatus) => {
                            if (sStatus === "OK" && aResults && aResults[0]) {
                                const oLocation = aResults[0].geometry.location;

                                fnSetter({
                                    geometry: { location: oLocation },
                                    formatted_address: aResults[0].formatted_address
                                });

                                this._ensureMarkers();

                                if (sId === "inputFrom") {
                                    this._setMarker(this._oMarkerFrom, oLocation, "A");
                                } else {
                                    this._setMarker(this._oMarkerTo, oLocation, "B");
                                }
                            }

                            fnOperationResolve();
                        });
                    }));
                };

                if (!this._oOriginPlace?.geometry) {
                    fnTryGeocode("inputFrom", (oPlace) => {
                        this._oOriginPlace = oPlace;
                    });
                }

                if (!this._oDestinationPlace?.geometry) {
                    fnTryGeocode("inputTo", (oPlace) => {
                        this._oDestinationPlace = oPlace;
                    });
                }

                Promise.all(aOperations).then(() => {
                    this._fitBoundsIfBothMarkers();
                    fnResolve();
                });
            });
        },

        /* ---------- Buttons ---------- */

        onAddMileage: function () {
            const sFrom = this.byId("inputFrom").getValue();
            const sTo = this.byId("inputTo").getValue();
            const sLabel = this.byId("txtDistance").getText() || "";
            const fKm = parseFloat((sLabel.match(/Distance:\s*([0-9.]+)/) || [])[1] || "0");

            if (this._fnSubmit) {
                this._fnSubmit({
                    from: sFrom,
                    to: sTo,
                    km: isNaN(fKm) ? 0 : fKm
                });
            }

            this.close();
        },

        onCancelMileage: function () {
            this.close();
        }

    });
});
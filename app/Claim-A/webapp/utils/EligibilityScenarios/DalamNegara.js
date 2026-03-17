sap.ui.define([

], function () {
    "use strict";
    return {
        async onEligibleCheck(oModel, Boxid, ClaimItmType) {

            for (var row of oModel) {
                switch (ClaimItmType) {
                    case DOBI:
                        if ((day1 - day3) > 3) {
                              return fail;                          
                        }
                            break;
                    case FLIGHT_L:
                        if (PersonalGrade < 21 && FlightClass != 3 ){
                            return fail;
                        }
                        break;
                    case HOTEL_L:

                        break;
                    case DOBI:

                        break;
                    case DOBI:

                        break;
                    case DOBI:

                        break;
                    case DOBI:

                        break;

                    default:
                        break;
                }

            }

        }
    };

});
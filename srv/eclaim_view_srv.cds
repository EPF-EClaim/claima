using { ECLAIMVIEW } from '../db/eclaims_view';

service ECLAIM_VIEW_SRV {
    entity ZEMP_REQUEST_VIEW as projection on ECLAIMVIEW.ZEMP_REQUEST_VIEW;
}